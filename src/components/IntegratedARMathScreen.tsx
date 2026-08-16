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
  Video,
  VideoOff,
  SwitchCamera,
  Layers,
  Check,
  RefreshCw,
  AlertCircle,
  Eye,
  Settings2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { classifyMultipleHands, analyzeSingleHandFingers } from "../utils/gestureClassifier";
import { GESTURE_DICTIONARY } from "../utils/gestureDictionary";
import { RecognitionResult } from "../types";
import { soundManager } from "../utils/soundEffects";

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
    emojiAnalogy: "3² = 9, 2⁰ = 1 ➡️ 9 - 1 = 8 🔢",
    explanation: "3 mũ 2 bằng 9, 2 mũ 0 bằng 1. Kết quả là 9 - 1 = 8!",
    gradeLevel: "Lớp 6 (THCS)",
  },

  // --- TRUNG HỌC CƠ SỞ (LỚP 7: SỐ HỮU TỈ, TỈ LỆ THỨC, CĂN BẬC HAI) ---
  {
    id: "q_thcs_7_1",
    problemStr: "Căn bậc hai: √49 = ?",
    correctAnswer: 7,
    emojiAnalogy: "7² = 49 ➡️ √49 = 7 📐",
    explanation: "Căn bậc hai số học của 49 là 7 vì 7 > 0 và 7² = 49!",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_2",
    problemStr: "Căn bậc hai: √81 = ?",
    correctAnswer: 9,
    emojiAnalogy: "9 x 9 = 81 ➡️ √81 = 9 🎯",
    explanation: "Căn bậc hai số học của 81 là 9 vì 9² = 81!",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_3",
    problemStr: "Tìm x: x/2 = 6/4",
    correctAnswer: 3,
    emojiAnalogy: "Tỉ lệ thức: 4x = 12 ➡️ x = 3 ⚖️",
    explanation: "Áp dụng tính chất tỉ lệ thức: x = (2 x 6) : 4 = 12 : 4 = 3!",
    gradeLevel: "Lớp 7 (THCS)",
  },
  {
    id: "q_thcs_7_4",
    problemStr: "Giá trị tuyệt đối: |-6| = ?",
    correctAnswer: 6,
    emojiAnalogy: "|-6| = 6 (Khoảng cách đến số 0) 📏",
    explanation: "Giá trị tuyệt đối của số âm -6 là số đối của nó: 6!",
    gradeLevel: "Lớp 7 (THCS)",
  },

  // --- TRUNG HỌC CƠ SỞ (LỚP 8 - 9: HẰNG ĐẲNG THỨC, HỆ PHƯƠNG TRÌNH, HÌNH HỌC) ---
  {
    id: "q_thcs_8_1",
    problemStr: "Cạnh huyền tam giác vuông (3, 4) = ?",
    correctAnswer: 5,
    emojiAnalogy: "Định lý Pythagore: √(3² + 4²) = √25 = 5 📐",
    explanation: "Theo định lý Pythagore: √(9 + 16) = √25 = 5!",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_2",
    problemStr: "Căn bậc hai: √100 = ?",
    correctAnswer: 10,
    emojiAnalogy: "10² = 100 ➡️ √100 = 10 💯",
    explanation: "Căn bậc hai của 100 bằng 10!",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_3",
    problemStr: "Tìm x: x² = 16 (x > 0)",
    correctAnswer: 4,
    emojiAnalogy: "4² = 16 ➡️ x = 4 🔑",
    explanation: "Vì x > 0 và x² = 16 nên x = √16 = 4!",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
  {
    id: "q_thcs_8_4",
    problemStr: "Tính: (√5)² + 2 = ?",
    correctAnswer: 7,
    emojiAnalogy: "(√5)² = 5 ➡️ 5 + 2 = 7 🌟",
    explanation: "Bình phương của căn bậc hai √5 là 5; 5 + 2 = 7!",
    gradeLevel: "Lớp 8 - 9 (THCS)",
  },
];

interface IntegratedARMathScreenProps {
  isStreaming: boolean;
  setIsStreaming: (s: boolean) => void;
  onGestureDetected?: (res: RecognitionResult) => void;
  useGemini?: boolean;
}

