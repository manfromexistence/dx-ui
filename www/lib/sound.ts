"use client";

import { create } from "zustand";
import React, { useState, useEffect, useRef, useCallback } from "react";

//================================================================================
// 1. TYPES & INTERFACES
//================================================================================

type PlaybackId = number;
type SpriteMap = { [key: string]: [number, number, boolean?] };
type SoundState = "unloaded" | "loading" | "loaded";
type AudioState = "suspended" | "running" | "suspending" | "interrupted";
type EventCallback = (id: PlaybackId) => void;
type ErrorCallback = (id: PlaybackId | null, error: any) => void;

interface SoundOptions {
    src: string | string[];
    autoplay?: boolean;
    format?: string | string[];
    html5?: boolean;
    loop?: boolean;
    mute?: boolean;
    pool?: number;
    preload?: boolean | "metadata";
    rate?: number;
    sprite?: SpriteMap;
    volume?: number;
    xhr?: {
        method?: string;
        headers?: Record<string, string>;
        withCredentials?: boolean;
    };
    onend?: EventCallback;
    onfade?: EventCallback;
    onload?: () => void;
    onloaderror?: ErrorCallback;
    onplayerror?: ErrorCallback;
    onpause?: EventCallback;
    onplay?: EventCallback;
    onstop?: EventCallback;
    onmute?: EventCallback;
    onvolume?: EventCallback;
    onrate?: EventCallback;
    onseek?: EventCallback;
    onunlock?: () => void;
    onresume?: EventCallback;
}

interface UseSoundOptions extends Omit<SoundOptions, "src"> {
    id?: string;
    interrupt?: boolean;
    soundEnabled?: boolean;
}

// This is the object returned by the createSound factory
type Sound = ReturnType<typeof createSound>;

type ExposedData = {
    pause: (id?: PlaybackId) => void;
    stop: (id?: PlaybackId) => void;
    mute: (muted: boolean, id?: PlaybackId) => void;
    volume: (vol: number, id?: PlaybackId) => void;
    seek: (pos: number, id?: PlaybackId) => number | void;
    duration: number | null;
    rate: (rate?: number, id?: PlaybackId) => number | void;
    isPlaying: boolean;
    sound: Sound | null;
};

type PlayFunction = (options?: { id?: string | PlaybackId; sprite?: string }) => void;
type UseSoundTuple = [PlayFunction, ExposedData];

interface SoundStore {
    playing: Set<string>;
    addPlaying: (id: string) => void;
    removePlaying: (id: string) => void;
    stopAll: () => void;
}

//================================================================================
// 2. CORE AUDIO ENGINE (dx-sound) - FUNCTIONAL APPROACH
//================================================================================

const cache: { [key: string]: AudioBuffer } = {};

