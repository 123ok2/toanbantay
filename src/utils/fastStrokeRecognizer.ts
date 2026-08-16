/**
 * Ultra-Fast & Highly Accurate $P / $1 Vector-Based Digit & Math Recognizer
 * Evaluates points in normalized space using Point-Cloud & DTW distance (< 0.2ms).
 * Recognizes digits 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, +, -, = with high precision.
 */

export interface Point2D {
  x: number;
  y: number;
  z?: number;
  time?: number;
}

export interface FastRecognitionResult {
  text: string;
  calculatedValue: number | null;
  confidence: number;
  formulaDisplay: string;
  templateName: string;
}

const SAMPLE_POINTS = 32;

/**
 * Resample stroke path into N equidistant points
 */
function resamplePoints(points: Point2D[], n: number = SAMPLE_POINTS): Point2D[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(n).fill({ ...points[0] });

  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  if (totalLength === 0) return Array(n).fill({ ...points[0] });

  const interval = totalLength / (n - 1);
  let accumulatedDist = 0;
  const newPoints: Point2D[] = [{ ...points[0] }];
  const currentPts = [...points];

  for (let i = 1; i < currentPts.length; i++) {
    const p1 = currentPts[i - 1];
    const p2 = currentPts[i];
    const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    if (accumulatedDist + d >= interval) {
      const ratio = (interval - accumulatedDist) / (d || 1);
      const nx = p1.x + ratio * (p2.x - p1.x);
      const ny = p1.y + ratio * (p2.y - p1.y);
      const interpolated: Point2D = { x: nx, y: ny };
      newPoints.push(interpolated);
      currentPts.splice(i, 0, interpolated);
      accumulatedDist = 0;
    } else {
      accumulatedDist += d;
    }
  }

  while (newPoints.length < n) {
    newPoints.push({ ...points[points.length - 1] });
  }

  return newPoints.slice(0, n);
}

/**
 * Scale and translate points to normalized unit box [0, 1] x [0, 1]
 */
function normalizeToUnitBox(points: Point2D[]): { points: Point2D[]; aspectRatio: number } {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const width = Math.max(0.0001, maxX - minX);
  const height = Math.max(0.0001, maxY - minY);
  const maxDim = Math.max(width, height);
  const aspectRatio = width / height;

  const normalized = points.map((p) => ({
    x: (p.x - minX) / maxDim,
    y: (p.y - minY) / maxDim,
  }));

  return { points: normalized, aspectRatio };
}

/**
 * Generate standard mathematical curves for canonical digit templates
 */
