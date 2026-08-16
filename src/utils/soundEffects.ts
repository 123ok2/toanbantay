// Web Audio API Synthesizer & Diverse Natural Vietnamese Motivational Voice Engine

export const PRAISE_PHRASES = [
  "Chính xác! Bạn thật là xuất sắc!",
  "Đúng rồi! Bạn làm rất tuyệt vời!",
  "Quá chuẩn luôn! Rất thông minh!",
  "Chính xác tuyệt đối! Giỏi lắm!",
  "Chuẩn không cần chỉnh! Tuyệt đỉnh!",
  "Rất nhanh và chính xác! Tiếp tục phát huy nhé!",
  "Tuyệt vời! Bạn tính nhẩm siêu thật!",
  "Hoàn hảo! Một pha tính toán đỉnh cao!",
  "Rất giỏi! Tư duy toán học của bạn thật nhạy bén!",
  "Chính xác 100%! Bạn đỉnh thật đấy!",
];

export const STREAK_PHRASES: Record<number, string[]> = {
  3: [
    "Đỉnh cao! Đã trả lời đúng 3 câu liên tiếp rồi!",
    "Phong độ tuyệt vời! 3 câu liên tiếp chính xác!",
  ],
  5: [
    "Thật không thể tin được! Chuỗi 5 câu chính xác tuyệt đối!",
    "Xuất thần! Bạn đang giữ chuỗi 5 câu đúng liên tục!",
  ],
  7: [
    "Thiên tài toán học là đây! Chuỗi 7 câu bất bại!",
    "Thần tốc và chuẩn xác! Đẳng cấp chuỗi 7 câu!",
  ],
  10: [
    "Huyền thoại Finger Math! 10 câu đúng liên tiếp, bạn quá xuất sắc!",
    "Siêu trí tuệ! Chuỗi 10 câu hoàn hảo không một lỗi sai!",
  ],
};

export const ENCOURAGEMENT_PHRASES = [
  "Chưa đúng rồi, nhưng không sao, hãy thử lại một lần nữa nhé!",
  "Đừng nản lòng, bạn đếm kỹ ngón tay lại một chút nào!",
  "Gần đúng rồi đó, cố gắng một chút nữa thôi!",
  "Bình tĩnh nào, bạn hoàn toàn có thể làm đúng câu này!",
  "Sai lầm là mẹ của thành công, cùng thử lại nào!",
  "Tập trung đếm lại ngón tay và thử lại nhé, bạn làm được mà!",
  "Cố lên bạn ơi, chiến thắng đang ở ngay phía trước!",
];

class SoundManager {
  private audioCtx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public speechEnabled: boolean = true;
  private voices: SpeechSynthesisVoice[] = [];
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private currentPlayingAudio: HTMLAudioElement | null = null;
  private lastPraiseIdx: number = -1;
  private lastEncourageIdx: number = -1;

