import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquarePlus,
  Volume2,
  Trash2,
  Sparkles,
  ArrowRight,
  Send,
  Plus,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Languages,
  PenTool,
  HelpCircle,
  X,
  Play,
  Lightbulb,
  CheckCircle2,
  Camera,
  Hand,
  Type,
} from "lucide-react";
import { RecognitionResult } from "../types";
import { soundManager } from "../utils/soundEffects";

interface SignSentenceBuilderProps {
  currentResult: RecognitionResult | null;
  openGuideTrigger?: boolean;
  onResetGuideTrigger?: () => void;
}

// Preset word chips for quick sentence composition
const WORD_CHIPS = [
  { text: "Tôi", emoji: "👤" },
  { text: "Muốn", emoji: "💭" },
  { text: "Xin chào", emoji: "✋" },
  { text: "Cảm ơn", emoji: "👍" },
  { text: "Cần", emoji: "✋" },
  { text: "Thích", emoji: "❤️" },
  { text: "Có", emoji: "👌" },
  { text: "Không", emoji: "👎" },
  { text: "Bạn", emoji: "🤝" },
  { text: "Học", emoji: "📚" },
];

const NUMBER_CHIPS = [
  { text: "1", emoji: "1️⃣" },
  { text: "2", emoji: "2️⃣" },
  { text: "3", emoji: "3️⃣" },
  { text: "4", emoji: "4️⃣" },
  { text: "5", emoji: "5️⃣" },
  { text: "6", emoji: "6️⃣" },
  { text: "7", emoji: "7️⃣" },
  { text: "8", emoji: "8️⃣" },
  { text: "9", emoji: "9️⃣" },
  { text: "10", emoji: "🔟" },
];

const GUIDED_TUTORIAL_STEPS = [
  {
    step: 1,
    title: "Giơ Bàn Tay Trước Camera",
    icon: Camera,
    color: "from-blue-500 to-cyan-500",
    desc: "Đưa 1 hoặc 2 bàn tay vào khung hình. Camera AI tự động đếm ngón tay (0–10) hoặc nhận diện cử chỉ như 🤟, ✋, 👍.",
    example: "Ví dụ: Giơ 2 ngón tay -> Máy ghi nhận số '2'",
  },
  {
    step: 2,
    title: "Chèn Từ Giao Tiếp Nhanh",
    icon: Hand,
    color: "from-purple-500 to-indigo-500",
    desc: "Nhấp chọn từ ghép sẵn bên dưới như 'Tôi', 'Muốn', 'Cần', 'Cảm ơn' để gắn nối vế câu nhanh chóng.",
    example: "Ví dụ: Chọn từ 'Tôi' và 'Muốn'",
  },
  {
    step: 3,
    title: "Gõ Thêm Từ Tùy Ý (Nếu Cần)",
    icon: Type,
    color: "from-emerald-500 to-teal-500",
    desc: "Nhập thêm từ bổ sung vào ô 'Viết thêm từ bổ sung...' rồi bấm 'Chèn' để câu văn hoàn chỉnh đúng ngữ pháp.",
    example: "Ví dụ: Gõ thêm 'ly trà'",
  },
  {
    step: 4,
    title: "Phát Âm AI & Giao Tiếp",
    icon: Volume2,
    color: "from-amber-500 to-orange-500",
    desc: "Bấm nút '🔊 Phát âm ra loa' để AI phát âm câu hoàn chỉnh cho người đối diện nghe rõ ràng.",
    example: "Kết quả: 'Tôi muốn 2 ly trà'",
  },
];

const INTERACTIVE_PRACTICE_SCENARIOS = [
  {
    title: "Mẫu 1: Gọi món & Số lượng",
    sentence: "Tôi muốn 2 ly trà",
    chips: [
      { text: "Tôi", emoji: "👤" },
      { text: "Muốn", emoji: "💭" },
      { text: "2", emoji: "2️⃣" },
      { text: "ly trà", emoji: "🍵" },
    ],
  },
  {
    title: "Mẫu 2: Chào hỏi & Giới thiệu",
    sentence: "Xin chào tôi tên là Linh",
    chips: [
      { text: "Xin chào", emoji: "✋" },
      { text: "Tôi", emoji: "👤" },
      { text: "tên là Linh", emoji: "🏷️" },
    ],
  },
  {
    title: "Mẫu 3: Bày tỏ tình cảm & Cảm ơn",
    sentence: "Cảm ơn bạn rất nhiều 🤟",
    chips: [
      { text: "Cảm ơn", emoji: "👍" },
      { text: "Bạn", emoji: "🤝" },
      { text: "rất nhiều", emoji: "✨" },
      { text: "Tôi Yêu Bạn", emoji: "🤟" },
    ],
  },
];

