// Web Audio API Synthesizer & Standard Natural Vietnamese Voice Engine for Educational Feedback

class SoundManager {
  private audioCtx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public speechEnabled: boolean = true;
  private voices: SpeechSynthesisVoice[] = [];
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private currentPlayingAudio: HTMLAudioElement | null = null;
  private preloaded: boolean = false;

  constructor() {
    this.initVoices();
    if (typeof window !== "undefined") {
      // Preload standard audio phrases after initial page load
      setTimeout(() => this.preloadCommonPhrases(), 800);
    }
  }

  private initVoices() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  // Preload essential high-quality Vietnamese voice clips for 0-latency playback
  public preloadCommonPhrases() {
    if (this.preloaded || typeof window === "undefined") return;
    this.preloaded = true;

    const clips: Record<string, string> = {
      "chính xác": "/sounds/chinh_xac.mp3",
      "chính xác!": "/sounds/chinh_xac.mp3",
      "chính xác rồi": "/sounds/chinh_xac_roi.mp3",
      "chính xác rồi!": "/sounds/chinh_xac_roi.mp3",
      "đúng rồi": "/sounds/dung_roi.mp3",
      "đúng rồi!": "/sounds/dung_roi.mp3",
      "rất giỏi": "/sounds/rat_gioi.mp3",
      "rất giỏi!": "/sounds/rat_gioi.mp3",
      "rất xuất sắc": "/sounds/xuat_sac.mp3",
      "rất xuất sắc!": "/sounds/xuat_sac.mp3",
      "chưa đúng": "/sounds/thu_lai.mp3",
      "thử lại": "/sounds/thu_lai.mp3",
    };

    Object.entries(clips).forEach(([phrase, path]) => {
      try {
        const audio = new Audio(path);
        audio.preload = "auto";
        this.audioCache.set(phrase.toLowerCase(), audio);
      } catch (e) {
        // ignore
      }
    });
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Harmonic, crisp bell chime (C6 -> E6 -> G6)
  public playSuccessChime() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Sparkling warm chord notes: G5 (784Hz), C6 (1046.5Hz), E6 (1318.5Hz)
      const frequencies = [783.99, 1046.5, 1318.51];
      const offsets = [0, 0.08, 0.16];

      frequencies.forEach((freq, idx) => {
        const t = now + offsets[idx];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);

        // Soft attack and smooth harmonic decay
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch (e) {
      console.warn("Audio playback error:", e);
    }
  }

  // Play victory celebration tune for completing AI challenge or high streaks
  public playVictoryFanfare() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      const times = [0, 0.1, 0.2, 0.3, 0.45];

      notes.forEach((freq, i) => {
        const now = ctx.currentTime + times[i];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === notes.length - 1 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (i === notes.length - 1 ? 0.7 : 0.35));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + (i === notes.length - 1 ? 0.7 : 0.35));
      });
    } catch (e) {
      console.warn("Victory fanfare error:", e);
    }
  }

  // Soft click sound for UI buttons
  public playClick() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.06);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // ignore
    }
  }

  // Gentle double-thump for incorrect math attempt (encouraging, not harsh)
  public playIncorrectBuzzer() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      [220, 180].forEach((freq, i) => {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch (e) {
      // ignore
    }
  }

  // Play warning alarm chime
  public playWarningAlarm() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Alarm error:", e);
    }
  }

  // Natural Vietnamese Speech Output with standard pronunciation, preloaded audio and server TTS
  public async speakText(text: string): Promise<boolean> {
    if (!this.speechEnabled || !text) return false;

    // Clean text: strip emojis, markdown symbols, and unnecessary punctuations for crisp pronunciation
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/[➕➖✖️➗📐⚖️🧩💎⚡🎯🚤🤝🌿🌟💯🛑🧮💡🎉🍬🍪🚀🍊🍎⭐🎈🔊👏!?,.]/g, " ")
      .replace(/[\n\r\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return false;

    const lower = cleanText.toLowerCase();

    // 1. Check if we have an ultra-high clarity preloaded Vietnamese audio file
    const preloadedAudio = this.audioCache.get(lower);
    if (preloadedAudio) {
      try {
        if (this.currentPlayingAudio) {
          this.currentPlayingAudio.pause();
          this.currentPlayingAudio.currentTime = 0;
        }

        preloadedAudio.currentTime = 0;
        this.currentPlayingAudio = preloadedAudio;
        preloadedAudio.volume = 1.0;

        const playPromise = preloadedAudio.play();
        if (playPromise !== undefined) {
          await playPromise;
          return true;
        }
      } catch (e) {
        console.log("Preloaded audio play fallback:", e);
      }
    }

    // 2. Play via Server-Side standard Vietnamese TTS endpoint
    try {
      if (this.currentPlayingAudio) {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio.currentTime = 0;
      }

      let audio = this.audioCache.get(cleanText);
      if (!audio) {
        const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText.slice(0, 180))}`;
        audio = new Audio(ttsUrl);
        this.audioCache.set(cleanText, audio);
      } else {
        audio.currentTime = 0;
      }

      this.currentPlayingAudio = audio;
      audio.volume = 1.0;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        return true;
      }
    } catch (e) {
      console.log("Server TTS fallback triggered for:", cleanText);
    }

    // 3. Fallback to Browser Web Speech API with standard Vietnamese Voice
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (this.voices.length === 0) {
          this.voices = window.speechSynthesis.getVoices();
        }

        const viVoice = this.voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("vi") ||
            v.name.toLowerCase().includes("vietnam") ||
            v.name.toLowerCase().includes("tiếng việt") ||
            v.name.toLowerCase().includes("hoaimy") ||
            v.name.toLowerCase().includes("namminh") ||
            v.name.toLowerCase().includes("linh") ||
            v.name.toLowerCase().includes("an") ||
            v.name.toLowerCase().includes("mai")
        );

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (viVoice) {
          utterance.voice = viVoice;
        }
        utterance.lang = "vi-VN";
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch (err) {
        console.warn("Web Speech synthesis error:", err);
      }
    }

    return false;
  }

  // Combined Correct Feedback (Plays Chime first, then cleanly speaks standard "Chính xác!")
  public playCorrectFeedback(correctAnswer?: number, streak: number = 0) {
    if (!this.soundEnabled) return;

    // 1. Play pleasant melodic bell
    this.playSuccessChime();

    // 2. Purely speak standard natural Vietnamese "Chính xác!" or praise
    if (this.speechEnabled) {
      setTimeout(() => {
        let phrase = "chính xác";
        if (streak >= 5) {
          phrase = "rất xuất sắc";
        } else if (streak >= 3) {
          phrase = "rất giỏi";
        }
        this.speakText(phrase);
      }, 140);
    }
  }

  // Sci-fi hologram activation whoosh
  public playHologramOpen() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // ignore
    }
  }

  // Pen touch soft sound when pinch drawing starts
  public playPenTouch() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // ignore
    }
  }

  // Sci-fi submit calculation success sound
  public playSubmitSuccess() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      // ignore
    }
  }

  // Smooth whoosh sound when wiping/clearing canvas with hand gesture
  public playWhoosh() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();


