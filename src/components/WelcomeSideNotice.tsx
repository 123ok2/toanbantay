import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Lightbulb,
  Camera,
  Volume2,
  ArrowRight,
  Hand,
  CheckCircle2,
  MessageSquarePlus,
  Play,
  HelpCircle,
} from "lucide-react";
import { soundManager } from "../utils/soundEffects";

interface WelcomeSideNoticeProps {
  onStartCamera?: () => void;
  onOpenFullGuide?: () => void;
}

export const WelcomeSideNotice: React.FC<WelcomeSideNoticeProps> = ({
  onStartCamera,
  onOpenFullGuide,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);

  // Trigger entrance sound & animation state after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    soundManager.playClick();
    setIsOpen(false);
    setIsMinimized(true);
  };

  const handleReopen = () => {
    soundManager.playClick();
    setIsOpen(true);
    setIsMinimized(false);
  };

  if (isMinimized && !isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <button
          onClick={handleReopen}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/40 cursor-pointer group"
          title="Mở hướng dẫn ghép câu"
        >
          <Lightbulb className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
          <span className="text-xs font-extrabold pr-1 hidden sm:inline">
            Hướng dẫn ghép câu
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-slide-in">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-5 shadow-2xl border-2 border-indigo-400/50 backdrop-blur-xl relative overflow-hidden">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-pink-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg text-slate-950 shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <span>👋 Chào mừng người mới!</span>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                Hướng Dẫn Tạo Câu Hoàn Chỉnh AI
              </h4>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Body Notice Content */}
        <div className="space-y-2.5 text-xs text-slate-200 relative z-10 my-3">
          <p className="text-indigo-200 font-medium leading-relaxed">
            Bạn chưa biết bắt đầu từ đâu? Hãy thực hiện <strong>3 bước cực dễ</strong> để ghép thành câu giao tiếp hoàn chỉnh cho người khiếm thính:
          </p>

          {/* Steps Preview */}
          <div className="bg-slate-900/80 rounded-2xl p-3 border border-indigo-400/30 space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-indigo-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white block font-bold">Giơ bàn tay trước camera 📷</strong>
                <span className="text-[11px] text-indigo-300">
                  Xòe 1 hoặc 2 bàn tay để AI đếm số ngón tay (0–10) hoặc nhận diện cử chỉ như 🤟, ✋.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-purple-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white block font-bold">Chèn từ giao tiếp nhanh 💬</strong>
                <span className="text-[11px] text-purple-300">
                  Bấm chọn từ 'Tôi', 'Muốn', 'Cần', 'Cảm ơn' hoặc gõ thêm từ tùy ý vào ô nhập.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-white block font-bold">Phát âm AI ra loa 🔊</strong>
                <span className="text-[11px] text-emerald-300">
                  Bấm '🔊 Phát âm ra loa' để AI nói to toàn bộ câu hoàn chỉnh.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Example */}
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-amber-200">
              💡 Ví dụ: <strong className="text-amber-300">"Tôi" + "Muốn" + "2" + "ly trà"</strong>
            </span>
            <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">
              Câu chuẩn
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10 relative z-10 flex-wrap">
          {onOpenFullGuide && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenFullGuide();
              }}
              className="flex-1 min-w-[130px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Xem 4 bước đầy đủ</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playClick();
              if (onStartCamera) onStartCamera();
              handleClose();
            }}
            className="flex-1 min-w-[130px] px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Bắt đầu ngay 🚀</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