// --- Global Audio State Manager ---
const createDxSoundGlobal = () => {
    const state = {
        _counter: 1000,
        _html5AudioPool: [] as HTMLAudioElement[],
        html5PoolSize: 10,
        _codecs: {} as { [key: string]: boolean },
        _sounds: [] as Sound[],
        _muted: false,
        _volume: 1,
        _canPlayEvent: "canplaythrough",
        _navigator: typeof window !== "undefined" ? window.navigator : null,
        masterGain: null as GainNode | null,
        noAudio: false,
        usingWebAudio: true,
        autoSuspend: true,
        ctx: null as AudioContext | null,
        autoUnlock: true,
        state: "suspended" as AudioState,
        _audioUnlocked: false,
        _suspendTimer: undefined as any,
        _scratchBuffer: null as AudioBuffer | null,
    };

    const self = {
        // --- Public Methods ---
        volume: (vol?: number): any => {
            if (vol !== undefined && vol >= 0 && vol <= 1) {
                state._volume = vol;
                if (state._muted) return self;
                if (state.usingWebAudio && state.masterGain && state.ctx) {
                    state.masterGain.gain.setValueAtTime(vol, state.ctx.currentTime);
                }
                for (const sound of state._sounds) {
                    if (!sound._webAudio) {
                        for (const playback of sound._playbacks) {
                            if (playback._node) (playback._node as HTMLAudioElement).volume = playback._volume * vol;
                        }
                    }
                }
                return self;
            }
            return state._volume;
        },

        mute: (muted: boolean): any => {
            state._muted = muted;
            if (state.usingWebAudio && state.masterGain && state.ctx) {
                state.masterGain.gain.setValueAtTime(muted ? 0 : state._volume, state.ctx.currentTime);
            }
            for (const sound of state._sounds) {
                if (!sound._webAudio) {
                    for (const playback of sound._playbacks) {
                        if (playback._node) (playback._node as HTMLAudioElement).muted = muted ? true : playback._muted;
                    }
                }
            }
            return self;
        },

        stop: (): any => {
            for (const sound of state._sounds) sound.stop();
            return self;
        },

        unload: (): any => {
            for (let i = state._sounds.length - 1; i >= 0; i--) {
                state._sounds[i].unload();
            }
            if (state.usingWebAudio && state.ctx && typeof state.ctx.close !== "undefined") {
                state.ctx.close();
                state.ctx = null;
                self._setupAudioContext();
            }
            return self;
        },

        codecs: (ext: string): boolean => {
            return state._codecs[ext.replace(/^x-/, "")];
        },

        // --- Internal Methods ---
        _setup: () => {
            state.state = state.ctx ? state.ctx.state as AudioState : "suspended";
            self._autoSuspend();
            if (!state.usingWebAudio) {
                try { new Audio(); } catch (e) { state.noAudio = true; }
            }
            if (!state.noAudio) self._setupCodecs();
        },

        _setupCodecs: () => {
            try {
                const audioTest = new Audio();
                const ua = state._navigator ? state._navigator.userAgent : "";
                const isOldSafari = ua.includes("Safari") && !ua.includes("Chrome") && parseInt(ua.split("Version/")[1]) < 15;
                state._codecs = {
                    mp3: !!audioTest.canPlayType("audio/mpeg;").replace(/^no$/, ""),
                    opus: !!audioTest.canPlayType("audio/ogg; codecs=\"opus\"").replace(/^no$/, ""),
                    ogg: !!audioTest.canPlayType("audio/ogg; codecs=\"vorbis\"").replace(/^no$/, ""),
                    wav: !!audioTest.canPlayType("audio/wav; codecs=\"1\"").replace(/^no$/, ""),
                    aac: !!audioTest.canPlayType("audio/aac;").replace(/^no$/, ""),
                    m4a: !!(audioTest.canPlayType("audio/x-m4a;") || audioTest.canPlayType("audio/m4a;")).replace(/^no$/, ""),
                    weba: !!(!isOldSafari && audioTest.canPlayType("audio/webm; codecs=\"vorbis\"").replace(/^no$/, "")),
                    flac: !!(audioTest.canPlayType("audio/x-flac;") || audioTest.canPlayType("audio/flac;")).replace(/^no$/, "")
                };
            } catch (e) { }
        },

        _unlockAudio: () => {
            if (state._audioUnlocked || !state.ctx) return;
            state._audioUnlocked = false;
            state.autoUnlock = false;

            const unlock = () => {
                if(!state.ctx) return;
                self._autoResume();
                const source = state.ctx.createBufferSource();
                source.buffer = state._scratchBuffer!;
                source.connect(state.ctx.destination);
                source.start(0);
                if (state.ctx.resume) state.ctx.resume();
                source.onended = () => {
                    source.disconnect(0);
                    state._audioUnlocked = true;
                    document.removeEventListener("touchstart", unlock, true);
                    document.removeEventListener("touchend", unlock, true);
                    document.removeEventListener("click", unlock, true);
                    for (const sound of state._sounds) sound._emit("unlock");
                };
            };

            document.addEventListener("touchstart", unlock, true);
            document.addEventListener("touchend", unlock, true);
            document.addEventListener("click", unlock, true);
        },

        _obtainHtml5Audio: (): HTMLAudioElement => {
            if (state._html5AudioPool.length) return state._html5AudioPool.pop()!;
            return new Audio();
        },

        _releaseHtml5Audio: (audio: HTMLAudioElement) => {
            if ((audio as any)._unlocked) state._html5AudioPool.push(audio);
        },

        _clearSound: (node: HTMLAudioElement) => {
            node.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        },

        _autoSuspend: () => {
            if (!state.autoSuspend || !state.ctx || !state.ctx.suspend || !state.usingWebAudio) return;
            if (state._suspendTimer) clearTimeout(state._suspendTimer);
            state._suspendTimer = setTimeout(() => {
                if (!state.autoSuspend || !state.ctx) return;
                state.state = "suspending";
                state.ctx.suspend().then(() => { state.state = "suspended"; });
            }, 30000);
        },

        _autoResume: () => {
            if (!state.ctx || !state.ctx.resume || !state.usingWebAudio) return;
            if (state.state === "suspended") {
                state.ctx.resume().then(() => {
                    state.state = "running";
                    for (const sound of state._sounds) sound._emit("resume");
                });
                if (state._suspendTimer) clearTimeout(state._suspendTimer);
            }
        },

        _setupAudioContext: () => {
            if (state.ctx || typeof window === "undefined") return;
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                state.ctx = new AudioContext();
            } catch (e) {
                state.usingWebAudio = false;
            }

            if (!state.ctx) state.usingWebAudio = false;

            if (state.usingWebAudio && state.ctx) {
                state.masterGain = state.ctx.createGain();
                state.masterGain.gain.setValueAtTime(state._muted ? 0 : state._volume, state.ctx.currentTime);
                state.masterGain.connect(state.ctx.destination);
                state._scratchBuffer = state.ctx.createBuffer(1, 1, 22050);
            }
        },
        // Expose state for internal use by Sound instances
        _state: state,
    };

    self._setupAudioContext();
    self._setup();

    return self;
};