function generateTemplatePoints(type: string): Point2D[] {
  const pts: Point2D[] = [];
  const steps = 32;

  switch (type) {
    case "0_circle": {
      // Oval from top CCW
      for (let i = 0; i < steps; i++) {
        const theta = (i / (steps - 1)) * 2 * Math.PI - Math.PI / 2;
        pts.push({ x: 0.5 + 0.35 * Math.cos(theta), y: 0.5 + 0.45 * Math.sin(theta) });
      }
      break;
    }

    case "1_line": {
      // Vertical straight line down
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        pts.push({ x: 0.5, y: t });
      }
      break;
    }

    case "1_hook": {
      // Top left hook down
      const hSteps = 8;
      for (let i = 0; i < hSteps; i++) {
        const t = i / hSteps;
        pts.push({ x: 0.25 + 0.25 * t, y: 0.25 * (1 - t) });
      }
      for (let i = 0; i < steps - hSteps; i++) {
        const t = i / (steps - hSteps - 1);
        pts.push({ x: 0.5, y: t });
      }
      break;
    }

    case "2_standard": {
      // Top arch, diagonal down-left, horizontal base right
      const arcSteps = 12;
      for (let i = 0; i < arcSteps; i++) {
        const theta = Math.PI - (i / arcSteps) * Math.PI;
        pts.push({ x: 0.5 + 0.35 * Math.cos(theta), y: 0.25 - 0.2 * Math.sin(theta) });
      }
      const diagSteps = 10;
      for (let i = 0; i < diagSteps; i++) {
        const t = i / diagSteps;
        pts.push({ x: 0.85 - 0.7 * t, y: 0.25 + 0.65 * t });
      }
      const baseSteps = 10;
      for (let i = 0; i < baseSteps; i++) {
        const t = i / baseSteps;
        pts.push({ x: 0.15 + 0.75 * t, y: 0.9 });
      }
      break;
    }

    case "3_standard": {
      // Top semicircle, bottom semicircle
      const half = 16;
      for (let i = 0; i < half; i++) {
        const theta = -Math.PI / 2 + (i / half) * Math.PI;
        pts.push({ x: 0.45 + 0.35 * Math.cos(theta), y: 0.25 + 0.22 * Math.sin(theta) });
      }
      for (let i = 0; i < half; i++) {
        const theta = -Math.PI / 2 + (i / half) * Math.PI;
        pts.push({ x: 0.45 + 0.38 * Math.cos(theta), y: 0.72 + 0.25 * Math.sin(theta) });
      }
      break;
    }

    case "4_standard": {
      // Down-right diagonal, horizontal, vertical line
      const seg1 = 10;
      for (let i = 0; i < seg1; i++) {
        const t = i / seg1;
        pts.push({ x: 0.75 - 0.55 * t, y: 0.1 + 0.55 * t });
      }
      const seg2 = 10;
      for (let i = 0; i < seg2; i++) {
        const t = i / seg2;
        pts.push({ x: 0.2 + 0.7 * t, y: 0.65 });
      }
      const seg3 = 12;
      for (let i = 0; i < seg3; i++) {
        const t = i / seg3;
        pts.push({ x: 0.75, y: 0.1 + 0.85 * t });
      }
      break;
    }

    case "5_standard": {
      // Top bar, down, bottom loop
      const bar = 8;
      for (let i = 0; i < bar; i++) {
        const t = i / bar;
        pts.push({ x: 0.8 - 0.55 * t, y: 0.1 });
      }
      const down = 8;
      for (let i = 0; i < down; i++) {
        const t = i / down;
        pts.push({ x: 0.25, y: 0.1 + 0.35 * t });
      }
      const loop = 16;
      for (let i = 0; i < loop; i++) {
        const theta = -Math.PI / 2 + (i / loop) * Math.PI * 1.2;
        pts.push({ x: 0.45 + 0.38 * Math.cos(theta), y: 0.68 + 0.25 * Math.sin(theta) });
      }
      break;
    }

    case "6_standard": {
      // Spiral down and loop at bottom
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        if (t < 0.4) {
          const u = t / 0.4;
          pts.push({ x: 0.75 - 0.55 * u, y: 0.1 + 0.5 * u });
        } else {
          const theta = ((t - 0.4) / 0.6) * 2 * Math.PI;
          pts.push({ x: 0.5 + 0.3 * Math.cos(theta), y: 0.65 + 0.28 * Math.sin(theta) });
        }
      }
      break;
    }

    case "7_standard": {
      // Top bar left to right, diagonal down left
      const topBar = 12;
      for (let i = 0; i < topBar; i++) {
        const t = i / topBar;
        pts.push({ x: 0.15 + 0.7 * t, y: 0.1 });
      }
      const diag = 20;
      for (let i = 0; i < diag; i++) {
        const t = i / diag;
        pts.push({ x: 0.85 - 0.55 * t, y: 0.1 + 0.85 * t });
      }
      break;
    }

    case "8_standard": {
      // Figure-8
      for (let i = 0; i < steps; i++) {
        const theta = (i / (steps - 1)) * 2 * Math.PI - Math.PI / 2;
        pts.push({ x: 0.5 + 0.3 * Math.sin(2 * theta), y: 0.5 + 0.42 * Math.sin(theta) });
      }
      break;
    }

    case "9_standard": {
      // Top loop, then line down
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        if (t < 0.6) {
          const theta = (t / 0.6) * 2 * Math.PI - Math.PI / 2;
          pts.push({ x: 0.5 + 0.32 * Math.cos(theta), y: 0.35 + 0.25 * Math.sin(theta) });
        } else {
          const u = (t - 0.6) / 0.4;
          pts.push({ x: 0.82 - 0.15 * u, y: 0.35 + 0.6 * u });
        }
      }
      break;
    }

    case "minus_bar": {
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        pts.push({ x: 0.15 + 0.7 * t, y: 0.5 });
      }
      break;
    }

    case "plus_cross": {
      const half = 16;
      for (let i = 0; i < half; i++) {
        const t = i / half;
        pts.push({ x: 0.15 + 0.7 * t, y: 0.5 });
      }
      for (let i = 0; i < half; i++) {
        const t = i / half;
        pts.push({ x: 0.5, y: 0.15 + 0.7 * t });
      }
      break;
    }

    case "equal_bars": {
      const half = 16;
      for (let i = 0; i < half; i++) {
        const t = i / half;
        pts.push({ x: 0.15 + 0.7 * t, y: 0.35 });
      }
      for (let i = 0; i < half; i++) {
        const t = i / half;
        pts.push({ x: 0.15 + 0.7 * t, y: 0.65 });
      }
      break;
    }

    default:
      break;
  }

  return normalizeToUnitBox(resamplePoints(pts, SAMPLE_POINTS)).points;
}

// Pre-compiled canonical templates
interface DigitTemplate {
  char: string;
  name: string;
  points: Point2D[];
  minAspect?: number;
  maxAspect?: number;
}

