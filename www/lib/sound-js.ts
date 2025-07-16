/*!
 * sound.js
 *
 * (c) 2013-2020, James Simpson of GoldFire Studios
 * goldfirestudios.com
 *
 * MIT License
 */

(function() {

    "use strict";
  
    var SoundGlobal = function() {
      this.init();
    };
    SoundGlobal.prototype = {
      init: function() {
        var self = this || sound;
  
        self._counter = 1000;
        self._html5AudioPool = [];
        self.html5PoolSize = 10;
        self._codecs = {};
        self._sounds = [];
        self._muted = false;
        self._volume = 1;
        self._canPlayEvent = "canplaythrough";
        self._navigator = (typeof window !== "undefined" && window.navigator) ? window.navigator : null;
  
        self.masterGain = null;
        self.noAudio = false;
        self.usingWebAudio = true;
        self.autoSuspend = true;
        self.ctx = null;
  
        self.autoUnlock = true;
  
        self._setup();
  
        return self;
      },
  
      volume: function(vol) {
        var self = this || sound;
        vol = parseFloat(vol);
  
        if (!self.ctx) {
          setupAudioContext();
        }
  
        if (typeof vol !== "undefined" && vol >= 0 && vol <= 1) {
          self._volume = vol;
  
          if (self._muted) {
            return self;
          }
  
          if (self.usingWebAudio) {
            self.masterGain.gain.setValueAtTime(vol, sound.ctx.currentTime);
          }
  
          for (var i = 0; i < self._sounds.length; i++) {
            if (!self._sounds[i]._webAudio) {
              var ids = self._sounds[i]._getPlaybackIds();
              for (var j = 0; j < ids.length; j++) {
                var playback = self._sounds[i]._playbackById(ids[j]);
                if (playback && playback._node) {
                  playback._node.volume = playback._volume * vol;
                }
              }
            }
          }
  
          return self;
        }
  
        return self._volume;
      },
  
      mute: function(muted) {
        var self = this || sound;
  
        if (!self.ctx) {
          setupAudioContext();
        }
  
        self._muted = muted;
  
        if (self.usingWebAudio) {
          self.masterGain.gain.setValueAtTime(muted ? 0 : self._volume, sound.ctx.currentTime);
        }
  
        for (var i = 0; i < self._sounds.length; i++) {
          if (!self._sounds[i]._webAudio) {
            var ids = self._sounds[i]._getPlaybackIds();
            for (var j = 0; j < ids.length; j++) {
              var playback = self._sounds[i]._playbackById(ids[j]);
              if (playback && playback._node) {
                playback._node.muted = (muted) ? true : playback._muted;
              }
            }
          }
        }
  
        return self;
      },
  
      stop: function() {
        var self = this || sound;
  
        for (var i = 0; i < self._sounds.length; i++) {
          self._sounds[i].stop();
        }
  
        return self;
      },
  
      unload: function() {
        var self = this || sound;
  
        for (var i = self._sounds.length - 1; i >= 0; i--) {
          self._sounds[i].unload();
        }
  
        if (self.usingWebAudio && self.ctx && typeof self.ctx.close !== "undefined") {
          self.ctx.close();
          self.ctx = null;
          setupAudioContext();
        }
  
        return self;
      },
  
      codecs: function(ext) {
        return (this || sound)._codecs[ext.replace(/^x-/, "")];
      },
  
      _setup: function() {
        var self = this || sound;
        self.state = self.ctx ? self.ctx.state || "suspended" : "suspended";
        self._autoSuspend();
  
        if (!self.usingWebAudio) {
          if (typeof Audio !== "undefined") {
            try {
              var test = new Audio();
              if (typeof test.oncanplaythrough === "undefined") {
                self._canPlayEvent = "canplay";
              }
            } catch (e) {
              self.noAudio = true;
            }
          } else {
            self.noAudio = true;
          }
        }
  
        try {
          var test = new Audio();
          if (test.muted) {
            self.noAudio = true;
          }
        } catch (e) {}
  
        if (!self.noAudio) {
          self._setupCodecs();
        }
  
        return self;
      },
  
      _setupCodecs: function() {
        var self = this || sound;
        var audioTest = null;
  
        try {
          audioTest = (typeof Audio !== "undefined") ? new Audio() : null;
        } catch (err) {
          return self;
        }
  
        if (!audioTest || typeof audioTest.canPlayType !== "function") {
          return self;
        }
  
        var mpegTest = audioTest.canPlayType("audio/mpeg;").replace(/^no$/, "");
        var ua = self._navigator ? self._navigator.userAgent : "";
        var checkOpera = ua.match(/OPR\/(\d+)/g);
        var isOldOpera = (checkOpera && parseInt(checkOpera[0].split("/")[1], 10) < 33);
        var checkSafari = ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1;
        var safariVersion = ua.match(/Version\/(.*?) /);
        var isOldSafari = (checkSafari && safariVersion && parseInt(safariVersion[1], 10) < 15);
  
        self._codecs = {
          mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType("audio/mp3;").replace(/^no$/, ""))),
          mpeg: !!mpegTest,
          opus: !!audioTest.canPlayType("audio/ogg; codecs=\"opus\"").replace(/^no$/, ""),
          ogg: !!audioTest.canPlayType("audio/ogg; codecs=\"vorbis\"").replace(/^no$/, ""),
          oga: !!audioTest.canPlayType("audio/ogg; codecs=\"vorbis\"").replace(/^no$/, ""),
          wav: !!(audioTest.canPlayType("audio/wav; codecs=\"1\"") || audioTest.canPlayType("audio/wav")).replace(/^no$/, ""),
          aac: !!audioTest.canPlayType("audio/aac;").replace(/^no$/, ""),
          caf: !!audioTest.canPlayType("audio/x-caf;").replace(/^no$/, ""),
          m4a: !!(audioTest.canPlayType("audio/x-m4a;") || audioTest.canPlayType("audio/m4a;") || audioTest.canPlayType("audio/aac;")).replace(/^no$/, ""),
          mp4: !!(audioTest.canPlayType("audio/x-mp4;") || audioTest.canPlayType("audio/mp4;") || audioTest.canPlayType("audio/aac;")).replace(/^no$/, ""),
          weba: !!(!isOldSafari && audioTest.canPlayType("audio/webm; codecs=\"vorbis\"").replace(/^no$/, "")),
          webm: !!(!isOldSafari && audioTest.canPlayType("audio/webm; codecs=\"vorbis\"").replace(/^no$/, "")),
          dolby: !!audioTest.canPlayType("audio/mp4; codecs=\"ec-3\"").replace(/^no$/, ""),
          flac: !!(audioTest.canPlayType("audio/x-flac;") || audioTest.canPlayType("audio/flac;")).replace(/^no$/, "")
        };
  
        return self;
      },
  
      _unlockAudio: function() {
        var self = this || sound;
  
        if (self._audioUnlocked || !self.ctx) {
          return;
        }
  
        self._audioUnlocked = false;
        self.autoUnlock = false;
  
        if (!self._mobileUnloaded && self.ctx.sampleRate !== 44100) {
          self._mobileUnloaded = true;
          self.unload();
        }
  
        self._scratchBuffer = self.ctx.createBuffer(1, 1, 22050);
  
        var unlock = function(e) {
          while (self._html5AudioPool.length < self.html5PoolSize) {
            try {
              var audioNode = new Audio();
              audioNode._unlocked = true;
              self._releaseHtml5Audio(audioNode);
            } catch (e) {
              self.noAudio = true;
              break;
            }
          }
  
          for (var i = 0; i < self._sounds.length; i++) {
            if (!self._sounds[i]._webAudio) {
              var ids = self._sounds[i]._getPlaybackIds();
              for (var j = 0; j < ids.length; j++) {
                var playback = self._sounds[i]._playbackById(ids[j]);
                if (playback && playback._node && !playback._node._unlocked) {
                  playback._node._unlocked = true;
                  playback._node.load();
                }
              }
            }
          }
  
          self._autoResume();
          var source = self.ctx.createBufferSource();
          source.buffer = self._scratchBuffer;
          source.connect(self.ctx.destination);
  
          if (typeof source.start === "undefined") {
            source.noteOn(0);
          } else {
            source.start(0);
          }
  
          if (typeof self.ctx.resume === "function") {
            self.ctx.resume();
          }
  
          source.onended = function() {
            source.disconnect(0);
            self._audioUnlocked = true;
            document.removeEventListener("touchstart", unlock, true);
            document.removeEventListener("touchend", unlock, true);
            document.removeEventListener("click", unlock, true);
            document.removeEventListener("keydown", unlock, true);
            for (var i = 0; i < self._sounds.length; i++) {
              self._sounds[i]._emit("unlock");
            }
          };
        };
  
        document.addEventListener("touchstart", unlock, true);
        document.addEventListener("touchend", unlock, true);
        document.addEventListener("click", unlock, true);
        document.addEventListener("keydown", unlock, true);
  
        return self;
      },
  
      _obtainHtml5Audio: function() {
        var self = this || sound;
  
        if (self._html5AudioPool.length) {
          return self._html5AudioPool.pop();
        }
  
        var testPlay = new Audio().play();
        if (testPlay && typeof Promise !== "undefined" && (testPlay instanceof Promise || typeof testPlay.then === "function")) {
          testPlay.catch(function() {
            console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.");
          });
        }
  
        return new Audio();
      },
  
      _releaseHtml5Audio: function(audio) {
        var self = this || sound;
        if (audio._unlocked) {
          self._html5AudioPool.push(audio);
        }
        return self;
      },
  
      _autoSuspend: function() {
        var self = this;
  
        if (!self.autoSuspend || !self.ctx || typeof self.ctx.suspend === "undefined" || !sound.usingWebAudio) {
          return;
        }
  
        for (var i = 0; i < self._sounds.length; i++) {
          if (self._sounds[i]._webAudio) {
            for (var j = 0; j < self._sounds[i]._playbacks.length; j++) {
              if (!self._sounds[i]._playbacks[j]._paused) {
                return self;
              }
            }
          }
        }
  
        if (self._suspendTimer) {
          clearTimeout(self._suspendTimer);
        }
  
        self._suspendTimer = setTimeout(function() {
          if (!self.autoSuspend) {
            return;
          }
  
          self._suspendTimer = null;
          self.state = "suspending";
          self.ctx.suspend().then(function() {
            self.state = "suspended";
            if (self._resumeAfterSuspend) {
              delete self._resumeAfterSuspend;
              self._autoResume();
            }
          });
        }, 30000);
  
        return self;
      },
  
      _autoResume: function() {
        var self = this;
  
        if (!self.ctx || typeof self.ctx.resume === "undefined" || !sound.usingWebAudio) {
          return;
        }
  
        if (self.state === "running" && self._suspendTimer) {
          clearTimeout(self._suspendTimer);
          self._suspendTimer = null;
        } else if (self.state === "suspended") {
          self.ctx.resume().then(function() {
            self.state = "running";
            for (var i = 0; i < self._sounds.length; i++) {
              self._sounds[i]._emit("resume");
            }
          });
  
          if (self._suspendTimer) {
            clearTimeout(self._suspendTimer);
            self._suspendTimer = null;
          }
        } else if (self.state === "suspending") {
          self._resumeAfterSuspend = true;
        }
  
        return self;
      }
    };
  
    var sound = new SoundGlobal();
  
    var Sound = function(o) {
      var self = this;
      if (!o.src || o.src.length === 0) {
        console.error("An array of source files must be passed with any new Sound.");
        return;
      }
      self.init(o);
    };
    Sound.prototype = {
      init: function(o) {
        var self = this;
  
        if (!sound.ctx) {
          setupAudioContext();
        }
  
        self._autoplay = o.autoplay || false;
        self._format = (typeof o.format !== "string") ? o.format : [o.format];
        self._html5 = o.html5 || false;
        self._muted = o.mute || false;
        self._loop = o.loop || false;
        self._pool = o.pool || 5;
        self._preload = (typeof o.preload === "boolean") ? o.preload : true;
        self._rate = o.rate || 1;
        self._sprite = o.sprite || {};
        self._src = (typeof o.src !== "string") ? o.src : [o.src];
        self._volume = o.volume !== undefined ? o.volume : 1;
        self._xhr = {
          method: o.xhr && o.xhr.method ? o.xhr.method : "GET",
          headers: o.xhr && o.xhr.headers ? o.xhr.headers : null,
          withCredentials: o.xhr && o.xhr.withCredentials ? o.xhr.withCredentials : false
        };
  
        self._duration = 0;
        self._state = "unloaded";
        self._playbacks = [];
        self._endTimers = {};
        self._queue = [];
        self._playLock = false;
  
        self._onend = o.onend ? [{fn: o.onend}] : [];
        self._onfade = o.onfade ? [{fn: o.onfade}] : [];
        self._onload = o.onload ? [{fn: o.onload}] : [];
        self._onloaderror = o.onloaderror ? [{fn: o.onloaderror}] : [];
        self._onplayerror = o.onplayerror ? [{fn: o.onplayerror}] : [];
        self._onpause = o.onpause ? [{fn: o.onpause}] : [];
        self._onplay = o.onplay ? [{fn: o.onplay}] : [];
        self._onstop = o.onstop ? [{fn: o.onstop}] : [];
        self._onmute = o.onmute ? [{fn: o.onmute}] : [];
        self._onvolume = o.onvolume ? [{fn: o.onvolume}] : [];
        self._onrate = o.onrate ? [{fn: o.onrate}] : [];
        self._onseek = o.onseek ? [{fn: o.onseek}] : [];
        self._onunlock = o.onunlock ? [{fn: o.onunlock}] : [];
        self._onresume = [];
  
        self._webAudio = sound.usingWebAudio && !self._html5;
  
        if (typeof sound.ctx !== "undefined" && sound.ctx && sound.autoUnlock) {
          sound._unlockAudio();
        }
  
        sound._sounds.push(self);
  
        if (self._autoplay) {
          self._queue.push({
            event: "play",
            action: function() {
              self.play();
            }
          });
        }
  
        if (self._preload) {
          self.load();
        }
  
        return self;
      },
  
      load: function() {
        var self = this;
        var url = null;
  
        if (sound.noAudio) {
          self._emit("loaderror", null, "No audio support.");
          return;
        }
  
        if (typeof self._src === "string") {
          self._src = [self._src];
        }
  
        for (var i = 0; i < self._src.length; i++) {
          var ext, str;
          if (self._format && self._format[i]) {
            ext = self._format[i];
          } else {
            str = self._src[i];
            if (typeof str !== "string") {
              self._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
              continue;
            }
            ext = /^data:audio\/([^;,]+);/i.exec(str);
            if (!ext) {
              ext = /\.([^.]+)$/.exec(str.split("?", 1)[0]);
            }
            if (ext) {
              ext = ext[1].toLowerCase();
            }
          }
  
          if (ext && sound.codecs(ext)) {
            url = self._src[i];
            break;
          }
        }
  
        if (!url) {
          self._emit("loaderror", null, "No codec support for selected audio sources.");
          return;
        }
  
        self._src = url;
        self._state = "loading";
  
        if (window.location.protocol === "https:" && url.slice(0, 5) === "http:") {
          self._html5 = true;
          self._webAudio = false;
        }
  
        new Playback(self);
  
        if (self._webAudio) {
          loadBuffer(self);
        }
  
        return self;
      },
  
      play: function(sprite, internal) {
        var self = this;
        var id = null;
  
        if (typeof sprite === "number") {
          id = sprite;
          sprite = null;
        } else if (typeof sprite === "string" && self._state === "loaded" && !self._sprite[sprite]) {
          return null;
        } else if (typeof sprite === "undefined") {
          sprite = "__default";
          if (!self._playLock) {
            var num = 0;
            for (var i = 0; i < self._playbacks.length; i++) {
              if (self._playbacks[i]._paused && !self._playbacks[i]._ended) {
                num++;
                id = self._playbacks[i]._id;
              }
            }
            if (num === 1) {
              sprite = null;
            } else {
              id = null;
            }
          }
        }
  
        var playback = id ? self._playbackById(id) : self._inactivePlayback();
  
        if (!playback) {
          return null;
        }
  
        if (id && !sprite) {
          sprite = playback._sprite || "__default";
        }
  
        if (self._state !== "loaded") {
          playback._sprite = sprite;
          playback._ended = false;
          var playbackId = playback._id;
          self._queue.push({
            event: "play",
            action: function() {
              self.play(playbackId);
            }
          });
          return playbackId;
        }
  
        if (id && !playback._paused) {
          if (!internal) {
            self._loadQueue("play");
          }
          return playback._id;
        }
  
        if (self._webAudio) {
          sound._autoResume();
        }
  
        var seek = playback._seek > 0 ? playback._seek : self._sprite[sprite][0] / 1000;
        var duration = ((self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000) - seek;
        var timeout = (duration * 1000) / Math.abs(playback._rate);
        playback._sprite = sprite;
        playback._ended = false;
  
        var setParams = function() {
          playback._paused = false;
          playback._seek = seek;
          playback._start = self._sprite[sprite][0] / 1000;
          playback._stop = (self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000;
          playback._loop = !!(playback._loop || self._sprite[sprite][2]);
        };
  
        if (seek >= playback._stop) {
          self._ended(playback);
          return;
        }
  
        var node = playback._node;
        if (self._webAudio) {
          var playWebAudio = function() {
            self._playLock = false;
            setParams();
            self._refreshBuffer(playback);
            var vol = (playback._muted || self._muted) ? 0 : playback._volume * sound.volume();
            node.gain.setValueAtTime(vol, sound.ctx.currentTime);
            playback._playStart = sound.ctx.currentTime;
  
            if (typeof node.bufferSource.start === "undefined") {
              playback._loop ? node.bufferSource.noteGrainOn(0, seek, 86400) : node.bufferSource.noteGrainOn(0, seek, duration);
            } else {
              playback._loop ? node.bufferSource.start(0, seek, 86400) : node.bufferSource.start(0, seek, duration);
            }
  
            if (timeout !== Infinity) {
              self._endTimers[playback._id] = setTimeout(self._ended.bind(self, playback), timeout);
            }
  
            if (!internal) {
              setTimeout(function() {
                self._emit("play", playback._id);
                self._loadQueue();
              }, 0);
            }
          };
  
          if (sound.state === "running") {
            playWebAudio();
          } else {
            self._playLock = true;
            self.once("resume", playWebAudio);
            self._clearTimer(playback._id);
          }
        } else {
          var playHtml5 = function() {
            node.currentTime = seek;
            node.muted = playback._muted || self._muted || sound._muted || node.muted;
            node.volume = playback._volume * sound.volume();
            node.playbackRate = playback._rate;
  
            try {
              var play = node.play();
              if (play && typeof Promise !== "undefined" && (play instanceof Promise || typeof play.then === "function")) {
                self._playLock = true;
                setParams();
                play.then(function() {
                  self._playLock = false;
                  node._unlocked = true;
                  if (!internal) {
                    self._emit("play", playback._id);
                  } else {
                    self._loadQueue();
                  }
                }).catch(function() {
                  self._playLock = false;
                  self._emit("playerror", playback._id, "Playback was unable to start.");
                  playback._ended = true;
                  playback._paused = true;
                });
              } else if (!internal) {
                self._playLock = false;
                setParams();
                self._emit("play", playback._id);
              }
  
              if (node.paused) {
                self._emit("playerror", playback._id, "Playback was unable to start.");
                return;
              }
  
              if (sprite !== "__default" || playback._loop) {
                self._endTimers[playback._id] = setTimeout(self._ended.bind(self, playback), timeout);
              } else {
                self._endTimers[playback._id] = function() {
                  self._ended(playback);
                  node.removeEventListener("ended", self._endTimers[playback._id], false);
                };
                node.addEventListener("ended", self._endTimers[playback._id], false);
              }
            } catch (err) {
              self._emit("playerror", playback._id, err);
            }
          };
  
          var loadedNoReadyState = (window && window.ejecta) || (!node.readyState && sound._navigator.isCocoonJS);
          if (node.readyState >= 3 || loadedNoReadyState) {
            playHtml5();
          } else {
            self._playLock = true;
            var listener = function() {
              playHtml5();
              node.removeEventListener(sound._canPlayEvent, listener, false);
            };
            node.addEventListener(sound._canPlayEvent, listener, false);
            self._clearTimer(playback._id);
          }
        }
  
        return playback._id;
      },
  
      pause: function(id) {
        var self = this;
        if (self._state !== "loaded" || self._playLock) {
          self._queue.push({
            event: "pause",
            action: function() {
              self.pause(id);
            }
          });
          return self;
        }
  
        var ids = self._getPlaybackIds(id);
        for (var i = 0; i < ids.length; i++) {
          self._clearTimer(ids[i]);
          var playback = self._playbackById(ids[i]);
          if (playback && !playback._paused) {
            playback._seek = self.seek(ids[i]);
            playback._rateSeek = 0;
            playback._paused = true;
            self._stopFade(ids[i]);
            if (playback._node) {
              if (self._webAudio) {
                if (!playback._node.bufferSource) {
                  continue;
                }
                if (typeof playback._node.bufferSource.stop === "undefined") {
                  playback._node.bufferSource.noteOff(0);
                } else {
                  playback._node.bufferSource.stop(0);
                }
                self._cleanBuffer(playback._node);
              } else if (!isNaN(playback._node.duration) || playback._node.duration === Infinity) {
                playback._node.pause();
              }
            }
          }
          if (!arguments[1]) {
            self._emit("pause", playback ? playback._id : null);
          }
        }
        return self;
      },
  
      stop: function(id, internal) {
        var self = this;
        if (self._state !== "loaded" || self._playLock) {
          self._queue.push({
            event: "stop",
            action: function() {
              self.stop(id);
            }
          });
          return self;
        }
  
        var ids = self._getPlaybackIds(id);
        for (var i = 0; i < ids.length; i++) {
          self._clearTimer(ids[i]);
          var playback = self._playbackById(ids[i]);
          if (playback) {
            playback._seek = playback._start || 0;
            playback._rateSeek = 0;
            playback._paused = true;
            playback._ended = true;
            self._stopFade(ids[i]);
            if (playback._node) {
              if (self._webAudio) {
                if (playback._node.bufferSource) {
                  if (typeof playback._node.bufferSource.stop === "undefined") {
                    playback._node.bufferSource.noteOff(0);
                  } else {
                    playback._node.bufferSource.stop(0);
                  }
                  self._cleanBuffer(playback._node);
                }
              } else if (!isNaN(playback._node.duration) || playback._node.duration === Infinity) {
                playback._node.currentTime = playback._start || 0;
                playback._node.pause();
                if (playback._node.duration === Infinity) {
                  self._clearSound(playback._node);
                }
              }
            }
          }
          if (!internal) {
            self._emit("stop", playback._id);
          }
        }
        return self;
      },
  
      mute: function(muted, id) {
        var self = this;
        if (self._state !== "loaded" || self._playLock) {
          self._queue.push({
            event: "mute",
            action: function() {
              self.mute(muted, id);
            }
          });
          return self;
        }
  
        if (typeof id === "undefined") {
          if (typeof muted === "boolean") {
            self._muted = muted;
          } else {
            return self._muted;
          }
        }
  
        var ids = self._getPlaybackIds(id);
        for (var i = 0; i < ids.length; i++) {
          var playback = self._playbackById(ids[i]);
          if (playback) {
            playback._muted = muted;
            if (playback._interval) {
              self._stopFade(playback._id);
            }
            if (self._webAudio && playback._node) {
              playback._node.gain.setValueAtTime(muted ? 0 : playback._volume, sound.ctx.currentTime);
            } else if (playback._node) {
              playback._node.muted = sound._muted ? true : muted;
            }
            self._emit("mute", playback._id);
          }
        }
        return self;
      },
  
      volume: function() {
        var self = this;
        var args = arguments;
        var vol, id;
        if (args.length === 0) {
          return self._volume;
        } else if (args.length === 1) {
          var ids = self._getPlaybackIds();
          var index = ids.indexOf(args[0]);
          if (index >= 0) {
            id = parseInt(args[0], 10);
          } else {
            vol = parseFloat(args[0]);
          }
        } else if (args.length >= 2) {
          vol = parseFloat(args[0]);
          id = parseInt(args[1], 10);
        }
  
        var playback;
        if (typeof vol !== "undefined" && vol >= 0 && vol <= 1) {
          if (self._state !== "loaded" || self._playLock) {
            self._queue.push({
              event: "volume",
              action: function() {
                self.volume.apply(self, args);
              }
            });
            return self;
          }
  
          if (typeof id === "undefined") {
            self._volume = vol;
          }
  
          id = self._getPlaybackIds(id);
          for (var i = 0; i < id.length; i++) {
            playback = self._playbackById(id[i]);
            if (playback) {
              playback._volume = vol;
              if (!args[2]) {
                self._stopFade(id[i]);
              }
              if (self._webAudio && playback._node && !playback._muted) {
                playback._node.gain.setValueAtTime(vol, sound.ctx.currentTime);
              } else if (playback._node && !playback._muted) {
                playback._node.volume = vol * sound.volume();
              }
              self._emit("volume", playback._id);
            }
          }
        } else {
          playback = id ? self._playbackById(id) : self._playbacks[0];
          return playback ? playback._volume : 0;
        }
        return self;
      },
  
      fade: function(from, to, len, id) {
        var self = this;
        if (self._state !== "loaded" || self._playLock) {
          self._queue.push({
            event: "fade",
            action: function() {
              self.fade(from, to, len, id);
            }
          });
          return self;
        }
        from = Math.min(Math.max(0, parseFloat(from)), 1);
        to = Math.min(Math.max(0, parseFloat(to)), 1);
        len = parseFloat(len);
        self.volume(from, id);
        var ids = self._getPlaybackIds(id);
        for (var i = 0; i < ids.length; i++) {
          var playback = self._playbackById(ids[i]);
          if (playback) {
            if (!id) {
              self._stopFade(ids[i]);
            }
            if (self._webAudio && !playback._muted) {
              var currentTime = sound.ctx.currentTime;
              var end = currentTime + (len / 1000);
              playback._volume = from;
              playback._node.gain.setValueAtTime(from, currentTime);
              playback._node.gain.linearRampToValueAtTime(to, end);
            }
            self._startFadeInterval(playback, from, to, len, ids[i], typeof id === "undefined");
          }
        }
        return self;
      },
  
      _startFadeInterval: function(playback, from, to, len, id, isGroup) {
        var self = this;
        var vol = from;
        var diff = to - from;
        var steps = Math.abs(diff / 0.01);
        var stepLen = Math.max(4, (steps > 0) ? len / steps : len);
        var lastTick = Date.now();
  
        playback._fadeTo = to;
        playback._interval = setInterval(function() {
          var tick = (Date.now() - lastTick) / len;
          lastTick = Date.now();
          vol += diff * tick;
          vol = Math.round(vol * 100) / 100;
          if (diff < 0) {
            vol = Math.max(to, vol);
          } else {
            vol = Math.min(to, vol);
          }
  
          if (self._webAudio) {
            playback._volume = vol;
          } else {
            self.volume(vol, playback._id, true);
          }
  
          if (isGroup) {
            self._volume = vol;
          }
  
          if ((to < from && vol <= to) || (to > from && vol >= to)) {
            clearInterval(playback._interval);
            playback._interval = null;
            playback._fadeTo = null;
            self.volume(to, playback._id);
            self._emit("fade", playback._id);
          }
        }, stepLen);
      },
  
      _stopFade: function(id) {
        var self = this;
        var playback = self._playbackById(id);
        if (playback && playback._interval) {
          if (self._webAudio) {
            playback._node.gain.cancelScheduledValues(sound.ctx.currentTime);
          }
          clearInterval(playback._interval);
          playback._interval = null;
          self.volume(playback._fadeTo, id);
          playback._fadeTo = null;
          self._emit("fade", id);
        }
        return self;
      },
  
      loop: function() {
        var self = this;
        var args = arguments;
        var loop, id, playback;
  
        if (args.length === 0) {
          return self._loop;
        } else if (args.length === 1) {
          if (typeof args[0] === "boolean") {
            loop = args[0];
            self._loop = loop;
          } else {
            playback = self._playbackById(parseInt(args[0], 10));
            return playback ? playback._loop : false;
          }
        } else if (args.length === 2) {
          loop = args[0];
          id = parseInt(args[1], 10);
        }
  
        var ids = self._getPlaybackIds(id);
        for (var i = 0; i < ids.length; i++) {
          playback = self._playbackById(ids[i]);
          if (playback) {
            playback._loop = loop;
            if (self._webAudio && playback._node && playback._node.bufferSource) {
              playback._node.bufferSource.loop = loop;
              if (loop) {
                playback._node.bufferSource.loopStart = playback._start || 0;
                playback._node.bufferSource.loopEnd = playback._stop;
              }
            }
          }
        }
        return self;
      },
  
      rate: function() {
        var self = this;
        var args = arguments;
        var rate, id;
  
        if (args.length === 0) {
          id = self._playbacks[0]._id;
        } else if (args.length === 1) {
          var ids = self._getPlaybackIds();
          var index = ids.indexOf(args[0]);
          if (index >= 0) {
            id = parseInt(args[0], 10);
          } else {
            rate = parseFloat(args[0]);
          }
        } else if (args.length === 2) {
          rate = parseFloat(args[0]);
          id = parseInt(args[1], 10);
        }
  
        var playback;
        if (typeof rate === "number") {
          if (self._state !== "loaded" || self._playLock) {
            self._queue.push({
              event: "rate",
              action: function() {
                self.rate.apply(self, args);
              }
            });
            return self;
          }
  
          if (typeof id === "undefined") {
            self._rate = rate;
          }
  
          id = self._getPlaybackIds(id);
          for (var i = 0; i < id.length; i++) {
            playback = self._playbackById(id[i]);
            if (playback) {
              if (self.playing(id[i])) {
                playback._rateSeek = self.seek(id[i]);
                playback._playStart = self._webAudio ? sound.ctx.currentTime : playback._playStart;
              }
              playback._rate = rate;
              if (self._webAudio && playback._node && playback._node.bufferSource) {
                playback._node.bufferSource.playbackRate.setValueAtTime(rate, sound.ctx.currentTime);
              } else if (playback._node) {
                playback._node.playbackRate = rate;
              }
              var seek = self.seek(id[i]);
              var duration = ((self._sprite[playback._sprite][0] + self._sprite[playback._sprite][1]) / 1000) - seek;
              var timeout = (duration * 1000) / Math.abs(playback._rate);
              if (self._endTimers[id[i]] || !playback._paused) {
                self._clearTimer(id[i]);
                self._endTimers[id[i]] = setTimeout(self._ended.bind(self, playback), timeout);
              }
              self._emit("rate", playback._id);
            }
          }
        } else {
          playback = self._playbackById(id);
          return playback ? playback._rate : self._rate;
        }
        return self;
      },
  
      seek: function() {
        var self = this;
        var args = arguments;
        var seek, id;
  
        if (args.length === 0) {
          if (self._playbacks.length) {
            id = self._playbacks[0]._id;
          }
        } else if (args.length === 1) {
          var ids = self._getPlaybackIds();
          var index = ids.indexOf(args[0]);
          if (index >= 0) {
            id = parseInt(args[0], 10);
          } else if (self._playbacks.length) {
            id = self._playbacks[0]._id;
            seek = parseFloat(args[0]);
          }
        } else if (args.length === 2) {
          seek = parseFloat(args[0]);
          id = parseInt(args[1], 10);
        }
  
        if (typeof id === "undefined") {
          return 0;
        }
  
        if (typeof seek === "number" && (self._state !== "loaded" || self._playLock)) {
          self._queue.push({
            event: "seek",
            action: function() {
              self.seek.apply(self, args);
            }
          });
          return self;
        }
  
        var playback = self._playbackById(id);
        if (playback) {
          if (typeof seek === "number" && seek >= 0) {
            var playing = self.playing(id);
            if (playing) {
              self.pause(id, true);
            }
            playback._seek = seek;
            playback._ended = false;
            self._clearTimer(id);
            if (!self._webAudio && playback._node && !isNaN(playback._node.duration)) {
              playback._node.currentTime = seek;
            }
  
            var seekAndEmit = function() {
              if (playing) {
                self.play(id, true);
              }
              self._emit("seek", id);
            };
  
            if (playing && !self._webAudio) {
              var emitSeek = function() {
                if (!self._playLock) {
                  seekAndEmit();
                } else {
                  setTimeout(emitSeek, 0);
                }
              };
              setTimeout(emitSeek, 0);
            } else {
              seekAndEmit();
            }
          } else {
            if (self._webAudio) {
              var realTime = self.playing(id) ? sound.ctx.currentTime - playback._playStart : 0;
              var rateSeek = playback._rateSeek ? playback._rateSeek - playback._seek : 0;
              return playback._seek + (rateSeek + realTime * Math.abs(playback._rate));
            } else {
              return playback._node.currentTime;
            }
          }
        }
        return self;
      },
  
      playing: function(id) {
        var self = this;
        if (typeof id === "number") {
          var playback = self._playbackById(id);
          return playback ? !playback._paused : false;
        }
        for (var i = 0; i < self._playbacks.length; i++) {
          if (!self._playbacks[i]._paused) {
            return true;
          }
        }
        return false;
      },
  
      duration: function(id) {
        var self = this;
        var duration = self._duration;
        var playback = self._playbackById(id);
        if (playback) {
          duration = self._sprite[playback._sprite][1] / 1000;
        }
        return duration;
      },
  
      state: function() {
        return this._state;
      },
  
      unload: function() {
        var self = this;
        var playbacks = self._playbacks;
        for (var i = 0; i < playbacks.length; i++) {
          if (!playbacks[i]._paused) {
            self.stop(playbacks[i]._id);
          }
          if (!self._webAudio) {
            self._clearSound(playbacks[i]._node);
            playbacks[i]._node.removeEventListener("error", playbacks[i]._errorFn, false);
            playbacks[i]._node.removeEventListener(sound._canPlayEvent, playbacks[i]._loadFn, false);
            sound._releaseHtml5Audio(playbacks[i]._node);
          }
          delete playbacks[i]._node;
          self._clearTimer(playbacks[i]._id);
        }
  
        var index = sound._sounds.indexOf(self);
        if (index >= 0) {
          sound._sounds.splice(index, 1);
        }
  
        var remCache = true;
        for (i = 0; i < sound._sounds.length; i++) {
          if (sound._sounds[i]._src === self._src) {
            remCache = false;
            break;
          }
        }
  
        if (cache && remCache) {
          delete cache[self._src];
        }
  
        sound.noAudio = false;
        self._state = "unloaded";
        self._playbacks = [];
        self = null;
  
        return null;
      },
  
      on: function(event, fn, id, once) {
        var self = this;
        var events = self["_on" + event];
        if (typeof fn === "function") {
          events.push(once ? {
            id: id,
            fn: fn,
            once: once
          } : {
            id: id,
            fn: fn
          });
        }
        return self;
      },
  
      off: function(event, fn, id) {
        var self = this;
        var events = self["_on" + event];
        var i = 0;
        if (typeof fn === "number") {
          id = fn;
          fn = null;
        }
        if (fn || id) {
          for (i = 0; i < events.length; i++) {
            var isId = (id === events[i].id);
            if (fn === events[i].fn && isId || !fn && isId) {
              events.splice(i, 1);
              break;
            }
          }
        } else if (event) {
          self["_on" + event] = [];
        } else {
          var keys = Object.keys(self);
          for (i = 0; i < keys.length; i++) {
            if ((keys[i].indexOf("_on") === 0) && Array.isArray(self[keys[i]])) {
              self[keys[i]] = [];
            }
          }
        }
        return self;
      },
  
      once: function(event, fn, id) {
        var self = this;
        self.on(event, fn, id, 1);
        return self;
      },
  
      _emit: function(event, id, msg) {
        var self = this;
        var events = self["_on" + event];
        for (var i = events.length - 1; i >= 0; i--) {
          if (!events[i].id || events[i].id === id || event === "load") {
            setTimeout(function(fn) {
              fn.call(this, id, msg);
            }.bind(self, events[i].fn), 0);
            if (events[i].once) {
              self.off(event, events[i].fn, events[i].id);
            }
          }
        }
        self._loadQueue(event);
        return self;
      },
  
      _loadQueue: function(event) {
        var self = this;
        if (self._queue.length > 0) {
          var task = self._queue[0];
          if (task.event === event) {
            self._queue.shift();
            self._loadQueue();
          }
          if (!event) {
            task.action();
          }
        }
        return self;
      },
  
      _ended: function(playback) {
        var self = this;
        var sprite = playback._sprite;
        var loop = !!(playback._loop || self._sprite[sprite][2]);
  
        self._emit("end", playback._id);
  
        if (!self._webAudio && loop) {
          self.stop(playback._id, true).play(playback._id);
        }
  
        if (self._webAudio && loop) {
          self._emit("play", playback._id);
          playback._seek = playback._start || 0;
          playback._rateSeek = 0;
          playback._playStart = sound.ctx.currentTime;
          var timeout = ((playback._stop - playback._start) * 1000) / Math.abs(playback._rate);
          self._endTimers[playback._id] = setTimeout(self._ended.bind(self, playback), timeout);
        }
  
        if (self._webAudio && !loop) {
          playback._paused = true;
          playback._ended = true;
          playback._seek = playback._start || 0;
          playback._rateSeek = 0;
          self._clearTimer(playback._id);
          self._cleanBuffer(playback._node);
          sound._autoSuspend();
        }
  
        if (!self._webAudio && !loop) {
          self.stop(playback._id, true);
        }
  
        return self;
      },
  
      _clearTimer: function(id) {
        var self = this;
        if (self._endTimers[id]) {
          if (typeof self._endTimers[id] !== "function") {
            clearTimeout(self._endTimers[id]);
          } else {
            var playback = self._playbackById(id);
            if (playback && playback._node) {
              playback._node.removeEventListener("ended", self._endTimers[id], false);
            }
          }
          delete self._endTimers[id];
        }
        return self;
      },
  
      _playbackById: function(id) {
        var self = this;
        for (var i = 0; i < self._playbacks.length; i++) {
          if (id === self._playbacks[i]._id) {
            return self._playbacks[i];
          }
        }
        return null;
      },
  
      _inactivePlayback: function() {
        var self = this;
        self._drain();
        for (var i = 0; i < self._playbacks.length; i++) {
          if (self._playbacks[i]._ended) {
            return self._playbacks[i].reset();
          }
        }
        return new Playback(self);
      },
  
      _drain: function() {
        var self = this;
        var limit = self._pool;
        var cnt = 0;
        var i = 0;
        if (self._playbacks.length < limit) {
          return;
        }
        for (i = 0; i < self._playbacks.length; i++) {
          if (self._playbacks[i]._ended) {
            cnt++;
          }
        }
        for (i = self._playbacks.length - 1; i >= 0; i--) {
          if (cnt <= limit) {
            return;
          }
          if (self._playbacks[i]._ended) {
            if (self._webAudio && self._playbacks[i]._node) {
              self._playbacks[i]._node.disconnect(0);
            }
            self._playbacks.splice(i, 1);
            cnt--;
          }
        }
      },
  
      _getPlaybackIds: function(id) {
        var self = this;
        if (typeof id === "undefined") {
          var ids = [];
          for (var i = 0; i < self._playbacks.length; i++) {
            ids.push(self._playbacks[i]._id);
          }
          return ids;
        } else {
          return [id];
        }
      },
  
      _refreshBuffer: function(playback) {
        var self = this;
        playback._node.bufferSource = sound.ctx.createBufferSource();
        playback._node.bufferSource.buffer = cache[self._src];
        if (playback._panner) {
          playback._node.bufferSource.connect(playback._panner);
        } else {
          playback._node.bufferSource.connect(playback._node);
        }
        playback._node.bufferSource.loop = playback._loop;
        if (playback._loop) {
          playback._node.bufferSource.loopStart = playback._start || 0;
          playback._node.bufferSource.loopEnd = playback._stop || 0;
        }
        playback._node.bufferSource.playbackRate.setValueAtTime(playback._rate, sound.ctx.currentTime);
        return self;
      },
  
      _cleanBuffer: function(node) {
        var self = this;
        var isIOS = sound._navigator && sound._navigator.vendor.indexOf("Apple") >= 0;
        if (sound._scratchBuffer && node.bufferSource) {
          node.bufferSource.onended = null;
          node.bufferSource.disconnect(0);
          if (isIOS) {
            try {
              node.bufferSource.buffer = sound._scratchBuffer;
            } catch (e) {}
          }
        }
        node.bufferSource = null;
        return self;
      },
  
      _clearSound: function(node) {
        var checkIE = /MSIE |Trident\//.test(sound._navigator && sound._navigator.userAgent);
        if (!checkIE) {
          node.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        }
      }
    };
  
    var Playback = function(soundInstance) {
      this._parent = soundInstance;
      this.init();
    };
    Playback.prototype = {
      init: function() {
        var self = this;
        var parent = self._parent;
        self._muted = parent._muted;
        self._loop = parent._loop;
        self._volume = parent._volume;
        self._rate = parent._rate;
        self._seek = 0;
        self._paused = true;
        self._ended = true;
        self._sprite = "__default";
        self._id = ++sound._counter;
        parent._playbacks.push(self);
        self.create();
        return self;
      },
      create: function() {
        var self = this;
        var parent = self._parent;
        var volume = (sound._muted || self._muted || self._parent._muted) ? 0 : self._volume;
        if (parent._webAudio) {
          self._node = (typeof sound.ctx.createGain === "undefined") ? sound.ctx.createGainNode() : sound.ctx.createGain();
          self._node.gain.setValueAtTime(volume, sound.ctx.currentTime);
          self._node.paused = true;
          self._node.connect(sound.masterGain);
        } else if (!sound.noAudio) {
          self._node = sound._obtainHtml5Audio();
          self._errorFn = self._errorListener.bind(self);
          self._node.addEventListener("error", self._errorFn, false);
          self._loadFn = self._loadListener.bind(self);
          self._node.addEventListener(sound._canPlayEvent, self._loadFn, false);
          self._endFn = self._endListener.bind(self);
          self._node.addEventListener("ended", self._endFn, false);
          self._node.src = parent._src;
          self._node.preload = parent._preload === true ? "auto" : parent._preload;
          self._node.volume = volume * sound.volume();
          self._node.load();
        }
        return self;
      },
      reset: function() {
        var self = this;
        var parent = self._parent;
        self._muted = parent._muted;
        self._loop = parent._loop;
        self._volume = parent._volume;
        self._rate = parent._rate;
        self._seek = 0;
        self._rateSeek = 0;
        self._paused = true;
        self._ended = true;
        self._sprite = "__default";
        self._id = ++sound._counter;
        return self;
      },
      _errorListener: function() {
        var self = this;
        self._parent._emit("loaderror", self._id, self._node.error ? self._node.error.code : 0);
        self._node.removeEventListener("error", self._errorFn, false);
      },
      _loadListener: function() {
        var self = this;
        var parent = self._parent;
        parent._duration = Math.ceil(self._node.duration * 10) / 10;
        if (Object.keys(parent._sprite).length === 0) {
          parent._sprite = {
            __default: [0, parent._duration * 1000]
          };
        }
        if (parent._state !== "loaded") {
          parent._state = "loaded";
          parent._emit("load");
          parent._loadQueue();
        }
        self._node.removeEventListener(sound._canPlayEvent, self._loadFn, false);
      },
      _endListener: function() {
        var self = this;
        var parent = self._parent;
        if (parent._duration === Infinity) {
          parent._duration = Math.ceil(self._node.duration * 10) / 10;
          if (parent._sprite.__default[1] === Infinity) {
            parent._sprite.__default[1] = parent._duration * 1000;
          }
          parent._ended(self);
        }
        self._node.removeEventListener("ended", self._endFn, false);
      }
    };
  
    var cache = {};
  
    var loadBuffer = function(self) {
      var url = self._src;
      if (cache[url]) {
        self._duration = cache[url].duration;
        loadSound(self);
        return;
      }
      if (/^data:[^;]+;base64,/.test(url)) {
        var data = atob(url.split(",")[1]);
        var dataView = new Uint8Array(data.length);
        for (var i = 0; i < data.length; ++i) {
          dataView[i] = data.charCodeAt(i);
        }
        decodeAudioData(dataView.buffer, self);
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open(self._xhr.method, url, true);
        xhr.withCredentials = self._xhr.withCredentials;
        xhr.responseType = "arraybuffer";
        if (self._xhr.headers) {
          Object.keys(self._xhr.headers).forEach(function(key) {
            xhr.setRequestHeader(key, self._xhr.headers[key]);
          });
        }
        xhr.onload = function() {
          var code = (xhr.status + "")[0];
          if (code !== "0" && code !== "2" && code !== "3") {
            self._emit("loaderror", null, "Failed loading audio file with status: " + xhr.status + ".");
            return;
          }
          decodeAudioData(xhr.response, self);
        };
        xhr.onerror = function() {
          if (self._webAudio) {
            self._html5 = true;
            self._webAudio = false;
            self._playbacks = [];
            delete cache[url];
            self.load();
          }
        };
        safeXhrSend(xhr);
      }
    };
  
    var safeXhrSend = function(xhr) {
      try {
        xhr.send();
      } catch (e) {
        xhr.onerror();
      }
    };
  
    var decodeAudioData = function(arraybuffer, self) {
      var error = function() {
        self._emit("loaderror", null, "Decoding audio data failed.");
      };
      var success = function(buffer) {
        if (buffer && self._playbacks.length > 0) {
          cache[self._src] = buffer;
          loadSound(self, buffer);
        } else {
          error();
        }
      };
      if (typeof Promise !== "undefined" && sound.ctx.decodeAudioData.length === 1) {
        sound.ctx.decodeAudioData(arraybuffer).then(success).catch(error);
      } else {
        sound.ctx.decodeAudioData(arraybuffer, success, error);
      }
    };
  
    var loadSound = function(self, buffer) {
      if (buffer && !self._duration) {
        self._duration = buffer.duration;
      }
      if (Object.keys(self._sprite).length === 0) {
        self._sprite = {
          __default: [0, self._duration * 1000]
        };
      }
      if (self._state !== "loaded") {
        self._state = "loaded";
        self._emit("load");
        self._loadQueue();
      }
    };
  
    var setupAudioContext = function() {
      if (!sound.usingWebAudio) {
        return;
      }
      try {
        if (typeof AudioContext !== "undefined") {
          sound.ctx = new AudioContext();
        } else if (typeof webkitAudioContext !== "undefined") {
          sound.ctx = new webkitAudioContext();
        } else {
          sound.usingWebAudio = false;
        }
      } catch (e) {
        sound.usingWebAudio = false;
      }
  
      if (!sound.ctx) {
        sound.usingWebAudio = false;
      }
  
      var iOS = (/iP(hone|od|ad)/.test(sound._navigator && sound._navigator.platform));
      var appVersion = sound._navigator && sound._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
      var version = appVersion ? parseInt(appVersion[1], 10) : null;
      if (iOS && version && version < 9) {
        var safari = /safari/.test(sound._navigator && sound._navigator.userAgent.toLowerCase());
        if (sound._navigator && !safari) {
          sound.usingWebAudio = false;
        }
      }
  
      if (sound.usingWebAudio) {
        sound.masterGain = (typeof sound.ctx.createGain === "undefined") ? sound.ctx.createGainNode() : sound.ctx.createGain();
        sound.masterGain.gain.setValueAtTime(sound._muted ? 0 : sound._volume, sound.ctx.currentTime);
        sound.masterGain.connect(sound.ctx.destination);
      }
  
      sound._setup();
    };
  
    if (typeof define === "function" && define.amd) {
      define([], function() {
        return {
          sound: sound,
          Sound: Sound
        };
      });
    }
  
    if (typeof exports !== "undefined") {
      exports.sound = sound;
      exports.Sound = Sound;
    }
  
    if (typeof window !== "undefined") {
      window.SoundGlobal = SoundGlobal;
      window.sound = sound;
      window.Sound = Sound;
      window.Playback = Playback;
    }
  })();