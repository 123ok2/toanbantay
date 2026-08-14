import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Star,
  Zap,
  Hand,
  Heart,
} from "lucide-react";
import confetti from "canvas-confetti";
import { GestureType, RecognitionResult } from "../types";
import { GESTURE_DICTIONARY } from "../utils/gestureDictionary";
import { soundManager } from "../utils/soundEffects";

interface AIChallengeProps {
  currentResult: RecognitionResult | null;
  isStreaming: boolean;
}

const SIGN_CHALLENGES: Array<{ id: GestureType; title: string; hint: string }> = [
  { id: "love_you", title: "Ký hiệu 🤟 - 'Tôi Yêu Bạn' (I Love You)", hint: "Giơ ngón cái (I), ngón trỏ (L) và ngón út (Y)" },
  { id: "open_palm", title: "Ký hiệu ✋ - 'Xin Chào' / Dừng lại / Số 5", hint: "Xòe rộng cả 5 ngón tay hướng về phía camera" },
  { id: "number_7", title: "Đếm Số 7️⃣ - 'Đếm 7 Ngón Tay' (2 Bàn Tay)", hint: "Xòe 2 bàn tay: Bàn tay 1 mở 5 ngón, Bàn tay 2 mở 2 ngón" },
  { id: "number_10", title: "Đếm Số 🔟 - 'Đếm 10 Ngón Tay' (2 Bàn Tay)", hint: "Xòe rộng cả 10 ngón tay trên 2 bàn tay trước camera" },
  { id: "thumbs_up", title: "Ký hiệu 👍 - 'Cảm Ơn' / Đồng ý", hint: "Giơ ngón cái thẳng đứng hướng lên trên" },
  { id: "letter_l", title: "Bảng chữ cái 🤙 - 'Chữ L'", hint: "Mở ngón cái và ngón trỏ tạo thành góc vuông hình chữ L" },
  { id: "letter_v", title: "Bảng chữ cái ✌️ - 'Chữ V' / Số 2", hint: "Xòe ngón trỏ và ngón giữa thành hình chữ V" },
  { id: "ok_sign", title: "Ký hiệu 👌 - 'Đồng Ý' / OK / Chữ O", hint: "Chụm đầu ngón cái và ngón trỏ thành hình vòng tròn" },
  { id: "point_up", title: "Ký hiệu ☝️ - 'Số 1' / 'Chú ý'", hint: "Giơ thẳng duy nhất ngón trỏ lên cao" },
  { id: "fist", title: "Bảng chữ cái ✊ - 'Chữ S' / Quyết tâm", hint: "Nắm chặt tất cả 5 ngón tay lại" },
];

export const AIChallenge: React.FC<AIChallengeProps> = ({
  currentResult,
  isStreaming,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const isCorrectRef = useRef<boolean>(false);

  useEffect(() => {
    isCorrectRef.current = isCorrect;
  }, [isCorrect]);

  const target = SIGN_CHALLENGES[currentIndex];
  const targetDef = GESTURE_DICTIONARY[target.id] || GESTURE_DICTIONARY.open_palm;

  const currentGestureId = currentResult?.gestureId;
  const currentConfidence = currentResult?.confidence ?? 0;
  const resultTimestamp = currentResult?.timestamp;

  // Evaluate current live camera gesture against target
  useEffect(() => {
    if (!isStreaming || isCorrectRef.current || !currentGestureId) return;

    if (
      currentGestureId === target.id &&
      currentConfidence >= 65
    ) {
      isCorrectRef.current = true;
      setIsCorrect(true);
      setScore((prev) => prev + 100 + streak * 10);
      setStreak((prev) => prev + 1);

      // Trigger Celebration Effects
      soundManager.playVictoryFanfare();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#a855f7"],
      });
    }
  }, [resultTimestamp, currentGestureId, currentConfidence, target.id, isStreaming, streak]);

  const handleNextChallenge = () => {
    soundManager.playClick();
    isCorrectRef.current = false;
    setIsCorrect(false);
    setCurrentIndex((prev) => (prev + 1) % SIGN_CHALLENGES.length);
  };

  const handleResetChallenge = () => {
    soundManager.playClick();
    isCorrectRef.current = false;
    setIsCorrect(false);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-indigo-500/30 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Trophy className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Phòng Luyện Tập Ký Hiệu AI (Interactive Arena)
            </h2>
            <p className="text-xs text-indigo-200">
              Thực hành ra hiệu trực tiếp trước camera để AI chấm điểm và rèn luyện kỹ năng giao tiếp khiếm thính!
            </p>
          </div>
        </div>

        {/* Score & Streak Counters */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5 text-xs font-bold">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Streak: {streak}</span>
          </div>

          <div className="bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-md">
            <Star className="w-4 h-4 fill-slate-950" />
            <span>{score} Điểm</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 h-full rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / SIGN_CHALLENGES.length) * 100}%`,
          }}
        />
      </div>

      {/* Challenge Card Content */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center relative">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/30 px-3 py-1 rounded-full mb-3">
          Thử thách {currentIndex + 1} / {SIGN_CHALLENGES.length}
        </span>

        {/* Large Target Emoji */}
        <div className="text-6xl sm:text-7xl my-2 transform hover:scale-110 transition-transform cursor-pointer drop-shadow-lg">
          {targetDef.emoji}
        </div>

        {/* Target Question text */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-white my-1">
          Hãy tạo cử chỉ ký hiệu: {targetDef.emoji} ({targetDef.name})
        </h3>

        <p className="text-xs sm:text-sm text-indigo-200 max-w-md mb-4 font-medium">
          💡 Gợi ý tư thế tay: {target.hint}
        </p>

        {/* Result Feedback Banner */}
        <div className="w-full mt-2">
          {isCorrect ? (
            <div className="bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 p-4 rounded-2xl text-sm font-bold animate-bounce flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>🎉 Xuất sắc! Bạn đã làm chính xác ký hiệu {targetDef.emoji} {targetDef.name}!</span>
            </div>
          ) : (
            <div className="bg-purple-500/20 border border-purple-400/30 text-purple-200 p-3.5 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>
                {isStreaming
                  ? "💡 Hãy đưa bàn tay lên ngang ngực trước camera và giữ nguyên tư thế 1-2 giây."
                  : "Bật camera ở trên để bắt đầu thử thách học Ngôn ngữ ký hiệu cùng AI!"}
              </span>
            </div>
          )}
        </div>

        {/* Challenge Action Controls */}
        <div className="flex items-center gap-3 mt-5 w-full justify-center">
          {isCorrect ? (
            <button
              onClick={handleNextChallenge}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Thử thách tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNextChallenge}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Đổi bài tập khác</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleResetChallenge}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs"
            title="Luyện tập lại từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