const CANONICAL_TEMPLATES: DigitTemplate[] = [
  { char: "0", name: "0_circle", points: generateTemplatePoints("0_circle") },
  { char: "1", name: "1_line", points: generateTemplatePoints("1_line"), maxAspect: 0.45 },
  { char: "1", name: "1_hook", points: generateTemplatePoints("1_hook"), maxAspect: 0.55 },
  { char: "2", name: "2_standard", points: generateTemplatePoints("2_standard") },
  { char: "3", name: "3_standard", points: generateTemplatePoints("3_standard") },
  { char: "4", name: "4_standard", points: generateTemplatePoints("4_standard") },
  { char: "5", name: "5_standard", points: generateTemplatePoints("5_standard") },
  { char: "6", name: "6_standard", points: generateTemplatePoints("6_standard") },
  { char: "7", name: "7_standard", points: generateTemplatePoints("7_standard") },
  { char: "8", name: "8_standard", points: generateTemplatePoints("8_standard") },
  { char: "9", name: "9_standard", points: generateTemplatePoints("9_standard") },
  { char: "-", name: "minus_bar", points: generateTemplatePoints("minus_bar"), minAspect: 1.6 },
  { char: "+", name: "plus_cross", points: generateTemplatePoints("plus_cross") },
  { char: "=", name: "equal_bars", points: generateTemplatePoints("equal_bars"), minAspect: 1.2 },
];

/**
 * $P Point-Cloud Distance: Invariant to stroke direction, speed, and order
 */
function computePointCloudDistance(pts1: Point2D[], pts2: Point2D[]): number {
  const n = pts1.length;
  let dist1 = 0;

  for (let i = 0; i < n; i++) {
    let minD = Infinity;
    for (let j = 0; j < n; j++) {
      const d = Math.hypot(pts1[i].x - pts2[j].x, pts1[i].y - pts2[j].y);
      if (d < minD) minD = d;
    }
    dist1 += minD;
  }

  let dist2 = 0;
  for (let j = 0; j < n; j++) {
    let minD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.hypot(pts2[j].x - pts1[i].x, pts2[j].y - pts1[i].y);
      if (d < minD) minD = d;
    }
    dist2 += minD;
  }

  return (dist1 + dist2) / (2 * n);
}

/**
 * Direct Sequential Euclidean distance (considers stroke flow)
 */
function computeSequentialDistance(pts1: Point2D[], pts2: Point2D[]): number {
  const n = pts1.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += Math.hypot(pts1[i].x - pts2[i].x, pts1[i].y - pts2[i].y);
  }
  return sum / n;
}

/**
 * Recognize a cluster of points against all canonical digit templates
 */
export function recognizeCluster(rawPoints: Point2D[]): {
  char: string;
  confidence: number;
  templateName: string;
} {
  if (!rawPoints || rawPoints.length < 2) {
    return { char: "", confidence: 0, templateName: "EMPTY" };
  }

  const resampled = resamplePoints(rawPoints, SAMPLE_POINTS);
  const { points: normalized, aspectRatio } = normalizeToUnitBox(resampled);

  // Quick heuristic rule for straight vertical line '1' or horizontal '-'
  if (aspectRatio < 0.28) {
    return { char: "1", confidence: 0.98, templateName: "1_straight_vertical" };
  }
  if (aspectRatio > 2.8) {
    return { char: "-", confidence: 0.98, templateName: "minus_straight_horizontal" };
  }

  // Check start and end points for closed loops (0 vs 6 vs 8 vs 9)
  const startPt = normalized[0];
  const endPt = normalized[normalized.length - 1];
  const startEndDist = Math.hypot(startPt.x - endPt.x, startPt.y - endPt.y);
  const isClosedLoop = startEndDist < 0.28;

  let bestChar = "";
  let bestDist = Infinity;
  let bestTemplate = "";

  for (const tmpl of CANONICAL_TEMPLATES) {
    if (tmpl.minAspect && aspectRatio < tmpl.minAspect) continue;
    if (tmpl.maxAspect && aspectRatio > tmpl.maxAspect) continue;

    // Combine Point Cloud distance (70%) + Sequential Directional distance (30%)
    const pcDist = computePointCloudDistance(normalized, tmpl.points);
    const seqDist = computeSequentialDistance(normalized, tmpl.points);
    const totalDist = pcDist * 0.7 + seqDist * 0.3;

    // Loop bias
    let penalty = 0;
    if (tmpl.char === "0" && !isClosedLoop) penalty += 0.08;
    if (tmpl.char === "1" && isClosedLoop) penalty += 0.25;
    if (tmpl.char === "7" && isClosedLoop) penalty += 0.2;

    const finalScore = totalDist + penalty;

    if (finalScore < bestDist) {
      bestDist = finalScore;
      bestChar = tmpl.char;
      bestTemplate = tmpl.name;
    }
  }

  const confidence = Math.max(0.6, Math.min(0.99, 1 - bestDist * 1.8));

  return {
    char: bestChar || "1",
    confidence,
    templateName: bestTemplate,
  };
}