// --- Sound Instance Factory ---
const createSound = (o: SoundOptions) => {
    if (!o.src || o.src.length === 0) {
        console.error("An array of source files must be passed with any new Sound.");
        o.src = [""];
    }

    if (!DxSound._state.ctx) {
        DxSound._setupAudioContext();
    }

    const soundState = {
        _autoplay: o.autoplay || false,
        _format: typeof o.format === "string" ? [o.format] : (o.format || []),
        _html5: o.html5 || false,
        _muted: o.mute || false,
        _loop: o.loop || false,
        _pool: o.pool || 5,
        _preload: typeof o.preload === "boolean" || o.preload === "metadata" ? o.preload : true,
        _rate: o.rate || 1,
        _sprite: o.sprite || {} as SpriteMap,
        _src: typeof o.src === "string" ? [o.src] : o.src as string | string[],
        _volume: o.volume !== undefined ? o.volume : 1,
        _xhr: {
            method: o.xhr?.method || "GET",
            headers: o.xhr?.headers || undefined,
            withCredentials: o.xhr?.withCredentials || false,
        },
        _duration: 0,
        _state: "unloaded" as SoundState,
        _playbacks: [] as any[],
        _endTimers: {} as { [id: number]: any },
        _queue: [] as { event: string; action: () => void }[],
        _playLock: false,
        _webAudio: DxSound._state.usingWebAudio && !(o.html5 || false),
        _onend: o.onend ? [{ fn: o.onend }] : [],
        _onfade: o.onfade ? [{ fn: o.onfade }] : [],
        _onload: o.onload ? [{ fn: o.onload }] : [],
        _onloaderror: o.onloaderror ? [{ fn: o.onloaderror }] : [],
        _onplayerror: o.onplayerror ? [{ fn: o.onplayerror }] : [],
        _onpause: o.onpause ? [{ fn: o.onpause }] : [],
        _onplay: o.onplay ? [{ fn: o.onplay }] : [],
        _onstop: o.onstop ? [{ fn: o.onstop }] : [],
        _onmute: o.onmute ? [{ fn: o.onmute }] : [],
        _onvolume: o.onvolume ? [{ fn: o.onvolume }] : [],
        _onrate: o.onrate ? [{ fn: o.onrate }] : [],
        _onseek: o.onseek ? [{ fn: o.onseek }] : [],
        _onunlock: o.onunlock ? [{ fn: o.onunlock }] : [],
        _onresume: o.onresume ? [{ fn: o.onresume }] : [],
    };

    const soundInstance: any = {
        // --- Public Methods ---
        load: () => {
            let url: string | null = null;
            if (DxSound._state.noAudio) {
                soundInstance._emit("loaderror", null, "No audio support.");
                return soundInstance;
            }
            const srcAsArray = Array.isArray(soundState._src) ? soundState._src : [soundState._src];
            for (let i = 0; i < srcAsArray.length; i++) {
                let ext: string | undefined;
                const srcStr = srcAsArray[i];
                if (soundState._format[i]) {
                    ext = soundState._format[i];
                } else {
                    if (typeof srcStr !== "string") {
                        soundInstance._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                        continue;
                    }
                    const match = /^data:audio\/([^;,]+);/i.exec(srcStr) || /\.([^.]+)$/.exec(srcStr.split("?", 1)[0]);
                    if (match) ext = match[1].toLowerCase();
                }
                if (ext && DxSound.codecs(ext)) {
                    url = srcStr;
                    break;
                }
            }
            if (!url) {
                soundInstance._emit("loaderror", null, "No codec support for selected audio sources.");
                return soundInstance;
            }
            soundState._src = url; // Now it's a single string
            soundState._state = "loading";
            if (typeof window !== "undefined" && window.location.protocol === "https:" && url.slice(0, 5) === "http:") {
                soundState._html5 = true;
                soundState._webAudio = false;
            }
            createPlayback(soundInstance);
            if (soundState._webAudio) {
                soundInstance._loadBuffer();
            }
            return soundInstance;
        },

        play: (spriteOrId?: string | PlaybackId): PlaybackId | null => {
            let id: PlaybackId | null = null;
            let sprite: string | null = null;
    
            if (typeof spriteOrId === "number") {
                id = spriteOrId;
            } else if (typeof spriteOrId === "string") {
                sprite = spriteOrId;
            } else if (spriteOrId === undefined) {
                sprite = "__default";
            }
    
            const playback = id ? soundInstance._playbackById(id) : soundInstance._inactivePlayback();
    
            if (!playback) return null;
    
            if (id && !sprite) {
                sprite = playback._sprite || "__default";
            }
    
            if (soundState._state !== "loaded") {
                playback._sprite = sprite!;
                playback._ended = false;
                const playbackId = playback._id;
                soundState._queue.push({ event: "play", action: () => soundInstance.play(playbackId) });
                return playbackId;
            }
    
            if (id && !playback._paused) return playback._id;
    
            if (soundState._webAudio) DxSound._autoResume();
    
            const seek = playback._seek > 0 ? playback._seek : (soundState._sprite[sprite!]?.[0] ?? 0) / 1000;
            const duration = Math.max(0, ((soundState._sprite[sprite!]?.[0] ?? 0) + (soundState._sprite[sprite!]?.[1] ?? 0)) / 1000 - seek);
            const timeout = (duration * 1000) / Math.abs(playback._rate);
            playback._sprite = sprite!;
            playback._ended = false;
    
            const setParams = () => {
                playback._paused = false;
                playback._seek = seek;
                playback._start = (soundState._sprite[sprite!]?.[0] ?? 0) / 1000;
                playback._stop = ((soundState._sprite[sprite!]?.[0] ?? 0) + (soundState._sprite[sprite!]?.[1] ?? 0)) / 1000;
                playback._loop = !!(playback._loop || soundState._sprite[sprite!]?.[2]);
            };
    
            if (seek >= playback._stop) {
                soundInstance._ended(playback);
                return null;
            }
    
            const node = playback._node;
            if (soundState._webAudio && node && DxSound._state.ctx) {
                const playWebAudio = () => {
                    soundState._playLock = false;
                    setParams();
                    soundInstance._refreshBuffer(playback);
                    const vol = playback._muted || soundState._muted || DxSound._state._muted ? 0 : playback._volume * (DxSound.volume() as number);
                    (node as GainNode).gain.setValueAtTime(vol, DxSound._state.ctx!.currentTime);
                    playback._playStart = DxSound._state.ctx!.currentTime;
    
                    if (playback._loop) {
                        (node as any).bufferSource.start(0, seek, 86400);
                    } else {
                        (node as any).bufferSource.start(0, seek, duration);
                    }
    
                    if (timeout !== Infinity) {
                        soundState._endTimers[playback._id] = setTimeout(() => soundInstance._ended(playback), timeout);
                    }
    
                    soundInstance._emit("play", playback._id);
                };
    
                if (DxSound._state.state === "running") {
                    playWebAudio();
                } else {
                    soundState._playLock = true;
                    soundInstance.once("resume", playWebAudio);
                    soundInstance._clearTimer(playback._id);
                }
            } else if(node) {
                const playHtml5 = () => {
                    const htmlNode = node as HTMLAudioElement;
                    htmlNode.currentTime = seek;
                    htmlNode.muted = playback._muted || soundState._muted || DxSound._state._muted;
                    htmlNode.volume = playback._volume * (DxSound.volume() as number);
                    htmlNode.playbackRate = playback._rate;
    
                    try {
                        const promise = htmlNode.play();
                        if(promise) {
                            soundState._playLock = true;
                            setParams();
                            promise.then(() => {
                                soundState._playLock = false;
                                (htmlNode as any)._unlocked = true;
                                soundInstance._emit("play", playback._id);
                            }).catch(() => {
                                soundState._playLock = false;
                                soundInstance._emit("playerror", playback._id, "Playback was unable to start.");
                                playback._ended = true;
                                playback._paused = true;
                            });
                        } else {
                            setParams();
                            soundInstance._emit("play", playback._id);
                        }
                    } catch(e) {
                        soundInstance._emit("playerror", playback._id, e);
                    }
                };
                const htmlNode = node as HTMLAudioElement;
                const readyState = (window as any).ejecta ? 4 : htmlNode.readyState;
    
                if (readyState >= 3) {
                    playHtml5();
                } else {
                    soundState._playLock = true;
                    const listener = () => {
                        playHtml5();
                        htmlNode.removeEventListener(DxSound._state._canPlayEvent, listener, false);
                    };
                    htmlNode.addEventListener(DxSound._state._canPlayEvent, listener, false);
                    soundInstance._clearTimer(playback._id);
                }
            }
            return playback._id;
        },

        pause: (id?: PlaybackId) => {
            if (soundState._state !== "loaded" || soundState._playLock) {
                soundState._queue.push({ event: "pause", action: () => soundInstance.pause(id) });
                return soundInstance;
            }
            const ids = soundInstance._getPlaybackIds(id);
            for (const playbackId of ids) {
                soundInstance._clearTimer(playbackId);
                const playback = soundInstance._playbackById(playbackId);
                if (playback && !playback._paused) {
                    playback._seek = soundInstance.seek(playbackId) as number;
                    playback._rateSeek = 0;
                    playback._paused = true;
                    soundInstance._stopFade(playbackId);
                    if (playback._node) {
                        if (soundState._webAudio) {
                            if ((playback._node as any).bufferSource) {
                               (playback._node as any).bufferSource.stop(0);
                                soundInstance._cleanBuffer(playback._node);
                            }
                        } else {
                            if (!isNaN((playback._node as HTMLAudioElement).duration) || (playback._node as HTMLAudioElement).duration === Infinity) {
                                (playback._node as HTMLAudioElement).pause();
                            }
                        }
                    }
                    soundInstance._emit("pause", playbackId);
                }
            }
            return soundInstance;
        },

        stop: (id?: PlaybackId) => {
            if (soundState._state !== "loaded" || soundState._playLock) {
                soundState._queue.push({ event: "stop", action: () => soundInstance.stop(id) });
                return soundInstance;
            }
            const ids = soundInstance._getPlaybackIds(id);
            for (const playbackId of ids) {
                soundInstance._clearTimer(playbackId);
                const playback = soundInstance._playbackById(playbackId);
                if(playback) {
                    playback._seek = playback._start || 0;
                    playback._rateSeek = 0;
                    playback._paused = true;
                    playback._ended = true;
                    soundInstance._stopFade(playbackId);
                    if (playback._node) {
                        if (soundState._webAudio) {
                            if ((playback._node as any).bufferSource) {
                                (playback._node as any).bufferSource.stop(0);
                                soundInstance._cleanBuffer(playback._node);
                            }
                        } else if (playback._node && !isNaN((playback._node as HTMLAudioElement).duration)) {
                            (playback._node as HTMLAudioElement).currentTime = playback._start || 0;
                            (playback._node as HTMLAudioElement).pause();
                        }
                    }
                    soundInstance._emit("stop", playbackId);
                }
            }
            return soundInstance;
        },

        mute: (muted: boolean, id?: PlaybackId) => {
            if (soundState._state !== "loaded" || soundState._playLock) {
                soundState._queue.push({ event: "mute", action: () => soundInstance.mute(muted, id) });
                return soundInstance;
            }
            if (id === undefined) {
                soundState._muted = muted;
            }
            const ids = soundInstance._getPlaybackIds(id);
            for (const playbackId of ids) {
                const playback = soundInstance._playbackById(playbackId);
                if (playback) {
                    playback._muted = muted;
                    soundInstance._stopFade(playbackId);
                    if (soundState._webAudio && playback._node && DxSound._state.ctx) {
                        (playback._node as GainNode).gain.setValueAtTime(muted ? 0 : playback._volume, DxSound._state.ctx.currentTime);
                    } else if (playback._node) {
                        (playback._node as HTMLAudioElement).muted = DxSound._state._muted ? true : muted;
                    }
                    soundInstance._emit("mute", playbackId);
                }
            }
            return soundInstance;
        },

        volume: (vol?: number, id?: PlaybackId): any => {
            if (vol === undefined) {
                if (id !== undefined) {
                    const playback = soundInstance._playbackById(id);
                    return playback ? playback._volume : 0;
                }
                return soundState._volume;
            }
    
            if (vol >= 0 && vol <= 1) {
                 if (soundState._state !== "loaded" || soundState._playLock) {
                    soundState._queue.push({ event: "volume", action: () => soundInstance.volume(vol, id) });
                    return soundInstance;
                }
                if(id === undefined) {
                    soundState._volume = vol;
                }
                const ids = soundInstance._getPlaybackIds(id);
                for (const playbackId of ids) {
                    const playback = soundInstance._playbackById(playbackId);
                    if (playback) {
                        playback._volume = vol;
                        soundInstance._stopFade(playbackId);
                        if (soundState._webAudio && playback._node && !playback._muted && DxSound._state.ctx) {
                            (playback._node as GainNode).gain.setValueAtTime(vol, DxSound._state.ctx.currentTime);
                        } else if (playback._node && !playback._muted) {
                            (playback._node as HTMLAudioElement).volume = vol * (DxSound.volume() as number);
                        }
                        soundInstance._emit("volume", playbackId);
                    }
                }
            }
            return soundInstance;
        },

        fade: (from: number, to: number, len: number, id?: PlaybackId): any => {
            if (soundState._state !== "loaded" || soundState._playLock) {
                soundState._queue.push({ event: "fade", action: () => soundInstance.fade(from, to, len, id) });
                return soundInstance;
            }
            soundInstance.volume(from, id);
            const ids = soundInstance._getPlaybackIds(id);
            for (const playbackId of ids) {
                const playback = soundInstance._playbackById(playbackId);
                if (playback && DxSound._state.ctx) {
                    soundInstance._stopFade(playbackId);
                    if (soundState._webAudio && !playback._muted) {
                        const currentTime = DxSound._state.ctx.currentTime;
                        const end = currentTime + len / 1000;
                        playback._volume = from;
                        (playback._node as GainNode).gain.setValueAtTime(from, currentTime);
                        (playback._node as GainNode).gain.linearRampToValueAtTime(to, end);
                    }
                    soundInstance._startFadeInterval(playback, from, to, len, playbackId);
                }
            }
            return soundInstance;
        },

        loop: (loop?: boolean, id?: PlaybackId): any => {
            if (loop === undefined) {
                if (id !== undefined) {
                    const playback = soundInstance._playbackById(id);
                    return playback ? playback._loop : false;
                }
                return soundState._loop;
            }
    
            const ids = soundInstance._getPlaybackIds(id);
            for (const playbackId of ids) {
                const playback = soundInstance._playbackById(playbackId);
                if (playback) {
                    playback._loop = loop;
                    if (soundState._webAudio && playback._node && (playback._node as any).bufferSource) {
                        (playback._node as any).bufferSource.loop = loop;
                        if(loop) {
                            (playback._node as any).bufferSource.loopStart = playback._start || 0;
                            (playback._node as any).bufferSource.loopEnd = playback._stop;
                        }
                    }
                }
            }
            return soundInstance;
        },

        rate: (rate?: number, id?: PlaybackId): any => {
            if (rate === undefined) {
                const playback = soundInstance._playbackById(id ?? soundState._playbacks[0]?._id);
                return playback ? playback._rate : soundState._rate;
            }
    
            if (soundState._state !== "loaded" || soundState._playLock) {
                soundState._queue.push({ event: "rate", action: () => soundInstance.rate(rate, id) });
                return soundInstance;
            }
            if (id === undefined) {
                soundState._rate = rate;
            }
            const ids = soundInstance._getPlaybackIds(id);
            for (const playbackId of ids) {
                const playback = soundInstance._playbackById(playbackId);
                if (playback && DxSound._state.ctx) {
                    playback._rate = rate;
                    if (soundState._webAudio && playback._node && (playback._node as any).bufferSource) {
                        (playback._node as any).bufferSource.playbackRate.setValueAtTime(rate, DxSound._state.ctx.currentTime);
                    } else if (playback._node) {
                        (playback._node as HTMLAudioElement).playbackRate = rate;
                    }
                    const seek = soundInstance.seek(playbackId) as number;
                    const duration = ((soundState._sprite[playback._sprite]?.[0] + soundState._sprite[playback._sprite]?.[1]) / 1000) - seek;
                    const timeout = (duration * 1000) / Math.abs(playback._rate);
                    if (soundState._endTimers[playbackId] || !playback._paused) {
                        soundInstance._clearTimer(playbackId);
                        soundState._endTimers[playbackId] = setTimeout(() => soundInstance._ended(playback), timeout);
                    }
                    soundInstance._emit("rate", playbackId);
                }
            }
            return soundInstance;
        },

        seek: (seek?: number, id?: PlaybackId): any => {
            if (seek === undefined) {
                const playbackId = id ?? soundState._playbacks[0]?._id;
                if(!playbackId) return 0;
    
                const playback = soundInstance._playbackById(playbackId);
                if (playback && DxSound._state.ctx) {
                    if (soundState._webAudio) {
                        const realTime = !playback._paused ? DxSound._state.ctx.currentTime - playback._playStart : 0;
                        return playback._seek + (playback._rateSeek + realTime * Math.abs(playback._rate));
                    }
                    return (playback._node as HTMLAudioElement).currentTime;
                }
                return 0;
            }
    
            if (soundState._state !== "loaded" || soundState._playLock) {
                soundState._queue.push({ event: "seek", action: () => soundInstance.seek(seek, id) });
                return soundInstance;
            }
            const ids = soundInstance._getPlaybackIds(id);
            for (const playbackId of ids) {
                const playback = soundInstance._playbackById(playbackId);
                if (playback) {
                    const playing = !playback._paused;
                    if (playing) soundInstance.pause(playbackId);
                    playback._seek = seek;
                    playback._ended = false;
                    soundInstance._clearTimer(playbackId);
                    if (!soundState._webAudio && playback._node) {
                        (playback._node as HTMLAudioElement).currentTime = seek;
                    }
                    if (playing) soundInstance.play(playbackId);
                    soundInstance._emit("seek", playbackId);
                }
            }
            return soundInstance;
        },

        playing: (id: PlaybackId): boolean => {
            const playback = soundInstance._playbackById(id);
            return playback ? !playback._paused : false;
        },
    
        duration: (id?: PlaybackId): number => {
            if (id) {
                const playback = soundInstance._playbackById(id);
                if (playback && soundState._sprite[playback._sprite]) {
                    return soundState._sprite[playback._sprite][1] / 1000;
                }
            }
            return soundState._duration;
        },
    
        state: (): SoundState => { return soundState._state; },
    
        unload: () => {
            for (const playback of [...soundState._playbacks]) {
                if (!playback._paused) soundInstance.stop(playback._id);
                if (!soundState._webAudio && playback._node) {
                    DxSound._clearSound(playback._node as HTMLAudioElement);
                    playback._node.removeEventListener("error", playback._errorFn as any, false);
                    playback._node.removeEventListener(DxSound._state._canPlayEvent, playback._loadFn!, false);
                    DxSound._releaseHtml5Audio(playback._node as HTMLAudioElement);
                }
                playback._node = null;
                soundInstance._clearTimer(playback._id);
            }
    
            const index = DxSound._state._sounds.indexOf(soundInstance);
            if (index >= 0) DxSound._state._sounds.splice(index, 1);
    
            const remCache = !DxSound._state._sounds.some(sound => (sound._src as string) === (soundState._src as string));
            if (cache[soundState._src as string] && remCache) {
                delete cache[soundState._src as string];
            }
    
            soundState._playbacks = [];
        },

        on: (event: string, fn: Function, id?: PlaybackId, once?: boolean) => {
            const events = (soundState as any)[`_on${event}`] as any[];
            if(events) events.push({ id, fn, once });
            return soundInstance;
        },
    
        off: (event: string, fn?: Function, id?: PlaybackId) => {
            const events = (soundState as any)[`_on${event}`] as any[];
            if (!fn && !id) {
                if(events) (soundState as any)[`_on${event}`] = [];
            } else if(events) {
                for(let i=events.length-1; i>=0; i--) {
                    const isId = (id === events[i].id);
                    if ((fn === events[i].fn && isId) || (!fn && isId)) {
                        events.splice(i, 1);
                    }
                }
            }
            return soundInstance;
        },
        
        once: (event: string, fn: Function, id?: PlaybackId) => {
            return soundInstance.on(event, fn, id, true);
        },

        // --- Internal Methods ---
        _emit: (event: string, id?: PlaybackId | null, msg?: any) => {
            const events = (soundState as any)[`_on${event}`] as { id?: PlaybackId; fn: Function; once?: boolean }[];
            if(events) {
                for(let i=events.length-1; i>=0; i--) {
                    const e = events[i];
                    if (!e.id || e.id === id || event === "load") {
                        setTimeout(() => e.fn.call(soundInstance, id, msg), 0);
                        if (e.once) soundInstance.off(event, e.fn, e.id);
                    }
                }
            }
            soundInstance._loadQueue(event);
        },
    
        _loadQueue: (event?: string) => {
            if (soundState._queue.length > 0) {
                const task = soundState._queue[0];
                if (!event || task.event === event) {
                    soundState._queue.shift();
                    if(!event) task.action();
                }
            }
        },
        
        _ended: (playback: any) => {
            const loop = !!(playback._loop || soundState._sprite[playback._sprite]?.[2]);
            soundInstance._emit("end", playback._id);
            if(soundState._webAudio && loop) {
                soundInstance.play(playback._id);
            } else if (soundState._webAudio && !loop) {
                playback._paused = true;
                playback._ended = true;
                playback._seek = playback._start || 0;
                soundInstance._clearTimer(playback._id);
                soundInstance._cleanBuffer(playback._node!);
                DxSound._autoSuspend();
            } else if (!soundState._webAudio) {
                if (loop) {
                    soundInstance.stop(playback._id).play(playback._id);
                } else {
                    soundInstance.stop(playback._id);
                }
            }
        },
    
        _clearTimer: (id: PlaybackId) => {
            if (soundState._endTimers[id]) {
                if (typeof soundState._endTimers[id] !== "function") {
                    clearTimeout(soundState._endTimers[id]);
                }
                delete soundState._endTimers[id];
            }
        },
    
        _playbackById: (id: PlaybackId): any | null => {
            return soundState._playbacks.find(p => p._id === id) || null;
        },
    
        _inactivePlayback: (): any => {
            soundInstance._drain();
            const inactive = soundState._playbacks.find(p => p._ended);
            return inactive ? inactive.reset() : createPlayback(soundInstance);
        },
    
        _drain: () => {
            const limit = soundState._pool;
            let endedCount = soundState._playbacks.filter(p => p._ended).length;
            if (soundState._playbacks.length < limit) return;
    
            for (let i = soundState._playbacks.length - 1; i >= 0; i--) {
                if (endedCount <= limit) break;
                if (soundState._playbacks[i]._ended) {
                    if (soundState._webAudio && soundState._playbacks[i]._node) {
                        (soundState._playbacks[i]._node as GainNode).disconnect(0);
                    }
                    soundState._playbacks.splice(i, 1);
                    endedCount--;
                }
            }
        },
    
        _getPlaybackIds: (id?: PlaybackId): PlaybackId[] => {
            return id === undefined ? soundState._playbacks.map(p => p._id) : [id];
        },
        
        _refreshBuffer: (playback: any) => {
            if (!DxSound._state.ctx) return;
            const node = playback._node as any;
            node.bufferSource = DxSound._state.ctx.createBufferSource();
            node.bufferSource.buffer = cache[soundState._src as string];
            node.bufferSource.connect(playback._panner ? playback._panner : node);
            node.bufferSource.loop = playback._loop;
            if (playback._loop) {
                node.bufferSource.loopStart = playback._start || 0;
                node.bufferSource.loopEnd = playback._stop || 0;
            }
            node.bufferSource.playbackRate.setValueAtTime(playback._rate, DxSound._state.ctx.currentTime);
        },
    
        _cleanBuffer: (node: any) => {
            if (DxSound._state._scratchBuffer && node.bufferSource) {
                node.bufferSource.onended = null;
                node.bufferSource.disconnect(0);
            }
            node.bufferSource = null;
        },
    
        _startFadeInterval: (playback: any, from: number, to: number, len: number, id: PlaybackId) => {
            const diff = to - from;
            const stepLen = len / (Math.abs(diff) / 0.01);
            let vol = from;
    
            playback._interval = setInterval(() => {
                vol += diff * (stepLen / len);
                vol = Math.max(0, Math.min(1, vol));
                soundInstance.volume(vol, id);
    
                if ((to > from && vol >= to) || (to < from && vol <= to)) {
                    clearInterval(playback._interval);
                    playback._interval = null;
                    soundInstance.volume(to, id);
                    soundInstance._emit("fade", id);
                }
            }, stepLen);
        },
        
        _stopFade: (id: PlaybackId) => {
            const playback = soundInstance._playbackById(id);
            if(playback && playback._interval && DxSound._state.ctx) {
                if (soundState._webAudio) {
                    (playback._node as GainNode).gain.cancelScheduledValues(DxSound._state.ctx.currentTime);
                }
                clearInterval(playback._interval);
                playback._interval = null;
                if(playback._fadeTo !== null) soundInstance.volume(playback._fadeTo, id);
                playback._fadeTo = null;
                soundInstance._emit("fade", id);
            }
        },
    
        _loadBuffer: () => {
            const url = soundState._src as string;
            if (cache[url]) {
                soundState._duration = cache[url].duration;
                soundInstance._loadSound(cache[url]);
                return;
            }
    
            if (/^data:[^;]+;base64,/.test(url)) {
                const data = atob(url.split(",")[1]);
                const dataView = new Uint8Array(data.length);
                for (let i = 0; i < data.length; ++i) {
                    dataView[i] = data.charCodeAt(i);
                }
                soundInstance._decodeAudioData(dataView.buffer);
            } else {
                const xhr = new XMLHttpRequest();
                xhr.open(soundState._xhr?.method || "GET", url, true);
                xhr.withCredentials = soundState._xhr?.withCredentials || false;
                xhr.responseType = "arraybuffer";
                if(soundState._xhr?.headers) {
                    Object.keys(soundState._xhr.headers).forEach(key => {
                        xhr.setRequestHeader(key, soundState._xhr!.headers![key]);
                    });
                }
                
                const handleError = (_e?: any) => {
                    if (soundState._webAudio) {
                        soundState._html5 = true;
                        soundState._webAudio = false;
                        soundState._playbacks = [];
                        delete cache[url];
                        soundInstance.load();
                    }
                };

                xhr.onload = () => {
                    soundInstance._decodeAudioData(xhr.response);
                };
                xhr.onerror = handleError;
                try {
                    xhr.send();
                } catch (e) {
                    handleError(e);
                }
            }
        },
    
        _decodeAudioData: (arraybuffer: ArrayBuffer) => {
            if (!DxSound._state.ctx) return;
            DxSound._state.ctx.decodeAudioData(arraybuffer,
                (buffer) => {
                    if (buffer && soundState._playbacks.length > 0) {
                        cache[soundState._src as string] = buffer;
                        soundInstance._loadSound(buffer);
                    }
                },
                () => {
                    soundInstance._emit("loaderror", null, "Decoding audio data failed.");
                }
            );
        },
    
        _loadSound: (buffer: AudioBuffer) => {
            soundState._duration = buffer.duration;
            if (Object.keys(soundState._sprite).length === 0) {
                soundState._sprite = { __default: [0, soundState._duration * 1000] };
            }
            if (soundState._state !== "loaded") {
                soundState._state = "loaded";
                soundInstance._emit("load");
                soundInstance._loadQueue();
            }
        },

        // Expose state for internal use
        ...soundState,
    };

    if (DxSound._state.ctx && DxSound._state.autoUnlock) {
        DxSound._unlockAudio();
    }

    DxSound._state._sounds.push(soundInstance);

    if (soundState._autoplay) {
        soundState._queue.push({ event: "play", action: () => soundInstance.play() });
    }

    if (soundState._preload) {
        soundInstance.load();
    }

    return soundInstance;
};

