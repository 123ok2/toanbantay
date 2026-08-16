import React from "react";
import { X, Eye, Network, ShieldCheck, Sparkles, Calculator, Trophy } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-indigo-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Đấu Trường Toán Bàn Tay & Nhận Diện Camera AI
            </h3>
            <p className="text-xs text-indigo-600 font-semibold">
              Phương pháp học toán tương tác trực quan kết hợp Computer Vision
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Mission */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Phương pháp tư duy trực quan & Phản xạ toán học</span>
            </div>
            <p className="text-amber-950 text-xs">
              Ứng dụng kết hợp giữa giải toán tư duy và phản xạ ngón tay qua camera AI. Học sinh từ Tiểu học đến THCS (Lớp 6, 7, 8, 9) có thể rèn luyện phản xạ tính nhẩm nhanh, giải phương trình, căn thức, lũy thừa và trả lời bằng cách giơ số ngón tay trực tiếp trước camera.
            </p>
          </div>

          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>1. Thu nhận hình ảnh từ Camera (Computer Vision)</span>
            </div>
            <p className="text-slate-600 text-xs">
              Camera đọc luồng video thời gian thực để phát hiện vị trí bàn tay của bạn với độ trễ siêu thấp.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
              <Network className="w-4 h-4 text-indigo-600" />
              <span>2. Trích xuất 21 điểm mốc khớp xương & Đếm ngón tay (MediaPipe)</span>
            </div>
            <p className="text-slate-700 text-xs">
              Mạng nơ-ron MediaPipe phân tích tọa độ 3D của 21 khớp xương bàn tay, thuật toán hình học xác định chính xác từng ngón tay đang xòe hay gập để tính tổng số ngón tay.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>3. Đối chiếu đáp án tức thì & Phản hồi âm thanh sinh động</span>
            </div>
            <p className="text-slate-600 text-xs">
              Ngay khi giơ đúng số ngón tay tương ứng với kết quả của bài toán, hệ thống tự động nhận diện, phát âm thanh chúc mừng và chuyển tiếp sang thử thách tiếp theo.
            </p>
          </div>

          {/* Safety & Privacy Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>An toàn & Bảo mật thông tin</span>
            </div>
            <p className="text-xs text-emerald-800">
              * Ứng dụng **không lưu trữ hình ảnh camera** hay bất kỳ dữ liệu cá nhân nào của bạn.
              * Toàn bộ quá trình xử lý hình ảnh và đếm ngón tay diễn ra cục bộ trực tiếp trên trình duyệt.
            </p>
          </div>

          {/* Copyright and Competition Information */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-300/60 text-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs sm:text-sm">Thông tin Bản quyền & Cuộc thi</span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <p className="font-semibold text-indigo-950 flex items-center gap-1.5">
                🏛️ <span>Đơn vị:</span> <strong className="text-indigo-700">Trường PTDTBT THCS Thu Cúc</strong>
              </p>
              <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                🌟 <span>Dự án:</span> <strong className="text-amber-700">Sáng tạo Trẻ toàn quốc (Lĩnh vực AI)</strong>
              </p>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-amber-200/50 mt-1">
                © Bản quyền thuộc về PTDTBT THCS Thu Cúc • Sáng tạo Trẻ toàn quốc (Lĩnh vực AI)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-indigo-200"
          >
            Đã hiểu! Bắt đầu đấu trường toán
          </button>
        </div>
      </div>
    </div>
  );
};

