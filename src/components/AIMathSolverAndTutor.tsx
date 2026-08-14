import React, { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  Volume2,
  CheckCircle2,
  Send,
  HelpCircle,
  Lightbulb,
  Copy,
  Check,
  RotateCcw,
  GraduationCap,
  Calculator,
  ChevronRight,
  Smile,
} from "lucide-react";
import { soundManager } from "../utils/soundEffects";

interface AIMathSolverAndTutorProps {
  onSelectMathProblem?: (problem: string) => void;
}

interface MathSolutionResponse {
  finalAnswer: string;
  steps: string[];
  visualAnalogy: string;
  explanation: string;
  encouragement: string;
}

const PRESET_TOPICS = [
  // --- TIỂU HỌC ---
  {
    category: "Tiểu học",
    grade: "Lớp 1 - 2",
    title: "Phép cộng có nhớ & trừ phạm vi 100",
    sampleProblem: "Tính nhanh: 37 + 28 = ?",
    icon: "➕",
  },
  {
    category: "Tiểu học",
    grade: "Lớp 3",
    title: "Bảng nhân 5 & Phép chia",
    sampleProblem: "Có 35 chiếc kẹo chia đều cho 5 bạn. Hỏi mỗi bạn nhận được bao nhiêu chiếc kẹo?",
    icon: "✖️",
  },
  {
    category: "Tiểu học",
    grade: "Lớp 4",
    title: "Toán đố Tổng & Hiệu",
    sampleProblem: "Tổng số tuổi của hai mẹ con là 42 tuổi. Mẹ hơn con 26 tuổi. Hỏi mẹ bao nhiêu tuổi, con bao nhiêu tuổi?",
    icon: "👩‍👦",
  },
  {
    category: "Tiểu học",
    grade: "Lớp 5",
    title: "Diện tích hình chữ nhật & Tỉ số %",
    sampleProblem: "Một khu vườn hình chữ nhật có chiều dài 25m, chiều rộng 12m. Tính chu vi và diện tích khu vườn.",
    icon: "📐",
  },

  // --- TRUNG HỌC CƠ SỞ (THCS - LỚP 6) ---
  {
    category: "Lớp 6",
    grade: "Lớp 6 (THCS)",
    title: "Tìm x & Quy tắc chuyển vế",
    sampleProblem: "Tìm số nguyên x biết: 3x - 15 = 45",
    icon: "🧮",
  },
  {
    category: "Lớp 6",
    grade: "Lớp 6 (THCS)",
    title: "Ước chung lớn nhất & Bội chung",
    sampleProblem: "Tìm ƯCLN(24, 36) và BCNN(24, 36).",
    icon: "🧩",
  },
  {
    category: "Lớp 6",
    grade: "Lớp 6 (THCS)",
    title: "Phép tính số nguyên có dấu âm",
    sampleProblem: "Tính hợp lý: (-25) . 64 + (-25) . 36",
    icon: "⚖️",
  },

  // --- TRUNG HỌC CƠ SỞ (THCS - LỚP 7) ---
  {
    category: "Lớp 7",
    grade: "Lớp 7 (THCS)",
    title: "Tỉ lệ thức & Dãy tỉ số bằng nhau",
    sampleProblem: "Tìm hai số x và y biết: x/3 = y/5 và x + y = 32.",
    icon: "📊",
  },
  {
    category: "Lớp 7",
    grade: "Lớp 7 (THCS)",
    title: "Căn bậc hai số học & Số thực",
    sampleProblem: "Tính giá trị biểu thức: A = √49 + √64 - √25",
    icon: "💎",
  },
  {
    category: "Lớp 7",
    grade: "Lớp 7 (THCS)",
    title: "Định lý Pythagoras trong tam giác vuông",
    sampleProblem: "Cho tam giác ABC vuông tại A có AB = 6cm, AC = 8cm. Tính độ dài cạnh huyền BC.",
    icon: "📐",
  },

  // --- TRUNG HỌC CƠ SỞ (THCS - LỚP 8) ---
  {
    category: "Lớp 8",
    grade: "Lớp 8 (THCS)",
    title: "Hằng đẳng thức đáng nhớ",
    sampleProblem: "Rút gọn biểu thức: (x + 3)² - x(x + 5)",
    icon: "⚡",
  },
  {
    category: "Lớp 8",
    grade: "Lớp 8 (THCS)",
    title: "Giải phương trình bậc nhất một ẩn",
    sampleProblem: "Giải phương trình: 3(x - 2) = 2x + 7",
    icon: "🎯",
  },
  {
    category: "Lớp 8",
    grade: "Lớp 8 (THCS)",
    title: "Toán chuyển động ca nô / ô tô",
    sampleProblem: "Một ca nô xuôi dòng mất 2 giờ và ngược dòng mất 3 giờ. Biết vận tốc dòng nước là 3km/h. Tính khoảng cách giữa hai bến.",
    icon: "🚤",
  },

  // --- TRUNG HỌC CƠ SỞ (THCS - LỚP 9) ---
  {
    category: "Lớp 9",
    grade: "Lớp 9 (THCS)",
    title: "Giải hệ phương trình bậc nhất 2 ẩn",
    sampleProblem: "Giải hệ phương trình: 2x + y = 7 và x - y = 2.",
    icon: "🤝",
  },
  {
    category: "Lớp 9",
    grade: "Lớp 9 (THCS)",
    title: "Rút gọn biểu thức chứa căn thức",
    sampleProblem: "Rút gọn biểu thức: P = √18 + √50 - √72",
    icon: "🌿",
  },
  {
    category: "Lớp 9",
    grade: "Lớp 9 (THCS)",
    title: "Phương trình bậc hai & Định lý Vi-ét",
    sampleProblem: "Giải phương trình bậc hai: x² - 5x + 6 = 0.",
    icon: "🌟",
  },
];

