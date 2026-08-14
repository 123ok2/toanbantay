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
 * Checks if a specific finger (index, middle, ring, pinky) is extended
 */
function isStandardFingerExtended(
  mcp: Landmark,
  pip: Landmark,
  dip: Landmark,
  tip: Landmark,
  wrist: Landmark
): boolean {
  const dWristTip = distance(wrist, tip);
  const dWristPip = distance(wrist, pip);
  const dMcpTip = distance(mcp, tip);
  const dMcpPip = distance(mcp, pip);
  const dPipTip = distance(pip, tip);
  const dPipDip = distance(pip, dip);

  // If hand is generally upright (wrist is below MCP in image coordinates)
  const isUpright = wrist.y > mcp.y - 0.05;

  // Condition 1: Tip is further from MCP than PIP is
  const extendedByMcp = dMcpTip > dMcpPip * 1.14;

  // Condition 2: Tip is further from wrist than PIP
  const extendedByWrist = dWristTip > dWristPip * 1.05;

  // Condition 3: Segment PIP-TIP is elongated (not curled back)
  const segmentStraight = dPipTip > dPipDip * 1.1;

  // Condition 4: In upright position, tip is distinctly above PIP
  const uprightExtended = isUpright && tip.y < pip.y - 0.02;

  // Curled conditions (definite curl into palm)
  const isCurled =
    dMcpTip < dMcpPip * 0.95 ||
    dWristTip < dWristPip * 0.95 ||
    (isUpright && tip.y > pip.y + 0.02);

  if (isCurled) return false;

  return (extendedByMcp && extendedByWrist && segmentStraight) || (uprightExtended && extendedByMcp);
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

  const handScale = distance(wrist, middleMCP) || 0.1;

  // 1. Long fingers extended evaluation
  const indexExtended = isStandardFingerExtended(indexMCP, indexPIP, indexDIP, indexTip, wrist);
  const middleExtended = isStandardFingerExtended(middleMCP, middlePIP, middleDIP, middleTip, wrist);
  const ringExtended = isStandardFingerExtended(ringMCP, ringPIP, ringDIP, ringTip, wrist);
  const pinkyExtended = isStandardFingerExtended(pinkyMCP, pinkyPIP, pinkyDIP, pinkyTip, wrist);

  // 2. Thumb extension evaluation
  // When thumb is extended:
  // - Thumb tip is far from thumb MCP (straightened)
  // - Thumb tip is far from index MCP (stretched out from palm)
  // - Thumb tip is far from pinky MCP (unfolded)
  const dThumbTipMcp = distance(thumbTip, thumbMCP);
  const dThumbIpMcp = distance(thumbIP, thumbMCP);
  const dThumbTipPinkyMcp = distance(thumbTip, pinkyMCP);
  const dThumbIpPinkyMcp = distance(thumbIP, pinkyMCP);
  const dThumbTipIndexMcp = distance(thumbTip, indexMCP);

  const thumbPointingUp = thumbTip.y < thumbMCP.y - 0.03 && thumbTip.y < indexMCP.y;
  const thumbPointingDown = thumbTip.y > thumbMCP.y + 0.03 && thumbTip.y > wrist.y;

  const thumbStraight = dThumbTipMcp > dThumbIpMcp * 1.2;
  const thumbUnfolded = dThumbTipPinkyMcp > dThumbIpPinkyMcp * 1.1;
  const thumbAwayFromPalm = dThumbTipIndexMcp > handScale * 0.38;

  const thumbExtended =
    (thumbStraight && thumbUnfolded && thumbAwayFromPalm) ||
    (thumbPointingUp && thumbStraight);

  let count = 0;
  if (thumbExtended) count++;
  if (indexExtended) count++;
  if (middleExtended) count++;
  if (ringExtended) count++;
  if (pinkyExtended) count++;

  return {
    fingerCount: count,
    extendedFingers: {
      thumb: thumbExtended,
      index: indexExtended,
      middle: middleExtended,
      ring: ringExtended,
      pinky: pinkyExtended,
    },
    thumbPointingUp,
    thumbPointingDown,
    handScale,
  };
}

/**
 * Classifies a single hand gesture
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
    confidence = 94;
  }
  // Number fallbacks
  else if (fingerCount === 1) {
    detectedId = "number_1";
    confidence = 90;
  } else if (fingerCount === 2) {
    detectedId = "number_2";
    confidence = 90;
  } else if (fingerCount === 3) {
    detectedId = "number_3";
    confidence = 90;
  } else if (fingerCount === 4) {
    detectedId = "number_4";
    confidence = 90;
  } else if (fingerCount === 5) {
    detectedId = "number_5";
    confidence = 95;
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
