// Web Audio API Synthesizer & Natural Vietnamese Voice Engine for Educational Feedback

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
      setTimeout(() => this.preloadCommonPhrases(), 1000);
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

  // Preload essential Vietnamese voice clip for 0-latency playback
  public preloadCommonPhrases() {
    if (this.preloaded || typeof window === "undefined") return;
    this.preloaded = true;

    const audio = new Audio("/sounds/chinh_xac.mp3");
    audio.preload = "auto";
    this.audioCache.set("Chính xác!", audio);
    this.audioCache.set("Chính xác", audio);
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

  // Natural Vietnamese Speech Output with local audio priority and server fallback
  public async speakText(text: string): Promise<boolean> {
    if (!this.speechEnabled || !text) return false;

    const cleanText = text.trim();
    if (!cleanText) return false;

    // 1. If text is 'Chính xác' or 'Chính xác!', play local high quality audio directly
    if (cleanText === "Chính xác!" || cleanText === "Chính xác") {
      try {
        if (this.currentPlayingAudio) {
          this.currentPlayingAudio.pause();
          this.currentPlayingAudio.currentTime = 0;
        }

        let audio = this.audioCache.get("Chính xác!");
        if (!audio) {
          audio = new Audio("/sounds/chinh_xac.mp3");
          this.audioCache.set("Chính xác!", audio);
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
        console.log("Local audio play fallback:", e);
      }
    }

    // 2. Try playing via Server-Side TTS endpoint
    try {
      if (this.currentPlayingAudio) {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio.currentTime = 0;
      }

      let audio = this.audioCache.get(cleanText);
      if (!audio) {
        const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
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

    // 3. Fallback to Browser Web Speech API ONLY if authentic Vietnamese voice exists on OS
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (this.voices.length === 0) {
          this.voices = window.speechSynthesis.getVoices();
        }

        const viVoice = this.voices.find(
          (v) =>
            v.lang.toLowerCase().includes("vi") ||
            v.name.toLowerCase().includes("vietnam") ||
            v.name.toLowerCase().includes("tiếng việt") ||
            v.name.toLowerCase().includes("hoaimy") ||
            v.name.toLowerCase().includes("namminh") ||
            v.name.toLowerCase().includes("linh") ||
            v.name.toLowerCase().includes("an")
        );

        if (viVoice) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.voice = viVoice;
          utterance.lang = "vi-VN";
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
          return true;
        }
      } catch (err) {
        console.warn("Web Speech synthesis error:", err);
      }
    }

    return false;
  }

  // Combined Correct Feedback (Plays Chime first, then cleanly speaks "Chính xác!")
  public playCorrectFeedback(correctAnswer?: number, streak: number = 0) {
    if (!this.soundEnabled) return;

    // 1. Play pleasant melodic bell
    this.playSuccessChime();

    // 2. Purely speak standard Vietnamese "Chính xác!"
    if (this.speechEnabled) {
      setTimeout(() => {
        this.speakText("Chính xác!");
      }, 150);
    }
  }
}

export const soundManager = new SoundManager();