export const SignSentenceBuilder: React.FC<SignSentenceBuilderProps> = ({
  currentResult,
  openGuideTrigger,
  onResetGuideTrigger,
}) => {
  const [words, setWords] = useState<Array<{ id: string; text: string; emoji: string }>>([]);
  const [customText, setCustomText] = useState<string>("");
  const lastAddedIdRef = useRef<string | null>(null);
  const lastAddedTimeRef = useRef<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    if (openGuideTrigger) {
      setShowGuideModal(true);
      if (onResetGuideTrigger) onResetGuideTrigger();
    }
  }, [openGuideTrigger, onResetGuideTrigger]);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);

  const gestureId = currentResult?.gestureId;
  const gestureConfidence = currentResult?.confidence ?? 0;
  const fingerCount = currentResult?.fingerCount ?? 0;
  const gestureName = currentResult?.name;
  const gestureEmoji = currentResult?.emoji;

  // Auto-append high-confidence detected gestures or finger counts
  useEffect(() => {
    if (!gestureId || gestureId === "unknown" || gestureConfidence < 80) {
      return;
    }

    const now = Date.now();
    // Prevent spam: must be different gesture or at least 2.5s passed
    if (gestureId !== lastAddedIdRef.current || now - lastAddedTimeRef.current > 2500) {
      lastAddedIdRef.current = gestureId;
      lastAddedTimeRef.current = now;

      const uniqueId = `${gestureId}-${fingerCount}-${now}`;
      let textToAdd = gestureName || "";
      if (fingerCount > 0) {
        textToAdd = `${fingerCount}`;
      }

      setWords((prev) => [
        ...prev,
        {
          id: uniqueId,
          text: textToAdd,
          emoji: gestureEmoji || "✋",
        },
      ]);
      soundManager.playClick();
    }
  }, [gestureId, gestureConfidence, fingerCount, gestureName, gestureEmoji]);

  // Compute full text from chips + custom text
  const fullSentence = [
    ...words.map((w) => w.text),
    ...(customText.trim() ? [customText.trim()] : []),
  ].join(" ");

  const handleAddChip = (text: string, emoji: string) => {
    soundManager.playClick();
    setWords((prev) => [
      ...prev,
      { id: `${text}-${Date.now()}`, text, emoji },
    ]);
  };

  const handleRemoveWord = (id: string) => {
    soundManager.playClick();
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleClear = () => {
    soundManager.playClick();
    setWords([]);
    setCustomText("");
    lastAddedIdRef.current = null;
  };

  const handleSpeakSentence = () => {
    if (!fullSentence) return;
    soundManager.playClick();
    soundManager.speakText(fullSentence);
  };

  const handleCopy = () => {
    if (!fullSentence) return;
    navigator.clipboard.writeText(fullSentence);
    setCopied(true);
    soundManager.playSuccessChime();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadScenario = (scenario: typeof INTERACTIVE_PRACTICE_SCENARIOS[0]) => {
    soundManager.playClick();
    setWords(
      scenario.chips.map((c, idx) => ({
        id: `demo-${idx}-${Date.now()}`,
        text: c.text,
        emoji: c.emoji,
      }))
    );
    setCustomText("");
    setShowGuideModal(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 text-white shadow-2xl border border-indigo-500/30 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <PenTool className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Soạn & Học Viết Câu Hoàn Chỉnh AI
            </h3>
            <p className="text-xs text-indigo-200">
              Ghép cử chỉ tay 2 bên + từ gợi ý + gõ phím để tạo câu nói hoàn chỉnh cho người khiếm thính
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Beginner Guide Trigger Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShowGuideModal(true);
            }}
            className="text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Hướng dẫn người mới</span>
          </button>

          {(words.length > 0 || customText) && (
            <button
              onClick={handleClear}
              className="text-xs font-semibold text-indigo-300 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa làm lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Beginner Quick Callout Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-400/30 rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-300 font-bold">Người mới bắt đầu?</strong> Giơ tay trước camera 📷 hoặc bấm chọn các thẻ từ/con số bên dưới để ghép thành câu hoàn chỉnh!
          </span>
        </div>
        <button
          onClick={() => {
            soundManager.playClick();
            setShowGuideModal(true);
          }}
          className="underline font-bold text-amber-300 hover:text-white shrink-0 cursor-pointer"
        >
          Xem hướng dẫn 4 bước →
        </button>
      </div>

      {/* Main Sentence Workspace Box */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-indigo-400/30 shadow-inner min-h-[110px] my-3">
        <div className="flex flex-wrap items-center gap-2 min-h-[48px]">
          {words.length === 0 && !customText && (
            <p className="text-xs text-indigo-200/70 italic my-auto">
              ✋ Đưa 1 hoặc 2 bàn tay trước camera hoặc chọn từ gợi ý bên dưới để ghép câu hoàn chỉnh...
            </p>
          )}

          {words.map((word) => (
            <div
              key={word.id}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md animate-fade-in group border border-indigo-300/30 hover:border-indigo-200"
            >
              <span className="text-sm">{word.emoji}</span>
              <span>{word.text}</span>
              <button
                onClick={() => handleRemoveWord(word.id)}
                className="text-indigo-200 hover:text-rose-300 text-xs font-bold ml-1 cursor-pointer"
                title="Xóa từ này"
              >
                ×
              </button>
            </div>
          ))}

          {customText.trim() && (
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-3 py-1.5 rounded-xl font-bold text-xs">
              ✍️ {customText}
            </span>
          )}
        </div>

        {/* Manual Text Extension Input */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Viết thêm từ bổ sung vào câu..."
            className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {customText.trim() && (
            <button
              onClick={() => {
                handleAddChip(customText.trim(), "✍️");
                setCustomText("");
              }}
              className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chèn</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Word & Number Palettes */}
      <div className="space-y-3 my-4">
        {/* Words */}
        <div>
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>💬 Từ Giao Tiếp Nhanh:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {WORD_CHIPS.map((chip) => (
              <button
                key={chip.text}
                onClick={() => handleAddChip(chip.text, chip.emoji)}
                className="bg-white/10 hover:bg-indigo-600 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{chip.emoji}</span>
                <span>{chip.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Numbers 1-10 */}
        <div>
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>🔢 Chèn Số Đếm (1 - 10):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NUMBER_CHIPS.map((chip) => (
              <button
                key={chip.text}
                onClick={() => handleAddChip(chip.text, chip.emoji)}
                className="bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-purple-400/30 font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>{chip.emoji}</span>
                <span>Số {chip.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Practice Scenarios */}
        <div>
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>📚 Thử Mẫu Câu Thực Hành Ngay (Dành Cho Người Mới):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTERACTIVE_PRACTICE_SCENARIOS.map((scen) => (
              <button
                key={scen.title}
                onClick={() => handleLoadScenario(scen)}
                className="bg-indigo-900/50 hover:bg-emerald-600 text-indigo-100 hover:text-white text-xs px-3 py-1.5 rounded-xl border border-indigo-400/30 transition-all flex items-center gap-1.5 cursor-pointer group"
              >
                <Play className="w-3 h-3 text-emerald-400 group-hover:text-white" />
                <span className="font-bold">{scen.title}:</span>
                <span className="italic opacity-90">"{scen.sentence}"</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 flex-wrap gap-2">
        <div className="text-xs text-indigo-200 font-medium">
          {fullSentence ? (
            <span className="text-emerald-300 font-bold">
              Câu hoàn chỉnh: "{fullSentence}"
            </span>
          ) : (
            "Chưa có từ nào trong câu"
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!fullSentence}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã chép!" : "Sao chép"}</span>
          </button>

          <button
            onClick={handleSpeakSentence}
            disabled={!fullSentence}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Volume2 className="w-4 h-4 text-slate-950" />
            <span>🔊 Phát âm ra loa</span>
          </button>
        </div>
      </div>

      {/* BEGINNER GUIDE TUTORIAL MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setShowGuideModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 p-2 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Lightbulb className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Hướng Dẫn 4 Bước Ghép Câu Hoàn Chỉnh (Dành Cho Người Mới)
                </h3>
                <p className="text-xs text-indigo-200">
                  Cách kết hợp ký hiệu camera AI + thẻ từ gợi ý + giọng nói AI
                </p>
              </div>
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5">
              {GUIDED_TUTORIAL_STEPS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.step}
                    className="bg-slate-800/80 rounded-2xl p-4 border border-indigo-500/20 hover:border-indigo-400/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className={`w-7 h-7 rounded-xl bg-gradient-to-r ${item.color} text-white font-black text-xs flex items-center justify-center shadow-md`}>
                          0{item.step}
                        </span>
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <IconComponent className="w-4 h-4 text-indigo-300" />
                          <span>{item.title}</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {item.desc}
                      </p>
                    </div>

                    <div className="bg-indigo-950/60 rounded-xl p-2.5 border border-indigo-400/20 text-[11px] text-indigo-200 font-mono">
                      💡 {item.example}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Trial Section in Modal */}
            <div className="bg-indigo-900/40 rounded-2xl p-4 border border-indigo-500/30 my-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Thực hành nhanh với các câu mẫu thử nghiệm:</span>
              </h4>
              <p className="text-xs text-slate-300 mb-3">
                Bấm vào câu mẫu bên dưới để tự động điền các thẻ từ vào bộ soạn thảo:
              </p>
              <div className="space-y-2">
                {INTERACTIVE_PRACTICE_SCENARIOS.map((scen) => (
                  <div
                    key={scen.title}
                    className="bg-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-3 border border-indigo-400/20"
                  >
                    <div>
                      <span className="font-bold text-xs text-white block">{scen.title}</span>
                      <span className="text-xs text-emerald-300 font-medium">"{scen.sentence}"</span>
                    </div>
                    <button
                      onClick={() => handleLoadScenario(scen)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Thử câu này</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Modal Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowGuideModal(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                Tôi Đã Hiểu - Bắt Đầu Ghép Câu 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

