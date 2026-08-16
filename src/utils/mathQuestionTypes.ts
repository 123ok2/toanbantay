export type MathGradeLevel =
  | "Lớp 1 - 2"
  | "Lớp 3 - 5"
  | "Lớp 6 (THCS)"
  | "Lớp 7 (THCS)"
  | "Lớp 8 - 9 (THCS)";

export type MathQuestionTopic =
  | "Cộng trừ cơ bản"
  | "Đếm hình & Toán đố"
  | "Nhân & Chia"
  | "Phân số & Chu vi"
  | "Số nguyên & Lũy thừa"
  | "Tìm x & Đại số"
  | "ƯCLN & BCNN"
  | "Căn bậc hai"
  | "Tỉ lệ thức & Số hữu tỉ"
  | "Hình học & Pythagore"
  | "Hằng đẳng thức";

export interface MathQuestion {
  id: string;
  problemStr: string;
  correctAnswer: number; // Strictly within 0..10 for finger gesture interaction
  emojiAnalogy: string;
  explanation: string;
  gradeLevel: MathGradeLevel;
  topic?: MathQuestionTopic;
  difficulty?: "Dễ" | "Trung bình" | "Thử thách";
}

export interface GradeLevelMeta {
  id: MathGradeLevel;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  colorClass: string;
}
