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
// 2. CORE AUDIO ENGINE (dx-sound)
//================================================================================

const cache: { [key: string]: AudioBuffer } = {};

class Playback {
    _parent: Sound;
    _muted: boolean;
    _loop: boolean;
    _volume: number;
    _rate: number;
    _seek: number = 0;
    _rateSeek: number = 0;
    _paused: boolean = true;
    _ended: boolean = true;
    _sprite: string = "__default";
    _id: PlaybackId;
    _node: (GainNode & { paused?: boolean; bufferSource?: AudioBufferSourceNode }) | HTMLAudioElement | null = null;
    _panner: PannerNode | null = null;
    _playStart: number = 0;
    _start: number = 0;
    _stop: number = 0;
    _fadeTo: number | null = null;
    _interval?: any;
    _errorFn?: (event: ErrorEvent) => void;
    _loadFn?: () => void;
    _endFn?: () => void;

    constructor(sound: Sound) {
        this._parent = sound;
        this._muted = sound._muted;
        this._loop = sound._loop;
        this._volume = sound._volume;
        this._rate = sound._rate;
        this._id = ++DxSound._counter;
        this._parent._playbacks.push(this);
        this.create();
    }

    create() {
        const parent = this._parent;
        const volume = DxSound._muted || this._muted || parent._muted ? 0 : this._volume * (DxSound.volume() as number);

        if (parent._webAudio) {
            this._node = DxSound.ctx!.createGain();
            (this._node as GainNode).gain.setValueAtTime(volume, DxSound.ctx!.currentTime);
            (this._node as any).paused = true;
            this._node.connect(DxSound.masterGain!);
        } else if (!DxSound.noAudio) {
            this._node = DxSound._obtainHtml5Audio();
            this._errorFn = this._errorListener.bind(this);
            this._node.addEventListener("error", this._errorFn as any, false);
            this._loadFn = this._loadListener.bind(this);
            this._node.addEventListener(DxSound._canPlayEvent, this._loadFn, false);
            this._endFn = this._endListener.bind(this);
            this._node.addEventListener("ended", this._endFn, false);

            (this._node as HTMLAudioElement).src = parent._src as string;
            (this._node as HTMLAudioElement).preload = parent._preload === true ? "auto" : (parent._preload as string);
            (this._node as HTMLAudioElement).volume = volume;
            (this._node as HTMLAudioElement).load();
        }
    }

    reset() {
        const parent = this._parent;
        this._muted = parent._muted;
        this._loop = parent._loop;
        this._volume = parent._volume;
        this._rate = parent._rate;
        this._seek = 0;
        this._rateSeek = 0;
        this._paused = true;
        this._ended = true;
        this._sprite = "__default";
        this._id = ++DxSound._counter;
        return this;
    }

    private _errorListener(this: Playback) {
        if (this._node) {
            this._parent._emit("loaderror", this._id, (this._node as HTMLAudioElement).error);
            (this._node as HTMLAudioElement).removeEventListener("error", this._errorFn as any, false);
        }
    }

    private _loadListener(this: Playback) {
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
            (this._node as HTMLAudioElement).removeEventListener(DxSound._canPlayEvent, this._loadFn!, false);
        }
    }

    private _endListener(this: Playback) {
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
}

class Sound {
    _autoplay: boolean;
    _format: string[];
    _html5: boolean;
    _muted: boolean;
    _loop: boolean;
    _pool: number;
    _preload: boolean | "metadata";
    _rate: number;
    _sprite: SpriteMap;
    _src: string | string[];
    _volume: number;
    _xhr: SoundOptions["xhr"];
    _duration: number = 0;
    _state: SoundState = "unloaded";
    _playbacks: Playback[] = [];
    _endTimers: { [id: number]: any } = {};
    _queue: { event: string; action: () => void }[] = [];
    _playLock: boolean = false;
    _webAudio: boolean;

