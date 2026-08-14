import React, { useState, useEffect } from "react";
import {
  Store,
  Stethoscope,
  Bus,
  Briefcase,
  Siren,
  UserCheck,
  Volume2,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Coffee,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  X,
  Phone,
  ShieldAlert,
  HeartPulse,
  Send,
  HelpCircle,
  Hand,
  QrCode,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { soundManager } from "../utils/soundEffects";
import { RecognitionResult } from "../types";

interface RealWorldApplicationHubProps {
  currentResult: RecognitionResult | null;
  onSelectScenarioSentence?: (sentence: string) => void;
}

// Scenarios data structure
const SCENARIOS = [
  {
    id: "cafe",
    title: "1. Quán Cà Phê / Nhà Hàng",
    subtitle: "Gọi món, thanh toán & yêu cầu tại bàn",
    icon: Store,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 border-amber-200 text-amber-900",
    activeColor: "bg-amber-600 text-white",
    items: [
      { name: "Cà phê sữa", price: "30k", emoji: "☕" },
      { name: "Trà đào cam sả", price: "35k", emoji: "🍑" },
      { name: "Bánh mì kẹp thịt", price: "25k", emoji: "🥖" },
      { name: "Nước lọc", price: "10k", emoji: "💧" },
      { name: "Trà sữa chân trâu", price: "40k", emoji: "🧋" },
    ],
    modifiers: ["Nóng", "Ít đá", "Ít đường", "Mang về", "Ăn tại chỗ"],
  },
  {
    id: "medical",
    title: "2. Bệnh Viện / Y Tế",
    subtitle: "Khai báo triệu chứng & giao tiếp với bác sĩ",
    icon: Stethoscope,
    color: "from-rose-500 to-red-600",
    bgColor: "bg-rose-50 border-rose-200 text-rose-900",
    activeColor: "bg-rose-600 text-white",
    symptoms: [
      { text: "Tôi bị đau đầu", emoji: "🤕" },
      { text: "Tôi bị sốt cao", emoji: "🤒" },
      { text: "Tôi bị đau bụng", emoji: "🤢" },
      { text: "Tôi bị dị ứng thuốc", emoji: "⚠️" },
      { text: "Cho tôi xin đơn thuốc", emoji: "💊" },
      { text: "Tôi cần gặp bác sĩ chuyên khoa", emoji: "🩺" },
    ],
  },
  {
    id: "transport",
    title: "3. Giao Thông & Đi Lại",
    subtitle: "Hỏi đường, đi xe buýt & gọi xe",
    icon: Bus,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50 border-blue-200 text-blue-900",
    activeColor: "bg-blue-600 text-white",
    phrases: [
      { text: "Xe buýt này có đến chợ Bến Thành không?", emoji: "🚌" },
      { text: "Vé xe bao nhiêu tiền?", emoji: "💵" },
      { text: "Cho tôi xuống ở trạm tiếp theo", emoji: "🛑" },
      { text: "Nhà vệ sinh công cộng ở đâu?", emoji: "🚻" },
      { text: "Làm ơn giúp tôi bắt xe ôm / taxi", emoji: "🚖" },
    ],
  },
  {
    id: "job",
    title: "4. Công Việc & Phỏng Vấn",
    subtitle: "Giao tiếp văn phòng & giới thiệu bản thân",
    icon: Briefcase,
    color: "from-purple-500 to-indigo-600",
    bgColor: "bg-purple-50 border-purple-200 text-purple-900",
    activeColor: "bg-purple-600 text-white",
    phrases: [
      { text: "Xin chào, tôi đến phỏng vấn xin việc", emoji: "💼" },
      { text: "Tôi giao tiếp qua chữ viết và ngôn ngữ ký hiệu", emoji: "✍️" },
      { text: "Tôi có kinh nghiệm làm việc 2 năm", emoji: "📜" },
      { text: "Tôi có thể sử dụng thành thạo máy tính", emoji: "💻" },
      { text: "Cảm ơn quý công ty đã trao cơ hội", emoji: "🤝" },
    ],
  },
];

export const RealWorldApplicationHub: React.FC<RealWorldApplicationHubProps> = ({
  currentResult,
  onSelectScenarioSentence,
}) => {
  const [activeTab, setActiveTab] = useState<"scenario" | "dialog" | "sos" | "ice">("scenario");
  const [activeScenarioId, setActiveScenarioId] = useState<string>("cafe");

  // Café scenario state
  const [selectedItem, setSelectedItem] = useState<string>("Trà sữa chân trâu");
  const [quantity, setQuantity] = useState<number>(2);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>(["Ít đường", "Ít đá"]);

  // Emergency SOS state
  const [sosModalText, setSosModalText] = useState<string | null>(null);

  // ICE Profile state (persisted in localStorage)
  const [profileName, setProfileName] = useState<string>(() => localStorage.getItem("deaf_ice_name") || "Nguyễn Văn An");
  const [profilePhone, setProfilePhone] = useState<string>(() => localStorage.getItem("deaf_ice_phone") || "0912 345 678");
  const [profileAddress, setProfileAddress] = useState<string>(() => localStorage.getItem("deaf_ice_address") || "Quận 1, TP. Hồ Chí Minh");
  const [profileNote, setProfileNote] = useState<string>(() => localStorage.getItem("deaf_ice_note") || "Tôi là người khiếm thính hoàn toàn. Vui lòng nhắn tin qua điện thoại hoặc gõ chữ trên màn hình.");
  const [profileSaved, setProfileSaved] = useState<boolean>(false);
  const [showFullIceCard, setShowFullIceCard] = useState<boolean>(false);

  const fingerCount = currentResult?.fingerCount;

  // Auto-update quantity from camera finger count if user is on café mode
  useEffect(() => {
    if (activeScenarioId === "cafe" && fingerCount !== undefined && fingerCount > 0) {
      setQuantity((prev) => (prev !== fingerCount ? fingerCount : prev));
    }
  }, [fingerCount, activeScenarioId]);

  // TTS helper
  const handleSpeak = (text: string) => {
    soundManager.playClick();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveProfile = () => {
    soundManager.playSuccessChime();
    localStorage.setItem("deaf_ice_name", profileName);
    localStorage.setItem("deaf_ice_phone", profilePhone);
    localStorage.setItem("deaf_ice_address", profileAddress);
    localStorage.setItem("deaf_ice_note", profileNote);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  // Build café sentence
  const cafeSentence = `Cho tôi ${quantity} ${selectedItem} (${selectedModifiers.join(", ")})`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden my-6">
      {/* Main Hub Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-lg">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Trung Tâm Ứng Dụng Thực Tế Đời Sống
                </h2>
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Thực tế 100% 🚀
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Các bộ công cụ hỗ trợ người khiếm thính giao tiếp tức thì khi đi mua sắm, khám bệnh, đi lại & khẩn cấp
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/10 flex-wrap">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab("scenario");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "scenario"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>1. Kịch bản thực tế</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab("sos");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "sos"
                  ? "bg-rose-500 text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Siren className="w-4 h-4 text-rose-300" />
              <span>2. Thẻ khẩn cấp SOS</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab("ice");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "ice"
                  ? "bg-amber-400 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>3. Thẻ cá nhân ICE</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: REAL-WORLD SCENARIOS (Café, Hospital, Transit, Job) */}
      {activeTab === "scenario" && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Sub-scenario selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SCENARIOS.map((s) => {
              const IconComp = s.icon;
              const isSelected = activeScenarioId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    soundManager.playClick();
                    setActiveScenarioId(s.id);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? `border-2 border-indigo-600 ${s.bgColor} shadow-md scale-[1.02]`
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? `bg-gradient-to-r ${s.color} text-white`
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">{s.title}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{s.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* SCENARIO 1: CAFÉ / RESTAURANT ORDERING PAD */}
          {activeScenarioId === "cafe" && (
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-50 to-amber-50 rounded-2xl p-5 border border-amber-200 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-amber-950 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-amber-600" />
                    <span>Bộ Bảng Gọi Món & Thanh Toán Tương Tác</span>
                  </h3>
                  <p className="text-xs text-amber-800">
                    Bấm chọn món + giơ ngón tay trước camera để chỉnh số lượng tự động!
                  </p>
                </div>

                {/* Finger Count Camera Hint */}
                {currentResult && currentResult.fingerCount > 0 && (
                  <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 animate-bounce">
                    <Hand className="w-4 h-4" />
                    <span>Camera đang nhận diện: {currentResult.fingerCount} Ngón</span>
                  </div>
                )}
              </div>

              {/* Items Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-900 block">
                  1. Chọn Món Ăn / Thức Uống:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {SCENARIOS[0].items.map((it) => (
                    <button
                      key={it.name}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedItem(it.name);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedItem === it.name
                          ? "bg-amber-600 text-white font-bold border-amber-700 shadow-md scale-105"
                          : "bg-white text-slate-800 border-amber-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{it.emoji}</div>
                      <div className="text-xs font-semibold">{it.name}</div>
                      <div className="text-[10px] opacity-80">{it.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector + Modifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
                  <label className="text-xs font-bold text-amber-900 block">
                    2. Số Lượng (Bấm nút hoặc giơ ngón tay trước camera):
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setQuantity((q) => Math.max(1, q - 1));
                      }}
                      className="w-10 h-10 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-lg cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center">
                      <span className="text-3xl font-black text-amber-900">{quantity}</span>
                      <span className="text-xs text-amber-700 block font-medium">phần / ly</span>
                    </div>
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setQuantity((q) => Math.min(10, q + 1));
                      }}
                      className="w-10 h-10 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Modifiers */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
                  <label className="text-xs font-bold text-amber-900 block">
                    3. Yêu Cầu Kèm Theo:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SCENARIOS[0].modifiers.map((m) => {
                      const isSelected = selectedModifiers.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            soundManager.playClick();
                            setSelectedModifiers((prev) =>
                              prev.includes(m) ? prev.filter((i) => i !== m) : [...prev, m]
                            );
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-600 text-white"
                              : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Output Sentence Card */}
              <div className="bg-amber-950 text-white p-4 rounded-2xl shadow-lg border border-amber-500/40 space-y-3">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                  <span>📢 Câu Giao Tiếp Tạo Ra Cho Nhân Viên Thu Ngân:</span>
                  <span className="bg-amber-500/30 text-amber-200 text-[10px] px-2 py-0.5 rounded-full">
                    Sẵn sàng phát âm
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-amber-100 leading-snug">
                  "{cafeSentence}"
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => handleSpeak(cafeSentence)}
                    className="flex-1 min-w-[140px] bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-slate-950 fill-slate-950" />
                    <span>Phát Âm Ra Loa Cho Thu Ngân 🔊</span>
                  </button>

                  {onSelectScenarioSentence && (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onSelectScenarioSentence(cafeSentence);
                      }}
                      className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer border border-white/10"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-300" />
                      <span>Đưa vào bộ ghép câu</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCENARIO 2: HOSPITAL & MEDICAL */}
          {activeScenarioId === "medical" && (
            <div className="bg-gradient-to-br from-rose-500/10 via-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-rose-950 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-rose-600" />
                    <span>Khai Báo Triệu Chứng Sức Khỏe & Y Tế</span>
                  </h3>
                  <p className="text-xs text-rose-800">
                    Bấm chọn triệu chứng để phát âm trực tiếp cho Bác sĩ hoặc Y sĩ nghe:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SCENARIOS[1].symptoms?.map((s) => (
                  <div
                    key={s.text}
                    className="bg-white p-3.5 rounded-2xl border border-rose-200 hover:border-rose-400 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{s.emoji}</span>
                      <span className="font-bold text-xs text-rose-950">{s.text}</span>
                    </div>
                    <button
                      onClick={() => handleSpeak(s.text)}
                      className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
                      title="Phát âm ra loa"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCENARIO 3: TRANSIT & BUS */}
          {activeScenarioId === "transport" && (
            <div className="bg-gradient-to-br from-blue-500/10 via-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-blue-950 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-blue-600" />
                    <span>Đi Xe Buýt & Hỏi Đường Đời Sống</span>
                  </h3>
                  <p className="text-xs text-blue-800">
                    Bấm nút phát âm để hỏi người phụ xe hoặc người qua đường:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SCENARIOS[2].phrases?.map((p) => (
                  <div
                    key={p.text}
                    className="bg-white p-3.5 rounded-2xl border border-blue-200 hover:border-blue-400 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.emoji}</span>
                      <span className="font-bold text-xs text-blue-950">{p.text}</span>
                    </div>
                    <button
                      onClick={() => handleSpeak(p.text)}
                      className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
                      title="Phát âm ra loa"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCENARIO 4: JOB INTERVIEW */}
          {activeScenarioId === "job" && (
            <div className="bg-gradient-to-br from-purple-500/10 via-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-purple-950 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    <span>Giao Tiếp Phỏng Vấn Xin Việc & Văn Phòng</span>
                  </h3>
                  <p className="text-xs text-purple-800">
                    Các mẫu câu chuyên nghiệp giúp bạn phỏng vấn thành công:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SCENARIOS[3].phrases?.map((p) => (
                  <div
                    key={p.text}
                    className="bg-white p-3.5 rounded-2xl border border-purple-200 hover:border-purple-400 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.emoji}</span>
                      <span className="font-bold text-xs text-purple-950">{p.text}</span>
                    </div>
                    <button
                      onClick={() => handleSpeak(p.text)}
                      className="p-2 bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
                      title="Phát âm ra loa"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMERGENCY SOS CARDS */}
      {activeTab === "sos" && (
        <div className="p-5 sm:p-6 space-y-5">
          <div className="bg-gradient-to-r from-rose-900 to-red-950 text-white p-4 rounded-2xl border border-rose-500/40 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse shrink-0" />
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Thẻ Cấp Cứu SOS Khẩn Cấp (1-Chạm Màn Hình)
                </h3>
                <p className="text-xs text-rose-200">
                  Hiển thị chữ kích thước siêu to rõ ràng trên toàn màn hình để người xung quanh hoặc cảnh sát / y sĩ đọc ngay lập tức!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => {
                soundManager.playWarningAlarm();
                setSosModalText("TÔI LÀ NGƯỜI KHANH KHIẾM THÍNH (DEAF)\nVUI LÒNG DÙNG CHỮ VIẾT HOẶC RA HIỆU!");
              }}
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-left font-bold shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">🤟</span>
                <Maximize2 className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold">Thẻ Thông Báo Khiếm Thính</h4>
                <p className="text-xs text-amber-100 font-normal mt-1">
                  Nhờ người xung quanh viết chữ giao tiếp
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                soundManager.playWarningAlarm();
                setSosModalText("CẤP CỨU Y TẾ 115!\nTÔI CẦN TRỢ GIÚP BỆNH VIỆN NGAY LẬP TỨC!");
              }}
              className="p-5 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white text-left font-bold shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <HeartPulse className="w-8 h-8 text-rose-200" />
                <Maximize2 className="w-5 h-5 text-rose-200" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold">Cấp Cứu Y Tế 115</h4>
                <p className="text-xs text-rose-100 font-normal mt-1">
                  Trợ giúp chấn thương / phát bệnh khẩn
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                soundManager.playWarningAlarm();
                setSosModalText("TÔI BỊ LẠC ĐƯỜNG / CẦN TÌM NGƯỜI THÂN!\nVUI LÒNG GỌI CHO NGƯỜI THÂN CỦA TÔI!");
              }}
              className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-left font-bold shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <Phone className="w-8 h-8 text-blue-200" />
                <Maximize2 className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold">Bị Lạc / Cần Tìm Người Thân</h4>
                <p className="text-xs text-blue-100 font-normal mt-1">
                  Nhờ gọi điện thoại cho số người thân ICE
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ICE PERSONAL PROFILE CARD */}
      {activeTab === "ice" && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-base text-amber-950 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <span>Thẻ Hồ Sơ Cá Nhân Khẩn Cấp (ICE Profile Card)</span>
              </h3>
              <p className="text-xs text-amber-800">
                Điền thông tin một lần (được lưu an toàn trên máy) để trình cho công an, bảo vệ, tài xế xe buýt khi cần!
              </p>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                setShowFullIceCard(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Trình Thẻ Màn Hình Rộng</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Form */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Họ và tên người dùng:
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Số điện thoại người thân (ICE Emergency Phone):
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ thường trú:</label>
                <input
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ghi chú giao tiếp đặc biệt:
                </label>
                <textarea
                  rows={2}
                  value={profileNote}
                  onChange={(e) => setProfileNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {profileSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Đã lưu thành công!</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    <span>Lưu Thẻ Cá Nhân</span>
                  </>
                )}
              </button>
            </div>

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border-2 border-indigo-400/40 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    ICE
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-amber-300">
                      THẺ XÁC NHẬN KHANH KHIẾM THÍNH
                    </h4>
                    <span className="text-[10px] text-indigo-300">
                      Hỗ trợ giao tiếp Y tế & Xã hội
                    </span>
                  </div>
                </div>
                <BadgeCheck className="w-6 h-6 text-amber-400" />
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-indigo-300 block text-[10px]">Họ tên:</span>
                  <span className="text-base font-extrabold text-white">{profileName}</span>
                </div>
                <div>
                  <span className="text-indigo-300 block text-[10px]">
                    SĐT Người thân khẩn cấp (ICE):
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {profilePhone}
                  </span>
                </div>
                <div>
                  <span className="text-indigo-300 block text-[10px]">Lưu ý:</span>
                  <p className="text-xs text-amber-100 italic bg-white/5 p-2 rounded-xl border border-white/10">
                    "{profileNote}"
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowFullIceCard(true);
                }}
                className="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Trình thẻ Màn Hình Rộng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN SOS MODAL */}
      {sosModalText && (
        <div className="fixed inset-0 z-50 bg-rose-950 text-white flex flex-col items-center justify-between p-6 sm:p-10 text-center animate-fade-in">
          <button
            onClick={() => {
              soundManager.playClick();
              setSosModalText(null);
            }}
            className="self-end bg-white/20 hover:bg-white/30 text-white p-3 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="my-auto space-y-6">
            <div className="w-20 h-20 rounded-full bg-rose-600 border-4 border-white flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Siren className="w-10 h-10 text-white" />
            </div>

            <div className="text-3xl sm:text-5xl font-black text-amber-300 leading-tight whitespace-pre-line tracking-wide drop-shadow-lg font-mono">
              {sosModalText}
            </div>

            <p className="text-sm text-rose-200">
              Màn hình khẩn cấp. Hãy đưa màn hình này cho người xung quanh đọc ngay!
            </p>
          </div>

          <div className="w-full max-w-md flex items-center gap-3">
            <button
              onClick={() => handleSpeak(sosModalText.replace(/\n/g, " "))}
              className="flex-1 py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-2xl cursor-pointer flex items-center justify-center gap-2"
            >
              <Volume2 className="w-6 h-6 fill-slate-950" />
              <span>Phát Âm Còi Báo 🔊</span>
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN ICE CARD MODAL */}
      {showFullIceCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 text-white flex flex-col items-center justify-between p-6 sm:p-10 text-center animate-fade-in">
          <button
            onClick={() => {
              soundManager.playClick();
              setShowFullIceCard(false);
            }}
            className="self-end bg-white/20 hover:bg-white/30 text-white p-3 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="my-auto max-w-2xl w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-8 sm:p-10 rounded-3xl border-4 border-amber-400 shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between border-b-2 border-indigo-500/40 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center">
                  ICE
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-300">
                    THẺ THÔNG TIN NGƯỜI KHANH KHIẾM THÍNH
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Trình cho Công An / Bác Sĩ / Tài Xế / Nhân Viên
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <span className="text-indigo-300 block text-xs uppercase tracking-wider font-bold">
                  Họ và Tên:
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">{profileName}</span>
              </div>

              <div>
                <span className="text-indigo-300 block text-xs uppercase tracking-wider font-bold">
                  SĐT Người thân khẩn cấp (ICE):
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {profilePhone}
                </span>
              </div>

              <div>
                <span className="text-indigo-300 block text-xs uppercase tracking-wider font-bold">
                  Địa chỉ:
                </span>
                <span className="text-base font-bold text-slate-200">{profileAddress}</span>
              </div>

              <div className="bg-amber-500/20 p-4 rounded-2xl border-2 border-amber-400/50">
                <span className="text-amber-300 block text-xs uppercase tracking-wider font-bold mb-1">
                  Lưu ý giao tiếp quan trọng:
                </span>
                <p className="text-sm sm:text-base font-bold text-amber-100 leading-relaxed">
                  "{profileNote}"
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              setShowFullIceCard(false);
            }}
            className="px-8 py-3 bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl hover:scale-105 transition-all cursor-pointer"
          >
            Đóng màn hình
          </button>
        </div>
      )}
    </div>
  );
};
