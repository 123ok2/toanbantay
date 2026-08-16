import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Calculator,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  Hand,
  Flame,
  Play,
  ArrowRight,
  Lightbulb,
  Video,
  VideoOff,
  SwitchCamera,
  Heart,
  Dice5,
} from "lucide-react";
import confetti from "canvas-confetti";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { classifyMultipleHands, analyzeSingleHandFingers } from "../utils/gestureClassifier";
import { RecognitionResult } from "../types";
import { soundManager } from "../utils/soundEffects";
import {
  MathQuestion,
  MathGradeLevel,
  MASTER_MATH_QUESTION_BANK,
  GRADE_LEVEL_OPTIONS,
  getShuffledQuestionsForGrade,
  generateDynamicQuestion,
  getPedagogicalHint,
  getPedagogicalAnalogy,
} from "../utils/mathQuestionBank";

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
  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);

  // States
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [fps, setFps] = useState<number>(0);

  // Math Arena State
  const [selectedGrade, setSelectedGrade] = useState<string>("Tất cả");
  const [questionPool, setQuestionPool] = useState<MathQuestion[]>(() => {
    return getShuffledQuestionsForGrade("Lớp 1 - 2");
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [showMathHint, setShowMathHint] = useState<boolean>(false);
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(0);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);
  const [isSpeakingPraise, setIsSpeakingPraise] = useState<boolean>(false);

  // Recognition state & Hand Stability Tracking
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHandMoving, setIsHandMoving] = useState<boolean>(false);

  // Hand stability refs
  const prevHandPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const stableFingerCountRef = useRef<number | null>(null);
  const stableHoldStartRef = useRef<number>(0);
  const REQUIRED_HOLD_TIME_MS = 800; // 800ms stable hold required
  const MOTION_THRESHOLD = 0.035;

  // Re-shuffle when grade changes
  useEffect(() => {
    let initialList: MathQuestion[] = [];
    if (selectedGrade === "Tất cả") {
      initialList = [...MASTER_MATH_QUESTION_BANK].sort(() => Math.random() - 0.5);
    } else {
      initialList = getShuffledQuestionsForGrade(selectedGrade as MathGradeLevel);
    }
    setQuestionPool(initialList);
    setCurrentQuestionIndex(0);
    setFeedbackState("idle");
  }, [selectedGrade]);

  const currentQ = questionPool[currentQuestionIndex % questionPool.length] || MASTER_MATH_QUESTION_BANK[0];

  // Initialize MediaPipe Vision Hand Landmarker
  useEffect(() => {
    let isSubscribed = true;

    async function initMediaPipe() {
      try {
        setIsModelLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        if (!isSubscribed) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });

        if (isSubscribed) {
          landmarkerRef.current = handLandmarker;
          setIsModelLoading(false);
        }
      } catch (err: any) {
        console.error("Không thể tải mô hình MediaPipe HandLandmarker:", err);
        if (isSubscribed) {
          setModelError("Không thể tải AI nhận diện MediaPipe. Vui lòng kiểm tra kết nối mạng.");
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
          setTimeout(() => {
            soundManager.speakText("Chào mừng bạn đến với Đấu trường Toán học Bàn tay AI!");
          }, 300);
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

  // Switch to next question
  const handleNextQuestion = useCallback(() => {
    soundManager.playClick();
    setFeedbackState("idle");
    setCurrentQuestionIndex((prev) => (prev + 1) % questionPool.length);
  }, [questionPool.length]);

  // Random question
  const handleRandomQuestion = useCallback(() => {
    soundManager.playClick();
    setFeedbackState("idle");
    if (questionPool.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * questionPool.length);
    if (nextIdx === currentQuestionIndex) {
      nextIdx = (nextIdx + 1) % questionPool.length;
    }
    setCurrentQuestionIndex(nextIdx);
  }, [currentQuestionIndex, questionPool.length]);

  // Dynamic question
  const handleGenerateDynamic = useCallback(() => {
    soundManager.playClick();
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
  }, [selectedGrade]);

  // Read question
  const handleReadQuestion = () => {
    setIsSpeakingQuestion(true);
    soundManager.readQuestion(currentQ.problemStr);
    setTimeout(() => setIsSpeakingQuestion(false), 2200);
  };

  // Cheer
  const handleMotivationalCheer = () => {
    setIsSpeakingPraise(true);
    soundManager.playCorrectFeedback(currentQ.correctAnswer, Math.max(1, streak));
    setTimeout(() => setIsSpeakingPraise(false), 2000);
  };

  // Validate answer
  const handleValidateAnswer = useCallback((answerNumber: number) => {
    const now = Date.now();
    if (now - lastAnswerTime < 1400) return;

    if (answerNumber === currentQ.correctAnswer) {
      setFeedbackState("correct");
      setLastAnswerTime(now);
      const nextStreak = streak + 1;
      setScore((prev) => prev + 100);
      setStreak(nextStreak);

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10B981", "#F59E0B", "#6366F1", "#EC4899", "#38BDF8"],
        });
      } catch (e) {}

      soundManager.playCorrectFeedback(currentQ.correctAnswer, nextStreak);

      setTimeout(() => {
        setFeedbackState("idle");
        setCurrentQuestionIndex((prev) => (prev + 1) % questionPool.length);
      }, 1600);
    } else {
      setFeedbackState("incorrect");
      setStreak(0);
      soundManager.playEncouragingFeedback();
      setTimeout(() => {
        setFeedbackState("idle");
      }, 1300);
    }
  }, [currentQ.correctAnswer, questionPool.length, lastAnswerTime, streak]);

  // Video loop
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
          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20],
            [0, 17],
          ];

          results.landmarks.forEach((handLandmarks, handIdx) => {
            const handColor = handIdx === 0 ? "#06B6D4" : "#818CF8";
            const fingerInfo = analyzeSingleHandFingers(handLandmarks as any);
            const { thumb, index, middle, ring, pinky } = fingerInfo.extendedFingers;
            const extendedMap: Record<number, boolean> = {
              4: thumb,
              8: index,
              12: middle,
              16: ring,
              20: pinky,
            };

            ctx.strokeStyle = handColor;
            ctx.lineWidth = 3;
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
                ctx.fillStyle = isExtendedTip ? "#FBBF24" : "#94A3B8";
                ctx.shadowColor = isExtendedTip ? "#F59E0B" : "transparent";
                ctx.shadowBlur = isExtendedTip ? 8 : 0;
              } else {
                ctx.fillStyle = "#FFFFFF";
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
              }
              ctx.fill();
            });
          });
        }

        const classified = classifyMultipleHands(results?.landmarks as any || []);
        setCurrentResult(classified);
        if (onGestureDetected) onGestureDetected(classified);

        const nowMs = Date.now();
        const firstHand = results?.landmarks?.[0];
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
            const velocity = (dist / dt) * 1000;

            if (velocity > 0.45 || dist > MOTION_THRESHOLD) {
              handIsMoving = true;
            }
          }
          prevHandPosRef.current = currentPos;
        }

        setIsHandMoving(handIsMoving);

        if (classified.handDetected && classified.fingerCount >= 0) {
          const detectedNumber = classified.fingerCount;

          if (handIsMoving) {
            stableHoldStartRef.current = 0;
            setHoldProgress(0);
          } else if (stableFingerCountRef.current !== detectedNumber) {
            stableFingerCountRef.current = detectedNumber;
            stableHoldStartRef.current = nowMs;
            setHoldProgress(10);
          } else {
            if (stableHoldStartRef.current === 0) {
              stableHoldStartRef.current = nowMs;
            }
            const holdDuration = nowMs - stableHoldStartRef.current;
            const progress = Math.min(
              100,
              Math.round((holdDuration / REQUIRED_HOLD_TIME_MS) * 100)
            );
            setHoldProgress(progress);

            if (progress >= 100 && feedbackState === "idle") {
              handleValidateAnswer(detectedNumber);
              stableHoldStartRef.current = 0;
              setHoldProgress(0);
            }
          }
        } else {
          stableFingerCountRef.current = null;
          stableHoldStartRef.current = 0;
          setHoldProgress(0);
        }
      } catch (err) {
        console.error("Frame processing error:", err);
      }

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
  }, [currentQ.correctAnswer, feedbackState, handleValidateAnswer, isStreaming, onGestureDetected]);

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

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* =========================================================================
          1. TOP BAR: Grade Filter & Clean Stats Cluster
         ========================================================================= */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Grade Dropdown */}
        <div className="relative min-w-0 flex-1 max-w-[210px] sm:max-w-xs">
          <select
            value={selectedGrade}
            onChange={(e) => {
              soundManager.playClick();
              setSelectedGrade(e.target.value);
              setCurrentQuestionIndex(0);
            }}
            className="w-full bg-slate-900/90 hover:bg-slate-850 text-slate-100 text-xs font-semibold rounded-xl px-3 py-2 border border-indigo-500/30 hover:border-indigo-500/50 outline-none cursor-pointer transition-all truncate shadow-sm focus:ring-1 focus:ring-cyan-400"
          >
            <option value="Tất cả" className="bg-slate-900 text-white">
              Tất cả khối ({MASTER_MATH_QUESTION_BANK.length} câu)
            </option>
            {GRADE_LEVEL_OPTIONS.map((g) => (
              <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Unified Stats Pill & Voice Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Combined Score + Streak Pill */}
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 px-3 py-1.5 rounded-xl border border-amber-400/35 text-xs font-bold shadow-sm">
            <div className="flex items-center gap-1 text-amber-300">
              <Trophy className="w-3.5 h-3.5 fill-amber-400/20" />
              <span>{score}</span>
            </div>
            <span className="text-amber-500/40">•</span>
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="w-3.5 h-3.5 fill-orange-400/30" />
              <span>{streak}</span>
            </div>
          </div>

          {/* Read Question Button */}
          <button
            onClick={handleReadQuestion}
            title="Đọc đề bài"
            className={`w-8 h-8 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isSpeakingQuestion
                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-indigo-500/40"
            }`}
          >
            <Volume2 className={`w-4 h-4 text-cyan-400 ${isSpeakingQuestion ? "animate-pulse" : ""}`} />
          </button>

          {/* Encouragement Button */}
          <button
            onClick={handleMotivationalCheer}
            title="Khích lệ & động viên"
            className={`w-8 h-8 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isSpeakingPraise
                ? "bg-rose-500 text-white border-rose-400 shadow-sm"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-indigo-500/40"
            }`}
          >
            <Heart className={`w-4 h-4 text-rose-400 ${isSpeakingPraise ? "fill-rose-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MATH QUESTION CARD (Hero Focus)
         ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/40 border border-indigo-500/25 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-indigo-950/20 flex flex-col gap-3">
        {/* Top Card Row: Info Badges & Quick Action Controls (Strictly 1 line) */}
        <div className="flex items-center justify-between gap-2 flex-nowrap min-w-0">
          {/* Metadata Badges */}
          <div className="flex items-center gap-1.5 text-xs font-medium min-w-0 truncate">
            <span className="font-bold text-cyan-300 shrink-0">
              #{currentQuestionIndex + 1}/{questionPool.length}
            </span>
            <span className="text-slate-600 shrink-0">•</span>
            <span className="text-indigo-200 font-semibold truncate">
              {currentQ.topic || "Toán học"}
            </span>
            {currentQ.difficulty && (
              <>
                <span className="text-slate-600 shrink-0 hidden xs:inline">•</span>
                <span className="text-slate-400 shrink-0 hidden xs:inline font-normal">{currentQ.difficulty}</span>
              </>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Hint Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setShowMathHint((prev) => !prev);
              }}
              className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                showMathHint
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-xs"
                  : "bg-slate-800/90 hover:bg-slate-750 text-slate-300 border-slate-700/70"
              }`}
              title="Gợi ý phương pháp"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs">Gợi ý</span>
            </button>

            {/* Random Button */}
            <button
              onClick={handleRandomQuestion}
              className="w-7 h-7 sm:w-auto sm:px-2 sm:py-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-300 border border-slate-700/70 cursor-pointer transition-all flex items-center justify-center gap-1 shrink-0"
              title="Đổi bài ngẫu nhiên"
            >
              <Dice5 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-xs font-semibold">Đổi</span>
            </button>

            {/* Next Question */}
            <button
              onClick={handleNextQuestion}
              className="text-xs font-bold px-2.5 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-indigo-600/30 shrink-0 active:scale-95"
              title="Câu tiếp theo"
            >
              <span>Tiếp</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Question Statement */}
        <div className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-normal leading-relaxed break-words">
          {currentQ.problemStr}
        </div>

        {/* Collapsible Pedagogical Hint */}
        {showMathHint && (
          <div className="bg-amber-950/30 border border-amber-400/30 rounded-xl p-3 text-xs text-amber-200/90 space-y-1.5">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Gợi ý phương pháp:</span>
              </span>
              <button
                onClick={() => setShowMathHint(false)}
                className="text-[11px] text-amber-400 hover:text-white cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>
            <p className="leading-relaxed">{getPedagogicalHint(currentQ)}</p>
            {getPedagogicalAnalogy(currentQ) && (
              <div className="text-[11px] font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded-md inline-block border border-amber-400/20">
                {getPedagogicalAnalogy(currentQ)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. CAMERA VIEWPORT (Clean Minimalist Frame)
         ========================================================================= */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/9 min-h-[220px] max-h-[360px] sm:max-h-[420px] bg-slate-950 rounded-2xl border border-indigo-500/25 overflow-hidden flex items-center justify-center select-none shadow-lg shadow-indigo-950/20">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {/* Canvas for Landmarks */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
        />

        {/* Camera Off State */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 text-white z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center mb-2.5 text-cyan-400 shadow-md">
              <VideoOff className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Camera AI Đang Tắt</h3>
            <p className="text-xs text-slate-400 mb-3.5 max-w-[260px]">
              Bật camera để AI MediaPipe tự động trích xuất ngón tay và chấm điểm thời gian thực
            </p>
            <button
              onClick={() => startCamera()}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Bật Camera AI</span>
            </button>
          </div>
        )}

        {/* Live Overlays */}
        {isStreaming && (
          <>
            {/* Top Left: Live Status */}
            <div className="absolute top-2.5 left-2.5 z-20">
              <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Live ({fps} FPS)</span>
              </div>
            </div>

            {/* Top Right: AI Detection Pill */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/35 shadow-md flex items-center gap-2 text-xs font-bold text-white">
                <span className="text-base">{currentResult ? currentResult.emoji : "✋"}</span>
                <span className="text-cyan-300">
                  {currentResult && currentResult.handDetected
                    ? `${currentResult.fingerCount} ngón`
                    : "Đang dò tay..."}
                </span>
              </div>
            </div>

            {/* Bottom Floating Feedback & Stability Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-sm">
              {feedbackState === "correct" ? (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-center gap-2 animate-bounce text-xs sm:text-sm border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>CHÍNH XÁC: ĐÁP ÁN LÀ {currentQ.correctAnswer}! 🎉</span>
                </div>
              ) : feedbackState === "incorrect" ? (
                <div className="bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-center gap-2 animate-pulse text-xs border border-rose-400">
                  <XCircle className="w-4 h-4 text-white shrink-0" />
                  <span>Chưa đúng rồi! Hãy đếm kỹ số ngón tay nhé!</span>
                </div>
              ) : (
                <div className="bg-slate-950/90 backdrop-blur-md text-slate-300 border border-indigo-500/30 px-3.5 py-2 rounded-xl shadow-lg flex flex-col gap-1 text-center text-xs">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-slate-400">💡 Giữ yên bàn tay để chốt đáp án</span>
                    {currentResult && currentResult.handDetected && (
                      <span className="font-bold text-cyan-300">
                        {currentResult.fingerCount} ngón
                      </span>
                    )}
                  </div>

                  {currentResult && currentResult.handDetected && (
                    <div className="w-full">
                      {isHandMoving ? (
                        <div className="text-[10px] text-amber-300 font-medium">
                          Bàn tay đang di chuyển (hãy giữ yên)...
                        </div>
                      ) : holdProgress > 0 ? (
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75 ease-out rounded-full shadow-xs"
                            style={{ width: `${holdProgress}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* =========================================================================
          4. TOUCH KEYPAD & CAMERA ACTION BAR
         ========================================================================= */}
      <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2.5 shadow-sm">
        {/* Fast Keypad 0 - 10 */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between px-0.5">
            <span className="text-slate-300">Chạm số để trả lời nhanh:</span>
            <span className="text-cyan-400 font-medium">0 - 10 ngón tay</span>
          </div>

          <div className="grid grid-cols-11 gap-1 w-full">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => handleValidateAnswer(num)}
                className={`h-9 rounded-lg font-bold text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                  num === currentQ.correctAnswer && feedbackState === "correct"
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md"
                    : "bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-200 border-slate-700/70 hover:border-indigo-400"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Camera Action Row */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={handleFlipCamera}
            disabled={!isStreaming}
            className="flex-1 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/70 cursor-pointer transition-all active:scale-95"
            title="Đổi camera trước/sau"
          >
            <SwitchCamera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Đổi camera</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              if (isStreaming) {
                stopCamera();
              } else {
                startCamera();
              }
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 ${
              isStreaming
                ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20"
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
                <span>Bật Camera AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
