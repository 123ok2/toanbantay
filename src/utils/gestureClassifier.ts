import { Landmark, GestureType, RecognitionResult, HandDetail } from "../types";
import { GESTURE_DICTIONARY } from "./gestureDictionary";

/**
 * Calculates Euclidean distance between two 3D landmarks
 */
function distance(a: Landmark, b: Landmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
  );
}

/**
 * Calculates 3D vector between two landmarks (b - a)
 */
function vector(a: Landmark, b: Landmark): { x: number; y: number; z: number } {
  return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
}

/**
 * Computes the angle in degrees between two 3D vectors
 */
function angleBetween(
  v1: { x: number; y: number; z: number },
  v2: { x: number; y: number; z: number }
): number {
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/**
 * Advanced Multi-Factor Finger Extension Classifier
 * Resolves loose fists, half-curled fingers, imperfect folds, and camera tilt
 */
function isStandardFingerExtended(
  mcp: Landmark,
  pip: Landmark,
  dip: Landmark,
  tip: Landmark,
  wrist: Landmark,
  palmCenter: Landmark,
  handLength: number
): boolean {
  // 1. Phân đoạn giải phẫu ngón tay (Finger joint segment lengths)
  const lenMcpPip = distance(mcp, pip);
  const lenPipDip = distance(pip, dip);
  const lenDipTip = distance(dip, tip);
  const totalFingerSegmentLength = lenMcpPip + lenPipDip + lenDipTip;

  if (totalFingerSegmentLength <= 0.001) return false;

  // 2. Tỷ lệ duỗi thẳng (Scale-Invariant Straightness Ratio)
  // Ngón duỗi thẳng: Tip cách xa MCP xấp xỉ bằng tổng chiều dài các đốt
  // Ngón gập/nắm (dù lỏng): Tip cuộn sát vào MCP => Straightness Ratio giảm mạnh
  const directMcpTip = distance(mcp, tip);
  const straightnessRatio = directMcpTip / totalFingerSegmentLength;

  // 3. Góc khớp PIP & DIP (Joint Flexion Angles)
  // Khi duỗi thẳng: Góc giữa vector (PIP - MCP) và (TIP - PIP) rất nhỏ (< 35 độ)
  // Khi gập lại: Góc gập lớn (> 60-80 độ)
  const vecMcpPip = vector(mcp, pip);
  const vecPipTip = vector(pip, tip);
  const jointFlexionAngle = angleBetween(vecMcpPip, vecPipTip);

  // 4. Khoảng cách tương đối tới tâm lòng bàn tay & cổ tay
  const dWristTip = distance(wrist, tip);
  const dWristPip = distance(wrist, pip);
  const dPalmTip = distance(palmCenter, tip);
  const dPalmMcp = distance(palmCenter, mcp);

  // 5. Chiều dọc hướng bàn tay (Hand Axis Alignment)
  // Vector trục bàn tay từ Wrist tới MCP
  const vecHandAxis = vector(wrist, mcp);
  const vecMcpTip = vector(mcp, tip);
  const axisDot =
    vecHandAxis.x * vecMcpTip.x +
    vecHandAxis.y * vecMcpTip.y +
    vecHandAxis.z * vecMcpTip.z;

  // === CÁC TIÊU CHÍ LOẠI TRỪ DỨT ĐOÁT (Definite Curl/Fold Detection) ===
  // A. Nếu góc gập > 60 độ => Chắc chắn ngón đang gập/cuộn vào lòng bàn tay
  if (jointFlexionAngle > 60) return false;

  // B. Nếu tỷ lệ duỗi thẳng < 0.70 => Ngón đang gập (nắm tay chưa chặt, cong ngón)
  if (straightnessRatio < 0.70) return false;

  // C. Nếu Tip gần cổ tay hơn PIP => Ngón đang cuộn ngược về phía cổ tay/lòng bàn tay
  if (dWristTip < dWristPip * 0.98) return false;

  // D. Nếu hình chiếu của ngón lên trục bàn tay âm hoặc quá nhỏ => Không duỗi theo hướng bàn tay
  if (axisDot < 0) return false;

  // E. Nếu Tip nằm quá gần tâm lòng bàn tay (so với chiều dài bàn tay)
  if (dPalmTip < dPalmMcp * 0.95 && straightnessRatio < 0.85) return false;

  // === TIÊU CHÍ DUỖI THẲNG CHUẨN XÁC (Strict Extension Confirmation) ===
  const isStraight = straightnessRatio >= 0.75;
  const isAligned = jointFlexionAngle < 45;
  const isExtendingFromWrist = dWristTip > dWristPip * 1.06;
  const isFarFromPalm = dPalmTip > dPalmMcp * 1.1;

  // Cần thỏa mãn đồng thời tính thẳng hàng và vươn xa khỏi lòng bàn tay
  return (isStraight && isAligned && isExtendingFromWrist) || (isStraight && isFarFromPalm && jointFlexionAngle < 40);
}

/**
 * Advanced Thumb Extension & Abduction Classifier
 * Strictly differentiates between thumb folded against palm / loose fist vs true extended thumb
 */
function isThumbExtended(
  cmc: Landmark,
  mcp: Landmark,
  ip: Landmark,
  tip: Landmark,
  wrist: Landmark,
  indexMcp: Landmark,
  middleMcp: Landmark,
  pinkyMcp: Landmark,
  palmCenter: Landmark,
  handScale: number
): { isExtended: boolean; pointingUp: boolean; pointingDown: boolean } {
  const lenCmcMcp = distance(cmc, mcp);
  const lenMcpIp = distance(mcp, ip);
  const lenIpTip = distance(ip, tip);
  const totalThumbLength = lenCmcMcp + lenMcpIp + lenIpTip;

  if (totalThumbLength <= 0.001) {
    return { isExtended: false, pointingUp: false, pointingDown: false };
  }

  // 1. Tỷ lệ duỗi của ngón cái
  const directCmcTip = distance(cmc, tip);
  const thumbStraightness = directCmcTip / totalThumbLength;

  // 2. Góc mở giữa các đốt ngón cái
  const vecCmcMcp = vector(cmc, mcp);
  const vecMcpTip = vector(mcp, tip);
  const thumbAngle = angleBetween(vecCmcMcp, vecMcpTip);

  // 3. Khoảng cách từ đầu ngón cái tới các khớp gốc ngón tay khác
  const dThumbIndexMcp = distance(tip, indexMcp);
  const dThumbMiddleMcp = distance(tip, middleMcp);
  const dThumbPinkyMcp = distance(tip, pinkyMcp);
  const dThumbPalmCenter = distance(tip, palmCenter);

  // 4. Khoảng cách tương đối so với kích thước bàn tay
  const normalizedIndexMcpDist = dThumbIndexMcp / (handScale || 0.1);
  const normalizedPinkyMcpDist = dThumbPinkyMcp / (handScale || 0.1);

  // Hướng ngón cái chỉ lên hoặc chỉ xuống
  const pointingUp = tip.y < mcp.y - 0.03 && tip.y < indexMcp.y - 0.02 && thumbStraightness > 0.72;
  const pointingDown = tip.y > mcp.y + 0.04 && tip.y > wrist.y && thumbStraightness > 0.72;

  // === CÁC TIÊU CHÍ NGÓN CÁI GẬP / NẮM VÀO LÒNG BÀN TAY (Folded / Curled Thumb) ===
  // - Nếu đầu ngón cái nằm áp sát gốc ngón trỏ hoặc ngón giữa (như khi nắm tay hoặc giơ 4 ngón)
  if (normalizedIndexMcpDist < 0.42 && !pointingUp && !pointingDown) {
    return { isExtended: false, pointingUp: false, pointingDown: false };
  }

  // - Nếu ngón cái cuộn cong (thumbStraightness thấp hoặc thumbAngle lớn)
  if (thumbStraightness < 0.68 || thumbAngle > 55) {
    return { isExtended: false, pointingUp: false, pointingDown: false };
  }

  // - Nếu ngón cái nằm quá gần tâm lòng bàn tay
  if (dThumbPalmCenter < handScale * 0.45 && !pointingUp) {
    return { isExtended: false, pointingUp: false, pointingDown: false };
  }

  // === TIÊU CHÍ NGÓN CÁI XÒE DUỖI THỰC SỰ (True Abducted / Extended Thumb) ===
  const isFarFromHand = normalizedIndexMcpDist >= 0.45 || normalizedPinkyMcpDist >= 0.75;
  const isStraightThumb = thumbStraightness >= 0.74 && thumbAngle < 45;

  const isExtended =
    (isStraightThumb && isFarFromHand) ||
    (pointingUp && isStraightThumb) ||
    (pointingDown && isStraightThumb);

  return { isExtended, pointingUp, pointingDown };
}

/**
 * Analyzes a single hand landmark set (21 points)
 * Returns extended finger status and total fingers count (0 to 5)
 */
export function analyzeSingleHandFingers(landmarks: Landmark[]) {
  if (!landmarks || landmarks.length < 21) {
    return {
      fingerCount: 0,
      extendedFingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
      thumbPointingUp: false,
      thumbPointingDown: false,
      handScale: 0.1,
    };
  }

  const wrist = landmarks[0];

  const thumbCMC = landmarks[1];
  const thumbMCP = landmarks[2];
  const thumbIP = landmarks[3];
  const thumbTip = landmarks[4];

  const indexMCP = landmarks[5];
  const indexPIP = landmarks[6];
  const indexDIP = landmarks[7];
  const indexTip = landmarks[8];

  const middleMCP = landmarks[9];
  const middlePIP = landmarks[10];
  const middleDIP = landmarks[11];
  const middleTip = landmarks[12];

  const ringMCP = landmarks[13];
  const ringPIP = landmarks[14];
  const ringDIP = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMCP = landmarks[17];
  const pinkyPIP = landmarks[18];
  const pinkyDIP = landmarks[19];
  const pinkyTip = landmarks[20];

  // Tính tâm lòng bàn tay (Palm Center)
  const palmCenter: Landmark = {
    x: (wrist.x + indexMCP.x + middleMCP.x + ringMCP.x + pinkyMCP.x) / 5,
    y: (wrist.y + indexMCP.y + middleMCP.y + ringMCP.y + pinkyMCP.y) / 5,
    z: (wrist.z + indexMCP.z + middleMCP.z + ringMCP.z + pinkyMCP.z) / 5,
  };

  const handScale = distance(wrist, middleMCP) || 0.1;

  // 1. Phân tích 4 ngón dài với bộ lọc chống nhận diện nhầm khi ngón gập/nửa chừng
  const indexExtended = isStandardFingerExtended(
    indexMCP,
    indexPIP,
    indexDIP,
    indexTip,
    wrist,
    palmCenter,
    handScale
  );

  const middleExtended = isStandardFingerExtended(
    middleMCP,
    middlePIP,
    middleDIP,
    middleTip,
    wrist,
    palmCenter,
    handScale
  );

  const ringExtended = isStandardFingerExtended(
    ringMCP,
    ringPIP,
    ringDIP,
    ringTip,
    wrist,
    palmCenter,
    handScale
  );

  const pinkyExtended = isStandardFingerExtended(
    pinkyMCP,
    pinkyPIP,
    pinkyDIP,
    pinkyTip,
    wrist,
    palmCenter,
    handScale
  );

  // 2. Phân tích ngón cái với bộ kiểm tra độ mở và khoảng cách lòng bàn tay
  const thumbResult = isThumbExtended(
    thumbCMC,
    thumbMCP,
    thumbIP,
    thumbTip,
    wrist,
    indexMCP,
    middleMCP,
    pinkyMCP,
    palmCenter,
    handScale
  );

  let count = 0;
  if (thumbResult.isExtended) count++;
  if (indexExtended) count++;
  if (middleExtended) count++;
  if (ringExtended) count++;
  if (pinkyExtended) count++;

  return {
    fingerCount: count,
    extendedFingers: {
      thumb: thumbResult.isExtended,
      index: indexExtended,
      middle: middleExtended,
      ring: ringExtended,
      pinky: pinkyExtended,
    },
    thumbPointingUp: thumbResult.pointingUp,
    thumbPointingDown: thumbResult.pointingDown,
    handScale,
  };
}

/**
 * Classifies a single hand gesture with robust disambiguation
 */
export function classifySingleHandGesture(landmarks: Landmark[]): { gestureId: GestureType; confidence: number } {
  if (!landmarks || landmarks.length < 21) {
    return { gestureId: "unknown", confidence: 0 };
  }

  const analysis = analyzeSingleHandFingers(landmarks);
  const { thumb, index, middle, ring, pinky } = analysis.extendedFingers;
  const { thumbPointingUp, thumbPointingDown } = analysis;
  const fingerCount = analysis.fingerCount;

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const thumbIndexDist = distance(thumbTip, indexTip) / (analysis.handScale || 0.1);

  let detectedId: GestureType = "unknown";
  let confidence = 85;

  // 1. Thumbs Up (👍)
  if (thumbPointingUp && !index && !middle && !ring && !pinky) {
    detectedId = "thumbs_up";
    confidence = 96;
  }
  // 2. Thumbs Down (👎)
  else if (thumbPointingDown && !index && !middle && !ring && !pinky) {
    detectedId = "thumbs_down";
    confidence = 96;
  }
  // 3. I Love You (🤟)
  else if (thumb && index && pinky && !middle && !ring) {
    detectedId = "love_you";
    confidence = 95;
  }
  // 4. Letter L (🤙 / L)
  else if (thumb && index && !middle && !ring && !pinky) {
    detectedId = "letter_l";
    confidence = 93;
  }
  // 5. Letter Y / Call Me (🤙 / Y)
  else if (thumb && pinky && !index && !middle && !ring) {
    detectedId = "letter_y";
    confidence = 93;
  }
  // 6. Letter I (🖐️ / I)
  else if (pinky && !index && !middle && !ring && !thumb) {
    detectedId = "letter_i";
    confidence = 91;
  }
  // 7. Letter V / Peace / Number 2 (✌️)
  else if (index && middle && !ring && !pinky && !thumb) {
    detectedId = "letter_v";
    confidence = 95;
  }
  // 8. OK Sign / Letter O (👌)
  else if (thumbIndexDist < 0.38 && middle && ring) {
    detectedId = "ok_sign";
    confidence = 92;
  }
  // 9. Point Up / Number 1 (☝️)
  else if (index && !middle && !ring && !pinky && !thumb) {
    detectedId = "point_up";
    confidence = 94;
  }
  // 10. Open Palm / Number 5 / Hello (✋)
  else if (fingerCount === 5 || (index && middle && ring && pinky && thumb)) {
    detectedId = "open_palm";
    confidence = 96;
  }
  // 11. Fist / Letter S / Number 0 (✊)
  else if (fingerCount === 0 || (!index && !middle && !ring && !pinky && !thumb)) {
    detectedId = "fist";
    confidence = 95;
  }
  // Number fallbacks based on exact analyzed count
  else if (fingerCount === 1) {
    detectedId = "number_1";
    confidence = 92;
  } else if (fingerCount === 2) {
    detectedId = "number_2";
    confidence = 92;
  } else if (fingerCount === 3) {
    detectedId = "number_3";
    confidence = 92;
  } else if (fingerCount === 4) {
    detectedId = "number_4";
    confidence = 92;
  } else if (fingerCount === 5) {
    detectedId = "number_5";
    confidence = 96;
  }

  return { gestureId: detectedId, confidence };
}

/**
 * Primary Classifier for 1 or 2 hands
 * Dynamically counts numbers across both hands (0 to 10)
 */
export function classifyMultipleHands(landmarksList: Landmark[][]): RecognitionResult {
  const timestamp = Date.now();

  if (!landmarksList || landmarksList.length === 0) {
    return {
      gestureId: "unknown",
      name: GESTURE_DICTIONARY.unknown.name,
      emoji: GESTURE_DICTIONARY.unknown.emoji,
      confidence: 0,
      handDetected: false,
      handCount: 0,
      fingerCount: 0,
      timestamp,
    };
  }

  const handDetails: HandDetail[] = [];
  let totalFingerCount = 0;

  landmarksList.forEach((landmarks, idx) => {
    if (landmarks && landmarks.length >= 21) {
      const fingerInfo = analyzeSingleHandFingers(landmarks);
      const singleClass = classifySingleHandGesture(landmarks);
      const def = GESTURE_DICTIONARY[singleClass.gestureId];

      totalFingerCount += fingerInfo.fingerCount;

      handDetails.push({
        handIndex: idx + 1,
        label: `Bàn tay ${idx + 1}`,
        fingerCount: fingerInfo.fingerCount,
        extendedFingers: fingerInfo.extendedFingers,
        gestureId: singleClass.gestureId,
        gestureName: def ? def.name : "Cử chỉ bàn tay",
        landmarks,
      });
    }
  });

  const handCount = handDetails.length;

  if (handCount === 0) {
    return {
      gestureId: "unknown",
      name: "Chưa nhận diện bàn tay",
      emoji: "❓",
      confidence: 0,
      handDetected: false,
      handCount: 0,
      fingerCount: 0,
      timestamp,
    };
  }

  // Dual-Hand Detection Logic
  if (handCount >= 2) {
    const h1 = handDetails[0];
    const h2 = handDetails[1];

    // Check if both hands are showing special gestures like ILY or Thumbs Up
    if (h1.gestureId === "love_you" && h2.gestureId === "love_you") {
      return {
        gestureId: "love_you",
        name: "Tôi Yêu Bạn (Cả 2 Tay 🤟🤟)",
        emoji: "🤟🤟",
        confidence: 98,
        handDetected: true,
        handCount: 2,
        fingerCount: totalFingerCount,
        handDetails,
        landmarks: h1.landmarks,
        allLandmarks: landmarksList,
        timestamp,
      };
    }

    if (h1.gestureId === "thumbs_up" && h2.gestureId === "thumbs_up") {
      return {
        gestureId: "thumbs_up",
        name: "Rất Tốt / Hoàn Hảo (Cả 2 Tay 👍👍)",
        emoji: "👍👍",
        confidence: 98,
        handDetected: true,
        handCount: 2,
        fingerCount: totalFingerCount,
        handDetails,
        landmarks: h1.landmarks,
        allLandmarks: landmarksList,
        timestamp,
      };
    }

    // Dynamic Finger Counting across 2 hands (0 to 10)
    const numberEmojis: Record<number, string> = {
      0: "0️⃣",
      1: "1️⃣",
      2: "2️⃣",
      3: "3️⃣",
      4: "4️⃣",
      5: "5️⃣",
      6: "6️⃣",
      7: "7️⃣",
      8: "8️⃣",
      9: "9️⃣",
      10: "🔟",
    };

    const emoji = numberEmojis[totalFingerCount] || "🔢";
    const numberKey = `number_${totalFingerCount}` as GestureType;

    return {
      gestureId: numberKey in GESTURE_DICTIONARY ? numberKey : "number_count",
      name: `Đếm số: ${totalFingerCount} ngón tay (${h1.fingerCount} + ${h2.fingerCount})`,
      emoji: `${emoji}`,
      confidence: 96,
      handDetected: true,
      handCount: 2,
      fingerCount: totalFingerCount,
      handDetails,
      landmarks: h1.landmarks,
      allLandmarks: landmarksList,
      explanation: `Đã phát hiện 2 bàn tay: Bàn tay 1 xòe ${h1.fingerCount} ngón, Bàn tay 2 xòe ${h2.fingerCount} ngón => Tổng cộng ${totalFingerCount} ngón tay.`,
      timestamp,
    };
  }

  // Single Hand Detection Logic
  const h1 = handDetails[0];
  const singleRes = classifySingleHandGesture(h1.landmarks);
  const def = GESTURE_DICTIONARY[singleRes.gestureId] || GESTURE_DICTIONARY.unknown;

  // Determine whether to highlight as number count or gesture
  let displayName = def.name;
  let displayEmoji = def.emoji;

  if (["open_palm", "point_up", "letter_v", "fist"].includes(singleRes.gestureId)) {
    displayName = `${def.name} (Đếm: ${h1.fingerCount} ngón)`;
  }

  return {
    gestureId: singleRes.gestureId,
    name: displayName,
    emoji: displayEmoji,
    confidence: singleRes.confidence,
    handDetected: true,
    handCount: 1,
    fingerCount: h1.fingerCount,
    handDetails,
    landmarks: h1.landmarks,
    allLandmarks: landmarksList,
    timestamp,
  };
}

/**
 * Backward-compatible single hand classifier
 */
export function classifyHandGesture(landmarks: Landmark[]): RecognitionResult {
  return classifyMultipleHands([landmarks]);
}
