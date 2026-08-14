import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Calculator,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
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

interface CameraMathInteractiveGameProps {
  currentResult: RecognitionResult | null;
  isStreaming: boolean;
  onStartCamera?: () => void;
}

interface MathQuestion {
  id: string;
  problemStr: string;
  correctAnswer: number;
  emojiAnalogy: string;
  explanation: string;
  gradeLevel: "Lớp 1 - 2" | "Lớp 3 - 5" | "Lớp 6 (THCS)" | "Lớp 7 (THCS)" | "Lớp 8 - 9 (THCS)";
}

// Preset Math Question Bank for Finger-Counting Game (0 to 10 answers)
const MATH_QUESTION_BANK: MathQuestion[] = [
  // --- TIỂU HỌC (LỚP 1 - 2 & 3 - 5) ---
  {
    id: "q1",
    problemStr: "2 + 3 = ?",
    correctAnswer: 5,
    emojiAnalogy: "🍎🍎 + 🍎🍎🍎 = 🍎🍎🍎🍎🍎",
    explanation: "2 quả táo cộng thêm 3 quả táo bằng 5 quả táo!",
    gradeLevel: "Lớp 1 - 2",
  },
  {
    id: "q2",
    problemStr: "4 + 3 = ?",
    correctAnswer: 7,
    emojiAnalogy: "⭐ ⭐ ⭐ ⭐ + ⭐ ⭐ ⭐ = 7 ⭐",
    explanation: "4 ngôi sao thêm 3 ngôi sao là 7 ngôi sao!",
    gradeLevel: "Lớp 1 - 2",
  },
  {
    id: "q3",
    problemStr: "8 - 2 = ?",
    correctAnswer: 6,
    emojiAnalogy: "🎈🎈🎈🎈🎈🎈🎈🎈 bớt đi 2 🎈🎈 = 6 🎈",
    explanation: "8 bóng bay bớt đi 2 bóng bay còn lại 6 bóng bay!",
    gradeLevel: "Lớp 1 - 2",
  },
  {
    id: "q4",
    problemStr: "5 + 5 = ?",
    correctAnswer: 10,
    emojiAnalogy: "✋ (5 ngón) + ✋ (5 ngón) = 🔟 (10 ngón)",
    explanation: "Xòe rộng 2 bàn tay mỗi bên 5 ngón thành 10 ngón tay!",
    gradeLevel: "Lớp 1 - 2",
  },
  {
    id: "q5",
    problemStr: "2 x 4 = ?",
    correctAnswer: 8,
    emojiAnalogy: "2 x 4 = 4 + 4 = 8 🍪",
    explanation: "2 nhóm, mỗi nhóm có 4 chiếc bánh là 8 chiếc bánh!",
    gradeLevel: "Lớp 1 - 2",
  },
  {
    id: "q6",
    problemStr: "3 x 3 = ?",
    correctAnswer: 9,
    emojiAnalogy: "3 x 3 = 3 + 3 + 3 = 9 🚀",
    explanation: "3 lần số 3 bằng 9!",
    gradeLevel: "Lớp 1 - 2",
  },
  {
    id: "q_elem_1",
    problemStr: "36 : 4 = ?",
    correctAnswer: 9,
    emojiAnalogy: "36 chiếc kẹo chia đều cho 4 bạn = 9 chiếc 🍬",
    explanation: "Phép chia: 36 chia cho 4 bằng 9!",
    gradeLevel: "Lớp 3 - 5",
  },
  {
    id: "q_elem_2",
    problemStr: "56 : 8 = ?",
    correctAnswer: 7,
    emojiAnalogy: "7 x 8 = 56 ➡️ 56 : 8 = 7 🎯",
    explanation: "56 chia 8 bằng 7 vì 7 nhân 8 bằng 56!",
    gradeLevel: "Lớp 3 - 5",
  },
  {
    id: "q_elem_3",
    problemStr: "1/2 của 16 = ?",
    correctAnswer: 8,
    emojiAnalogy: "16 quả cam chia đôi = 8 quả 🍊",
    explanation: "Một nửa (1/2) của 16 là 16 : 2 = 8!",
    gradeLevel: "Lớp 3 - 5",
  },

  // --- TRUNG HỌC CƠ SỞ (LỚP 6: TẬP HỢP, SỐ NGUYÊN, TÌM X, LŨY THỪA, ƯCLN - BCNN) ---
  {
    id: "q_thcs_6_1",
    problemStr: "Tìm x: 2x - 4 = 6",
    correctAnswer: 5,
    emojiAnalogy: "2x = 6 + 4 = 10 ➡️ x = 10 : 2 = 5 💡",
    explanation: "Chuyển vế: 2x = 6 + 4 = 10. Do đó x = 10 : 2 = 5!",
    gradeLevel: "Lớp 6 (THCS)",
  },
  {
    id: "q_thcs_6_2",
    problemStr: "Tính số nguyên: 10 + (-3) = ?",
    correctAnswer: 7,
    emojiAnalogy: "Cộng số nguyên khác dấu: 10 - 3 = 7 ⚖️",
    explanation: "Cộng hai số nguyên khác dấu: lấy số lớn trừ số bé, mang dấu dương = 7.",
    gradeLevel: "Lớp 6 (THCS)",
  },
  {
    id: "q_thcs_6_3",
    problemStr: "Lũy thừa: 2³ = ?",
    correctAnswer: 8,
    emojiAnalogy: "2³ = 2 x 2 x 2 = 8 ⚡",
    explanation: "2 mũ 3 là tích của 3 thừa số 2: 2 x 2 x 2 = 8!",
    gradeLevel: "Lớp 6 (THCS)",
  },
  {
    id: "q_thcs_6_4",
    problemStr: "ƯCLN(12, 16) = ?",
    correctAnswer: 4,
    emojiAnalogy: "Ư(12) ∩ Ư(16) lớn nhất là 4 🧩",
    explanation: "12 = 2² x 3; 16 = 2⁴. Ước chung lớn nhất là 2² = 4!",
    gradeLevel: "Lớp 6 (THCS)",
  },
  {
    id: "q_thcs_6_5",
    problemStr: "BCNN(2, 3) = ?",
    correctAnswer: 6,
    emojiAnalogy: "Bội chung nhỏ nhất của 2 và 3 là 6 🔄",
    explanation: "Vì 2 và 3 là hai số nguyên tố cùng nhau, BCNN(2, 3) = 2 x 3 = 6!",
    gradeLevel: "Lớp 6 (THCS)",
  },
  {
    id: "q_thcs_6_6",
    problemStr: "Tính: 3² - 2⁰ = ?",
    correctAnswer: 8,
    emojiAnalogy: "3² = 9; 2⁰ = 1 ➡️ 9 - 1 = 8 📐",
    explanation: "3 bình phương bằng 9, bất kỳ số nào khác 0 mũ 0 đều bằng 1: 9 - 1 = 8.",
    gradeLevel: "Lớp 6 (THCS)",
  },
  {
    id: "q_thcs_6_7",
    problemStr: "Tìm x: 3x + 1 = 10",
    correctAnswer: 3,
    emojiAnalogy: "3x = 10 - 1 = 9 ➡️ x = 9 : 3 = 3 ✏️",
    explanation: "3x = 9, vậy x = 3!",
    gradeLevel: "Lớp 6 (THCS)",
  },

  // --- TRUNG HỌC CƠ SỞ (LỚP 7: CĂN BẬC HAI, TỈ LỆ THỨC, GIÁ TRỊ TUYỆT ĐỐI, PYTHAGORAS) ---
  {
    id: "q_thcs_7_1",
    problemStr: "Căn bậc hai: √49 = ?",
    correctAnswer: 7,
    emojiAnalogy: "√49 = 7 vì 7² = 49 🌿",
    explanation: "Căn bậc hai số học của 49 là 7 (vì 7 > 0 và 7 x 7 = 49).",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_2",
    problemStr: "Căn bậc hai: √64 = ?",
    correctAnswer: 8,
    emojiAnalogy: "√64 = 8 vì 8² = 64 💎",
    explanation: "Căn bậc hai số học của 64 là 8 (8 x 8 = 64).",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_3",
    problemStr: "Tính căn bậc hai: √81 = ?",
    correctAnswer: 9,
    emojiAnalogy: "√81 = 9 vì 9² = 81 🌟",
    explanation: "Căn bậc hai số học của 81 là 9!",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_4",
    problemStr: "Giá trị tuyệt đối: |-6| = ?",
    correctAnswer: 6,
    emojiAnalogy: "Khoảng cách từ -6 đến 0 trên trục số là 6 📏",
    explanation: "Giá trị tuyệt đối của một số âm bằng số đối của nó: |-6| = 6.",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_5",
    problemStr: "Tìm x: x/4 = 6/8",
    correctAnswer: 3,
    emojiAnalogy: "x = (4 x 6) : 8 = 24 : 8 = 3 ⚖️",
    explanation: "Tỉ lệ thức: x = (4 x 6) / 8 = 24 / 8 = 3.",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_6",
    problemStr: "Bậc của đơn thức: 5x²y³",
    correctAnswer: 5,
    emojiAnalogy: "Bậc = tổng số mũ của biến = 2 + 3 = 5 📊",
    explanation: "Bậc của đơn thức bằng tổng số mũ của các biến: 2 + 3 = 5.",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_7",
    problemStr: "Pythagoras: Cạnh huyền Δ vuông 3 & 4 là?",
    correctAnswer: 5,
    emojiAnalogy: "c = √(3² + 4²) = √(9 + 16) = √25 = 5 📐",
    explanation: "Định lý Pythagoras: c² = a² + b² = 3² + 4² = 25 ➡️ c = 5.",
    gradeLevel: "Lớp 7 (THCS)",
  },

  // --- TRUNG HỌC CƠ SỞ (LỚP 8 - 9: PHƯƠNG TRÌNH BẬC NHẤT & BẬC HAI, HẰNG ĐẲNG THỨC, HÌNH HỌC) ---
  {
    id: "q_thcs_8_1",
    problemStr: "Giải PT: 4x - 8 = 12",
    correctAnswer: 5,
    emojiAnalogy: "4x = 12 + 8 = 20 ➡️ x = 20 : 4 = 5 🎯",
    explanation: "Chuyển vế đổi dấu: 4x = 20 ➡️ x = 5.",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_2",
    problemStr: "Giải PT: 5x + 3 = 2x + 15",
    correctAnswer: 4,
    emojiAnalogy: "5x - 2x = 15 - 3 ➡️ 3x = 12 ➡️ x = 4 ⚡",
    explanation: "Chuyển x sang vế trái: 3x = 12 ➡️ x = 4.",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_3",
    problemStr: "Nghiệm dương của: x² = 36",
    correctAnswer: 6,
    emojiAnalogy: "x = √36 = 6 (vì 6 x 6 = 36) 🗝️",
    explanation: "Phương trình x² = 36 có 2 nghiệm là x = 6 và x = -6. Nghiệm dương là 6!",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_4",
    problemStr: "Hệ PT: x + y = 10 và x - y = 6. Tìm x?",
    correctAnswer: 8,
    emojiAnalogy: "Cộng 2 vế: 2x = 16 ➡️ x = 8 🤝",
    explanation: "Cộng hai phương trình vế theo vế: (x + y) + (x - y) = 10 + 6 ➡️ 2x = 16 ➡️ x = 8.",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_5",
    problemStr: "Tính: √100 - √16 = ?",
    correctAnswer: 6,
    emojiAnalogy: "10 - 4 = 6 🌟",
    explanation: "Căn thức: √100 = 10 và √16 = 4. Do đó 10 - 4 = 6!",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_6",
    problemStr: "Hình bát giác đều có mấy cạnh?",
    correctAnswer: 8,
    emojiAnalogy: "Bát giác (Octagon) = 8 cạnh 🛑",
    explanation: "Bát giác là hình đa giác có đúng 8 cạnh và 8 góc.",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_7",
    problemStr: "Giá trị (x - 1)² tại x = 4",
    correctAnswer: 9,
    emojiAnalogy: "(4 - 1)² = 3² = 9 🧮",
    explanation: "Thay x = 4 vào: (4 - 1)² = 3² = 9!",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
];

export const CameraMathInteractiveGame: React.FC<CameraMathInteractiveGameProps> = ({
  currentResult,
  isStreaming,
  onStartCamera,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<
    "Tất cả" | "Lớp 1 - 2" | "Lớp 3 - 5" | "Lớp 6 (THCS)" | "Lớp 7 (THCS)" | "Lớp 8 - 9 (THCS)"
  >("Tất cả");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [autoNextTimer, setAutoNextTimer] = useState<number | null>(null);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(0);

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

  // Filter questions based on grade
  const filteredQuestions = MATH_QUESTION_BANK.filter(
    (q) => selectedGrade === "Tất cả" || q.gradeLevel === selectedGrade
  );

  const currentQ = filteredQuestions[currentQuestionIndex % filteredQuestions.length];
  const currentQRef = useRef(currentQ);
  currentQRef.current = currentQ;

  // Hold time detection for live finger camera detection to prevent accidental triggers
  const lastDetectedFingerRef = useRef<number | null>(null);
  const fingerHoldTimeRef = useRef<number>(0);

  // Handle Correct Answer Event
  const handleCorrectAnswer = useCallback(() => {
    if (isLockedRef.current || feedbackStateRef.current !== "idle") return;
    isLockedRef.current = true;
    fingerHoldTimeRef.current = 0;
    lastDetectedFingerRef.current = null;

    const q = currentQRef.current;
    soundManager.playSuccessChime();
    soundManager.speakText(`Chính xác! ${q.problemStr} bằng ${q.correctAnswer}`);

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
      setCurrentQuestionIndex((prev) => (prev + 1) % filteredQuestions.length);
      fingerHoldTimeRef.current = 0;
      lastDetectedFingerRef.current = null;
    }, 2500);
  }, [streak, filteredQuestions.length]);

  // Monitor currentResult from camera
  const resultTimestamp = currentResult?.timestamp;
  const isHandDetected = currentResult?.handDetected;
  const detectedFingerCount = currentResult?.fingerCount ?? -1;
  const detectedGesture = currentResult?.gestureId;

  useEffect(() => {
    if (!isStreaming || feedbackStateRef.current !== "idle" || isLockedRef.current || !isHandDetected) {
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

    if (isDirectCountMatch || isSpecialGestureMatch) {
      handleCorrectAnswer();
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
    setCurrentQuestionIndex((prev) => (prev + 1) % filteredQuestions.length);
    fingerHoldTimeRef.current = 0;
    lastDetectedFingerRef.current = null;
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
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-2xl p-3.5 sm:p-4 text-white shadow-xl border border-indigo-500/30 my-3 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar & Quick Stats (Compact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 relative z-10 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center text-slate-950 shadow-md">
            <Calculator className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Đấu Trường Toán Bàn Tay AI
              </h2>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                Trả lời qua Camera
              </span>
            </div>
            <p className="text-[11px] text-indigo-200">
              Nhìn đề &rarr; Xòe đúng số ngón tay trước camera &rarr; AI tự động chấm điểm!
            </p>
          </div>
        </div>

        {/* Level Selector & Score/Streak Stats */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Level Tabs */}
          <div className="flex items-center flex-wrap bg-white/5 p-0.5 rounded-xl border border-white/10 gap-0.5">
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
                className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedGrade === grade
                    ? "bg-amber-400 text-slate-950 shadow-xs scale-105"
                    : "text-indigo-200 hover:bg-white/10"
                }`}
              >
                {grade}
              </button>
            ))}
          </div>

          {/* Stats Pills */}
          <div className="flex items-center gap-1.5">
            <div className="bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 text-center flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-black text-amber-300">{score}</span>
            </div>

            <div className="bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 text-center flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-bounce" />
              <span className="text-xs font-black text-orange-400">{streak}</span>
            </div>

            <button
              onClick={handleResetGame}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
              title="Chơi lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* QUESTION DISPLAY BOARD (Ultra-Compact) */}
      <div className="bg-gradient-to-br from-slate-900/90 via-indigo-900/40 to-slate-900/90 border border-indigo-400/30 rounded-2xl p-3.5 sm:p-4 text-center relative z-10 shadow-lg">
        {/* Question Counter Header & Live Camera Status */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <span>Câu {currentQuestionIndex + 1}/{filteredQuestions.length}</span>
            <span className="text-amber-300">({currentQ.gradeLevel})</span>
          </div>

          {/* Live Camera Scanner Status */}
          {isStreaming ? (
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Camera nhận diện: <strong className="text-amber-300">{currentResult ? `${currentResult.fingerCount} ngón` : "0 ngón"}</strong></span>
            </div>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                if (onStartCamera) onStartCamera();
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <Play className="w-3 h-3 fill-slate-950" />
              <span>Bật Camera để trả lời 📷</span>
            </button>
          )}
        </div>

        {/* Compact Formula & Analogy in one row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 my-2">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-wider font-mono drop-shadow-sm">
            {currentQ.problemStr}
          </div>

          <div className="text-xs sm:text-sm font-bold text-amber-300 bg-white/5 py-1 px-3 rounded-xl border border-white/10">
            {currentQ.emojiAnalogy}
          </div>
        </div>

        {/* Feedback State (Compact) */}
        {feedbackState === "correct" && (
          <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 py-1.5 px-3 rounded-xl my-2 animate-bounce max-w-sm mx-auto text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-extrabold text-emerald-300">CHÍNH XÁC! 🎉 {currentQ.explanation}</span>
          </div>
        )}

        {feedbackState === "incorrect" && (
          <div className="bg-rose-500/20 border border-rose-400 text-rose-200 py-1.5 px-3 rounded-xl my-2 animate-pulse max-w-sm mx-auto text-xs flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold text-rose-300">Chưa đúng rồi! Hãy đếm lại số ngón tay nhé!</span>
          </div>
        )}

        {/* Interactive Instruction Banner & Quick Buttons */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px] text-indigo-200">
          <div className="flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span>
              Giơ đúng <strong className="text-amber-300">{currentQ.correctAnswer} ngón tay</strong> trước camera hoặc bấm chọn:
            </span>
          </div>

          <button
            onClick={handleNextQuestion}
            className="text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 cursor-pointer shrink-0 transition-all"
          >
            <span>Đổi câu khác</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Answer Buttons (Compact 0 to 10) */}
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => handleManualAnswer(num)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs border transition-all cursor-pointer shadow-xs flex items-center justify-center ${
                num === currentQ.correctAnswer && feedbackState === "correct"
                  ? "bg-emerald-500 text-slate-950 border-emerald-300 scale-110"
                  : "bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-white border-white/20"
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