// --- Playback Instance Factory ---
const createPlayback = (sound: Sound) => {
    const playback: any = {
        _parent: sound,
        _muted: sound._muted,
        _loop: sound._loop,
        _volume: sound._volume,
        _rate: sound._rate,
        _seek: 0,
        _rateSeek: 0,
        _paused: true,
        _ended: true,
        _sprite: "__default",
        _id: ++DxSound._state._counter,
        _node: null,
        _panner: null,
        _playStart: 0,
        _start: 0,
        _stop: 0,
        _fadeTo: null,
        _interval: undefined,
        _errorFn: undefined,
        _loadFn: undefined,
        _endFn: undefined,
    };

    const create = () => {
        const parent = playback._parent;
        const volume = DxSound._state._muted || playback._muted || parent._muted ? 0 : playback._volume * (DxSound.volume() as number);

        if (parent._webAudio && DxSound._state.ctx) {
            playback._node = DxSound._state.ctx.createGain();
            (playback._node as GainNode).gain.setValueAtTime(volume, DxSound._state.ctx.currentTime);
            (playback._node as any).paused = true;
            playback._node.connect(DxSound._state.masterGain!);
        } else if (!DxSound._state.noAudio) {
            playback._node = DxSound._obtainHtml5Audio();
            playback._errorFn = _errorListener.bind(playback);
            playback._node.addEventListener("error", playback._errorFn as any, false);
            playback._loadFn = _loadListener.bind(playback);
            playback._node.addEventListener(DxSound._state._canPlayEvent, playback._loadFn, false);
            playback._endFn = _endListener.bind(playback);
            playback._node.addEventListener("ended", playback._endFn, false);

            (playback._node as HTMLAudioElement).src = parent._src as string;
            
            const preloadValue = parent._preload;
            (playback._node as HTMLAudioElement).preload = 
                preloadValue === true ? "auto" :
                preloadValue === false ? "none" :
                preloadValue;

            (playback._node as HTMLAudioElement).volume = volume;
            (playback._node as HTMLAudioElement).load();
        }
    };

    const reset = () => {
        const parent = playback._parent;
        playback._muted = parent._muted;
        playback._loop = parent._loop;
        playback._volume = parent._volume;
        playback._rate = parent._rate;
        playback._seek = 0;
        playback._rateSeek = 0;
        playback._paused = true;
        playback._ended = true;
        playback._sprite = "__default";
        playback._id = ++DxSound._state._counter;
        return playback;
    };

    function _errorListener(this: any) {
        if (this._node) {
            this._parent._emit("loaderror", this._id, (this._node as HTMLAudioElement).error);
            (this._node as HTMLAudioElement).removeEventListener("error", this._errorFn as any, false);
        }
    }

    function _loadListener(this: any) {
        const parent = this._parent;
        if (this._node) {
            parent._duration = Math.ceil((this._node as HTMLAudioElement).duration * 10) / 10;
            if (Object.keys(parent._sprite).length === 0) {
                (parent._sprite as any).__default = [0, parent._duration * 1000];
            }
            if (parent._state !== "loaded") {
                parent._state = "loaded";
                parent._emit("load");
                parent._loadQueue();
            }
            (this._node as HTMLAudioElement).removeEventListener(DxSound._state._canPlayEvent, this._loadFn!, false);
        }
    }

    function _endListener(this: any) {
        const parent = this._parent;
        if (parent._duration === Infinity && this._node) {
            parent._duration = Math.ceil((this._node as HTMLAudioElement).duration * 10) / 10;
            if ((parent._sprite as any).__default[1] === Infinity) {
                (parent._sprite as any).__default[1] = parent._duration * 1000;
            }
            parent._ended(this);
        }
        if (this._node) {
            (this._node as HTMLAudioElement).removeEventListener("ended", this._endFn!, false);
        }
    }

    playback.reset = reset;
    
    create();
    sound._playbacks.push(playback);
    return playback;
}

