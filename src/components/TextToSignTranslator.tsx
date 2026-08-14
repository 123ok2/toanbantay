import React, { useState, useEffect } from "react";
import {
  Languages,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  Hand,
  ArrowRight,
  Info,
  Check,
} from "lucide-react";
import { GESTURE_DICTIONARY } from "../utils/gestureDictionary";
import { GestureDefinition } from "../types";
import { soundManager } from "../utils/soundEffects";

// Mapping common phrases to gesture sequences
const SAMPLE_PHRASES: Array<{ label: string; text: string }> = [
  { label: "Xin chào!", text: "Xin chào" },
  { label: "Cảm ơn bạn!", text: "Cảm ơn" },
  { label: "Tôi yêu bạn 🤟", text: "Tôi yêu bạn" },
  { label: "Hoàn hảo / Đồng ý", text: "Đồng ý" },
  { label: "Chữ L - I - N - H", text: "L I V Y" },
];

export const TextToSignTranslator: React.FC = () => {
  const [inputText, setInputText] = useState<string>("Xin chào");
  const [signSequence, setSignSequence] = useState<GestureDefinition[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1800); // ms per sign

  // Parse input text into sign gestures
  useEffect(() => {
    const cleanText = inputText.trim().toLowerCase();
    const result: GestureDefinition[] = [];

    // Helper to find by key
    const allGestures = Object.values(GESTURE_DICTIONARY);

    if (cleanText.includes("yêu") || cleanText.includes("love") || cleanText.includes("thương")) {
      result.push(GESTURE_DICTIONARY.love_you);
    }
    if (cleanText.includes("chào") || cleanText.includes("hello") || cleanText.includes("hi")) {
      result.push(GESTURE_DICTIONARY.open_palm);
    }
    if (cleanText.includes("cảm ơn") || cleanText.includes("tốt") || cleanText.includes("cảm ơn")) {
      result.push(GESTURE_DICTIONARY.thumbs_up);
    }
    if (cleanText.includes("đồng ý") || cleanText.includes("ok")) {
      result.push(GESTURE_DICTIONARY.ok_sign);
    }

    // Parse individual letters if spelling
    const words = cleanText.split(/\s+/);
    for (const char of cleanText) {
      if (char === "l") result.push(GESTURE_DICTIONARY.letter_l);
      else if (char === "v") result.push(GESTURE_DICTIONARY.letter_v);
      else if (char === "y") result.push(GESTURE_DICTIONARY.letter_y);
      else if (char === "i") result.push(GESTURE_DICTIONARY.letter_i);
      else if (char === "a") result.push(GESTURE_DICTIONARY.letter_a);
      else if (char === "b") result.push(GESTURE_DICTIONARY.letter_b);
      else if (char === "c") result.push(GESTURE_DICTIONARY.letter_c);
      else if (char === "s") result.push(GESTURE_DICTIONARY.fist);
      else if (char === "o") result.push(GESTURE_DICTIONARY.ok_sign);
    }

    // Default fallback if no match
    if (result.length === 0) {
      result.push(GESTURE_DICTIONARY.open_palm);
      result.push(GESTURE_DICTIONARY.love_you);
    }

    setSignSequence(result);
    setActiveStepIndex(0);
    setIsPlaying(false);
  }, [inputText]);

  // Auto-play sign sequence loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && signSequence.length > 0) {
      timer = setInterval(() => {
        setActiveStepIndex((prev) => {
          const next = (prev + 1) % signSequence.length;
          // Speak current gesture name
          if (signSequence[next]) {
            soundManager.speakText(signSequence[next].name);
          }
          return next;
        });
      }, playbackSpeed);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, signSequence, playbackSpeed]);

  const handlePlayToggle = () => {
    soundManager.playClick();
    setIsPlaying(!isPlaying);
  };

  const handleSelectPhrase = (phraseText: string) => {
    soundManager.playClick();
    setInputText(phraseText);
  };

  const activeGesture = signSequence[activeStepIndex] || GESTURE_DICTIONARY.open_palm;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-200">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Dịch Từ Tiếng Việt Sang Ngôn Ngữ Ký Hiệu
            </h2>
            <p className="text-xs text-slate-500">
              Nhập từ/cụm từ để xem mô phỏng cử chỉ tay nói chuyện với người khiếm thính
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
          Công cụ hỗ trợ người nghe giao tiếp 🤝
        </span>
      </div>

      {/* Input Field & Preset Buttons */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập câu tiếng Việt (VD: Xin chào, Cảm ơn, Tôi yêu bạn...)"
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-indigo-100 focus:border-indigo-500 focus:bg-white text-slate-900 text-sm font-semibold transition-all outline-none pr-10 shadow-inner"
          />
          {inputText && (
            <button
              onClick={() => setInputText("")}
              className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Quick Sample Phrase Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500">Mẫu câu nhanh:</span>
          {SAMPLE_PHRASES.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPhrase(phrase.text)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all cursor-pointer"
            >
              {phrase.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sign Sequence Visual Showcase */}
      {signSequence.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50 rounded-2xl p-6 border border-indigo-100">
          {/* Main Active Gesture Card (Main Stage) */}
          <div className="md:col-span-6 bg-white rounded-2xl p-6 shadow-md border border-indigo-100 text-center flex flex-col items-center justify-between min-h-[260px]">
            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Bước {activeStepIndex + 1} / {signSequence.length}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px]">
                {activeGesture.categoryLabel}
              </span>
            </div>

            {/* Giant Emoji */}
            <div className="text-7xl sm:text-8xl my-3 transform hover:scale-110 transition-transform drop-shadow-md">
              {activeGesture.emoji}
            </div>

            {/* Sign Name */}
            <h3 className="text-2xl font-black text-slate-900 mb-1">
              {activeGesture.name}
            </h3>

            {/* Description & Tips */}
            <p className="text-xs text-slate-600 max-w-sm mb-3">
              👉 {activeGesture.tips}
            </p>

            {/* Deaf Context Note */}
            {activeGesture.deafContext && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-left text-[11px] text-purple-900 w-full flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Bối cảnh giao tiếp khiếm thính:</strong> {activeGesture.deafContext}</span>
              </div>
            )}
          </div>

          {/* Sequence Steps Timeline & Controls */}
          <div className="md:col-span-6 flex flex-col justify-between h-full space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-indigo-600" />
                <span>Chuỗi cử chỉ tay tương ứng ({signSequence.length} bước)</span>
              </h4>

              {/* Step Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {signSequence.map((gesture, idx) => {
                  const isActive = idx === activeStepIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        soundManager.playClick();
                        setActiveStepIndex(idx);
                        soundManager.speakText(gesture.name);
                      }}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between border cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.01]"
                          : "bg-white hover:bg-indigo-50 text-slate-800 border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{gesture.emoji}</span>
                        <div>
                          <div className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-900"}`}>
                            {idx + 1}. {gesture.name}
                          </div>
                          <p className={`text-[11px] ${isActive ? "text-indigo-100" : "text-slate-500"}`}>
                            {gesture.tips}
                          </p>
                        </div>
                      </div>

                      {isActive && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
              <button
                onClick={handlePlayToggle}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Tạm dừng phát
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Phát trình diễn cử chỉ
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  soundManager.speakText(activeGesture.name);
                }}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Phát âm tiếng Việt"
              >
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span>Đọc giọng nói</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
