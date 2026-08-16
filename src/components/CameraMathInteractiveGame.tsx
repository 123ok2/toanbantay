import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Calculator,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Hand,
  Flame,
  Star,
  Award,
  Play,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "../utils/soundEffects";
import { RecognitionResult } from "../types";
import {
  MathQuestion,
  MathGradeLevel,
  MASTER_MATH_QUESTION_BANK,
  GRADE_LEVEL_OPTIONS,
  getShuffledQuestionsForGrade,
  getRandomQuestionForGrade,
  generateDynamicQuestion,
} from "../utils/mathQuestionBank";

interface CameraMathInteractiveGameProps {
  currentResult: RecognitionResult | null;
  isStreaming: boolean;
  onStartCamera?: () => void;
}

export const CameraMathInteractiveGame: React.FC<CameraMathInteractiveGameProps> = ({
  currentResult,
  isStreaming,
  onStartCamera,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>("Tất cả");
  const [questionPool, setQuestionPool] = useState<MathQuestion[]>(() => {
    return [...MASTER_MATH_QUESTION_BANK].sort(() => Math.random() - 0.5);
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [autoNextTimer, setAutoNextTimer] = useState<number | null>(null);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(0);
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const [speechOn, setSpeechOn] = useState<boolean>(true);

  const feedbackStateRef = useRef<"idle" | "correct" | "incorrect">("idle");
  const isLockedRef = useRef<boolean>(false);
  const autoNextTimerRef = useRef<number | null>(null);

  // Sync ref
  useEffect(() => {
    feedbackStateRef.current = feedbackState;
  }, [feedbackState]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  // Update and shuffle question pool when grade changes
  useEffect(() => {
    let list: MathQuestion[] = [];
    if (selectedGrade === "Tất cả") {
      list = [...MASTER_MATH_QUESTION_BANK].sort(() => Math.random() - 0.5);
    } else {
      list = getShuffledQuestionsForGrade(selectedGrade as MathGradeLevel);
    }
    setQuestionPool(list);
    setCurrentQuestionIndex(0);
    setFeedbackState("idle");
  }, [selectedGrade]);

  const currentQ = questionPool[currentQuestionIndex % questionPool.length] || MASTER_MATH_QUESTION_BANK[0];
  const currentQRef = useRef(currentQ);
  currentQRef.current = currentQ;

  // Hold time detection for live finger camera detection to prevent accidental triggers
  const lastDetectedFingerRef = useRef<number | null>(null);
  const fingerHoldStartRef = useRef<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const REQUIRED_HOLD_TIME_MS = 900; // Require holding gesture steady for 900ms before accepting answer

  // Handle Correct Answer Event
  const handleCorrectAnswer = useCallback(() => {
    if (isLockedRef.current || feedbackStateRef.current !== "idle") return;
    isLockedRef.current = true;
    fingerHoldStartRef.current = 0;
    lastDetectedFingerRef.current = null;
    setHoldProgress(0);

    const q = currentQRef.current;
    soundManager.playCorrectFeedback(q.correctAnswer, streak);

    // Trigger confetti 🎉
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });

    setFeedbackState("correct");
    setScore((prev) => prev + 10 + streak * 2);
    setStreak((prev) => prev + 1);
    setTotalQuestionsAnswered((prev) => prev + 1);

    // Auto advance to next question after 2.5 seconds
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    autoNextTimerRef.current = window.setTimeout(() => {
      isLockedRef.current = false;
      setFeedbackState("idle");
      setCurrentQuestionIndex((prev) => (prev + 1) % questionPool.length);
      fingerHoldStartRef.current = 0;
      lastDetectedFingerRef.current = null;
      setHoldProgress(0);
    }, 2500);
  }, [streak, questionPool.length]);

  // Monitor currentResult from camera with stability checking
  const resultTimestamp = currentResult?.timestamp;
  const isHandDetected = currentResult?.handDetected;
  const detectedFingerCount = currentResult?.fingerCount ?? -1;
  const detectedGesture = currentResult?.gestureId;

  useEffect(() => {
    if (!isStreaming || feedbackStateRef.current !== "idle" || isLockedRef.current || !isHandDetected) {
      fingerHoldStartRef.current = 0;
      setHoldProgress(0);
      return;
    }

    const targetAnswer = currentQ.correctAnswer;

    // Check if detected fingers or gesture matches the target answer
    const isDirectCountMatch = detectedFingerCount === targetAnswer;
    const isSpecialGestureMatch =
      (targetAnswer === 0 && (detectedGesture === "fist" || detectedGesture === "number_0")) ||
      (targetAnswer === 1 && (detectedGesture === "point_up" || detectedGesture === "number_1" || detectedGesture === "thumbs_up")) ||
      (targetAnswer === 2 && (detectedGesture === "letter_v" || detectedGesture === "number_2" || detectedGesture === "letter_l")) ||
      (targetAnswer === 3 && detectedGesture === "number_3") ||
      (targetAnswer === 4 && detectedGesture === "number_4") ||
      (targetAnswer === 5 && (detectedGesture === "open_palm" || detectedGesture === "number_5")) ||
      (targetAnswer === 6 && (detectedGesture === "letter_y" || detectedGesture === "number_6")) ||
      (targetAnswer === 7 && (detectedGesture === "letter_l" || detectedGesture === "number_7")) ||
      (targetAnswer === 8 && (detectedGesture === "love_you" || detectedGesture === "number_8")) ||
      (targetAnswer === 10 && detectedGesture === "number_10");

    const isMatchingAnswer = isDirectCountMatch || isSpecialGestureMatch;

    const now = Date.now();
    if (isMatchingAnswer) {
      if (lastDetectedFingerRef.current !== detectedFingerCount) {
        lastDetectedFingerRef.current = detectedFingerCount;
        fingerHoldStartRef.current = now;
        setHoldProgress(15);
      } else {
        const holdDuration = now - fingerHoldStartRef.current;
        const progress = Math.min(100, Math.round((holdDuration / REQUIRED_HOLD_TIME_MS) * 100));
        setHoldProgress(progress);

        if (progress >= 100) {
          handleCorrectAnswer();
        }
      }
    } else {
      lastDetectedFingerRef.current = detectedFingerCount;
      fingerHoldStartRef.current = 0;
      setHoldProgress(0);
    }
  }, [
    resultTimestamp,
    isStreaming,
    isHandDetected,
    detectedFingerCount,
    detectedGesture,
    currentQ.correctAnswer,
    handleCorrectAnswer,
  ]);

  // Manual button check (for testing without camera)
  const handleManualAnswer = (answerNum: number) => {
    soundManager.playClick();
    if (answerNum === currentQ.correctAnswer) {
      handleCorrectAnswer();
    } else {
      soundManager.playIncorrectBuzzer();
      soundManager.speakText(`Chưa đúng rồi! Hãy đếm lại xem sao nhé.`);
      setFeedbackState("incorrect");
      setStreak(0);
      setTimeout(() => {
        setFeedbackState("idle");
      }, 1500);
    }
  };

  const handleNextQuestion = () => {
    soundManager.playClick();
    if (autoNextTimer) clearTimeout(autoNextTimer);
    setFeedbackState("idle");
    setCurrentQuestionIndex((prev) => (prev + 1) % questionPool.length);
    fingerHoldStartRef.current = 0;
    lastDetectedFingerRef.current = null;
    setHoldProgress(0);
  };

  const handleRandomQuestion = () => {
    soundManager.playClick();
    if (autoNextTimer) clearTimeout(autoNextTimer);
    setFeedbackState("idle");
    if (questionPool.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * questionPool.length);
    if (nextIdx === currentQuestionIndex) {
      nextIdx = (nextIdx + 1) % questionPool.length;
    }
    setCurrentQuestionIndex(nextIdx);
    fingerHoldStartRef.current = 0;
    lastDetectedFingerRef.current = null;
    setHoldProgress(0);
  };

  const handleGenerateDynamic = () => {
    soundManager.playClick();
    if (autoNextTimer) clearTimeout(autoNextTimer);
    setFeedbackState("idle");
    const targetGrade =
      selectedGrade === "Tất cả"
        ? (["Lớp 1 - 2", "Lớp 3 - 5", "Lớp 6 (THCS)", "Lớp 7 (THCS)", "Lớp 8 - 9 (THCS)"][
            Math.floor(Math.random() * 5)
          ] as MathGradeLevel)
        : (selectedGrade as MathGradeLevel);

    const newQ = generateDynamicQuestion(targetGrade);
    setQuestionPool((prev) => [newQ, ...prev]);
    setCurrentQuestionIndex(0);
    fingerHoldStartRef.current = 0;
    lastDetectedFingerRef.current = null;
    setHoldProgress(0);
  };

  const handleResetGame = () => {
    soundManager.playClick();
    if (autoNextTimer) clearTimeout(autoNextTimer);
    setScore(0);
    setStreak(0);
    setFeedbackState("idle");
    setCurrentQuestionIndex(0);
    setTotalQuestionsAnswered(0);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-2xl p-2.5 sm:p-4 text-white shadow-xl border border-indigo-500/30 my-1 sm:my-3 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar & Quick Stats (Compact & Mobile-Optimized) */}
      <div className="flex flex-col gap-1.5 sm:gap-2.5 mb-2 sm:mb-3 relative z-10 border-b border-white/10 pb-2">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Calculator className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-lg font-black text-white leading-tight">
                  Đấu Trường Toán Bàn Tay AI
                </h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Stats Pills & Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
            <div className="bg-white/10 px-2 py-0.5 sm:py-1 rounded-xl border border-white/10 text-center flex items-center gap-1">
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span className="text-xs font-black text-amber-300">{score}</span>
            </div>

            <div className="bg-white/10 px-2 py-0.5 sm:py-1 rounded-xl border border-white/10 text-center flex items-center gap-1">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 fill-orange-400" />
              <span className="text-xs font-black text-orange-400">{streak}</span>
            </div>

            <button
              onClick={handleResetGame}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
              title="Chơi lại từ đầu"
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Test Sound & Voice Feedback Button */}
            <button
              onClick={() => {
                if (isTestingSound) return;
                setIsTestingSound(true);
                soundManager.playCorrectFeedback(currentQ.correctAnswer, 1);
                setTimeout(() => setIsTestingSound(false), 1600);
              }}
              className={`px-2 py-1 rounded-xl border text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs min-h-[30px] ${
                isTestingSound
                  ? "bg-amber-400 text-slate-950 border-amber-300 scale-105"
                  : "bg-indigo-600/60 hover:bg-indigo-600 text-white border-indigo-400/40"
              }`}
              title="Nhấn để nghe thử giọng phát âm chuẩn tiếng Việt"
            >
              <Volume2 className={`w-3 h-3 ${isTestingSound ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">
                {isTestingSound ? "Đang phát..." : "Thử âm thanh"}
              </span>
            </button>
          </div>
        </div>

        {/* Grade Selector Tabs (Horizontally scrollable on Mobile) */}
        <div className="w-full overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex items-center bg-white/5 p-0.5 sm:p-1 rounded-xl border border-white/10 gap-1 min-w-max">
            {(
              [
                "Tất cả",
                "Lớp 1 - 2",
                "Lớp 3 - 5",
                "Lớp 6 (THCS)",
                "Lớp 7 (THCS)",
                "Lớp 8 - 9 (THCS)",
              ] as const
            ).map((grade) => (
              <button
                key={grade}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedGrade(grade);
                  setCurrentQuestionIndex(0);
                }}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap min-h-[28px] ${
                  selectedGrade === grade
                    ? "bg-amber-400 text-slate-950 shadow-xs scale-105"
                    : "text-indigo-200 hover:bg-white/10"
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QUESTION DISPLAY BOARD (Ultra-Compact) */}
      <div className="bg-gradient-to-br from-slate-900/90 via-indigo-900/40 to-slate-900/90 border border-indigo-400/30 rounded-2xl p-2.5 sm:p-4 text-center relative z-10 shadow-lg">
        {/* Question Counter Header, Topic & Live Camera Status */}
        <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">
              <span>Câu {currentQuestionIndex + 1}/{questionPool.length}</span>
              <span className="text-amber-300">({currentQ.gradeLevel})</span>
            </div>

            {currentQ.topic && (
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                {currentQ.topic}
              </span>
            )}

            {currentQ.difficulty && (
              <span
                className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                  currentQ.difficulty === "Dễ"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : currentQ.difficulty === "Trung bình"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                }`}
              >
                {currentQ.difficulty}
              </span>
            )}
          </div>

          {/* Live Camera Scanner Status */}
          {isStreaming ? (
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Camera nhận diện: <strong className="text-amber-300">{currentResult ? `${currentResult.fingerCount} ngón` : "0 ngón"}</strong></span>
            </div>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                if (onStartCamera) onStartCamera();
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <Play className="w-2.5 h-2.5 fill-slate-950" />
              <span>Bật Cam 📷</span>
            </button>
          )}
        </div>

        {/* Compact Formula & Analogy in one row */}
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 my-1.5 sm:my-3 flex-wrap">
          <div className="text-2xl sm:text-5xl font-black text-white tracking-wider font-mono drop-shadow-sm">
            {currentQ.problemStr}
          </div>

          <div className="text-[11px] sm:text-sm font-bold text-amber-300 bg-white/5 py-1 px-2.5 rounded-xl border border-white/10">
            {currentQ.emojiAnalogy}
          </div>
        </div>

        {/* Feedback State (Compact) */}
        {feedbackState === "correct" && (
          <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 py-1.5 px-3 rounded-xl my-1.5 animate-bounce max-w-sm mx-auto text-xs sm:text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-extrabold text-emerald-300">CHÍNH XÁC! 🎉 {currentQ.explanation}</span>
          </div>
        )}

        {feedbackState === "incorrect" && (
          <div className="bg-rose-500/20 border border-rose-400 text-rose-200 py-1.5 px-3 rounded-xl my-1.5 animate-pulse max-w-sm mx-auto text-xs sm:text-sm flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold text-rose-300">Chưa đúng rồi! Hãy đếm lại số ngón tay nhé!</span>
          </div>
        )}

        {/* Interactive Instruction Banner & Quick Buttons */}
        <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5 text-[10px] sm:text-xs text-indigo-200">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1 text-amber-300 font-bold">
              <Hand className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span>
                💡 Hướng dẫn: Tính nhẩm và <strong className="text-white underline">GIỮ YÊN bàn tay</strong> trước camera hoặc chạm số:
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleRandomQuestion}
                className="text-[10px] sm:text-xs font-bold text-amber-200 hover:text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-1 rounded-xl border border-amber-400/30 cursor-pointer transition-all min-h-[28px] flex items-center gap-1"
                title="Chọn một câu hỏi ngẫu nhiên trong kho đề"
              >
                <span>🎲 Đổi ngẫu nhiên</span>
              </button>

              <button
                onClick={handleGenerateDynamic}
                className="text-[10px] sm:text-xs font-bold text-cyan-200 hover:text-cyan-100 bg-cyan-500/20 hover:bg-cyan-500/30 px-2 py-1 rounded-xl border border-cyan-400/30 cursor-pointer transition-all min-h-[28px] flex items-center gap-1"
                title="Tạo đề toán ngẫu nhiên mới"
              >
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span className="hidden sm:inline">Tạo mới</span>
              </button>

              <button
                onClick={handleNextQuestion}
                className="text-[10px] sm:text-xs font-bold text-indigo-200 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-xl border border-white/10 cursor-pointer transition-all min-h-[28px]"
              >
                <span>Kế tiếp</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Realtime Hold Progress on Screen */}
          {isStreaming && isHandDetected && holdProgress > 0 && feedbackState === "idle" && (
            <div className="w-full bg-slate-950/80 p-1.5 rounded-xl border border-indigo-400/30 flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-300 shrink-0">
                🎯 Giữ yên: {holdProgress}%
              </span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-75 ease-out"
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Answer Buttons (Mobile Touch Grid 0 to 10) */}
        <div className="mt-2 flex flex-wrap justify-center gap-1 sm:gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => handleManualAnswer(num)}
              className={`w-7 h-7 sm:w-10 sm:h-10 min-w-[28px] min-h-[28px] rounded-lg font-black text-xs sm:text-sm border transition-all cursor-pointer shadow-xs flex items-center justify-center ${
                num === currentQ.correctAnswer && feedbackState === "correct"
                  ? "bg-emerald-500 text-slate-950 border-emerald-300 scale-110"
                  : "bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-white border-white/20 active:scale-95"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