//================================================================================
// 3. DXSOUND GLOBAL INSTANCE
//================================================================================
export const DxSound = createDxSoundGlobal();

//================================================================================
// 4. ZUSTAND STORE for Global State Management
//================================================================================

const useSoundStore = create<SoundStore>((set) => ({
    playing: new Set(),
    addPlaying: (id) => {
        set((state) => {
            const newPlaying = new Set(state.playing);
            newPlaying.add(id);
            return { playing: newPlaying };
        });
    },
    removePlaying: (id) => {
        set((state) => {
            const newPlaying = new Set(state.playing);
            newPlaying.delete(id);
            return { playing: newPlaying };
        });
    },
    stopAll: () => {
        DxSound.stop();
        set({ playing: new Set() });
    },
}));

//================================================================================
// 5. THE `useSound` HOOK
//================================================================================

export function useSound(
    src: string | string[],
    options: UseSoundOptions = {}
): UseSoundTuple {
    const {
        id,
        volume = 1,
        rate: playbackRate = 1,
        soundEnabled = true,
        loop = false,
        interrupt = false,
        ...rest
    } = options;

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState<number | null>(null);
    const soundRef = useRef<Sound | null>(null);

    const { addPlaying, removePlaying, stopAll: stopAllStore } = useSoundStore();
    const soundId = id || (Array.isArray(src) ? src.join("") : src);

    const stop = useCallback((id?: PlaybackId) => {
        if (soundRef.current) {
            soundRef.current.stop(id);
        }
    }, []);

    const play: PlayFunction = useCallback((opts) => {
        if (!soundEnabled || !soundRef.current) return;
        if (interrupt) {
            stopAllStore();
        }
        soundRef.current.play(opts?.sprite || (opts?.id as PlaybackId));
    }, [soundEnabled, interrupt, stopAllStore]);

    const pause = useCallback((id?: PlaybackId) => {
        if (soundRef.current) soundRef.current.pause(id);
    }, []);

    const mute = useCallback((muted: boolean, id?: PlaybackId) => {
        if (soundRef.current) soundRef.current.mute(muted, id);
    }, []);

    const seek = useCallback((position: number, id?: PlaybackId) => {
        if (soundRef.current) soundRef.current.seek(position, id);
    }, []);

    const setVolume = useCallback((newVol: number, id?: PlaybackId) => {
        if (soundRef.current) soundRef.current.volume(newVol, id);
    }, []);

    const setRate = useCallback((newRate: number, id?: PlaybackId) => {
        if(soundRef.current) soundRef.current.rate(newRate, id);
    }, []);

    useEffect(() => {
        if (!soundEnabled) {
            return;
        }

        const soundInstance = createSound({
            src,
            volume,
            rate: playbackRate,
            loop,
            ...rest,
            onplay: (playedId) => {
                setIsPlaying(true);
                addPlaying(soundId);
                rest.onplay?.(playedId);
            },
            onpause: (playedId) => {
                setIsPlaying(false);
                removePlaying(soundId);
                rest.onpause?.(playedId);
            },
            onstop: (playedId) => {
                setIsPlaying(false);
                removePlaying(soundId);
                rest.onstop?.(playedId);
            },
            onend: (playedId) => {
                setIsPlaying(false);
                removePlaying(soundId);
                rest.onend?.(playedId);
            },
            onload: () => {
                setDuration(soundInstance.duration());
                rest.onload?.();
            },
        });

        soundRef.current = soundInstance;

        return () => {
            soundInstance.unload();
            removePlaying(soundId);
        };
    }, [soundEnabled, JSON.stringify(src), soundId, volume, playbackRate, loop, JSON.stringify(rest)]);

    useEffect(() => {
        if (soundRef.current) {
            soundRef.current.volume(volume);
        }
    }, [volume]);

    useEffect(() => {
        if (soundRef.current) {
            soundRef.current.loop(loop);
        }
    }, [loop]);

    useEffect(() => {
        if (soundRef.current) {
            soundRef.current.rate(playbackRate);
        }
    }, [playbackRate]);

    const exposedData: ExposedData = {
        pause,
        stop,
        mute,
        seek: seek as (pos: number, id?: PlaybackId) => void,
        duration,
        isPlaying,
        sound: soundRef.current,
        volume: setVolume,
        rate: setRate as (rate?: number, id?: PlaybackId) => void,
    };

    return [play, exposedData];
}

//================================================================================
// 6. GLOBAL CONTROLS EXPORT
//================================================================================

export const sound = {
    global: DxSound,
    stopAll: useSoundStore.getState().stopAll,
    getPlaying: () => Array.from(useSoundStore.getState().playing),
};
