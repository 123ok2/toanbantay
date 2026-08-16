/**
 * Stroke OCR Engine for 3D Air-Canvas
 * Converts hand-drawn strokes into mathematical digits and expressions
 */

export interface StrokePoint {
  x: number;
  y: number;
  z: number;
  time?: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export interface OcrMathResult {
  rawText: string;
  calculatedValue: number | null;
  confidence: number;
  explanation: string;
}

/**
 * Normalizes and analyzes geometric features of strokes to recognize handwritten digits and simple math symbols
 */
export function recognizeDrawnStrokes(strokes: Stroke[]): OcrMathResult {
  if (!strokes || strokes.length === 0) {
    return { rawText: "", calculatedValue: null, confidence: 0, explanation: "Chưa có nét vẽ nào" };
  }

  // Collect all points to find bounding box
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  let totalPoints = 0;
  for (const stroke of strokes) {
    for (const pt of stroke.points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
      totalPoints++;
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;

  if (totalPoints < 4 || width < 0.01 || height < 0.01) {
    return { rawText: "", calculatedValue: null, confidence: 0, explanation: "Nét vẽ quá ngắn" };
  }

  // Sort strokes from left to right (horizontal writing order)
  const strokeBounds = strokes.map((s, idx) => {
    let sMinX = Infinity,
      sMaxX = -Infinity,
      sMinY = Infinity,
      sMaxY = -Infinity;
    for (const p of s.points) {
      if (p.x < sMinX) sMinX = p.x;
      if (p.x > sMaxX) sMaxX = p.x;
      if (p.y < sMinY) sMinY = p.y;
      if (p.y > sMaxY) sMaxY = p.y;
    }
    return {
      stroke: s,
      index: idx,
      minX: sMinX,
      maxX: sMaxX,
      minY: sMinY,
      maxY: sMaxY,
      centerX: (sMinX + sMaxX) / 2,
      centerY: (sMinY + sMaxY) / 2,
      width: sMaxX - sMinX,
      height: sMaxY - sMinY,
    };
  });

  strokeBounds.sort((a, b) => a.minX - b.minX);

  // Group strokes into character clusters
  const clusters: typeof strokeBounds[] = [];
  let currentCluster: typeof strokeBounds = [];

  for (let i = 0; i < strokeBounds.length; i++) {
    const item = strokeBounds[i];
    if (currentCluster.length === 0) {
      currentCluster.push(item);
    } else {
      const prev = currentCluster[currentCluster.length - 1];
      // If horizontal distance is small or overlaps vertically, group together (e.g. for "+", "=", "4", "5", "7")
      const overlapX = Math.max(0, Math.min(prev.maxX, item.maxX) - Math.max(prev.minX, item.minX));
      const dist = item.minX - prev.maxX;

      if (overlapX > 0 || dist < 0.05 * Math.max(1, height)) {
        currentCluster.push(item);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Classify each cluster
  const recognizedTokens: string[] = [];

  for (const cluster of clusters) {
    const token = classifyStrokeCluster(cluster, height);
    if (token) {
      recognizedTokens.push(token);
    }
  }

  const rawText = recognizedTokens.join("");

  // Evaluate mathematical expression if valid
  let calculatedValue: number | null = null;
  let explanation = "";

  if (rawText.length > 0) {
    // If it's a simple number (e.g. "5", "10", "7")
    const parsedNum = parseInt(rawText, 10);
    if (!isNaN(parsedNum) && String(parsedNum) === rawText) {
      calculatedValue = parsedNum;
      explanation = `Nhận diện số: ${parsedNum}`;
    } else {
      // Try evaluating arithmetic (e.g. "3+4", "9-2", "2*3")
      try {
        const sanitized = rawText.replace(/[^0-9+\-*/.]/g, "");
        if (sanitized.length > 0 && /^[0-9]+([+\-*/][0-9]+)+$/.test(sanitized)) {
          // eslint-disable-next-line no-new-func
          const evalResult = new Function(`return (${sanitized});`)();
          if (typeof evalResult === "number" && !isNaN(evalResult) && isFinite(evalResult)) {
            calculatedValue = Math.round(evalResult * 100) / 100;
            explanation = `${sanitized} = ${calculatedValue}`;
          }
        }
      } catch (e) {
        // Ignore math eval errors
      }
    }
  }

  return {
    rawText,
    calculatedValue,
    confidence: rawText ? 0.88 : 0,
    explanation: explanation || (rawText ? `Đã nhận diện: ${rawText}` : "Không nhận dạng được"),
  };
}

/**
 * Classify a single character or symbol cluster
 */
function classifyStrokeCluster(
  cluster: Array<{
    stroke: Stroke;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
  }>,
  totalCanvasHeight: number
): string {
  if (cluster.length === 0) return "";

  // Combine points
  const allPoints: StrokePoint[] = [];
  for (const item of cluster) {
    allPoints.push(...item.stroke.points);
  }

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of allPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const w = maxX - minX;
  const h = maxY - minY;
  const aspectRatio = w / Math.max(0.001, h);

  // Multi-stroke symbols: "+" (2 strokes intersecting), "=" (2 horizontal strokes), "4", "7"
  if (cluster.length === 2) {
    const [s1, s2] = cluster;
    // Check for "=" (two horizontal lines stacked vertically)
    const isS1Horizontal = s1.width > s1.height * 1.5;
    const isS2Horizontal = s2.width > s2.height * 1.5;
    if (isS1Horizontal && isS2Horizontal && Math.abs(s1.minY - s2.minY) > 0.015) {
      return "=";
    }

    // Check for "+" (one horizontal, one vertical intersecting)
    const isS1Vertical = s1.height > s1.width * 1.5;
    const isS2Vertical = s2.height > s2.width * 1.5;
    if ((isS1Horizontal && isS2Vertical) || (isS2Horizontal && isS1Vertical)) {
      return "+";
    }

    // Check for "4" or "7" with bar
    if (s1.height > 0.03 && s2.height > 0.03) {
      if (aspectRatio > 0.4 && aspectRatio < 1.2) {
        return "4";
      }
    }
  }

  // Single stroke / merged points analysis
  const firstPt = allPoints[0];
  const lastPt = allPoints[allPoints.length - 1];
  const midPt = allPoints[Math.floor(allPoints.length / 2)];

  const startEndDist = Math.hypot(firstPt.x - lastPt.x, firstPt.y - lastPt.y);
  const isClosedLoop = startEndDist < 0.28 * Math.max(w, h);

  // 1. Check for "1" (tall and narrow, straight down)
  if (aspectRatio < 0.35 && h > 0.04) {
    return "1";
  }

  // 2. Check for "-" (horizontal line)
  if (aspectRatio > 2.2 && h < 0.04) {
    return "-";
  }

  // 3. Check for "0" (closed loop, round)
  if (isClosedLoop && aspectRatio >= 0.45 && aspectRatio <= 1.4) {
    return "0";
  }

  // 4. Check for "8" (two loops or crossing self near center)
  // Check self-intersection
  let crossCount = 0;
  for (let i = 0; i < allPoints.length - 10; i += 5) {
    for (let j = i + 15; j < allPoints.length - 5; j += 5) {
      const p1 = allPoints[i],
        p2 = allPoints[i + 5];
      const p3 = allPoints[j],
        p4 = allPoints[j + 5];
      if (linesIntersect(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)) {
        crossCount++;
      }
    }
  }
  if (crossCount >= 1 && h > 0.04) {
    return "8";
  }

  // 5. Check for "7" (starts top left -> goes top right -> diagonals down to bottom left)
  if (firstPt.y < minY + 0.35 * h && firstPt.x < minX + 0.45 * w && lastPt.y > maxY - 0.3 * h) {
    let topMaxX = 0;
    for (let i = 0; i < Math.floor(allPoints.length / 3); i++) {
      if (allPoints[i].x > topMaxX) topMaxX = allPoints[i].x;
    }
    if (topMaxX > maxX - 0.25 * w) {
      return "7";
    }
  }

  // 6. Check for "3" (two arcs on the right)
  if (
    firstPt.y < minY + 0.35 * h &&
    lastPt.y > maxY - 0.35 * h &&
    midPt.x < maxX - 0.3 * w &&
    aspectRatio > 0.4
  ) {
    return "3";
  }

  // 7. Check for "6" vs "9"
  // If bottom has a loop and starts from top right -> "6"
  // If top has a loop and finishes at bottom -> "9"
  if (firstPt.y < minY + 0.3 * h && lastPt.y < maxY - 0.1 * h && lastPt.y > minY + 0.4 * h) {
    return "6";
  }
  if (firstPt.y > minY + 0.3 * h && firstPt.y < maxY - 0.2 * h && lastPt.y > maxY - 0.25 * h) {
    return "9";
  }

  // 8. Check for "2" (starts top left -> curves top right -> goes bottom left -> goes bottom right)
  if (
    firstPt.y < minY + 0.35 * h &&
    lastPt.y > maxY - 0.3 * h &&
    lastPt.x > minX + 0.4 * w
  ) {
    return "2";
  }

  // 9. Check for "5"
  if (firstPt.x > minX + 0.3 * w && firstPt.y < minY + 0.3 * h && lastPt.y > maxY - 0.3 * h) {
    return "5";
  }

  // Fallbacks
  if (aspectRatio < 0.45) return "1";
  if (aspectRatio > 1.8) return "-";
  if (isClosedLoop) return "0";

  // General heuristics based on curvature
  if (midPt.y > minY + 0.3 * h && midPt.y < maxY - 0.3 * h) {
    return "5";
  }

  return "2";
}

function linesIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return false;
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}