export const IntegratedARMathScreen: React.FC<IntegratedARMathScreenProps> = ({
  isStreaming,
  setIsStreaming,
  onGestureDetected,
  useGemini = false,
}) => {
  // Video and Canvas Refs for Live MediaPipe
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const lastEmitTimeRef = useRef<number>(0);
  const lastHandCountRef = useRef<number>(0);

  // States
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [fps, setFps] = useState<number>(0);

  // Math State
  const [selectedGrade, setSelectedGrade] = useState<string>("Tất cả");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(0);
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<"math" | "free">("math");

  // Recognition state & Hand Stability Tracking
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHandMoving, setIsHandMoving] = useState<boolean>(false);

  // Hand stability refs
  const prevHandPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const stableFingerCountRef = useRef<number | null>(null);
  const stableHoldStartRef = useRef<number>(0);
  const REQUIRED_HOLD_TIME_MS = 950; // 950ms stable pose hold required before validating answer
  const MOTION_THRESHOLD = 0.035; // Normalized displacement threshold for hand movement detection

  // Filter questions based on grade
  const filteredQuestions =
    selectedGrade === "Tất cả"
      ? MATH_QUESTION_BANK
      : MATH_QUESTION_BANK.filter((q) => q.gradeLevel === selectedGrade);

  const currentQ = filteredQuestions[currentQuestionIndex % filteredQuestions.length] || MATH_QUESTION_BANK[0];

  // Initialize MediaPipe
  useEffect(() => {
    let isSubscribed = true;

    async function initMediaPipe() {
      try {
        setIsModelLoading(true);
        setModelError(null);

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (!isSubscribed) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (isSubscribed) {
          landmarkerRef.current = landmarker;
          setIsModelLoading(false);
        }
      } catch (err: any) {
        console.error("Lỗi khi nạp mô hình MediaPipe:", err);
        if (isSubscribed) {
          setModelError("Không thể tải mô hình MediaPipe. Hãy kiểm tra kết nối mạng.");
          setIsModelLoading(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isSubscribed = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  // Camera Management
  const startCamera = useCallback(async (targetFacing?: "user" | "environment") => {
    setHasPermissionError(null);
    const facing = targetFacing || facingMode;
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: facing,
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
          soundManager.playSuccessChime();
        };
      }
    } catch (err: any) {
      console.error("Không thể mở Camera:", err);
      setHasPermissionError(
        err.name === "NotAllowedError"
          ? "Bạn chưa cấp quyền truy cập Camera trên trình duyệt."
          : "Không tìm thấy hoặc không thể mở Camera thiết bị."
      );
      setIsStreaming(false);
    }
  }, [facingMode, setIsStreaming]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    setIsStreaming(false);
    setCurrentResult(null);
  }, [setIsStreaming]);

  const handleFlipCamera = () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    if (isStreaming) {
      startCamera(nextFacing);
    }
  };

  // Switch to next math question
  const handleNextQuestion = useCallback(() => {
    soundManager.playClick();
    setFeedbackState("idle");
    setCurrentQuestionIndex((prev) => (prev + 1) % filteredQuestions.length);
  }, [filteredQuestions.length]);

  // Answer validation trigger
  const handleValidateAnswer = useCallback((answerNumber: number) => {
    const now = Date.now();
    if (now - lastAnswerTime < 1400) return; // Prevent double spam

    if (answerNumber === currentQ.correctAnswer) {
      setFeedbackState("correct");
      setLastAnswerTime(now);
      setScore((prev) => prev + 100);
      setStreak((prev) => prev + 1);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#10B981", "#F59E0B", "#6366F1", "#EC4899"],
        });
      } catch (e) {}

      // Play audio & voice explanation
      soundManager.playCorrectFeedback(currentQ.correctAnswer, streak + 1);

      // Automatically advance to next question
      setTimeout(() => {
        setFeedbackState("idle");
        setCurrentQuestionIndex((prev) => (prev + 1) % filteredQuestions.length);
      }, 1600);
    } else {
      setFeedbackState("incorrect");
      soundManager.playIncorrectBuzzer();
      setTimeout(() => {
        setFeedbackState("idle");
      }, 1200);
    }
  }, [currentQ.correctAnswer, filteredQuestions.length, lastAnswerTime, streak]);

  // Video processing and hand landmark detection loop
  const processVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !landmarkerRef.current || !isStreaming) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.readyState >= 2 && ctx) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startTimeMs = performance.now();
      try {
        const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

        if (results && results.landmarks && results.landmarks.length > 0) {
          // Draw Hand Landmarks & Skeletons on Canvas
          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [5, 9], [9, 10], [10, 11], [11, 12], // Middle
            [9, 13], [13, 14], [14, 15], [15, 16], // Ring
            [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [0, 17], // Palm base
          ];

          results.landmarks.forEach((handLandmarks, handIdx) => {
            const handColor = handIdx === 0 ? "#10B981" : "#F59E0B";

            // Classify single hand fingers first for accurate visual feedback
            const fingerInfo = analyzeSingleHandFingers(handLandmarks as any);
            const { thumb, index, middle, ring, pinky } = fingerInfo.extendedFingers;
            const extendedMap: Record<number, boolean> = {
              4: thumb,
              8: index,
              12: middle,
              16: ring,
              20: pinky,
            };

            // Draw connecting lines with dynamic glow
            ctx.strokeStyle = handColor;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = handColor;
            ctx.shadowBlur = 6;

            connections.forEach(([i, j]) => {
              const p1 = handLandmarks[i];
              const p2 = handLandmarks[j];
              if (p1 && p2) {
                ctx.beginPath();
                ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                ctx.stroke();
              }
            });

            // Draw joint nodes with clear differentiation between extended and folded fingers
            handLandmarks.forEach((pt, ptIdx) => {
              const isTip = [4, 8, 12, 16, 20].includes(ptIdx);
              const isExtendedTip = isTip && extendedMap[ptIdx];

              ctx.beginPath();
              ctx.arc(
                pt.x * canvas.width,
                pt.y * canvas.height,
                isTip ? (isExtendedTip ? 7 : 4.5) : 3.5,
                0,
                2 * Math.PI
              );

              if (isTip) {
                if (isExtendedTip) {
                  ctx.fillStyle = "#FBBF24"; // Vàng sáng phát quang cho ngón duỗi
                  ctx.shadowColor = "#F59E0B";
                  ctx.shadowBlur = 10;
                } else {
                  ctx.fillStyle = "#64748B"; // Xám mờ cho ngón gập/nắm
                  ctx.shadowColor = "transparent";
                  ctx.shadowBlur = 0;
                }
              } else {
                ctx.fillStyle = "#FFFFFF";
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
              }

              ctx.fill();
              ctx.strokeStyle = isExtendedTip ? "#FFFFFF" : handColor;
              ctx.lineWidth = isExtendedTip ? 2 : 1.2;
              ctx.stroke();
            });
          });

          // Classify gestures & fingers
          const classified = classifyMultipleHands(results.landmarks as any);
          setCurrentResult(classified);
          if (onGestureDetected) onGestureDetected(classified);

          // === YÊU CẦU 3: KIỂM TRA ĐỘ ỔN ĐỊNH BÀN TAY (HAND STABILITY & MOTION FILTER) ===
          // Khi bàn tay chưa giữ nguyên, còn chuyển động lung tung -> CHỈ NHẬN DIỆN BÀN TAY, CHƯA CÔNG NHẬN ĐÁP ÁN.
          // Chỉ khi bàn tay đứng yên và giữ nguyên tư thế đủ thời gian -> Mới chính thức công nhận kết quả.
          const nowMs = Date.now();
          const firstHand = results.landmarks[0];
          let handIsMoving = false;

          if (firstHand && firstHand.length >= 10) {
            const currentPos = {
              x: (firstHand[0].x + firstHand[9].x) / 2,
              y: (firstHand[0].y + firstHand[9].y) / 2,
              time: nowMs,
            };

            if (prevHandPosRef.current) {
              const dt = Math.max(16, currentPos.time - prevHandPosRef.current.time);
              const dx = currentPos.x - prevHandPosRef.current.x;
              const dy = currentPos.y - prevHandPosRef.current.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              // Calculate normalized velocity
              const velocity = (dist / dt) * 1000;

              if (velocity > 0.45 || dist > MOTION_THRESHOLD) {
                handIsMoving = true;
              }
            }
            prevHandPosRef.current = currentPos;
          }

          setIsHandMoving(handIsMoving);

          if (activeMode === "math" && classified.handDetected && classified.fingerCount >= 0) {
            const detectedNumber = classified.fingerCount;

            // If hand is shaking or moving around rapidly, or finger count just changed -> reset hold timer
            if (handIsMoving) {
              stableHoldStartRef.current = 0;
              setHoldProgress(0);
            } else if (stableFingerCountRef.current !== detectedNumber) {
              // Finger count just changed, restart stability timer
              stableFingerCountRef.current = detectedNumber;
              stableHoldStartRef.current = nowMs;
              setHoldProgress(10);
            } else {
              // Hand is stationary and fingers remain steady -> accumulate hold progress
              if (stableHoldStartRef.current === 0) {
                stableHoldStartRef.current = nowMs;
              }
              const holdDuration = nowMs - stableHoldStartRef.current;
              const progress = Math.min(100, Math.round((holdDuration / REQUIRED_HOLD_TIME_MS) * 100));
              setHoldProgress(progress);

              // ONLY ACCEPT ANSWER WHEN HAND HAS BEEN HELD COMPLETELY STEADY
              if (progress >= 100) {
                if (detectedNumber === currentQ.correctAnswer && feedbackState === "idle") {
                  handleValidateAnswer(detectedNumber);
                  stableHoldStartRef.current = 0;
                  setHoldProgress(0);
                }
              }
            }
          } else {
            stableFingerCountRef.current = null;
            stableHoldStartRef.current = 0;
            setHoldProgress(0);
          }
        } else {
          setCurrentResult(null);
          prevHandPosRef.current = null;
          stableFingerCountRef.current = null;
          stableHoldStartRef.current = 0;
          setHoldProgress(0);
          setIsHandMoving(false);
        }
      } catch (err) {
        console.error("Lỗi phân tích khung hình MediaPipe:", err);
      }

      // Compute FPS
      frameCountRef.current += 1;
      const now = Date.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
    }

    if (isStreaming) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
    }
  }, [activeMode, currentQ.correctAnswer, feedbackState, handleValidateAnswer, isStreaming, onGestureDetected]);

  useEffect(() => {
    if (isStreaming) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isStreaming, processVideoFrame]);

  const isRecognized = currentResult && currentResult.handDetected && currentResult.confidence > 50;

  return (
    <div className="w-full bg-slate-950 rounded-2xl sm:rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden relative flex flex-col text-white">
      {/* =========================================================================
          TOP UNIFIED AR HUD: BÀI TOÁN & THÔNG SỐ TRẬN ĐẤU (Floating seamlessly)
         ========================================================================= */}
      <div className="bg-gradient-to-b from-slate-950/95 via-indigo-950/90 to-transparent p-2.5 sm:p-4 z-20 border-b border-white/10 backdrop-blur-md">
        {/* Top Header Row: Mode Switch, Grade Selector & Stats */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap mb-2">
          {/* Left: Mode & Level Selector */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Calculator className="w-4 h-4 stroke-[2.5]" />
            </div>

            {/* Mode Switcher Pills */}
            <div className="bg-white/10 p-0.5 rounded-xl border border-white/10 flex items-center gap-0.5">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveMode("math");
                }}
                className={`px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                  activeMode === "math"
                    ? "bg-amber-400 text-slate-950 shadow-xs"
                    : "text-indigo-200 hover:text-white"
                }`}
              >
                🧮 Đấu Trường Toán
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveMode("free");
                }}
                className={`px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                  activeMode === "free"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-indigo-200 hover:text-white"
                }`}
              >
                ✨ Nhận Diện Tự Do
              </button>
            </div>

            {/* Grade Selector (only in math mode) */}
            {activeMode === "math" && (
              <select
                value={selectedGrade}
                onChange={(e) => {
                  soundManager.playClick();
                  setSelectedGrade(e.target.value);
                  setCurrentQuestionIndex(0);
                }}
                className="bg-white/10 text-amber-300 text-[10px] sm:text-xs font-bold border border-white/10 rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                <option value="Tất cả" className="bg-slate-900 text-white">Tất cả khối lớp</option>
                <option value="Lớp 1 - 2" className="bg-slate-900 text-white">Lớp 1 - 2</option>
                <option value="Lớp 3 - 5" className="bg-slate-900 text-white">Lớp 3 - 5</option>
                <option value="Lớp 6 (THCS)" className="bg-slate-900 text-white">Lớp 6 (THCS)</option>
                <option value="Lớp 7 (THCS)" className="bg-slate-900 text-white">Lớp 7 (THCS)</option>
                <option value="Lớp 8 - 9 (THCS)" className="bg-slate-900 text-white">Lớp 8 - 9 (THCS)</option>
              </select>
            )}
          </div>

          {/* Right Stats: Score, Streak, Sound */}
          <div className="flex items-center gap-1.5 ml-auto">
            {activeMode === "math" && (
              <>
                <div className="bg-white/10 px-2 py-0.5 sm:py-1 rounded-xl border border-white/10 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black text-amber-300">{score}</span>
                </div>
                <div className="bg-white/10 px-2 py-0.5 sm:py-1 rounded-xl border border-white/10 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span className="text-xs font-black text-orange-400">{streak}</span>
                </div>
              </>
            )}

            {/* Test Voice Pronounce */}
            <button
              onClick={() => {
                setIsTestingSound(true);
                soundManager.playCorrectFeedback(currentQ.correctAnswer, 1);
                setTimeout(() => setIsTestingSound(false), 1400);
              }}
              className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isTestingSound
                  ? "bg-amber-400 text-slate-950 border-amber-300 scale-105"
                  : "bg-white/10 hover:bg-white/20 text-indigo-200 border-white/10"
              }`}
              title="Phát âm tiếng Việt"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MATH PROBLEM BOARD (When in Math Mode) */}
        {activeMode === "math" ? (
          <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900/60 border border-indigo-400/30 rounded-xl p-2 sm:p-3 flex items-center justify-between flex-wrap gap-2 shadow-inner">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-indigo-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                Câu {currentQuestionIndex + 1}/{filteredQuestions.length}
              </span>
              <div className="text-2xl sm:text-4xl font-black text-white tracking-widest font-mono drop-shadow-md">
                {currentQ.problemStr}
              </div>
              <div className="hidden sm:block text-xs font-bold text-amber-300 bg-black/30 px-2.5 py-1 rounded-lg border border-amber-400/20">
                {currentQ.emojiAnalogy}
              </div>
            </div>

            {/* Next question button */}
            <button
              onClick={handleNextQuestion}
              className="text-xs font-bold text-indigo-200 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95 ml-auto"
            >
              <span>Đổi câu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-indigo-900/40 border border-indigo-400/30 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">
                Chế độ Nhận diện Tự do: Hãy giơ cử chỉ bàn tay (0-10 ngón, Like, Peace, OK, Trái tim...)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MAIN CAMERA VIEWPORT (WITH REALTIME HUD & RECOGNITION BADGE OVERLAY)
         ========================================================================= */}
      <div className="relative w-full aspect-16/11 sm:aspect-16/9 max-h-[380px] sm:max-h-[480px] bg-slate-950 flex items-center justify-center overflow-hidden group select-none">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {/* Canvas Overlay for hand landmarks & skeletons */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
        />

        {/* Camera OFF Screen */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 text-white backdrop-blur-xs z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center mb-2.5 text-indigo-300">
              <VideoOff className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-white mb-0.5">
              Camera AI Đang Tắt
            </h3>
            <p className="text-xs text-slate-300 mb-3 max-w-[260px]">
              Bật camera để AI tự động đếm ngón tay và chấm điểm trực tiếp
            </p>
            <button
              onClick={() => startCamera()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Bật Camera Ngay 📷</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            INTEGRATED REALTIME AI RECOGNITION HUD (FLOATING DIRECTLY IN CAMERA)
           ========================================================================= */}
        {isStreaming && (
          <>
            {/* Top Left Live Status Pill */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 flex-wrap">
              <div className="bg-slate-950/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>AI Live ({fps} FPS)</span>
              </div>

              {currentResult && currentResult.handCount > 0 && (
                <div className="bg-slate-950/80 backdrop-blur-md border border-indigo-400/30 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-lg">
                  <Hand className="w-3 h-3 text-amber-400" />
                  <span>{currentResult.handCount >= 2 ? "2 Bàn tay" : "1 Bàn tay"}</span>
                </div>
              )}
            </div>

            {/* Top Right Live Gesture Detection Card Overlay */}
            <div className="absolute top-2.5 right-2.5 z-20 max-w-[180px] sm:max-w-[220px] bg-slate-950/85 backdrop-blur-md border border-indigo-400/40 rounded-xl p-2 shadow-xl flex items-center gap-2">
              <div className="text-2xl sm:text-3xl shrink-0">
                {currentResult ? currentResult.emoji : "✋"}
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 leading-none">
                  AI Nhận Diện
                </div>
                <div className="text-xs sm:text-sm font-black text-white truncate">
                  {currentResult && currentResult.handDetected
                    ? `${currentResult.fingerCount} Ngón tay`
                    : "Đang dò bàn tay..."}
                </div>
                {currentResult && currentResult.name && (
                  <div className="text-[9px] text-amber-300 font-bold truncate">
                    {currentResult.name} ({currentResult.confidence}%)
                  </div>
                )}
              </div>
            </div>

            {/* CENTER AR EVALUATION & STABILITY HOLD BANNER */}
            {activeMode === "math" && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[92%] sm:w-auto max-w-md">
                {feedbackState === "correct" ? (
                  <div className="bg-emerald-500/90 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-2xl border border-emerald-300 flex items-center justify-center gap-2 animate-bounce">
                    <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
                    <span className="text-xs sm:text-sm">
                      CHÍNH XÁC: KẾT QUẢ LÀ {currentQ.correctAnswer}! 🎉 (+100đ)
                    </span>
                  </div>
                ) : feedbackState === "incorrect" ? (
                  <div className="bg-rose-500/90 text-white font-black px-4 py-2 rounded-2xl shadow-2xl border border-rose-300 flex items-center justify-center gap-2 animate-pulse">
                    <XCircle className="w-5 h-5 text-white shrink-0" />
                    <span className="text-xs sm:text-sm">
                      Chưa đúng rồi! Hãy tính nháp và đếm lại số ngón nhé!
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-950/90 backdrop-blur-md text-slate-200 border border-indigo-400/30 px-3 py-2 rounded-2xl shadow-xl flex flex-col gap-1.5 text-center text-[11px] sm:text-xs">
                    {/* Guidance Prompt - Không lộ đáp án */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Hand className="w-3.5 h-3.5 animate-pulse" />
                        <span>💡 Hướng dẫn: Tính nhẩm và <strong className="text-white underline">GIỮ YÊN bàn tay</strong> trước camera</span>
                      </div>
                      {currentResult && currentResult.handDetected && (
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30 shrink-0 font-mono">
                          {currentResult.fingerCount} ngón
                        </span>
                      )}
                    </div>

                    {/* Realtime Hand Stability Status Bar */}
                    {currentResult && currentResult.handDetected && (
                      <div className="w-full">
                        {isHandMoving ? (
                          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/15 py-1 px-2 rounded-lg border border-amber-400/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            <span>Bàn tay đang di chuyển (Giữ yên để nộp bài)...</span>
                          </div>
                        ) : holdProgress > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-300 px-1">
                              <span>🎯 Giữ yên ổn định để nộp bài:</span>
                              <span>{holdProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                              <div
                                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-75 ease-out rounded-full"
                                style={{ width: `${holdProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-300 italic">
                            Giữ cố định vị trí bàn tay khoảng 1 giây để chốt đáp án
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* =========================================================================
          BOTTOM INTEGRATED CONTROLS & FAST KEYPAD (0 - 10)
         ========================================================================= */}
      <div className="bg-slate-900 p-2 sm:p-3 border-t border-white/10 z-20 flex flex-col gap-2">
        {/* Number Keypad for Fast Touch Response (0 to 10) */}
        {activeMode === "math" && (
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-[10px] text-indigo-300 font-bold uppercase hidden sm:inline">
              Chạm nhanh:
            </span>
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-1 overflow-x-auto no-scrollbar py-0.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => handleValidateAnswer(num)}
                  className={`w-7 h-7 sm:w-9 sm:h-9 min-w-[28px] min-h-[28px] rounded-lg font-black text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center ${
                    num === currentQ.correctAnswer && feedbackState === "correct"
                      ? "bg-emerald-500 text-slate-950 border-emerald-300 scale-110 shadow-md shadow-emerald-500/50"
                      : "bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-white border-white/15 active:scale-95"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Camera Controls Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
          {/* Flip Camera Button */}
          <button
            onClick={handleFlipCamera}
            disabled={!isStreaming}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-indigo-200 text-xs font-bold flex items-center gap-1 border border-white/10 cursor-pointer transition-all"
            title="Đổi camera trước/sau"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span>Đổi camera</span>
          </button>

          {/* Start/Stop Camera */}
          <button
            onClick={() => {
              soundManager.playClick();
              if (isStreaming) {
                stopCamera();
              } else {
                startCamera();
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isStreaming
                ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black shadow-emerald-500/20"
            }`}
          >
            {isStreaming ? (
              <>
                <VideoOff className="w-3.5 h-3.5" />
                <span>Tắt Camera</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>Bật Camera</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
