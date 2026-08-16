import { fastRecognizeStrokes, FastRecognitionResult, Point2D } from "./fastStrokeRecognizer";
import { soundManager } from "./soundEffects";

export type AirCanvasState = "INACTIVE" | "ACTIVE" | "CALCULATED";

export type DrawMode = "PINCH" | "INDEX_AIR_PEN";

export type RecognitionState = "IDLE" | "DRAWING" | "WAITING_AUTO_RECOGNIZE" | "RECOGNIZING" | "RECOGNIZED";

export type SingleHandGesture =
  | "INDEX_FINGER_UP" // Bật bảng (Activation)
  | "PINCH_DRAW" // Vẽ (Drawing)
  | "FIST" // Nắm tay -> Tính toán ngay (Submit & Calculate)
  | "OPEN_PALM" // Xòe bàn tay -> Xóa & Trả quyền (Reset)
  | "UNKNOWN";

export interface AirCanvasParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ArenaContextData {
  question: string;
  correctAnswer: number;
  isSolved?: boolean;
}

export interface AirCanvasFrameData {
  isActive: boolean;
  state: AirCanvasState;
  drawMode: DrawMode;
  currentGesture: SingleHandGesture;
  isDrawing: boolean;
  pointerPos: Point2D | null;
  pinchProximity: number; // 0 to 1 (1 = fully touching)
  strokesCount: number;
  fastOcr: FastRecognitionResult | null;
  gestureHint: string;
  currentColor: string;
  colorPalette: string[];
  justCalculated: boolean;
  justReset: boolean;
  arenaContext: ArenaContextData | null;
  twoHandsCloseProgress: number;
  twoHandsCloseDetected: boolean;
  recognitionState: RecognitionState;
  autoRecognizeProgress: number; // 0 - 100%
}

export const AIR_CANVAS_COLORS = [
  "#06B6D4", // Neon Cyan
  "#A855F7", // Neon Purple
  "#10B981", // Emerald
  "#F59E0B", // Amber Gold
  "#EC4899", // Neon Pink
  "#3B82F6", // Laser Blue
];

export class AirCanvasEngine {
  public state: AirCanvasState = "ACTIVE"; // Active by default for immediate drawing experience
  public drawMode: DrawMode = "PINCH";
  public strokes: Array<{ points: Point2D[]; color: string; width: number }> = [];
  public currentStroke: Point2D[] | null = null;
  public currentColor: string = AIR_CANVAS_COLORS[0];
  public strokeWidth: number = 6;
  public particles: AirCanvasParticle[] = [];
  public fastOcr: FastRecognitionResult | null = null;
  public arenaContext: ArenaContextData | null = null;

  // Single Hand Gesture Detection State
  public currentGesture: SingleHandGesture = "UNKNOWN";
  public gestureHint: string = "Chụm ngón cái & trỏ để vẽ • Xòe tay để nhấc bút";

  // Coordinates smoothing filter state (Dynamic adaptive One-Euro / EMA filter)
  private smoothedPointer: Point2D = { x: 0, y: 0, z: 0 };
  private hasSmoothedPointer: boolean = false;
  private prevRawPointer: Point2D | null = null;

  // Hysteresis & Grace buffer for continuous unbroken strokes
  private isCurrentlyPinching: boolean = false;
  private lastDrawReleaseTime: number = 0;
  private readonly DRAW_GRACE_PERIOD_MS = 180;

  // Smart Deferred Recognition System
  public recognitionState: RecognitionState = "IDLE";
  private lastPenUpTime: number = 0;
  private readonly AUTO_RECOGNIZE_DELAY_MS = 950; // 950ms after pen up -> auto recognize
  private autoRecognizeProgress: number = 0;

  // Gesture hold timers
  private lastActivationTime: number = 0;
  private lastCalculateTime: number = 0;
  private lastResetTime: number = 0;
  private fistHoldStartTime: number = 0;
  private openPalmHoldStartTime: number = 0;
  private twoHandsCloseStartTime: number = 0;