  constructor() {
    this.initVoices();
    if (typeof window !== "undefined") {
      setTimeout(() => this.preloadCommonPhrases(), 600);
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

  public preloadCommonPhrases() {
    if (typeof window === "undefined") return;
    const essential = [
      "Chính xác! Giỏi quá!",
      "Đúng rồi!",
      "Rất xuất sắc!",
      "Tuyệt vời!",
      "Thử lại nhé!",
    ];

    essential.forEach((phrase) => {
      try {
        const ttsUrl = `/api/tts?text=${encodeURIComponent(phrase)}`;
        const audio = new Audio(ttsUrl);
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
      const frequencies = [783.99, 1046.5, 1318.51];
      const offsets = [0, 0.08, 0.16];

      frequencies.forEach((freq, idx) => {
        const t = now + offsets[idx];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch (e) {
      // ignore
    }
  }

  // Play victory celebration fanfare
  public playVictoryFanfare() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
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
      // ignore
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

  // Gentle double-thump for incorrect math attempt
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

  // Natural Vietnamese Speech Engine (Multi-Tier Architecture for AI Studio, Vercel & Production)
  public async speakText(text: string): Promise<boolean> {
    if (!this.speechEnabled || !text) return false;

    // Clean text for speech: strip emojis, math symbols, and markdown
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/[➕➖✖️➗📐⚖️🧩💎⚡🎯🚤🤝🌿🌟💯🛑🧮💡🎉🍬🍪🚀🍊🍎⭐🎈🔊👏!?,.*_#`~[\]()]/g, " ")
      .replace(/[\n\r\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return false;

    const lower = cleanText.toLowerCase();

    // Helper: Stop previous speech/audio
    if (this.currentPlayingAudio) {
      try {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
    }

    // Helper: Function to play an audio element with promise error catch
    const tryPlayAudio = async (audioUrl: string): Promise<boolean> => {
      return new Promise((resolve) => {
        try {
          const audio = new Audio(audioUrl);
          this.currentPlayingAudio = audio;
          audio.volume = 1.0;

          audio.onended = () => resolve(true);
          audio.onerror = () => resolve(false);

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => resolve(true)).catch(() => resolve(false));
          } else {
            resolve(true);
          }
        } catch (e) {
          resolve(false);
        }
      });
    };

    // 1. Check local audio cache
    const cached = this.audioCache.get(lower);
    if (cached) {
      try {
        cached.currentTime = 0;
        this.currentPlayingAudio = cached;
        cached.volume = 1.0;
        const playPromise = cached.play();
        if (playPromise !== undefined) {
          await playPromise;
          return true;
        }
      } catch (e) {
        // fallback
      }
    }

    // 2. Play via Server TTS / Vercel Serverless Endpoint (/api/tts)
    const encodedText = encodeURIComponent(cleanText.slice(0, 180));
    const internalTtsUrl = `/api/tts?text=${encodedText}`;
    const internalSuccess = await tryPlayAudio(internalTtsUrl);
    if (internalSuccess) {
      return true;
    }

    // 3. Direct Google TTS fallback (with CORS audio element)
    const directGoogleTts = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=vi&client=tw-ob`;
    const directSuccess = await tryPlayAudio(directGoogleTts);
    if (directSuccess) {
      return true;
    }

    // 4. Web Speech API Fallback (with smart Vietnamese Voice selection)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (this.voices.length === 0) {
          this.voices = window.speechSynthesis.getVoices();
        }

        // Priority list for Vietnamese voices across Google Chrome, Edge, Safari, Android, iOS
        const viVoice =
          this.voices.find((v) => v.lang === "vi-VN" || v.lang === "vi_VN") ||
          this.voices.find(
            (v) =>
              v.lang.toLowerCase().startsWith("vi") ||
              v.name.toLowerCase().includes("vietnam") ||
              v.name.toLowerCase().includes("tiếng việt") ||
              v.name.toLowerCase().includes("hoaimy") ||
              v.name.toLowerCase().includes("namminh") ||
              v.name.toLowerCase().includes("linh") ||
              v.name.toLowerCase().includes("an") ||
              v.name.toLowerCase().includes("mai")
          ) ||
          this.voices.find((v) => v.lang.toLowerCase().includes("vi"));

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (viVoice) {
          utterance.voice = viVoice;
          utterance.lang = viVoice.lang;
        } else {
          utterance.lang = "vi-VN";
        }
        utterance.rate = 0.95; // slightly slower for clearer Vietnamese pronunciation
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch (err) {
        // ignore
      }
    }

    return false;
  }

  // Pick a distinct random praise phrase (avoiding immediate repeats)
  private getRandomPraise(): string {
    let nextIdx = Math.floor(Math.random() * PRAISE_PHRASES.length);
    if (nextIdx === this.lastPraiseIdx) {
      nextIdx = (nextIdx + 1) % PRAISE_PHRASES.length;
    }
    this.lastPraiseIdx = nextIdx;
    return PRAISE_PHRASES[nextIdx];
  }

  // Pick a distinct random encouragement phrase
  private getRandomEncouragement(): string {
    let nextIdx = Math.floor(Math.random() * ENCOURAGEMENT_PHRASES.length);
    if (nextIdx === this.lastEncourageIdx) {
      nextIdx = (nextIdx + 1) % ENCOURAGEMENT_PHRASES.length;
    }
    this.lastEncourageIdx = nextIdx;
    return ENCOURAGEMENT_PHRASES[nextIdx];
  }

  // Rich Correct Feedback with diverse, inspiring Vietnamese praise & streak celebrations
  public playCorrectFeedback(correctAnswer?: number, streak: number = 0) {
    if (!this.soundEnabled) return;

    if (streak >= 3) {
      this.playVictoryFanfare();
    } else {
      this.playSuccessChime();
    }

    if (this.speechEnabled) {
      setTimeout(() => {
        let phrase = "";
        if (streak >= 10 && STREAK_PHRASES[10]) {
          const list = STREAK_PHRASES[10];
          phrase = list[Math.floor(Math.random() * list.length)];
        } else if (streak >= 7 && STREAK_PHRASES[7]) {
          const list = STREAK_PHRASES[7];
          phrase = list[Math.floor(Math.random() * list.length)];
        } else if (streak >= 5 && STREAK_PHRASES[5]) {
          const list = STREAK_PHRASES[5];
          phrase = list[Math.floor(Math.random() * list.length)];
        } else if (streak >= 3 && STREAK_PHRASES[3]) {
          const list = STREAK_PHRASES[3];
          phrase = list[Math.floor(Math.random() * list.length)];
        } else {
          phrase = this.getRandomPraise();
        }

        this.speakText(phrase);
      }, 150);
    }
  }

  // Gentle feedback when wrong (sound only, no speech voice)
  public playEncouragingFeedback() {
    if (!this.soundEnabled) return;
    this.playIncorrectBuzzer();
  }

  // Read question aloud naturally in Vietnamese
  public readQuestion(questionText: string) {
    if (!this.speechEnabled || !questionText) return;
    // Format question nicely for speech (e.g. "5 + 3 = ?" -> "5 cộng 3 bằng bao nhiêu?")
    let speechQ = questionText
      .replace(/\+/g, " cộng ")
      .replace(/-/g, " trừ ")
      .replace(/x|\*/g, " nhân ")
      .replace(/:|\//g, " chia ")
      .replace(/=\s*\?/g, " bằng bao nhiêu?")
      .replace(/=\s*___/g, " bằng bao nhiêu?")
      .replace(/\?/g, " bằng bao nhiêu?");

    if (!speechQ.includes("bao nhiêu") && !speechQ.includes("tính")) {
      speechQ = `Hãy tính: ${speechQ}`;
    }

    this.speakText(speechQ);
  }

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
    } catch (e) {}
  }

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
    } catch (e) {}
  }

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
    } catch (e) {}
  }

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
    } catch (e) {}
  }

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
    } catch (e) {}
  }
}

export const soundManager = new SoundManager();