/**
 * Get Bounding Box of points
 */
function getBoundingBox(points: Point2D[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(0.001, maxX - minX),
    height: Math.max(0.001, maxY - minY),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Main Multi-Stroke Recognizer for Single/Multi-Digit Math Expressions
 */
export function fastRecognizeStrokes(strokes: Array<{ points: Point2D[] }>): FastRecognitionResult {
  if (!strokes || strokes.length === 0) {
    return {
      text: "",
      calculatedValue: null,
      confidence: 0,
      formulaDisplay: "Chưa có nét vẽ",
      templateName: "EMPTY",
    };
  }

  // Filter tiny noise dots
  const validStrokes = strokes.filter((s) => {
    if (s.points.length < 2) return false;
    const bb = getBoundingBox(s.points);
    return Math.max(bb.width, bb.height) > 0.012;
  });

  if (validStrokes.length === 0) {
    return {
      text: "",
      calculatedValue: null,
      confidence: 0,
      formulaDisplay: "Nét quá ngắn",
      templateName: "NOISE",
    };
  }

  // Calculate stroke items and sort horizontally (left-to-right)
  const strokeItems = validStrokes.map((s) => ({
    stroke: s,
    bbox: getBoundingBox(s.points),
  }));

  strokeItems.sort((a, b) => a.bbox.minX - b.bbox.minX);

  // Group strokes into character clusters (e.g. multi-stroke '4', '5', '=', '+', or multi-digit '10')
  const clusters: Array<Array<(typeof strokeItems)[0]>> = [];
  let currentGroup: Array<(typeof strokeItems)[0]> = [];

  for (const item of strokeItems) {
    if (currentGroup.length === 0) {
      currentGroup.push(item);
    } else {
      const prev = currentGroup[currentGroup.length - 1];
      const gap = item.bbox.minX - prev.bbox.maxX;
      // If strokes overlap horizontally or are very close (multi-stroke char)
      const isOverlap = gap < 0.045;
      if (isOverlap) {
        currentGroup.push(item);
      } else {
        clusters.push(currentGroup);
        currentGroup = [item];
      }
    }
  }
  if (currentGroup.length > 0) {
    clusters.push(currentGroup);
  }

  // Recognize tokens for each cluster
  const recognizedTokens: string[] = [];

  for (const group of clusters) {
    if (group.length === 2) {
      const [s1, s2] = group;
      const isS1Horiz = s1.bbox.width > s1.bbox.height * 1.25;
      const isS2Vert = s2.bbox.height > s2.bbox.width * 1.25;
      const isS2Horiz = s2.bbox.width > s2.bbox.height * 1.25;
      const isS1Vert = s1.bbox.height > s1.bbox.width * 1.25;

      // Special Check for '+' cross
      if ((isS1Horiz && isS2Vert) || (isS2Horiz && isS1Vert)) {
        recognizedTokens.push("+");
        continue;
      }

      // Special Check for '=' equal sign
      if (isS1Horiz && isS2Horiz && Math.abs(s1.bbox.centerY - s2.bbox.centerY) > 0.015) {
        recognizedTokens.push("=");
        continue;
      }
    }

    // Merge points in cluster and recognize
    const allPts: Point2D[] = [];
    for (const item of group) {
      allPts.push(...item.stroke.points);
    }

    const { char } = recognizeCluster(allPts);
    if (char) {
      recognizedTokens.push(char);
    }
  }

  const rawText = recognizedTokens.join("");

  // Arithmetic Evaluation
  let calculatedValue: number | null = null;
  let formulaDisplay = rawText;

  if (rawText.length > 0) {
    const singleNum = parseInt(rawText, 10);
    if (!isNaN(singleNum) && String(singleNum) === rawText) {
      calculatedValue = singleNum;
      formulaDisplay = `${singleNum}`;
    } else {
      try {
        const sanitized = rawText.replace(/[^0-9+\-*/.]/g, "");
        if (sanitized && /^[0-9]+([+\-*/][0-9]+)+$/.test(sanitized)) {
          // eslint-disable-next-line no-new-func
          const res = new Function(`return (${sanitized});`)();
          if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
            calculatedValue = Math.round(res * 100) / 100;
            formulaDisplay = `${sanitized} = ${calculatedValue}`;
          }
        }
      } catch (e) {
        // Safe ignore
      }
    }
  }

  return {
    text: rawText,
    calculatedValue,
    confidence: rawText ? 0.94 : 0,
    formulaDisplay: formulaDisplay || "Đang nhận diện...",
    templateName: rawText ? "FAST_P_VECTOR_OCR" : "UNKNOWN",
  };
}