  private canvasWidth: number = 640;
  private canvasHeight: number = 480;
  private pointerProximity: number = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.state = "ACTIVE";
    this.strokes = [];
    this.currentStroke = null;
    this.particles = [];
    this.fastOcr = null;
    this.currentGesture = "UNKNOWN";
    this.gestureHint = "Chụm ngón cái & trỏ để vẽ • Xòe tay để nhấc bút";
    this.fistHoldStartTime = 0;
    this.openPalmHoldStartTime = 0;
    this.twoHandsCloseStartTime = 0;
    this.isCurrentlyPinching = false;
    this.hasSmoothedPointer = false;
    this.prevRawPointer = null;
    this.lastDrawReleaseTime = 0;
    this.lastPenUpTime = 0;
    this.recognitionState = "IDLE";
    this.autoRecognizeProgress = 0;
  }

  public setDrawMode(mode: DrawMode) {
    this.drawMode = mode;
  }

  public setArenaContext(context: ArenaContextData | null) {
    this.arenaContext = context;
  }

  public setActive(active: boolean) {
    if (active) {
      this.state = "ACTIVE";
      this.gestureHint =
        this.drawMode === "PINCH"
          ? "Chụm ngón cái & trỏ để vẽ • Xòe tay để nhấc bút • Tự động nhận diện khi vẽ xong"
          : "Di chuyển ngón trỏ ☝️ để vẽ tự do • Nắm tay ✊ để tính • Xòe tay 🖐️ để xóa";
      soundManager.playHologramOpen();
    } else {
      this.state = "INACTIVE";
      this.currentStroke = null;
      this.gestureHint = "Giơ ngón trỏ ☝️ hoặc bấm Bảng 3D để bật";
    }
  }

  public toggleActive(): boolean {
    const next = this.state === "INACTIVE";
    this.setActive(next);
    return next;
  }

  public clearCanvas(silent: boolean = false) {
    this.strokes = [];
    this.currentStroke = null;
    this.fastOcr = null;
    this.state = "ACTIVE";
    this.recognitionState = "IDLE";
    this.lastPenUpTime = 0;
    this.autoRecognizeProgress = 0;
    if (!silent) {
      this.spawnResetParticles();
      soundManager.playWhoosh();
    }
  }

  public undoStroke() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      if (this.strokes.length > 0) {
        this.triggerManualRecognition();
      } else {
        this.fastOcr = null;
        this.recognitionState = "IDLE";
      }
    }
  }

  public setColor(color: string) {
    this.currentColor = color;
  }

  /**
   * Triggers manual immediate recognition of all currently drawn strokes
   */
  public triggerManualRecognition(): FastRecognitionResult | null {
    if (this.strokes.length === 0 && (!this.currentStroke || this.currentStroke.length === 0)) {
      return null;
    }

    // Finalize current stroke if active
    if (this.currentStroke && this.currentStroke.length >= 1) {
      this.strokes.push({
        points: this.smoothPath(this.currentStroke),
        color: this.currentColor,
        width: this.strokeWidth,
      });
      this.currentStroke = null;
    }

    this.runFastOcr();
    this.recognitionState = "RECOGNIZED";
    this.autoRecognizeProgress = 100;
    this.state = "CALCULATED";
    soundManager.playSubmitSuccess();
    this.spawnRecognitionParticles();

    return this.fastOcr;
  }

  /**
   * Fast Single-Hand Landmark Classifier with PINCH CENTER PEN-TIP & Hysteresis
   * 
   * Trạng thái Vẽ (Hạ bút): Chụm đỉnh ngón cái và đỉnh ngón trỏ lại (tâm điểm chụm là đầu bút).
   * Trạng thái Di chuyển (Nhấc bút): Xòe ngón cái và ngón trỏ ra.
   */
  private classifySingleHand(landmarks: Array<{ x: number; y: number; z?: number }>): {
    gesture: SingleHandGesture;
    rawPointer: Point2D;
    isPinchTriggered: boolean;
    proximity: number;
    isIndexUpOnly: boolean;
  } {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const indexDip = landmarks[7];
    const indexPip = landmarks[6];
    const indexMcp = landmarks[5];
    const middleTip = landmarks[12];
    const middlePip = landmarks[10];
    const middleMcp = landmarks[9];
    const ringTip = landmarks[16];
    const ringPip = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyPip = landmarks[18];

    // Palm scale reference (distance from wrist to middle finger knuckle)
    const handScale = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y) || 0.22;

    // Check finger extensions
    const isIndexExtended = indexTip.y < indexPip.y - 0.015;
    const isMiddleExtended = middleTip.y < middlePip.y - 0.015;
    const isRingExtended = ringTip.y < ringPip.y - 0.015;
    const isPinkyExtended = pinkyTip.y < pinkyPip.y - 0.015;

    const thumbSpread = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y);
    const isThumbExtended = thumbSpread > 0.12;

    // 1. FIST GESTURE (All 4 fingers curled down) -> Tính toán / Nộp bài ngay
    const isFist = !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;
    if (isFist) {
      this.isCurrentlyPinching = false;
      return {
        gesture: "FIST",
        rawPointer: { x: indexTip.x, y: indexTip.y, z: indexTip.z },
        isPinchTriggered: false,
        proximity: 0,
        isIndexUpOnly: false,
      };
    }

    // 2. OPEN PALM GESTURE (All fingers extended open) -> Xóa bảng
    const isOpenPalm =
      isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && isThumbExtended;
    if (isOpenPalm) {
      this.isCurrentlyPinching = false;
      return {
        gesture: "OPEN_PALM",
        rawPointer: { x: indexTip.x, y: indexTip.y, z: indexTip.z },
        isPinchTriggered: false,
        proximity: 0,
        isIndexUpOnly: false,
      };
    }

    // Calculate Euclidean distance between thumb tip and index tip & index DIP joint
    const distToTip = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const distToDip = Math.hypot(thumbTip.x - indexDip.x, thumbTip.y - indexDip.y);
    const minPinchDist = Math.min(distToTip, distToDip);

    // Scale-adaptive pinch ratio (relative to palm size)
    const pinchRatio = minPinchDist / handScale;

    // Responsive Hysteresis threshold
    // Enter pinch (Hạ bút): Chụm đỉnh ngón cái và ngón trỏ
    const PINCH_ENTER_RATIO = 0.44;
    // Exit pinch (Nhấc bút): Xòe ngón cái và ngón trỏ ra
    const PINCH_EXIT_RATIO = 0.62;

    if (!this.isCurrentlyPinching && (pinchRatio < PINCH_ENTER_RATIO || minPinchDist < 0.085)) {
      this.isCurrentlyPinching = true;
    } else if (this.isCurrentlyPinching && (pinchRatio > PINCH_EXIT_RATIO || minPinchDist > 0.13)) {
      this.isCurrentlyPinching = false;
    }

    // Proximity metric: 0 (wide open) to 1.0 (fully pinched touching)
    const proximity = Math.max(0, Math.min(1, (0.65 - pinchRatio) / (0.65 - 0.22)));

    // TÂM CỦA ĐIỂM CHỤM LÀM ĐẦU BÚT KHI HẠ BÚT:
    // Midpoint between Thumb Tip (landmark 4) and Index Tip (landmark 8)
    const pinchCenter: Point2D = {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2,
      z: ((thumbTip.z || 0) + (indexTip.z || 0)) / 2,
    };

    // Smoothly blend pointer towards pinch center as fingers approach
    const blend = Math.max(0, Math.min(1, proximity));
    const rawPointer: Point2D = this.isCurrentlyPinching
      ? pinchCenter
      : {
          x: indexTip.x * (1 - blend) + pinchCenter.x * blend,
          y: indexTip.y * (1 - blend) + pinchCenter.y * blend,
          z: indexTip.z,
        };

    // 3. PINCH DRAW (Hạ bút vẽ)
    if (this.isCurrentlyPinching) {
      return { gesture: "PINCH_DRAW", rawPointer, isPinchTriggered: true, proximity, isIndexUpOnly: false };
    }

    // 4. INDEX FINGER UP ONLY (Pointing)
    const isIndexUpOnly = isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;
    if (isIndexUpOnly) {
      return {
        gesture: "INDEX_FINGER_UP",
        rawPointer: { x: indexTip.x, y: indexTip.y, z: indexTip.z },
        isPinchTriggered: false,
        proximity,
        isIndexUpOnly: true,
      };
    }

    return { gesture: "UNKNOWN", rawPointer, isPinchTriggered: false, proximity, isIndexUpOnly: false };
  }

  /**
   * Main Real-time Processing Loop with Smart Deferred Recognition & Adaptive Filtering
   */
  public processHands(
    landmarksList: Array<Array<{ x: number; y: number; z?: number }>>,
    width: number,
    height: number
  ): AirCanvasFrameData {
    this.canvasWidth = width;
    this.canvasHeight = height;

    const now = Date.now();
    let justCalculated = false;
    let justReset = false;

    if (!landmarksList || landmarksList.length === 0) {
      this.hasSmoothedPointer = false;
      this.isCurrentlyPinching = false;
      this.twoHandsCloseStartTime = 0;
      this.prevRawPointer = null;

      // If a stroke is active, finalize it
      if (this.currentStroke && this.currentStroke.length >= 1) {
        this.strokes.push({
          points: this.smoothPath(this.currentStroke),
          color: this.currentColor,
          width: this.strokeWidth,
        });
        this.currentStroke = null;
        this.lastPenUpTime = now;
        this.recognitionState = "WAITING_AUTO_RECOGNIZE";
      }

      // Check auto-recognition timer even when hands leave screen
      this.handleDeferredRecognition(now);

      return {
        isActive: this.state !== "INACTIVE",
        state: this.state,
        drawMode: this.drawMode,
        currentGesture: "UNKNOWN",
        isDrawing: false,
        pointerPos: null,
        pinchProximity: 0,
        strokesCount: this.strokes.length,
        fastOcr: this.fastOcr,
        gestureHint: this.gestureHint,
        currentColor: this.currentColor,
        colorPalette: AIR_CANVAS_COLORS,
        justCalculated: false,
        justReset: false,
        arenaContext: this.arenaContext,
        twoHandsCloseProgress: 0,
        twoHandsCloseDetected: false,
        recognitionState: this.recognitionState,
        autoRecognizeProgress: this.autoRecognizeProgress,
      };
    }

    // =========================================================================
    // TWO-HANDS PROXIMITY DETECTION: Chụm 2 bàn tay sát nhau 1s để kích hoạt Bảng 3D
    // =========================================================================
    let twoHandsCloseDetected = false;
    let twoHandsCloseProgress = 0;

    if (landmarksList.length >= 2) {
      const h1 = landmarksList[0];
      const h2 = landmarksList[1];
      if (h1 && h2 && h1.length >= 10 && h2.length >= 10) {
        const wristDist = Math.hypot(h1[0].x - h2[0].x, h1[0].y - h2[0].y);
        const palmDist = Math.hypot(h1[9].x - h2[9].x, h1[9].y - h2[9].y);
        const indexTipsDist = Math.hypot(h1[8].x - h2[8].x, h1[8].y - h2[8].y);
        const thumbsDist = Math.hypot(h1[4].x - h2[4].x, h1[4].y - h2[4].y);

        const minProximity = Math.min(palmDist, wristDist, (indexTipsDist + thumbsDist) / 2);

        if (minProximity < 0.22 || (palmDist < 0.24 && wristDist < 0.28)) {
          twoHandsCloseDetected = true;
          if (this.twoHandsCloseStartTime === 0) {
            this.twoHandsCloseStartTime = now;
          }
          const holdTime = now - this.twoHandsCloseStartTime;
          twoHandsCloseProgress = Math.min(100, Math.round((holdTime / 1000) * 100));

          if (holdTime >= 1000 && now - this.lastActivationTime > 1500) {
            this.lastActivationTime = now;
            this.twoHandsCloseStartTime = 0;
            this.setActive(true);
            soundManager.playHologramOpen();
            this.gestureHint = "✨ Đã kích hoạt Bảng vẽ 3D (Chụm 2 tay 1s)!";
          }
        } else {
          this.twoHandsCloseStartTime = 0;
        }
      }
    } else {
      this.twoHandsCloseStartTime = 0;
    }

    // Find active drawing hand among detected hands
    let bestClassification = this.classifySingleHand(landmarksList[0]);

    if (landmarksList.length > 1) {
      for (let i = 1; i < landmarksList.length; i++) {
        const candidate = this.classifySingleHand(landmarksList[i]);
        if (candidate.isPinchTriggered || candidate.isIndexUpOnly) {
          bestClassification = candidate;
          break;
        } else if (
          bestClassification.gesture === "UNKNOWN" &&
          (candidate.gesture === "FIST" || candidate.gesture === "OPEN_PALM")
        ) {
          bestClassification = candidate;
        }
      }
    }

    const { gesture, rawPointer, isPinchTriggered, proximity, isIndexUpOnly } =
      bestClassification;
    this.currentGesture = gesture;
    this.pointerProximity = proximity;

    // DYNAMIC ADAPTIVE ONE-EURO STYLE FILTER FOR ZERO-JITTER SMOOTH DRAWING
    const rawPx = rawPointer.x * width;
    const rawPy = rawPointer.y * height;
    const rawPz = (rawPointer.z || 0) * 100;

    if (!this.hasSmoothedPointer) {
      this.smoothedPointer = { x: rawPx, y: rawPy, z: rawPz, time: now };
      this.hasSmoothedPointer = true;
      this.prevRawPointer = { x: rawPx, y: rawPy, z: rawPz, time: now };
    } else {
      const prev = this.prevRawPointer || { x: rawPx, y: rawPy, z: rawPz, time: now };
      const dt = Math.max(1, (now - (prev.time || now)) / 1000);
      const dist = Math.hypot(rawPx - prev.x, rawPy - prev.y);
      const velocity = dist / dt; // pixels per second

      // Dynamic alpha: High responsiveness on fast strokes, heavy smoothing on slow/subtle motion
      const alpha = isPinchTriggered
        ? Math.min(0.85, Math.max(0.40, velocity / 1200))
        : Math.min(0.90, Math.max(0.45, velocity / 1000));

      this.smoothedPointer = {
        x: this.smoothedPointer.x * (1 - alpha) + rawPx * alpha,
        y: this.smoothedPointer.y * (1 - alpha) + rawPy * alpha,
        z: (this.smoothedPointer.z || 0) * (1 - alpha) + rawPz * alpha,
        time: now,
      };

      this.prevRawPointer = { x: rawPx, y: rawPy, z: rawPz, time: now };
    }

    // Auto-activate on any drawing intent
    if (this.state === "INACTIVE" && (isPinchTriggered || isIndexUpOnly)) {
      this.state = "ACTIVE";
    }

    // Determine drawing intent based on DrawMode
    let isDrawingNow = false;
    if (this.state === "ACTIVE") {
      if (this.drawMode === "PINCH") {
        isDrawingNow = isPinchTriggered;
      } else if (this.drawMode === "INDEX_AIR_PEN") {
        isDrawingNow = isIndexUpOnly;
      }
    }

    // =========================================================================
    // STATE MACHINE & GESTURES
    // =========================================================================

    // 1. ACTIVATION (INDEX_FINGER_UP)
    if (gesture === "INDEX_FINGER_UP") {
      if (this.state === "INACTIVE" && now - this.lastResetTime > 600) {
        this.state = "ACTIVE";
        this.lastActivationTime = now;
        this.gestureHint = "✨ Bảng 3D đã bật! Chụm ngón cái & trỏ để hạ bút vẽ";
        soundManager.playHologramOpen();
      }
    }

    // 2. ACTIVE CANVAS CONTROLS
    if (this.state === "ACTIVE" || this.state === "CALCULATED") {
      // (a) RESET / CLEAR & CLOSE (OPEN_PALM)
      if (gesture === "OPEN_PALM") {
        if (this.openPalmHoldStartTime === 0) {
          this.openPalmHoldStartTime = now;
        } else if (now - this.openPalmHoldStartTime > 240 && now - this.lastResetTime > 600) {
          this.clearCanvas(false);
          this.state = "INACTIVE";
          this.lastResetTime = now;
          this.openPalmHoldStartTime = 0;
          justReset = true;
          this.gestureHint = "🖐️ Đã xòe tay: Xóa bảng vẽ";
        }
      } else {
        this.openPalmHoldStartTime = 0;
      }

      // (b) IMMEDIATE SUBMIT & CALCULATE (FIST)
      if (gesture === "FIST") {
        if (this.fistHoldStartTime === 0) {
          this.fistHoldStartTime = now;
        } else if (
          now - this.fistHoldStartTime > 160 &&
          now - this.lastCalculateTime > 650 &&
          (this.strokes.length > 0 || this.currentStroke)
        ) {
          this.triggerManualRecognition();
          this.lastCalculateTime = now;
          this.fistHoldStartTime = 0;
          justCalculated = true;
          this.gestureHint = "✊ Nắm tay: Đã nhận diện kết quả!";
        }
      } else {
        this.fistHoldStartTime = 0;
      }

      // (c) DRAWING DISPATCHER WITH PINCH-DOWN & PEN-UP
      if (this.state === "ACTIVE") {
        const pt: Point2D = {
          x: this.smoothedPointer.x,
          y: this.smoothedPointer.y,
          z: this.smoothedPointer.z,
          time: now,
        };

        if (isDrawingNow) {
          // --- TRẠNG THÁI HẠ BÚT (VẼ) ---
          this.lastDrawReleaseTime = 0;
          this.lastPenUpTime = 0;
          this.autoRecognizeProgress = 0;
          this.recognitionState = "DRAWING";

          if (!this.currentStroke) {
            this.currentStroke = [pt];
            soundManager.playPenTouch();
          } else {
            const last = this.currentStroke[this.currentStroke.length - 1];
            const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
            // Record smooth points with minimal displacement
            if (dist > 1.8) {
              // Interpolate intermediate sub-points if moving fast to prevent angular corners
              if (dist > 12.0) {
                const steps = Math.min(4, Math.floor(dist / 8));
                for (let k = 1; k < steps; k++) {
                  const frac = k / steps;
                  this.currentStroke.push({
                    x: last.x + frac * (pt.x - last.x),
                    y: last.y + frac * (pt.y - last.y),
                    time: now - (steps - k) * 3,
                  });
                }
              }
              this.currentStroke.push(pt);
              this.spawnPinchParticles(pt.x, pt.y);
            }
          }
          this.gestureHint = "✍️ Đang hạ bút vẽ nét... Xòe tay ra để nhấc bút";
        } else {
          // --- TRẠNG THÁI NHẤC BÚT (DI CHUYỂN) ---
          if (this.currentStroke) {
            if (this.lastDrawReleaseTime === 0) {
              this.lastDrawReleaseTime = now;
            } else if (now - this.lastDrawReleaseTime > this.DRAW_GRACE_PERIOD_MS) {
              // Grace period expired -> Finalize this stroke smoothly
              if (this.currentStroke.length >= 1) {
                this.strokes.push({
                  points: this.smoothPath(this.currentStroke),
                  color: this.currentColor,
                  width: this.strokeWidth,
                });
              }
              this.currentStroke = null;
              this.lastDrawReleaseTime = 0;
              this.lastPenUpTime = now;
              this.recognitionState = "WAITING_AUTO_RECOGNIZE";
            }
          }

          // Smart Deferred Recognition evaluation
          this.handleDeferredRecognition(now);
        }
      }
    }

    return {
      isActive: this.state !== "INACTIVE",
      state: this.state,
      drawMode: this.drawMode,
      currentGesture: this.currentGesture,
      isDrawing: isDrawingNow,
      pointerPos: {
        x: this.smoothedPointer.x / width,
        y: this.smoothedPointer.y / height,
      },
      pinchProximity: proximity,
      strokesCount: this.strokes.length + (this.currentStroke ? 1 : 0),
      fastOcr: this.fastOcr,
      gestureHint: this.gestureHint,
      currentColor: this.currentColor,
      colorPalette: AIR_CANVAS_COLORS,
      justCalculated,
      justReset,
      arenaContext: this.arenaContext,
      twoHandsCloseProgress,
      twoHandsCloseDetected,
      recognitionState: this.recognitionState,
      autoRecognizeProgress: this.autoRecognizeProgress,
    };
  }

  /**
   * Smart Deferred Recognition: Runs OCR ONLY when user finishes drawing (idle after pen up)
   */
  private handleDeferredRecognition(now: number) {
    if (
      this.recognitionState === "WAITING_AUTO_RECOGNIZE" &&
      this.strokes.length > 0 &&
      this.lastPenUpTime > 0
    ) {
      const elapsed = now - this.lastPenUpTime;
      const progress = Math.min(100, Math.round((elapsed / this.AUTO_RECOGNIZE_DELAY_MS) * 100));
      this.autoRecognizeProgress = progress;

      if (elapsed >= this.AUTO_RECOGNIZE_DELAY_MS) {
        // User finished drawing all strokes -> Run high-speed vector recognition!
        this.runFastOcr();
        this.recognitionState = "RECOGNIZED";
        this.lastPenUpTime = 0;
        this.autoRecognizeProgress = 100;
        this.state = "CALCULATED";

        soundManager.playSubmitSuccess();
        this.spawnRecognitionParticles();

        if (this.fastOcr && this.fastOcr.calculatedValue !== null) {
          this.gestureHint = `🎯 Đã nhận diện: ${this.fastOcr.formulaDisplay}`;
        } else {
          this.gestureHint = "🎯 Đã nhận diện nét vẽ!";
        }
      } else {
        const remainingSec = ((this.AUTO_RECOGNIZE_DELAY_MS - elapsed) / 1000).toFixed(1);
        this.gestureHint = `⏳ Đã nhấc bút • Tự động nhận diện sau ${remainingSec}s hoặc Nắm tay ✊`;
      }
    }
  }

  /**
   * Chaikin's Algorithm + Corner smoothing to produce velvety round lines
   */
  private smoothPath(points: Point2D[]): Point2D[] {
    if (points.length < 3) return points;
    const smoothed: Point2D[] = [points[0]];

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      const q: Point2D = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
      };
      const r: Point2D = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
      };

      smoothed.push(q);
      smoothed.push(r);
    }
    smoothed.push(points[points.length - 1]);
    return smoothed;
  }

  private runFastOcr() {
    const rawStrokes = this.strokes.map((s) => ({
      points: s.points.map((p) => ({ x: p.x, y: p.y })),
    }));
    this.fastOcr = fastRecognizeStrokes(rawStrokes);
  }

  private spawnPinchParticles(x: number, y: number) {
    if (this.particles.length > 40) return;
    this.particles.push({
      x,
      y,
      z: 0,
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 2.2,
      color: this.currentColor,
      size: Math.random() * 3 + 1.8,
      alpha: 1.0,
      life: 0,
      maxLife: 14,
    });
  }

  private spawnRecognitionParticles() {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const speed = Math.random() * 5 + 3;
      this.particles.push({
        x: centerX,
        y: centerY,
        z: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: this.currentColor,
        size: Math.random() * 3.5 + 2,
        alpha: 1.0,
        life: 0,
        maxLife: 22,
      });
    }
  }

  private spawnResetParticles() {
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x: this.canvasWidth / 2 + (Math.random() - 0.5) * 120,
        y: this.canvasHeight / 2 + (Math.random() - 0.5) * 80,
        z: 0,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: "#06B6D4",
        size: Math.random() * 4 + 2,
        alpha: 1.0,
        life: 0,
        maxLife: 20,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Ultra-Smooth 3D Canvas Rendering (Quadratic Bézier Splines + Air-Brush Reticle)
   */
  public renderToCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.state === "INACTIVE") return;

    ctx.save();

    // 1. Holographic Workspace Frame
    this.renderHolographicFrame(ctx, width, height);

    // 2. Render Completed 3D Strokes (Velvety Smooth Quadratic Bézier)
    for (const stroke of this.strokes) {
      this.renderSmoothBezierPath(ctx, stroke.points, stroke.color, stroke.width);
    }

    // 3. Render Active Drawing Stroke
    if (this.currentStroke && this.currentStroke.length >= 1) {
      this.renderSmoothBezierPath(ctx, this.currentStroke, this.currentColor, this.strokeWidth + 1);
    }

    // 4. Render Spark Particles
    this.updateParticles();
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // 5. Render Interactive Air-Pen Cursor Reticle (Visual Pinch Guidance)
    if (this.hasSmoothedPointer) {
      this.renderAirPenReticle(ctx, this.smoothedPointer.x, this.smoothedPointer.y);
    }

    // 6. Render 3D HUD (Arena/Fast Math Result & Countdown)
    this.render3DHud(ctx, width, height);

    ctx.restore();
  }

  private renderAirPenReticle(ctx: CanvasRenderingContext2D, px: number, py: number) {
    ctx.save();
    const isDrawing = this.currentStroke !== null || this.isCurrentlyPinching;

    if (isDrawing) {
      // --- HẠ BÚT (PINCH DOWN): TÂM CHỤM LÀM ĐẦU BÚT PHÁT QUANG RỰC RỠ ---
      // Glowing Laser Tip
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = this.currentColor;
      ctx.shadowBlur = 18;
      ctx.fill();

      // Outer vibrant ripple ring
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.strokeStyle = this.currentColor;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Mini Pen Tip Tag (flipped so readable)
      ctx.save();
      ctx.translate(px, py - 18);
      ctx.scale(-1, 1);
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.fillStyle = "#FDE047";
      ctx.textAlign = "center";
      ctx.fillText("✍️ ĐẦU BÚT (HẠ BÚT)", 0, 0);
      ctx.restore();
    } else {
      // --- NHẤC BÚT (PEN UP / HOVER): VÒNG NGẮM TÂM CHỤM ---
      const ringRadius = 8 + (1 - this.pointerProximity) * 14;
      ctx.beginPath();
      ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = this.pointerProximity > 0.6 ? "#FDE047" : "rgba(56, 189, 248, 0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.shadowColor = "#38BDF8";
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Center crosshair dot
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = this.pointerProximity > 0.6 ? "#FDE047" : "#38BDF8";
      ctx.fill();
    }

    ctx.restore();
  }

  private renderHolographicFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const pad = 10;
    const cornerSize = 20;

    ctx.save();
    ctx.strokeStyle = "#06B6D4";
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "#38BDF8";
    ctx.shadowBlur = 10;

    // 4 Glowing corner brackets
    ctx.beginPath();
    ctx.moveTo(pad, pad + cornerSize);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + cornerSize, pad);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - pad - cornerSize, pad);
    ctx.lineTo(width - pad, pad);
    ctx.lineTo(width - pad, pad + cornerSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pad, height - pad - cornerSize);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(pad + cornerSize, height - pad);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - pad - cornerSize, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad, height - pad - cornerSize);
    ctx.stroke();

    // Mode & Status Indicator at Top
    ctx.save();
    ctx.translate(width / 2, pad + 14);
    ctx.scale(-1, 1);
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillStyle = this.isCurrentlyPinching ? "#FDE047" : "#38BDF8";
    ctx.textAlign = "center";
    const statusText = this.isCurrentlyPinching
      ? "✍️ ĐANG HẠ BÚT VẼ (CHỤM NGÓN)"
      : "🖐️ NHẤC BÚT (XÒE NGÓN DI CHUYỂN)";
    ctx.fillText(`✦ BẢNG VẼ AIR-CANVAS • ${statusText} ✦`, 0, 0);
    ctx.restore();

    ctx.restore();
  }

  /**
   * Quadratic Bézier Spline rendering for velvet-smooth unbroken strokes
   */
  private renderSmoothBezierPath(
    ctx: CanvasRenderingContext2D,
    pts: Point2D[],
    color: string,
    width: number
  ) {
    if (!pts || pts.length === 0) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (pts.length === 1) {
      // Render single point dot
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, width / 2 + 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, Math.max(2, width / 2 - 1), 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.restore();
      return;
    }

    // 1. Wide Neon Glow Layer
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

    ctx.strokeStyle = color;
    ctx.lineWidth = width + 6;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.65;
    ctx.stroke();

    // 2. High-Definition Inner Core
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(3, width - 1);
    ctx.shadowBlur = 5;
    ctx.globalAlpha = 1.0;
    ctx.stroke();

    ctx.restore();
  }

  private render3DHud(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    const badgeW = 290;
    const badgeH = 54;
    const badgeX = (width - badgeW) / 2;
    const badgeY = height - 70;

    let isCorrect = false;
    if (this.arenaContext && this.fastOcr && this.fastOcr.calculatedValue !== null) {
      isCorrect = this.fastOcr.calculatedValue === this.arenaContext.correctAnswer;
    }

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
    ctx.fillStyle = isCorrect
      ? "rgba(6, 78, 59, 0.94)"
      : this.recognitionState === "WAITING_AUTO_RECOGNIZE"
      ? "rgba(30, 27, 75, 0.92)"
      : "rgba(15, 23, 42, 0.90)";
    ctx.strokeStyle = isCorrect
      ? "#10B981"
      : this.recognitionState === "WAITING_AUTO_RECOGNIZE"
      ? "#F59E0B"
      : "#06B6D4";
    ctx.lineWidth = 2;
    ctx.shadowColor = isCorrect ? "#10B981" : "#06B6D4";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.stroke();

    // Auto-Recognition progress bar at bottom of HUD
    if (this.recognitionState === "WAITING_AUTO_RECOGNIZE" && this.autoRecognizeProgress > 0) {
      const barW = (badgeW - 20) * (this.autoRecognizeProgress / 100);
      ctx.beginPath();
      ctx.roundRect(badgeX + 10, badgeY + badgeH - 5, barW, 3, 2);
      ctx.fillStyle = "#F59E0B";
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 6;
      ctx.fill();
    }

    // Flip horizontally so HUD text is readable on mirrored canvas
    ctx.save();
    ctx.translate(width / 2, badgeY);
    ctx.scale(-1, 1);

    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.fillStyle = isCorrect ? "#6EE7B7" : "#38BDF8";
    ctx.font = "bold 10px system-ui, sans-serif";

    if (this.arenaContext) {
      ctx.fillText(
        isCorrect ? "🎉 ĐÁP ÁN CHÍNH XÁC!" : `🧮 ĐẤU TRƯỜNG: ${this.arenaContext.question}`,
        0,
        15
      );
    } else {
      ctx.fillText("🧮 3D VECTOR MATH ENGINE", 0, 15);
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 15px monospace";

    if (isCorrect && this.arenaContext) {
      ctx.fillText(`KẾT QUẢ = ${this.arenaContext.correctAnswer} (+100đ)`, 0, 38);
    } else if (this.recognitionState === "WAITING_AUTO_RECOGNIZE") {
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillStyle = "#FDE047";
      ctx.fillText("⏳ Đang chờ nét tiếp theo...", 0, 38);
    } else if (this.recognitionState === "DRAWING") {
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillStyle = "#38BDF8";
      ctx.fillText("✍️ Đang hạ bút vẽ nét...", 0, 38);
    } else if (this.fastOcr && this.fastOcr.formulaDisplay) {
      ctx.fillText(this.fastOcr.formulaDisplay, 0, 38);
    } else {
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText("Chụm ngón để vẽ • Xòe tay nhấc bút", 0, 38);
    }

    ctx.restore();
    ctx.restore();
  }
}

export const airCanvasEngine = new AirCanvasEngine();
