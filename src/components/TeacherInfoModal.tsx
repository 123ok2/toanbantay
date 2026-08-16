import React from "react";
import { X, Eye, Network, ShieldCheck, Sparkles, Calculator, Trophy, Check, Award, Cpu, BookOpen, Layers } from "lucide-react";
import { soundManager } from "../utils/soundEffects";

interface TeacherInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherInfoModal: React.FC<TeacherInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-800 flex flex-col gap-4">
        {/* Close button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0 border border-white/40">
            <Calculator className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 rounded-md flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                <span>HỒ SƠ THUYẾT MINH DỰ ÁN</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
              Đấu Trường Toán Bàn Tay AI
            </h3>
            <p className="text-xs text-indigo-600 font-bold">
              Ứng dụng Trí tuệ Nhân tạo & Thị giác Máy tính trong Đổi mới Phương pháp Dạy và Học Toán
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="space-y-3.5 text-xs leading-relaxed">
          {/* Mission & Background */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-indigo-700">
              <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Mục tiêu & Ý nghĩa Thực tiễn</span>
            </div>
            <p className="text-slate-700 text-xs">
              Dự án ra đời nhằm giải quyết rào cản học toán ở học sinh vùng cao và trường nội trú: biến những phép tính khô khan thành trải nghiệm tương tác trực quan 3 trong 1 (quan sát đề bài - tư duy tính nhẩm - thể hiện ngón tay trước camera AI), giúp các em hứng thú, tự tin và phản xạ số học vượt bậc.
            </p>
          </div>

          {/* Workflow 3-Step Tech Pipeline */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Quy trình Công nghệ & Tương tác 3-trong-1</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-700">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Thu hình Real-time</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Camera thu nhận cử chỉ với tốc độ cao, hiển thị gương tự nhiên cho học sinh.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. AI MediaPipe Vision</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Phát hiện 21 điểm mốc khung xương bàn tay, đếm ngón tay mở với thuật toán chống rung.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>3. Tự động chấm & Khích lệ</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Đối chiếu đáp án, phát âm thanh giọng đọc khen ngợi và tự động tích điểm số.
                </p>
              </div>
            </div>
          </div>

          {/* Highlights & Novelty */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-amber-800 mb-1">
              <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tính mới & Điểm sáng tạo của Dự án</span>
            </div>
            <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-0.5">
              <li><strong className="text-amber-800">Không cần chạm bàn phím/chuột:</strong> Trả lời hoàn toàn bằng ngôn ngữ cơ thể (ngón tay).</li>
              <li><strong className="text-indigo-700">Tích hợp 500 bài toán từ lớp 1 đến lớp 9:</strong> Phù hợp đa lứa tuổi, tự động phát sinh câu hỏi thông minh.</li>
              <li><strong className="text-emerald-700">Trợ lý sư phạm AI:</strong> Giọng đọc tiếng Việt, gợi ý phương pháp giải và động viên tâm lý người học.</li>
            </ul>
          </div>

          {/* Privacy & Safety */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-center gap-2 font-bold mb-0.5 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>An toàn dữ liệu & Quyền riêng tư</span>
            </div>
            <p className="text-slate-700 text-[11px]">
              Ứng dụng xử lý mô hình AI 100% On-device (nội bộ trên trình duyệt thiết bị), hoàn toàn không lưu trữ hay gửi video ra máy chủ bên ngoài.
            </p>
          </div>

          {/* Project Entity */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="font-bold text-slate-800">
                🏛️ Trường PTDTBT THCS Thu Cúc
              </div>
              <div className="text-indigo-600 font-semibold">🌟 Cuộc thi Sáng tạo Trẻ toàn quốc (Lĩnh vực AI)</div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold shrink-0">
              Công nghệ Edge AI
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Trải nghiệm Đấu trường Toán AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
