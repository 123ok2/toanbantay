import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Hand,
  Heart,
  Eye,
  Smile,
  Volume2,
  Info,
} from "lucide-react";
import { GESTURE_DICTIONARY } from "../utils/gestureDictionary";
import { soundManager } from "../utils/soundEffects";

export const GestureGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"alphabet" | "conversational" | "sentence" | "etiquette" | "steps">("alphabet");

  const allGestures = Object.values(GESTURE_DICTIONARY).filter((g) => g.id !== "unknown");
  const alphabetGestures = allGestures.filter((g) => g.category === "alphabet");
  const conversationalGestures = allGestures.filter((g) => g.category === "conversational");

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-100">
      {/* Header & Nav Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Góc Học Tập & Từ Điển Ngôn Ngữ Ký Hiệu
            </h2>
            <p className="text-xs text-slate-500">
              Tìm hiểu bảng chữ cái ngón tay, ghép câu hoàn chỉnh & văn hóa cộng đồng người khiếm thính
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-semibold flex-wrap gap-1">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab("alphabet");
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "alphabet"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔤 Chữ cái ngón tay
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab("conversational");
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "conversational"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💬 Từ vựng giao tiếp
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab("sentence");
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "sentence"
                ? "bg-indigo-600 text-white shadow-xs font-bold"
                : "text-indigo-600 hover:text-indigo-900 bg-indigo-50"
            }`}
          >
            💡 Hướng dẫn ghép câu
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab("etiquette");
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "etiquette"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🤝 Văn hóa giao tiếp
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab("steps");
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "steps"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📖 Hướng dẫn
          </button>
        </div>
      </div>

      {/* Tab 1: Finger-spelling Alphabet */}
      {activeTab === "alphabet" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Bảng chữ cái ngón tay (Finger-spelling):</strong> Dùng bàn tay tạo hình các chữ cái A, B, C, I, L, V, Y, S... để đánh vần tên riêng, tên địa danh hoặc từ mới khi giao tiếp với người khiếm thính.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {alphabetGestures.map((g) => (
              <div
                key={g.id}
                onClick={() => soundManager.speakText(g.name)}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl group-hover:scale-125 transition-transform">
                      {g.emoji}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      Chữ cái
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{g.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {g.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-indigo-600">
                    💡 {g.tips}
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Conversational Signs */}
      {activeTab === "conversational" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-purple-950 flex items-start gap-2">
            <Heart className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>
              <strong>Từ vựng ký hiệu thông dụng:</strong> Các từ chào hỏi, cảm ơn, biểu thị đồng ý và trao gửi yêu thương 🤟 giúp học sinh nhanh chóng thực hành trò chuyện thực tế.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {conversationalGestures.map((g) => (
              <div
                key={g.id}
                onClick={() => soundManager.speakText(g.name)}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-200 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl group-hover:scale-125 transition-transform">
                      {g.emoji}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      Từ vựng
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{g.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {g.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-purple-600">
                    💡 {g.tips}
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2.5: Beginner Sentence Building Guide */}
      {activeTab === "sentence" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 text-white shadow-lg space-y-2">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <span>💡 Hướng Dẫn Ghép Câu Hoàn Chỉnh Cho Người Mới Bắt Đầu</span>
            </h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Ngôn ngữ ký hiệu không chỉ là từng từ riêng lẻ mà là sự kết hợp giữa **cử chỉ tay**, **số đếm ngón tay**, **từ nối gợi ý** và **văn bản nhập tay**. Dưới đây là 4 bước đơn giản để tạo một câu nói hoàn chỉnh:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-black">1</span>
                <span>Nhận diện cử chỉ hoặc đếm số ngón tay 📷</span>
              </div>
              <p className="text-xs text-indigo-950 leading-relaxed">
                Giơ 1 hoặc 2 bàn tay trước camera. Hệ thống tự động đếm số ngón tay xòe (ví dụ: xòe 2 ngón → tự động nhập số <strong>2</strong>) hoặc nhận diện cử chỉ như 🤟 (Tôi yêu bạn), ✋ (Xin chào).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-black">2</span>
                <span>Chèn từ giao tiếp nhanh 💬</span>
              </div>
              <p className="text-xs text-purple-950 leading-relaxed">
                Nhấp chọn các thẻ từ giao tiếp nhanh như <strong>"Tôi"</strong>, <strong>"Muốn"</strong>, <strong>"Cần"</strong>, <strong>"Cảm ơn"</strong> để tạo khung câu liên kết logic.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-black">3</span>
                <span>Nhập từ bổ sung tự do ✍️</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                Gõ thêm bất kỳ từ danh từ hoặc tính từ nào vào ô <em>"Viết thêm từ bổ sung..."</em> rồi bấm <strong>Chèn</strong> để hoàn thiện nội dung câu văn tiếng Việt.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-black">4</span>
                <span>Phát âm AI ra loa 🔊</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                Bấm nút <strong>"🔊 Phát âm ra loa"</strong> để AI đọc to câu văn hoàn chỉnh cho người đối diện nghe, giúp xóa bỏ rào cản giao tiếp giữa người bình thường và người khiếm thính.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🌟 Câu Mẫu Minh Họa:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-indigo-300 font-bold block">1. Gọi món:</span>
                <span className="text-emerald-400 font-mono text-[11px]">"Tôi" + "Muốn" + "2" + "ly trà"</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-indigo-300 font-bold block">2. Chào hỏi:</span>
                <span className="text-emerald-400 font-mono text-[11px]">"Xin chào" + "Tôi" + "tên là Linh"</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-indigo-300 font-bold block">3. Tình cảm:</span>
                <span className="text-emerald-400 font-mono text-[11px]">"Cảm ơn" + "Bạn" + "🤟"</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Deaf Community Etiquette */}
      {activeTab === "etiquette" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>1. Duy trì giao tiếp bằng ánh mắt</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Người khiếm thính quan sát ánh mắt và khuôn mặt của bạn để đọc cảm xúc. Hãy nhìn thẳng đối diện, duy trì ánh mắt thân thiện và tập trung vào cuộc trò chuyện.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
              <Smile className="w-4 h-4 text-indigo-600" />
              <span>2. Biểu cảm khuôn mặt (Facial Expressions)</span>
            </div>
            <p className="text-xs text-indigo-950 leading-relaxed">
              Trong Ngôn ngữ ký hiệu, biểu cảm nét mặt đóng vai trò như "ngữ điệu giọng nói". Nụ cười hay sự nhướng mày giúp đối phương hiểu rõ ý muốn biểu đạt.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
              <Hand className="w-4 h-4 text-purple-600" />
              <span>3. Bắt đầu cuộc trò chuyện đúng cách</span>
            </div>
            <p className="text-xs text-purple-950 leading-relaxed">
              Để gây sự chú ý với người khiếm thính ở khoảng cách gần, bạn có thể vẫy tay nhẹ nhàng hoặc vỗ nhẹ vào vai một cách lịch sự, ấm áp.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>4. Nói chậm rãi & Dùng hình ảnh hỗ trợ</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              Nếu bạn chưa thuộc ký hiệu, hãy nói chậm rãi với khẩu hình môi rõ ràng, hoặc dùng các công cụ ghi chữ / ký hiệu trực quan trên ứng dụng AI này.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Usage Steps */}
      {activeTab === "steps" && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              1
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Bật Camera AI</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Nhấn **"Bắt đầu nhận diện"** và cho phép trình duyệt truy cập camera.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              2
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Thực hành ra hiệu bàn tay</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Đưa bàn tay ngang ngực trước camera và thực hiện ký hiệu như 🤟, ✋, ✌️, 👍, 🤙...
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              3
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">AI Dịch sang Giọng nói tiếng Việt</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Xem kết quả nhận diện, nhấn **"🔊 Đọc giọng nói"** để ứng dụng phát âm câu ký hiệu cho người nghe.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              4
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Dịch chữ tiếng Việt sang Ký hiệu</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Người nghe có thể gõ câu nói ở ô Dịch chữ để xem chuỗi cử chỉ tay hướng dẫn giao tiếp đáp lại.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
