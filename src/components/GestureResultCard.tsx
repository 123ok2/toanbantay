import React from "react";
import {
  Volume2,
  Trash2,
  Sparkles,
  HelpCircle,
  ThumbsUp,
  CheckCircle,
  Info,
  RotateCcw,
} from "lucide-react";
import { RecognitionResult } from "../types";
import { GESTURE_DICTIONARY } from "../utils/gestureDictionary";
import { soundManager } from "../utils/soundEffects";

interface GestureResultCardProps {
  result: RecognitionResult | null;
  onClearResult: () => void;
  geminiExplanation?: string | null;
}

export const GestureResultCard: React.FC<GestureResultCardProps> = ({
  result,
  onClearResult,
  geminiExplanation,
}) => {
  const currentResult = result || {
    gestureId: "unknown",
    name: "Đang chờ nhận diện",
    emoji: "✋",
    confidence: 0,
    handDetected: false,
    timestamp: Date.now(),
  };

  const gestureDef = GESTURE_DICTIONARY[currentResult.gestureId] || GESTURE_DICTIONARY.unknown;
  const isRecognized = currentResult.gestureId !== "unknown" && currentResult.confidence > 50;

  const handleSpeak = () => {
    soundManager.playClick();
    if (isRecognized) {
      soundManager.speakText(`Cử chỉ: ${currentResult.name}. Biểu thị: ${gestureDef.meaning}`);
    } else {
      soundManager.speakText("Chưa nhận diện được cử chỉ. Vui lòng đưa bàn tay rõ hơn trước camera.");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-lg border border-indigo-100 flex flex-col justify-between relative overflow-hidden transition-all h-full">
      {/* Background Subtle Gradient Glow */}
      <div
        className={`absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all ${
          isRecognized ? "bg-emerald-200/40" : "bg-indigo-100/40"
        }`}
      />

      {/* Card Header & Status */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
              Kết Quả Nhận Diện AI
            </span>
          </div>

          {/* Confidence Badge */}
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              isRecognized
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            Tin cậy: {isRecognized ? `${currentResult.confidence}%` : "0%"}
          </div>
        </div>

        {/* Compact Result Box */}
        <div className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 border border-indigo-100/80 rounded-xl p-3.5 sm:p-4 text-center my-1.5 shadow-inner relative flex flex-col items-center justify-center min-h-[160px] sm:min-h-[180px]">
          {/* Hand Count & Finger Count Badge */}
          {currentResult.handCount > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {currentResult.handCount >= 2 ? "✋✋ 2 Tay" : "✋ 1 Tay"}
              </span>
              {currentResult.fingerCount > 0 && (
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  🔢 {currentResult.fingerCount} Ngón
                </span>
              )}
            </div>
          )}

          {/* Animated Emoji */}
          <div className="text-4xl sm:text-5xl mb-1.5 transform hover:scale-110 transition-transform duration-300 drop-shadow-sm select-none">
            {currentResult.emoji}
          </div>

          {/* Vietnamese Gesture Name */}
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-0.5 tracking-tight">
            {currentResult.name}
          </h3>

          {/* Status Subtitle & Hand Breakdown */}
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium max-w-xs leading-relaxed">
            {isRecognized
              ? gestureDef ? gestureDef.meaning : `Đã nhận diện ${currentResult.fingerCount} ngón tay.`
              : "Đưa bàn tay vào khung camera và xòe ngón tay để AI nhận diện."}
          </p>

          {/* Detailed Per-Hand Breakdown */}
          {currentResult.handDetails && currentResult.handDetails.length > 1 && (
            <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-900">
              {currentResult.handDetails.map((hand) => (
                <span key={hand.handIndex} className="flex items-center gap-1">
                  <span>{hand.label}:</span>
                  <span className="text-purple-700 font-bold">{hand.fingerCount} ngón</span>
                </span>
              ))}
            </div>
          )}

          {/* Visual Confidence Bar */}
          {isRecognized && (
            <div className="w-full max-w-xs mt-2.5">
              <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                <span>Độ chuẩn</span>
                <span>{currentResult.confidence}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentResult.confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Gemini Detailed AI Explanation Box (if requested) */}
        {geminiExplanation && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] animate-fade-in shadow-xs">
            <div className="flex items-center gap-1 font-bold text-purple-800 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Phân tích từ Gemini AI:</span>
            </div>
            <p className="leading-tight text-purple-950 font-medium">
              {geminiExplanation}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons (Compact) */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Speak Result Button */}
        <button
          onClick={handleSpeak}
          className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title="Đọc kết quả bằng giọng nói tiếng Việt"
        >
          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Đọc Kết Quả</span>
        </button>

        {/* Clear Result Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClearResult();
          }}
          className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title="Xóa kết quả hiện tại"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Xóa</span>
        </button>
      </div>
    </div>
  );
};
