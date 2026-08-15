import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  Video,
  VideoOff,
  FlipHorizontal,
  AlertCircle,
  Sparkles,
  Loader2,
  Eye,
  Activity,
  CheckCircle2,
  SwitchCamera,
  Smartphone,
} from "lucide-react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { classifyMultipleHands, analyzeSingleHandFingers } from "../utils/gestureClassifier";
import { RecognitionResult } from "../types";
import { soundManager } from "../utils/soundEffects";

interface CameraViewProps {
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  onGestureDetected: (result: RecognitionResult, imageSnapshot?: string) => void;
  useGemini: boolean;
  isAnalyzingGemini: boolean;
  onTriggerGeminiAnalysis: (imageBase64: string) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isStreaming,
  setIsStreaming,
  onGestureDetected,
  useGemini,
  isAnalyzingGemini,
  onTriggerGeminiAnalysis,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasPermissionError, setHasPermissionError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [mirrorMode, setMirrorMode] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [handCountState, setHandCountState] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const lastHandCountRef = useRef<number>(0);
  const lastEmitTimeRef = useRef<number>(0);
  const lastGestureIdRef = useRef<string>("unknown");
  const onGestureDetectedRef = useRef(onGestureDetected);

  useEffect(() => {
    onGestureDetectedRef.current = onGestureDetected;
  }, [onGestureDetected]);

  // Initialize MediaPipe HandLandmarker model
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
        console.error("Lỗi khi nạp mô hình MediaPipe HandLandmarker:", err);
        if (isSubscribed) {
          setModelError("Không thể tải mô hình MediaPipe. Đang sử dụng chế độ dự phòng.");
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

  // Start Camera Stream
  const startCamera = useCallback(async (requestedFacing?: "user" | "environment") => {
    setHasPermissionError(null);
    const targetFacing = requestedFacing || facingMode;
    try {
      // Stop existing stream if running
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: targetFacing,
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
      console.error("Camera access error:", err);
      let errorMsg = "Không thể truy cập camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Trình duyệt chưa được cấp quyền sử dụng camera. Vui lòng cho phép quyền camera trên trình duyệt.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "Không tìm thấy thiết bị camera trên máy tính/điện thoại của bạn.";
      }
      setHasPermissionError(errorMsg);
      setIsStreaming(false);
    }
  }, [facingMode, setIsStreaming]);

  // Switch between front (selfie) and rear (environment) cameras for mobile phones
  const toggleCameraFacing = useCallback(async () => {
    soundManager.playClick();
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    // When using environment camera, mirror mode should be turned off
    setMirrorMode(nextFacing === "user");

    if (isStreaming) {
      await startCamera(nextFacing);
    }
  }, [facingMode, isStreaming, startCamera]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setHandCountState(0);

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [setIsStreaming]);

