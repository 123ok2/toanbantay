export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type GestureCategory = "alphabet" | "conversational" | "numbers" | "expressions" | "general";

export type GestureType =
  | "letter_a"
  | "letter_b"
  | "letter_c"
  | "letter_i"
  | "letter_l"
  | "letter_v"
  | "letter_y"
  | "thumbs_up"
  | "thumbs_down"
  | "open_palm"
  | "peace"
  | "point_up"
  | "fist"
  | "ok_sign"
  | "love_you"
  | "number_0"
  | "number_1"
  | "number_2"
  | "number_3"
  | "number_4"
  | "number_5"
  | "number_6"
  | "number_7"
  | "number_8"
  | "number_9"
  | "number_10"
  | "number_count"
  | "unknown";

export interface GestureDefinition {
  id: GestureType;
  name: string;
  emoji: string;
  category: GestureCategory;
  categoryLabel: string;
  description: string;
  tips: string;
  meaning: string;
  deafContext?: string; // Bối cảnh sử dụng giao tiếp với người khiếm thính
}

export interface HandDetail {
  handIndex: number;
  label: string; // "Bàn tay 1" / "Bàn tay 2"
  fingerCount: number;
  extendedFingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  gestureId?: GestureType;
  gestureName?: string;
  landmarks: Landmark[];
}

export interface RecognitionResult {
  gestureId: GestureType | string;
  name: string;
  emoji: string;
  confidence: number; // 0 to 100
  handDetected: boolean;
  handCount: number; // 0, 1, or 2 hands
  fingerCount: number; // Total extended fingers across all hands (0 to 10)
  handDetails?: HandDetail[];
  landmarks?: Landmark[];
  allLandmarks?: Landmark[][];
  explanation?: string;
  timestamp: number;
}

export interface ChallengeQuestion {
  id: string;
  targetGesture: GestureType;
  targetName: string;
  emoji: string;
  hint: string;
}

export interface HistoryItem {
  id: string;
  gestureName: string;
  emoji: string;
  confidence: number;
  timestamp: string;
}

