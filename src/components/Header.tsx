import React from "react";
import { Hand, Sparkles, Volume2, VolumeX, Info, Video, Calculator, BrainCircuit } from "lucide-react";
import { soundManager } from "../utils/soundEffects";

interface HeaderProps {
  isStreaming: boolean;
  onToggleInfoModal: () => void;
  useGemini: boolean;
  onToggleGeminiMode: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isStreaming,
  onToggleInfoModal,
  useGemini,
  onToggleGeminiMode,
  soundOn,
  onToggleSound,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Brand & Title */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-xl md:text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 bg-clip-text text-transparent leading-tight">
                  Học Toán AI & Cử Chỉ Bàn Tay
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                  Toán Thông Minh 🧮
                </span>
              </div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-indigo-600">PTDTBT THCS Thu Cúc</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-600 font-medium">Sáng tạo Trẻ toàn quốc (Lĩnh vực AI)</span>
                </p>
            </div>
          </div>

          {/* Mobile Camera Indicator (Shown only on small screens) */}
          <div className="sm:hidden flex items-center">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                isStreaming
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isStreaming ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span>{isStreaming ? "Cam Bật" : "Cam Tắt"}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto no-scrollbar py-0.5">
          {/* Desktop Camera Status */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isStreaming
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isStreaming ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <Video className="w-3.5 h-3.5" />
            <span>{isStreaming ? "Camera Đang Bật" : "Camera Tắt"}</span>
          </div>

          {/* Gemini Mode Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleGeminiMode();
            }}
            title="Đổi chế độ AI: MediaPipe Tốc độ cao hoặc Gemini AI Giải Toán Chuyên Sâu"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium transition-all border min-h-[38px] cursor-pointer ${
              useGemini
                ? "bg-purple-100 text-purple-800 border-purple-300 shadow-2xs"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="whitespace-nowrap">{useGemini ? "Gemini AI" : "MediaPipe"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundManager.playClick();
            }}
            title={soundOn ? "Tắt Giọng Nói & Âm Thanh" : "Mở Giọng Nói & Âm Thanh"}
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-indigo-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Educational Info Modal */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleInfoModal();
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all text-[11px] sm:text-xs font-semibold cursor-pointer min-h-[38px]"
          >
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="whitespace-nowrap">Hướng Dẫn</span>
          </button>
        </div>
      </div>
    </header>
  );
};

