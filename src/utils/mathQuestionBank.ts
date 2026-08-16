// Master Math Question Bank for AR & Interactive Finger-Counting Game
// Diverse questions spanning Grades 1-2, 3-5, 6, 7, 8-9 (THCS)
// Exactly 100 high-quality questions per grade level (500 questions in total!)
// All correct answers are strictly within [0, 10] for finger/gesture matching

import {
  MathGradeLevel,
  MathQuestionTopic,
  MathQuestion,
  GradeLevelMeta,
} from "./mathQuestionTypes";
import { GRADE_1_2_QUESTIONS } from "./mathQuestionsGrade1_2";
import { GRADE_3_5_QUESTIONS } from "./mathQuestionsGrade3_5";
import { GRADE_6_QUESTIONS } from "./mathQuestionsGrade6";
import { GRADE_7_QUESTIONS } from "./mathQuestionsGrade7";
import { GRADE_8_9_QUESTIONS } from "./mathQuestionsGrade8_9";

export type { MathGradeLevel, MathQuestionTopic, MathQuestion, GradeLevelMeta };

export const GRADE_LEVEL_OPTIONS: GradeLevelMeta[] = [
  {
    id: "Lớp 1 - 2",
    label: "Lớp 1 - 2 (Tiểu học)",
    shortLabel: "Lớp 1-2",
    description: "Cộng trừ phạm vi 10, đếm đồ vật, nhân 2-3 cơ bản, toán đố vui (100 câu)",
    icon: "🍎",
    colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    id: "Lớp 3 - 5",
    label: "Lớp 3 - 5 (Tiểu học)",
    shortLabel: "Lớp 3-5",
    description: "Bảng nhân chia, phân số, chu vi diện tích, bài toán logic & tuổi (100 câu)",
    icon: "🍬",
    colorClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    id: "Lớp 6 (THCS)",
    label: "Lớp 6 (THCS)",
    shortLabel: "Lớp 6",
    description: "Số nguyên âm dương, phương trình tìm x, lũy thừa, số nguyên tố, ƯCLN & BCNN (100 câu)",
    icon: "⚡",
    colorClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  {
    id: "Lớp 7 (THCS)",
    label: "Lớp 7 (THCS)",
    shortLabel: "Lớp 7",
    description: "Căn bậc hai số học, tỉ lệ thức, giá trị tuyệt đối, đơn thức & định lý Pythagore (100 câu)",
    icon: "📐",
    colorClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    id: "Lớp 8 - 9 (THCS)",
    label: "Lớp 8 - 9 (THCS)",
    shortLabel: "Lớp 8-9",
    description: "Hằng đẳng thức, hệ phương trình 2 ẩn, nghiệm bậc hai, căn lồng & hình học đa giác (100 câu)",
    icon: "🚀",
    colorClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
];

// Curated Master Math Question Bank (500 questions total, 100 per grade)
export const MASTER_MATH_QUESTION_BANK: MathQuestion[] = [
  ...GRADE_1_2_QUESTIONS,
  ...GRADE_3_5_QUESTIONS,
  ...GRADE_6_QUESTIONS,
  ...GRADE_7_QUESTIONS,
  ...GRADE_8_9_QUESTIONS,
];

/**
 * Fisher-Yates shuffle algorithm for robust random order
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets all questions filtered by grade level, shuffled in random order
 */
export function getShuffledQuestionsForGrade(gradeLevel: MathGradeLevel): MathQuestion[] {
  const filtered = MASTER_MATH_QUESTION_BANK.filter((q) => q.gradeLevel === gradeLevel);
  return shuffleArray(filtered);
}

/**
 * Picks a random question for a specific grade level, avoiding the current question ID
 */
export function getRandomQuestionForGrade(
  gradeLevel: MathGradeLevel,
  excludeId?: string
): MathQuestion {
  const filtered = MASTER_MATH_QUESTION_BANK.filter(
    (q) => q.gradeLevel === gradeLevel && q.id !== excludeId
  );
  if (filtered.length === 0) {
    // fallback if only 1 exists
    const fallback = MASTER_MATH_QUESTION_BANK.filter((q) => q.gradeLevel === gradeLevel);
    return fallback[0] || MASTER_MATH_QUESTION_BANK[0];
  }
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

/**
 * Returns the count of questions available for each grade level
 */
export function getQuestionsCountByGrade(): Record<string, number> {
  const counts: Record<string, number> = {
    "Tất cả": MASTER_MATH_QUESTION_BANK.length,
  };
  for (const opt of GRADE_LEVEL_OPTIONS) {
    counts[opt.id] = MASTER_MATH_QUESTION_BANK.filter((q) => q.gradeLevel === opt.id).length;
  }
  return counts;
}

/**
 * Dynamically generates a fresh mathematical problem on the fly
 * ensures infinite variety for endless practice
 */
export function generateDynamicQuestion(gradeLevel: MathGradeLevel): MathQuestion {
  const seed = Date.now();
  const id = `dynamic_${gradeLevel}_${seed}`;

  switch (gradeLevel) {
    case "Lớp 1 - 2": {
      // Random addition or subtraction with answer between 0 and 10
      const isAdd = Math.random() > 0.4;
      if (isAdd) {
        const a = Math.floor(Math.random() * 6); // 0..5
        const b = Math.floor(Math.random() * (11 - a)); // 0..(10-a)
        const ans = a + b;
        return {
          id,
          problemStr: `${a} + ${b} = ?`,
          correctAnswer: ans,
          emojiAnalogy: `Thực hiện phép cộng: ${a} cộng ${b} = ${ans} 🌟`,
          explanation: `Phép tính cộng: ${a} + ${b} = ${ans}!`,
          gradeLevel,
          topic: "Cộng trừ cơ bản",
          difficulty: "Dễ",
        };
      } else {
        const a = Math.floor(Math.random() * 11); // 0..10
        const b = Math.floor(Math.random() * (a + 1)); // 0..a
        const ans = a - b;
        return {
          id,
          problemStr: `${a} - ${b} = ?`,
          correctAnswer: ans,
          emojiAnalogy: `Thực hiện phép trừ: ${a} trừ ${b} = ${ans} 🍃`,
          explanation: `Phép tính trừ: ${a} - ${b} = ${ans}!`,
          gradeLevel,
          topic: "Cộng trừ cơ bản",
          difficulty: "Dễ",
        };
      }
    }

    case "Lớp 3 - 5": {
      // Multiplication or division with answer 0..10
      const operations = ["mul", "div", "fraction"];
      const op = operations[Math.floor(Math.random() * operations.length)];
      if (op === "mul") {
        const a = Math.floor(Math.random() * 4) + 1; // 1..4
        const maxB = Math.floor(10 / a);
        const b = Math.floor(Math.random() * maxB) + 1;
        const ans = a * b;
        return {
          id,
          problemStr: `${a} x ${b} = ?`,
          correctAnswer: ans,
          emojiAnalogy: `${a} nhóm, mỗi nhóm có ${b} phần = ${ans} 🍪`,
          explanation: `Phép nhân: ${a} x ${b} = ${ans}!`,
          gradeLevel,
          topic: "Nhân & Chia",
          difficulty: "Dễ",
        };
      } else if (op === "fraction") {
        const factor = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, 5
        const ans = Math.floor(Math.random() * 10) + 1; // 1..10
        const total = ans * factor;
        return {
          id,
          problemStr: `1/${factor} của ${total} = ?`,
          correctAnswer: ans,
          emojiAnalogy: `${total} chia làm ${factor} phần = ${ans} 🍊`,
          explanation: `Một phần ${factor} của ${total} là ${total} : ${factor} = ${ans}!`,
          gradeLevel,
          topic: "Phân số & Chu vi",
          difficulty: "Trung bình",
        };
      } else {
        const divisor = Math.floor(Math.random() * 8) + 2; // 2..9
        const ans = Math.floor(Math.random() * 10) + 1; // 1..10
        const dividend = ans * divisor;
        return {
          id,
          problemStr: `${dividend} : ${divisor} = ?`,
          correctAnswer: ans,
          emojiAnalogy: `${dividend} chia cho ${divisor} = ${ans} 🍬`,
          explanation: `Phép chia: ${dividend} : ${divisor} = ${ans}!`,
          gradeLevel,
          topic: "Nhân & Chia",
          difficulty: "Dễ",
        };
      }
    }

    case "Lớp 6 (THCS)": {
      // Linear equation ax + b = c
      const ans = Math.floor(Math.random() * 10) + 1; // 1..10
      const a = Math.floor(Math.random() * 5) + 1; // 1..5
      const constant = Math.floor(Math.random() * 6); // 0..5
      const target = a * ans + constant;
      return {
        id,
        problemStr: `Tìm x: ${a}x + ${constant} = ${target}`,
        correctAnswer: ans,
        emojiAnalogy: `${a}x = ${target} - ${constant} = ${a * ans} ➡️ x = ${ans} 💡`,
        explanation: `Chuyển vế: ${a}x = ${target - constant}, suy ra x = ${ans}!`,
        gradeLevel,
        topic: "Tìm x & Đại số",
        difficulty: "Trung bình",
      };
    }

    case "Lớp 7 (THCS)": {
      // Square roots
      const ans = Math.floor(Math.random() * 11); // 0..10
      const sq = ans * ans;
      return {
        id,
        problemStr: `Căn bậc hai: √${sq} = ?`,
        correctAnswer: ans,
        emojiAnalogy: `${ans}² = ${sq} ➡️ √${sq} = ${ans} 📐`,
        explanation: `Căn bậc hai số học của ${sq} là ${ans} vì ${ans}² = ${sq}!`,
        gradeLevel,
        topic: "Căn bậc hai",
        difficulty: "Dễ",
      };
    }

    case "Lớp 8 - 9 (THCS)": {
      // Pythagorean triples or polynomial root
      const ans = Math.floor(Math.random() * 9) + 2; // 2..10
      return {
        id,
        problemStr: `Tìm x dương: x² - ${ans * ans} = 0`,
        correctAnswer: ans,
        emojiAnalogy: `x² = ${ans * ans} ➡️ x = ${ans} (x > 0) 🚀`,
        explanation: `Phương trình có nghiệm dương: x = √${ans * ans} = ${ans}!`,
        gradeLevel,
        topic: "Hằng đẳng thức",
        difficulty: "Trung bình",
      };
    }
  }
}