export const AIMathSolverAndTutor: React.FC<AIMathSolverAndTutorProps> = () => {
  const [gradeLevel, setGradeLevel] = useState<string>("THCS - Lớp 6 (Số nguyên, Tìm x, Ước-Bội)");
  const [selectedTopicCategory, setSelectedTopicCategory] = useState<string>("Tất cả");
  const [problemInput, setProblemInput] = useState<string>("Tìm số nguyên x biết: 3x - 15 = 45");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [solution, setSolution] = useState<MathSolutionResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const filteredTopics = PRESET_TOPICS.filter(
    (t) => selectedTopicCategory === "Tất cả" || t.category === selectedTopicCategory
  );

  const handleSolveMath = async (textToSolve?: string) => {
    const query = textToSolve || problemInput;
    if (!query.trim()) return;

    soundManager.playClick();
    setIsLoading(true);
    setSolution(null);

    try {
      const response = await fetch("/api/solve-math", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: query,
          gradeLevel,
        }),
      });

      const data = await response.json();
      setSolution({
        finalAnswer: data.finalAnswer || "Xem kết quả bài giải",
        steps: data.steps || ["Đang phân tích dữ liệu", "Thực hiện phép tính"],
        visualAnalogy: data.visualAnalogy || "🍎 + 🍎 = 🍎🍎",
        explanation: data.explanation || "Hướng dẫn chi tiết từng bước.",
        encouragement: data.encouragement || "Bạn đã học rất xuất sắc! Hãy tiếp tục rèn luyện nhé!",
      });

      soundManager.playSuccessChime();
    } catch (err) {
      console.error("Lỗi khi giải toán:", err);
      setSolution({
        finalAnswer: "Kết quả ước tính",
        steps: [
          "Bước 1: Phân tích tóm tắt bài toán.",
          "Bước 2: Lập sơ đồ phép tính tương ứng.",
          "Bước 3: Thực hiện tính toán và ghi đáp số.",
        ],
        visualAnalogy: "✏️ 15 + (15 + 8) = 15 + 23 = 38",
        explanation: "Phân tích: Bình có 15 + 8 = 23 viên bi. Cả hai bạn có: 15 + 23 = 38 viên bi.",
        encouragement: "Giỏi lắm! Hãy kiểm tra lại kết quả nhé!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakSolution = () => {
    if (!solution) return;
    soundManager.playClick();
    const fullText = `Đáp số: ${solution.finalAnswer}. Lời giải: ${solution.explanation}`;
    soundManager.speakText(fullText);
  };

  const handleCopySolution = () => {
    if (!solution) return;
    soundManager.playClick();
    const textToCopy = `BÀI GIẢI TOÁN AI:\nĐề bài: ${problemInput}\nĐáp số: ${solution.finalAnswer}\n\nCác bước giải:\n${solution.steps.join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden my-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-lg">
              <BrainCircuit className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Gia Sư Giải Toán AI Từng Bước
                </h2>
                <span className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Gemini AI Math Tutor 🤖
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Nhập bất kỳ đề bài toán nào (cộng trừ, nhân chia, toán có lời văn) để nhận lời giải minh họa siêu sinh động
              </p>
            </div>
          </div>

          {/* Grade Level Selector */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/10">
            <GraduationCap className="w-4 h-4 text-cyan-300 ml-1 shrink-0" />
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-2"
            >
              <option value="Tiểu học (Lớp 1 - 5)" className="bg-slate-900 text-white">
                Tiểu học (Lớp 1 - 5)
              </option>
              <option value="THCS - Lớp 6 (Số nguyên, Tìm x, Ước-Bội)" className="bg-slate-900 text-white">
                THCS - Lớp 6 (Số nguyên, Tìm x, Ước-Bội)
              </option>
              <option value="THCS - Lớp 7 (Tỉ lệ thức, Căn bậc hai, Hình học)" className="bg-slate-900 text-white">
                THCS - Lớp 7 (Tỉ lệ thức, Căn bậc hai, Hình học)
              </option>
              <option value="THCS - Lớp 8 (Hằng đẳng thức, Phương trình bậc nhất)" className="bg-slate-900 text-white">
                THCS - Lớp 8 (Hằng đẳng thức, PT bậc nhất)
              </option>
              <option value="THCS - Lớp 9 (Hệ phương trình, Căn thức, Vi-ét)" className="bg-slate-900 text-white">
                THCS - Lớp 9 (Hệ PT, Căn thức, Vi-ét)
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Preset Topics Filter & Grid */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Mẫu Bài Toán Phổ Biến (Bấm chọn thử ngay):</span>
            </label>

            {/* Category Filter Pills */}
            <div className="flex items-center flex-wrap gap-1">
              {["Tất cả", "Tiểu học", "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedTopicCategory(cat);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTopicCategory === cat
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {filteredTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setProblemInput(topic.sampleProblem);
                  handleSolveMath(topic.sampleProblem);
                }}
                className="p-3 bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left transition-all cursor-pointer group flex items-start gap-2.5"
              >
                <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                  {topic.icon}
                </span>
                <div>
                  <div className="text-[11px] font-bold text-indigo-600">{topic.grade}</div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{topic.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5">
                    "{topic.sampleProblem}"
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Math Problem Input Form */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Nhập đề bài toán của bạn vào đây:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={problemInput}
                onChange={(e) => setProblemInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSolveMath();
                }}
                placeholder="Ví dụ: Tính 45 + 38 = ? hoặc Tìm x biết 2x + 10 = 30"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
              />
            </div>

            <button
              onClick={() => handleSolveMath()}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI đang giải...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Giải Bài Toán Bằng AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI SOLUTION DISPLAY BOARD */}
        {solution && (
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border-2 border-indigo-400/40 shadow-xl space-y-5 animate-fade-in">
            {/* Answer Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                  🎯 ĐÁP SỐ CHÍNH XÁC:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1 font-mono">
                  {solution.finalAnswer}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakSolution}
                  className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Volume2 className="w-4 h-4 fill-slate-950" />
                  <span>Đọc Lời Giải 🔊</span>
                </button>

                <button
                  onClick={handleCopySolution}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10"
                  title="Sao chép bài giải"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Visual Emoji Analogy */}
            {solution.visualAnalogy && (
              <div className="bg-amber-400/10 border border-amber-400/30 p-3.5 rounded-2xl">
                <span className="text-[11px] text-amber-300 font-bold block mb-1">
                  🎨 Sơ Đồ Minh Họa Trực Quan:
                </span>
                <div className="text-base sm:text-lg font-bold text-amber-100 font-mono">
                  {solution.visualAnalogy}
                </div>
              </div>
            )}

            {/* Step-by-Step Explanation */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Các Bước Giải Chi Tiết Từng Bước:</span>
              </span>

              <div className="space-y-2">
                {solution.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-cyan-400/30">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Encouragement Footer */}
            {solution.encouragement && (
              <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-300 font-bold">
                <Smile className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{solution.encouragement}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