  // Capture snapshot image from current video frame
  const captureSnapshot = useCallback((): string | undefined => {
    if (!videoRef.current || !videoRef.current.videoWidth) return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    if (mirrorMode) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, [mirrorMode]);

  // Draw hand landmarks on canvas with distinct styling per hand
  const drawMultipleLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarksList: Array<Array<{ x: number; y: number; z: number }>>,
    width: number,
    height: number
  ) => {
    const HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],         // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],         // Index
      [5, 9], [9, 10], [10, 11], [11, 12],     // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],   // Ring
      [13, 17], [17, 18], [18, 19], [19, 20],  // Pinky
      [0, 17]                                  // Palm base
    ];

    const handStyles = [
      { bone: "#06b6d4", dot: "#38bdf8", tip: "#ec4899", labelBg: "rgba(6, 182, 212, 0.85)", label: "Tay 1" },
      { bone: "#a855f7", dot: "#c084fc", tip: "#f43f5e", labelBg: "rgba(168, 85, 247, 0.85)", label: "Tay 2" },
    ];

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    landmarksList.forEach((landmarks, handIndex) => {
      const style = handStyles[handIndex % handStyles.length];
      const fingerAnalysis = analyzeSingleHandFingers(landmarks);
      const ext = fingerAnalysis.extendedFingers;

      // Map tip landmark index to extended status
      const tipExtendedMap: Record<number, boolean> = {
        4: ext.thumb,
        8: ext.index,
        12: ext.middle,
        16: ext.ring,
        20: ext.pinky,
      };

      // Draw bones
      ctx.strokeStyle = style.bone;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";

      HAND_CONNECTIONS.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        }
      });

      // Draw dots & fingertips
      landmarks.forEach((p, idx) => {
        const x = p.x * width;
        const y = p.y * height;
        const isFingertip = [4, 8, 12, 16, 20].includes(idx);
        const isExt = isFingertip ? tipExtendedMap[idx] : false;

        if (isFingertip && isExt) {
          // Highlight extended fingertip in glowing emerald green
          ctx.fillStyle = "#22c55e";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 7.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Outer glowing ring
          ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          ctx.fillStyle = isFingertip ? "#94a3b8" : style.dot;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, isFingertip ? 5 : 3.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      });

      // Draw Hand Label tag near wrist with real-time finger count
      const wrist = landmarks[0];
      if (wrist) {
        const wx = wrist.x * width;
        const wy = Math.min(height - 15, wrist.y * height + 24);
        const labelText = `${style.label}: ${fingerAnalysis.fingerCount} ngón`;

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = style.labelBg;
        ctx.beginPath();
        ctx.roundRect(wx - 42, wy - 14, 84, 22, 8);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(labelText, wx, wy + 1);
      }
    });

    ctx.restore();
  };

  // Processing loop
  const processFrame = useCallback(() => {
    if (!videoRef.current || !isStreaming || videoRef.current.readyState < 2) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Calculate FPS (update once per second)
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastTimeRef.current >= 1000) {
      const currentFps = frameCountRef.current;
      setFps((prev) => (prev !== currentFps ? currentFps : prev));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas?.getContext("2d");

    // MediaPipe Hand Detection
    if (landmarkerRef.current) {
      try {
        const results = landmarkerRef.current.detectForVideo(video, now);

        if (results.landmarks && results.landmarks.length > 0) {
          const detectedHandCount = results.landmarks.length;
          if (lastHandCountRef.current !== detectedHandCount) {
            lastHandCountRef.current = detectedHandCount;
            setHandCountState(detectedHandCount);
          }

          if (ctx && canvas) {
            drawMultipleLandmarks(ctx, results.landmarks, canvas.width, canvas.height);
          }

          // Classify 1 or 2 hands
          const result = classifyMultipleHands(results.landmarks);

          // Throttle gesture dispatch: dispatch if gesture changed or at least 70ms passed
          const timeSinceLastEmit = now - lastEmitTimeRef.current;
          if (result.gestureId !== lastGestureIdRef.current || timeSinceLastEmit >= 70) {
            lastGestureIdRef.current = result.gestureId;
            lastEmitTimeRef.current = now;
            onGestureDetectedRef.current(result);
          }
        } else {
          if (lastHandCountRef.current !== 0) {
            lastHandCountRef.current = 0;
            setHandCountState(0);
          }
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          const timeSinceLastEmit = now - lastEmitTimeRef.current;
          if (lastGestureIdRef.current !== "unknown" || timeSinceLastEmit >= 150) {
            lastGestureIdRef.current = "unknown";
            lastEmitTimeRef.current = now;
            onGestureDetectedRef.current({
              gestureId: "unknown",
              name: "Đang chờ bàn tay...",
              emoji: "👋",
              confidence: 0,
              handDetected: false,
              handCount: 0,
              fingerCount: 0,
              timestamp: now,
            });
          }
        }
      } catch (err) {
        // Frame processing error tolerance
      }
    }

    requestRef.current = requestAnimationFrame(processFrame);
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      requestRef.current = requestAnimationFrame(processFrame);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isStreaming, processFrame]);

  // Handle manual Gemini Vision button click
  const handleGeminiClick = () => {
    soundManager.playClick();
    const snapshot = captureSnapshot();
    if (snapshot) {
      onTriggerGeminiAnalysis(snapshot);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-lg border border-slate-100 flex flex-col items-center">
      {/* Top bar with Camera status & controls */}
      <div className="w-full flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">Camera AI Trực Tiếp</h2>
            <p className="text-[11px] text-slate-500">
              {isStreaming ? `FPS: ${fps} • MediaPipe 21-Points` : "Sẵn sàng kết nối"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Switch Front/Rear Camera Button (Especially useful on Mobile) */}
          <button
            onClick={toggleCameraFacing}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs min-h-[36px]"
            title="Đổi camera trước (Selfie) hoặc camera sau"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {facingMode === "user" ? "Cam Trước" : "Cam Sau"}
            </span>
          </button>

          {/* Mirror Flip Button */}
          {isStreaming && (
            <button
              onClick={() => setMirrorMode(!mirrorMode)}
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer min-h-[36px]"
              title="Lật hình camera (Gương)"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Lật ảnh</span>
            </button>
          )}

          {/* Model Status Indicator */}
          {isModelLoading ? (
            <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-full border border-indigo-200">
              <Loader2 className="w-3 h-3 animate-spin" /> Tải AI...
            </span>
          ) : modelError ? (
            <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              Dự phòng
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sẵn sàng
            </span>
          )}
        </div>
      </div>

      {/* Main Camera Video Feed & Canvas Wrapper (Compact & Responsive) */}
      <div className="relative w-full aspect-4/3 max-h-[260px] sm:max-h-[320px] bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-indigo-100 flex items-center justify-center group">
        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${mirrorMode ? "scale-x-[-1]" : ""}`}
        />

        {/* Canvas Landmark Skeleton Overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            mirrorMode ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Detection Status Overlay Badge */}
        {isStreaming && (
          <div className="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/15 shadow-md">
            <span
              className={`w-2 h-2 rounded-full ${
                handCountState >= 2
                  ? "bg-purple-400 animate-pulse"
                  : handCountState === 1
                  ? "bg-emerald-400 animate-ping"
                  : "bg-amber-400"
              }`}
            />
            <span className="font-semibold flex items-center gap-1">
              {handCountState >= 2 ? (
                <>
                  <span className="text-purple-300 font-bold">✋✋ 2 Tay</span>
                  <span className="text-[9px] bg-purple-500/40 text-purple-200 px-1 py-0.2 rounded">Đang đếm</span>
                </>
              ) : handCountState === 1 ? (
                <>
                  <span className="text-emerald-300 font-bold">✋ 1 Tay</span>
                  <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1 py-0.2 rounded">Đang đếm</span>
                </>
              ) : (
                <span className="text-amber-200/80">Giơ ngón tay trước camera...</span>
              )}
            </span>
          </div>
        )}

        {/* Off State Placeholder */}
        {!isStreaming && !hasPermissionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-950 text-white p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 mb-2.5 animate-pulse">
              <VideoOff className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold mb-1">Camera Đang Tắt</h3>
            <p className="text-[11px] text-slate-300 max-w-xs mb-3">
              Bật camera để AI nhận diện ngón tay và giải toán tương tác trực tiếp.
            </p>
            <button
              onClick={() => startCamera()}
              disabled={isModelLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isModelLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang khởi tạo AI...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Bật Camera Ngay
                </>
              )}
            </button>
          </div>
        )}

        {/* Permission Error State */}
        {hasPermissionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/90 text-white p-4 text-center backdrop-blur-md">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <h3 className="text-xs font-bold text-rose-200 mb-1">Chưa có quyền camera</h3>
            <p className="text-[11px] text-rose-100 max-w-xs mb-2 leading-tight">
              {hasPermissionError}
            </p>
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 rounded-lg bg-white text-rose-950 font-bold text-xs hover:bg-rose-50 transition-all shadow-sm cursor-pointer min-h-[44px]"
            >
              Thử Lại Bật Camera
            </button>
          </div>
        )}
      </div>

      {/* Main Control Buttons Bar (Mobile-friendly with 44px min touch height) */}
      <div className="w-full mt-3 flex flex-wrap sm:flex-nowrap items-center justify-center gap-2">
        {!isStreaming ? (
          <button
            onClick={() => startCamera()}
            disabled={isModelLoading}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Video className="w-4 h-4" />
            Bật Camera Nhận Diện
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-sm shadow-rose-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <VideoOff className="w-4 h-4" />
            Dừng Camera
          </button>
        )}

        {/* Switch Camera quick button for mobile */}
        {isStreaming && (
          <button
            onClick={toggleCameraFacing}
            className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Đổi camera trước hoặc sau"
          >
            <SwitchCamera className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Đổi Camera</span>
          </button>
        )}

        {/* Gemini Vision Snapshot Analyzer Button */}
        {isStreaming && (
          <button
            onClick={handleGeminiClick}
            disabled={isAnalyzingGemini}
            className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            title="Gửi khung hình hiện tại cho Gemini AI phân tích sâu"
          >
            {isAnalyzingGemini ? (
              <>
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-600" />
                Hỏi Gemini AI
              </>
            )}
          </button>
        )}
      </div>

      {/* Mobile-Friendly Usage Tip */}
      <div className="w-full mt-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-600">
        <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span className="leading-tight">
          <strong>Mẹo:</strong> Để điện thoại cố định trên bàn, giơ bàn tay cách camera 30–50cm trong điều kiện đủ sáng.
        </span>
      </div>
    </div>
  );
};