    private _onend: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onfade: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onload: { fn: () => void; id?: PlaybackId; once?: boolean }[];
    private _onloaderror: { fn: ErrorCallback; id?: PlaybackId; once?: boolean }[];
    private _onplayerror: { fn: ErrorCallback; id?: PlaybackId; once?: boolean }[];
    private _onpause: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onplay: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onstop: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onmute: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onvolume: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onrate: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onseek: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];
    private _onunlock: { fn: () => void; id?: PlaybackId; once?: boolean }[];
    private _onresume: { fn: EventCallback; id?: PlaybackId; once?: boolean }[];

    constructor(o: SoundOptions) {
        if (!o.src || o.src.length === 0) {
            console.error("An array of source files must be passed with any new Sound.");
            o.src = [""];
        }

        if (!DxSound.ctx) {
            DxSound._setupAudioContext();
        }

        this._autoplay = o.autoplay || false;
        this._format = typeof o.format === "string" ? [o.format] : (o.format || []);
        this._html5 = o.html5 || false;
        this._muted = o.mute || false;
        this._loop = o.loop || false;
        this._pool = o.pool || 5;
        this._preload = typeof o.preload === "boolean" || o.preload === "metadata" ? o.preload : true;
        this._rate = o.rate || 1;
        this._sprite = o.sprite || {};
        this._src = typeof o.src === "string" ? [o.src] : o.src;
        this._volume = o.volume !== undefined ? o.volume : 1;
        this._xhr = {
            method: o.xhr?.method || "GET",
            headers: o.xhr?.headers || undefined,
            withCredentials: o.xhr?.withCredentials || false,
        };

        this._onend = o.onend ? [{ fn: o.onend }] : [];
        this._onfade = o.onfade ? [{ fn: o.onfade }] : [];
        this._onload = o.onload ? [{ fn: o.onload }] : [];
        this._onloaderror = o.onloaderror ? [{ fn: o.onloaderror }] : [];
        this._onplayerror = o.onplayerror ? [{ fn: o.onplayerror }] : [];
        this._onpause = o.onpause ? [{ fn: o.onpause }] : [];
        this._onplay = o.onplay ? [{ fn: o.onplay }] : [];
        this._onstop = o.onstop ? [{ fn: o.onstop }] : [];
        this._onmute = o.onmute ? [{ fn: o.onmute }] : [];
        this._onvolume = o.onvolume ? [{ fn: o.onvolume }] : [];
        this._onrate = o.onrate ? [{ fn: o.onrate }] : [];
        this._onseek = o.onseek ? [{ fn: o.onseek }] : [];
        this._onunlock = o.onunlock ? [{ fn: o.onunlock }] : [];
        this._onresume = o.onresume ? [{ fn: o.onresume }] : [];

        this._webAudio = DxSound.usingWebAudio && !this._html5;

        if (DxSound.ctx && DxSound.autoUnlock) {
            DxSound._unlockAudio();
        }

        DxSound._sounds.push(this);

        if (this._autoplay) {
            this._queue.push({ event: "play", action: () => this.play() });
        }

        if (this._preload && this._preload !== "none") {
            this.load();
        }
    }

    load() {
        let url: string | null = null;

        if (DxSound.noAudio) {
            this._emit("loaderror", null, "No audio support.");
            return this;
        }

        if (typeof this._src === "string") this._src = [this._src];

        for (let i = 0; i < this._src.length; i++) {
            let ext: string | undefined;
            const srcStr = this._src[i];

            if (this._format[i]) {
                ext = this._format[i];
            } else {
                if (typeof srcStr !== "string") {
                    this._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
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
            this._emit("loaderror", null, "No codec support for selected audio sources.");
            return this;
        }

        this._src = url;
        this._state = "loading";

        if (typeof window !== "undefined" && window.location.protocol === "https:" && url.slice(0, 5) === "http:") {
            this._html5 = true;
            this._webAudio = false;
        }

        new Playback(this);

        if (this._webAudio) {
            this._loadBuffer();
        }

        return this;
    }

    play(spriteOrId?: string | PlaybackId): PlaybackId | null {
        let id: PlaybackId | null = null;
        let sprite: string | null = null;

        if (typeof spriteOrId === "number") {
            id = spriteOrId;
        } else if (typeof spriteOrId === "string") {
            sprite = spriteOrId;
        } else if (spriteOrId === undefined) {
            sprite = "__default";
        }

        const playback = id ? this._playbackById(id) : this._inactivePlayback();

        if (!playback) return null;

        if (id && !sprite) {
            sprite = playback._sprite || "__default";
        }

        if (this._state !== "loaded") {
            playback._sprite = sprite!;
            playback._ended = false;
            const playbackId = playback._id;
            this._queue.push({ event: "play", action: () => this.play(playbackId) });
            return playbackId;
        }

        if (id && !playback._paused) return playback._id;

        if (this._webAudio) DxSound._autoResume();

        const seek = playback._seek > 0 ? playback._seek : (this._sprite[sprite!]?.[0] ?? 0) / 1000;
        const duration = Math.max(0, ((this._sprite[sprite!]?.[0] ?? 0) + (this._sprite[sprite!]?.[1] ?? 0)) / 1000 - seek);
        const timeout = (duration * 1000) / Math.abs(playback._rate);
        playback._sprite = sprite!;
        playback._ended = false;

        const setParams = () => {
            playback._paused = false;
            playback._seek = seek;
            playback._start = (this._sprite[sprite!]?.[0] ?? 0) / 1000;
            playback._stop = ((this._sprite[sprite!]?.[0] ?? 0) + (this._sprite[sprite!]?.[1] ?? 0)) / 1000;
            playback._loop = !!(playback._loop || this._sprite[sprite!]?.[2]);
        };

        if (seek >= playback._stop) {
            this._ended(playback);
            return null;
        }

        const node = playback._node;
        if (this._webAudio && node) {
            const playWebAudio = () => {
                this._playLock = false;
                setParams();
                this._refreshBuffer(playback);
                const vol = playback._muted || this._muted || DxSound._muted ? 0 : playback._volume * (DxSound.volume() as number);
                (node as GainNode).gain.setValueAtTime(vol, DxSound.ctx!.currentTime);
                playback._playStart = DxSound.ctx!.currentTime;

                if (playback._loop) {
                    (node as any).bufferSource.start(0, seek, 86400);
                } else {
                    (node as any).bufferSource.start(0, seek, duration);
                }

                if (timeout !== Infinity) {
                    this._endTimers[playback._id] = setTimeout(() => this._ended(playback), timeout);
                }

                this._emit("play", playback._id);
            };

            if (DxSound.state === "running") {
                playWebAudio();
            } else {
                this._playLock = true;
                this.once("resume", playWebAudio);
                this._clearTimer(playback._id);
            }
        } else if(node) {
            const playHtml5 = () => {
                const htmlNode = node as HTMLAudioElement;
                htmlNode.currentTime = seek;
                htmlNode.muted = playback._muted || this._muted || DxSound._muted;
                htmlNode.volume = playback._volume * (DxSound.volume() as number);
                htmlNode.playbackRate = playback._rate;

                try {
                    const promise = htmlNode.play();
                    if(promise) {
                        this._playLock = true;
                        setParams();
                        promise.then(() => {
                            this._playLock = false;
                            (htmlNode as any)._unlocked = true;
                            this._emit("play", playback._id);
                        }).catch(() => {
                            this._playLock = false;
                            this._emit("playerror", playback._id, "Playback was unable to start.");
                            playback._ended = true;
                            playback._paused = true;
                        });
                    } else {
                        setParams();
                        this._emit("play", playback._id);
                    }
                } catch(e) {
                    this._emit("playerror", playback._id, e);
                }
            };
            const htmlNode = node as HTMLAudioElement;
            const readyState = (window as any).ejecta ? 4 : htmlNode.readyState;

            if (readyState >= 3) {
                playHtml5();
            } else {
                this._playLock = true;
                const listener = () => {
                    playHtml5();
                    htmlNode.removeEventListener(DxSound._canPlayEvent, listener, false);
                };
                htmlNode.addEventListener(DxSound._canPlayEvent, listener, false);
                this._clearTimer(playback._id);
            }
        }
        return playback._id;
    }

    pause(id?: PlaybackId) {
        if (this._state !== "loaded" || this._playLock) {
            this._queue.push({ event: "pause", action: () => this.pause(id) });
            return this;
        }
        const ids = this._getPlaybackIds(id);
        for (const playbackId of ids) {
            this._clearTimer(playbackId);
            const playback = this._playbackById(playbackId);
            if (playback && !playback._paused) {
                playback._seek = this.seek(playbackId) as number;
                playback._rateSeek = 0;
                playback._paused = true;
                this._stopFade(playbackId);
                if (playback._node) {
                    if (this._webAudio) {
                        if ((playback._node as any).bufferSource) {
                           (playback._node as any).bufferSource.stop(0);
                            this._cleanBuffer(playback._node);
                        }
                    } else {
                        if (!isNaN((playback._node as HTMLAudioElement).duration) || (playback._node as HTMLAudioElement).duration === Infinity) {
                            (playback._node as HTMLAudioElement).pause();
                        }
                    }
                }
                this._emit("pause", playbackId);
            }
        }
        return this;
    }

    stop(id?: PlaybackId) {
        if (this._state !== "loaded" || this._playLock) {
            this._queue.push({ event: "stop", action: () => this.stop(id) });
            return this;
        }
        const ids = this._getPlaybackIds(id);
        for (const playbackId of ids) {
            this._clearTimer(playbackId);
            const playback = this._playbackById(playbackId);
            if(playback) {
                playback._seek = playback._start || 0;
                playback._rateSeek = 0;
                playback._paused = true;
                playback._ended = true;
                this._stopFade(playbackId);
                if (playback._node) {
                    if (this._webAudio) {
                        if ((playback._node as any).bufferSource) {
                            (playback._node as any).bufferSource.stop(0);
                            this._cleanBuffer(playback._node);
                        }
                    } else if (playback._node && !isNaN((playback._node as HTMLAudioElement).duration)) {
                        (playback._node as HTMLAudioElement).currentTime = playback._start || 0;
                        (playback._node as HTMLAudioElement).pause();
                    }
                }
                this._emit("stop", playbackId);
            }
        }
        return this;
    }

    mute(muted: boolean, id?: PlaybackId) {
        if (this._state !== "loaded" || this._playLock) {
            this._queue.push({ event: "mute", action: () => this.mute(muted, id) });
            return this;
        }
        if (id === undefined) {
            this._muted = muted;
        }
        const ids = this._getPlaybackIds(id);
        for (const playbackId of ids) {
            const playback = this._playbackById(playbackId);
            if (playback) {
                playback._muted = muted;
                this._stopFade(playbackId);
                if (this._webAudio && playback._node) {
                    (playback._node as GainNode).gain.setValueAtTime(muted ? 0 : playback._volume, DxSound.ctx!.currentTime);
                } else if (playback._node) {
                    (playback._node as HTMLAudioElement).muted = DxSound._muted ? true : muted;
                }
                this._emit("mute", playbackId);
            }
        }
        return this;
    }

    volume(vol?: number, id?: PlaybackId): this | number {
        if (vol === undefined) {
            if (id !== undefined) {
                const playback = this._playbackById(id);
                return playback ? playback._volume : 0;
            }
            return this._volume;
        }

        if (vol >= 0 && vol <= 1) {
             if (this._state !== "loaded" || this._playLock) {
                this._queue.push({ event: "volume", action: () => this.volume(vol, id) });
                return this;
            }
            if(id === undefined) {
                this._volume = vol;
            }
            const ids = this._getPlaybackIds(id);
            for (const playbackId of ids) {
                const playback = this._playbackById(playbackId);
                if (playback) {
                    playback._volume = vol;
                    this._stopFade(playbackId);
                    if (this._webAudio && playback._node && !playback._muted) {
                        (playback._node as GainNode).gain.setValueAtTime(vol, DxSound.ctx!.currentTime);
                    } else if (playback._node && !playback._muted) {
                        (playback._node as HTMLAudioElement).volume = vol * (DxSound.volume() as number);
                    }
                    this._emit("volume", playbackId);
                }
            }
        }
        return this;
    }

    fade(from: number, to: number, len: number, id?: PlaybackId): this {
        if (this._state !== "loaded" || this._playLock) {
            this._queue.push({ event: "fade", action: () => this.fade(from, to, len, id) });
            return this;
        }
        this.volume(from, id);
        const ids = this._getPlaybackIds(id);
        for (const playbackId of ids) {
            const playback = this._playbackById(playbackId);
            if (playback) {
                this._stopFade(playbackId);
                if (this._webAudio && !playback._muted) {
                    const currentTime = DxSound.ctx!.currentTime;
                    const end = currentTime + len / 1000;
                    playback._volume = from;
                    (playback._node as GainNode).gain.setValueAtTime(from, currentTime);
                    (playback._node as GainNode).gain.linearRampToValueAtTime(to, end);
                }
                this._startFadeInterval(playback, from, to, len, playbackId);
            }
        }
        return this;
    }

    loop(loop?: boolean, id?: PlaybackId): this | boolean {
        if (loop === undefined) {
            if (id !== undefined) {
                const playback = this._playbackById(id);
                return playback ? playback._loop : false;
            }
            return this._loop;
        }

        const ids = this._getPlaybackIds(id);
        for (const playbackId of ids) {
            const playback = this._playbackById(playbackId);
            if (playback) {
                playback._loop = loop;
                if (this._webAudio && playback._node && (playback._node as any).bufferSource) {
                    (playback._node as any).bufferSource.loop = loop;
                    if(loop) {
                        (playback._node as any).bufferSource.loopStart = playback._start || 0;
                        (playback._node as any).bufferSource.loopEnd = playback._stop;
                    }
                }
            }
        }
        return this;
    }

    rate(rate?: number, id?: PlaybackId): this | number {
        if (rate === undefined) {
            const playback = this._playbackById(id ?? this._playbacks[0]._id);
            return playback ? playback._rate : this._rate;
        }

        if (this._state !== "loaded" || this._playLock) {
            this._queue.push({ event: "rate", action: () => this.rate(rate, id) });
            return this;
        }
        if (id === undefined) {
            this._rate = rate;
        }
        const ids = this._getPlaybackIds(id);
        for (const playbackId of ids) {
            const playback = this._playbackById(playbackId);
            if (playback) {
                playback._rate = rate;
                if (this._webAudio && playback._node && (playback._node as any).bufferSource) {
                    (playback._node as any).bufferSource.playbackRate.setValueAtTime(rate, DxSound.ctx!.currentTime);
                } else if (playback._node) {
                    (playback._node as HTMLAudioElement).playbackRate = rate;
                }
                const seek = this.seek(playbackId) as number;
                const duration = ((this._sprite[playback._sprite]?.[0] + this._sprite[playback._sprite]?.[1]) / 1000) - seek;
                const timeout = (duration * 1000) / Math.abs(playback._rate);
                if (this._endTimers[playbackId] || !playback._paused) {
                    this._clearTimer(playbackId);
                    this._endTimers[playbackId] = setTimeout(() => this._ended(playback), timeout);
                }
                this._emit("rate", playbackId);
            }
        }
        return this;
    }

    seek(seek?: number, id?: PlaybackId): this | number {
        if (seek === undefined) {
            const playbackId = id ?? this._playbacks[0]?._id;
            if(!playbackId) return 0;

            const playback = this._playbackById(playbackId);
            if (playback) {
                if (this._webAudio) {
                    const realTime = !playback._paused ? DxSound.ctx!.currentTime - playback._playStart : 0;
                    return playback._seek + (playback._rateSeek + realTime * Math.abs(playback._rate));
                }
                return (playback._node as HTMLAudioElement).currentTime;
            }
            return 0;
        }

        if (this._state !== "loaded" || this._playLock) {
            this._queue.push({ event: "seek", action: () => this.seek(seek, id) });
            return this;
        }
        const ids = this._getPlaybackIds(id);
        for (const playbackId of ids) {
            const playback = this._playbackById(playbackId);
            if (playback) {
                const playing = !playback._paused;
                if (playing) this.pause(playbackId);
                playback._seek = seek;
                playback._ended = false;
                this._clearTimer(playbackId);
                if (!this._webAudio && playback._node) {
                    (playback._node as HTMLAudioElement).currentTime = seek;
                }
                if (playing) this.play(playbackId);
                this._emit("seek", playbackId);
            }
        }
        return this;
    }

    playing(id: PlaybackId): boolean {
        const playback = this._playbackById(id);
        return playback ? !playback._paused : false;
    }

    duration(id?: PlaybackId): number {
        if (id) {
            const playback = this._playbackById(id);
            if (playback && this._sprite[playback._sprite]) {
                return this._sprite[playback._sprite][1] / 1000;
            }
        }
        return this._duration;
    }

    state(): SoundState { return this._state; }

    unload() {
        for (const playback of [...this._playbacks]) {
            if (!playback._paused) this.stop(playback._id);
            if (!this._webAudio && playback._node) {
                DxSound._clearSound(playback._node as HTMLAudioElement);
                playback._node.removeEventListener("error", playback._errorFn as any, false);
                playback._node.removeEventListener(DxSound._canPlayEvent, playback._loadFn!, false);
                DxSound._releaseHtml5Audio(playback._node as HTMLAudioElement);
            }
            playback._node = null;
            this._clearTimer(playback._id);
        }

        const index = DxSound._sounds.indexOf(this);
        if (index >= 0) DxSound._sounds.splice(index, 1);

        const remCache = !DxSound._sounds.some(sound => sound._src === this._src);
        if (cache[this._src as string] && remCache) {
            delete cache[this._src as string];
        }

        this._playbacks = [];
    }

    on(event: string, fn: Function, id?: PlaybackId, once?: boolean) {
        const events = this[`_on${event}` as keyof this] as any[];
        if(events) events.push({ id, fn, once });
        return this;
    }

    off(event: string, fn?: Function, id?: PlaybackId) {
        const events = this[`_on${event}` as keyof this] as any[];
        if (!fn && !id) {
            if(events) (this as any)[`_on${event}`] = [];
        } else if(events) {
            for(let i=events.length-1; i>=0; i--) {
                const isId = (id === events[i].id);
                if ((fn === events[i].fn && isId) || (!fn && isId)) {
                    events.splice(i, 1);
                }
            }
        }
        return this;
    }

    once(event: string, fn: Function, id?: PlaybackId) {
        return this.on(event, fn, id, true);
    }

    _emit(event: string, id?: PlaybackId | null, msg?: any) {
        const events = this[`_on${event}` as keyof this] as { id?: PlaybackId; fn: Function; once?: boolean }[];
        if(events) {
            for(let i=events.length-1; i>=0; i--) {
                const e = events[i];
                if (!e.id || e.id === id || event === "load") {
                    setTimeout(() => e.fn.call(this, id, msg), 0);
                    if (e.once) this.off(event, e.fn, e.id);
                }
            }
        }
        this._loadQueue(event);
    }

    _loadQueue(event?: string) {
        if (this._queue.length > 0) {
            const task = this._queue[0];
            if (!event || task.event === event) {
                this._queue.shift();
                if(!event) task.action();
            }
        }
    }

    _ended(playback: Playback) {
        const loop = !!(playback._loop || this._sprite[playback._sprite]?.[2]);
        this._emit("end", playback._id);
        if(this._webAudio && loop) {
            this.play(playback._id);
        } else if (this._webAudio && !loop) {
            playback._paused = true;
            playback._ended = true;
            playback._seek = playback._start || 0;
            this._clearTimer(playback._id);
            this._cleanBuffer(playback._node!);
            DxSound._autoSuspend();
        } else if (!this._webAudio) {
            if (loop) {
                this.stop(playback._id).play(playback._id);
            } else {
                this.stop(playback._id);
            }
        }
    }

    private _clearTimer(id: PlaybackId) {
        if (this._endTimers[id]) {
            if (typeof this._endTimers[id] !== "function") {
                clearTimeout(this._endTimers[id]);
            }
            delete this._endTimers[id];
        }
    }

    _playbackById(id: PlaybackId): Playback | null {
        return this._playbacks.find(p => p._id === id) || null;
    }

    private _inactivePlayback(): Playback {
        this._drain();
        const inactive = this._playbacks.find(p => p._ended);
        return inactive ? inactive.reset() : new Playback(this);
    }

    private _drain() {
        const limit = this._pool;
        let endedCount = this._playbacks.filter(p => p._ended).length;
        if (this._playbacks.length < limit) return;

        for (let i = this._playbacks.length - 1; i >= 0; i--) {
            if (endedCount <= limit) break;
            if (this._playbacks[i]._ended) {
                if (this._webAudio && this._playbacks[i]._node) {
                    (this._playbacks[i]._node as GainNode).disconnect(0);
                }
                this._playbacks.splice(i, 1);
                endedCount--;
            }
        }
    }

    _getPlaybackIds(id?: PlaybackId): PlaybackId[] {
        return id === undefined ? this._playbacks.map(p => p._id) : [id];
    }

    _refreshBuffer(playback: Playback) {
        const node = playback._node as any;
        node.bufferSource = DxSound.ctx!.createBufferSource();
        node.bufferSource.buffer = cache[this._src as string];
        node.bufferSource.connect(playback._panner ? playback._panner : node);
        node.bufferSource.loop = playback._loop;
        if (playback._loop) {
            node.bufferSource.loopStart = playback._start || 0;
            node.bufferSource.loopEnd = playback._stop || 0;
        }
        node.bufferSource.playbackRate.setValueAtTime(playback._rate, DxSound.ctx!.currentTime);
    }

    _cleanBuffer(node: any) {
        if (DxSound._scratchBuffer && node.bufferSource) {
            node.bufferSource.onended = null;
            node.bufferSource.disconnect(0);
        }
        node.bufferSource = null;
    }

    _startFadeInterval(playback: Playback, from: number, to: number, len: number, id: PlaybackId) {
        const diff = to - from;
        const stepLen = len / (Math.abs(diff) / 0.01);
        let vol = from;

        playback._interval = setInterval(() => {
            vol += diff * (stepLen / len);
            vol = Math.max(0, Math.min(1, vol));
            this.volume(vol, id);

            if ((to > from && vol >= to) || (to < from && vol <= to)) {
                clearInterval(playback._interval);
                playback._interval = null;
                this.volume(to, id);
                this._emit("fade", id);
            }
        }, stepLen);
    }

    _stopFade(id: PlaybackId) {
        const playback = this._playbackById(id);
        if(playback && playback._interval) {
            if (this._webAudio) {
                (playback._node as GainNode).gain.cancelScheduledValues(DxSound.ctx!.currentTime);
            }
            clearInterval(playback._interval);
            playback._interval = null;
            if(playback._fadeTo !== null) this.volume(playback._fadeTo, id);
            playback._fadeTo = null;
            this._emit("fade", id);
        }
    }

    private _loadBuffer() {
        const url = this._src as string;
        if (cache[url]) {
            this._duration = cache[url].duration;
            this._loadSound(cache[url]);
            return;
        }

        if (/^data:[^;]+;base64,/.test(url)) {
            const data = atob(url.split(",")[1]);
            const dataView = new Uint8Array(data.length);
            for (let i = 0; i < data.length; ++i) {
                dataView[i] = data.charCodeAt(i);
            }
            this._decodeAudioData(dataView.buffer);
        } else {
            const xhr = new XMLHttpRequest();
            xhr.open(this._xhr?.method || "GET", url, true);
            xhr.withCredentials = this._xhr?.withCredentials || false;
            xhr.responseType = "arraybuffer";
            if(this._xhr?.headers) {
                Object.keys(this._xhr.headers).forEach(key => {
                    xhr.setRequestHeader(key, this._xhr!.headers![key]);
                });
            }
            xhr.onload = () => {
                this._decodeAudioData(xhr.response);
            };
            xhr.onerror = () => {
                if (this._webAudio) {
                    this._html5 = true;
                    this._webAudio = false;
                    this._playbacks = [];
                    delete cache[url];
                    this.load();
                }
            };
            try { xhr.send(); } catch (e) { xhr.onerror(); }
        }
    }

    private _decodeAudioData(arraybuffer: ArrayBuffer) {
        DxSound.ctx!.decodeAudioData(arraybuffer,
            (buffer) => {
                if (buffer && this._playbacks.length > 0) {
                    cache[this._src as string] = buffer;
                    this._loadSound(buffer);
                }
            },
            () => {
                this._emit("loaderror", null, "Decoding audio data failed.");
            }
        );
    }

    private _loadSound(buffer: AudioBuffer) {
        this._duration = buffer.duration;
        if (Object.keys(this._sprite).length === 0) {
            this._sprite = { __default: [0, this._duration * 1000] };
        }
        if (this._state !== "loaded") {
            this._state = "loaded";
            this._emit("load");
            this._loadQueue();
        }
    }
}

class DxSoundGlobal {
    _counter: number = 1000;
    _html5AudioPool: HTMLAudioElement[] = [];
    html5PoolSize: number = 10;
    _codecs: { [key: string]: boolean } = {};
    _sounds: Sound[] = [];
    _muted: boolean = false;
    _volume: number = 1;
    _canPlayEvent: string = "canplaythrough";
    _navigator = typeof window !== "undefined" ? window.navigator : null;
    masterGain: GainNode | null = null;
    noAudio: boolean = false;
    usingWebAudio: boolean = true;
    autoSuspend: boolean = true;
    ctx: AudioContext | null = null;
    autoUnlock: boolean = true;
    state: AudioState = "suspended";
    private _audioUnlocked: boolean = false;
    private _suspendTimer: any;
    _scratchBuffer: AudioBuffer | null = null;

    constructor() {
        this._setupAudioContext();
        this._setup();
    }

    volume(vol?: number): this | number {
        if(vol !== undefined && vol >= 0 && vol <= 1) {
            this._volume = vol;
            if (this._muted) return this;
            if (this.usingWebAudio) {
                this.masterGain!.gain.setValueAtTime(vol, this.ctx!.currentTime);
            }
            for (const sound of this._sounds) {
                if (!sound._webAudio) {
                    for (const playback of sound._playbacks) {
                        if (playback._node) (playback._node as HTMLAudioElement).volume = playback._volume * vol;
                    }
                }
            }
            return this;
        }
        return this._volume;
    }

    mute(muted: boolean): this {
        this._muted = muted;
        if (this.usingWebAudio) {
            this.masterGain!.gain.setValueAtTime(muted ? 0 : this._volume, this.ctx!.currentTime);
        }
        for (const sound of this._sounds) {
            if (!sound._webAudio) {
                for (const playback of sound._playbacks) {
                    if (playback._node) (playback._node as HTMLAudioElement).muted = muted ? true : playback._muted;
                }
            }
        }
        return this;
    }

    stop(): this {
        for (const sound of this._sounds) sound.stop();
        return this;
    }

    unload(): this {
        for (let i = this._sounds.length - 1; i >= 0; i--) {
            this._sounds[i].unload();
        }
        if (this.usingWebAudio && this.ctx && this.ctx.close) {
            this.ctx.close();
            this.ctx = null;
            this._setupAudioContext();
        }
        return this;
    }

    codecs(ext: string): boolean {
        return this._codecs[ext.replace(/^x-/, "")];
    }

    _setup() {
        this.state = this.ctx ? this.ctx.state as AudioState : "suspended";
        this._autoSuspend();
        if (!this.usingWebAudio) {
            try { new Audio(); } catch (e) { this.noAudio = true; }
        }
        if (!this.noAudio) this._setupCodecs();
    }

    _setupCodecs() {
        try {
            const audioTest = new Audio();
            const ua = this._navigator ? this._navigator.userAgent : "";
            const isOldSafari = ua.includes("Safari") && !ua.includes("Chrome") && parseInt(ua.split("Version/")[1]) < 15;
            this._codecs = {
                mp3: !!audioTest.canPlayType("audio/mpeg;").replace(/^no$/, ""),
                opus: !!audioTest.canPlayType("audio/ogg; codecs=\"opus\"").replace(/^no$/, ""),
                ogg: !!audioTest.canPlayType("audio/ogg; codecs=\"vorbis\"").replace(/^no$/, ""),
                wav: !!audioTest.canPlayType("audio/wav; codecs=\"1\"").replace(/^no$/, ""),
                aac: !!audioTest.canPlayType("audio/aac;").replace(/^no$/, ""),
                m4a: !!(audioTest.canPlayType("audio/x-m4a;") || audioTest.canPlayType("audio/m4a;")).replace(/^no$/, ""),
                weba: !!(!isOldSafari && audioTest.canPlayType("audio/webm; codecs=\"vorbis\"").replace(/^no$/, "")),
                flac: !!(audioTest.canPlayType("audio/x-flac;") || audioTest.canPlayType("audio/flac;")).replace(/^no$/, "")
            };
        } catch(e) {}
    }

    _unlockAudio() {
        if (this._audioUnlocked || !this.ctx) return;
        this._audioUnlocked = false;
        this.autoUnlock = false;

        const unlock = () => {
            this._autoResume();
            const source = this.ctx!.createBufferSource();
            source.buffer = this._scratchBuffer!;
            source.connect(this.ctx!.destination);
            source.start(0);
            if (this.ctx!.resume) this.ctx!.resume();
            source.onended = () => {
                source.disconnect(0);
                this._audioUnlocked = true;
                document.removeEventListener("touchstart", unlock, true);
                document.removeEventListener("touchend", unlock, true);
                document.removeEventListener("click", unlock, true);
                for (const sound of this._sounds) sound._emit("unlock");
            };
        };

        document.addEventListener("touchstart", unlock, true);
        document.addEventListener("touchend", unlock, true);
        document.addEventListener("click", unlock, true);
    }

    _obtainHtml5Audio(): HTMLAudioElement {
        if (this._html5AudioPool.length) return this._html5AudioPool.pop()!;
        return new Audio();
    }

    _releaseHtml5Audio(audio: HTMLAudioElement) {
        if((audio as any)._unlocked) this._html5AudioPool.push(audio);
    }

    _clearSound(node: HTMLAudioElement) {
        node.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    }

    _autoSuspend() {
        if (!this.autoSuspend || !this.ctx || !this.ctx.suspend || !this.usingWebAudio) return;
        if(this._suspendTimer) clearTimeout(this._suspendTimer);
        this._suspendTimer = setTimeout(() => {
            if(!this.autoSuspend) return;
            this.state = "suspending";
            this.ctx!.suspend().then(() => { this.state = "suspended"; });
        }, 30000);
    }

    _autoResume() {
        if (!this.ctx || !this.ctx.resume || !this.usingWebAudio) return;
        if (this.state === "suspended") {
            this.ctx.resume().then(() => {
                this.state = "running";
                for(const sound of this._sounds) sound._emit("resume");
            });
            if(this._suspendTimer) clearTimeout(this._suspendTimer);
        }
    }

    _setupAudioContext() {
        if(this.ctx || typeof window === "undefined") return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
        } catch (e) {
            this.usingWebAudio = false;
        }

        if (!this.ctx) this.usingWebAudio = false;

        if (this.usingWebAudio) {
            this.masterGain = this.ctx!.createGain();
            this.masterGain.gain.setValueAtTime(this._muted ? 0 : this._volume, this.ctx!.currentTime);
            this.masterGain.connect(this.ctx!.destination);
            this._scratchBuffer = this.ctx.createBuffer(1, 1, 22050);
        }
    }
}

//================================================================================
// 3. DXSOUND GLOBAL INSTANCE
//================================================================================
export const DxSound = new DxSoundGlobal();

//================================================================================
// 4. ZUSTAND STORE for Global State Management
//================================================================================

const useSoundStore = create<SoundStore>((set, get) => ({
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

        const soundInstance = new Sound({
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
    }, [soundEnabled, JSON.stringify(src), soundId]);

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
