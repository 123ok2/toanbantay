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
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-1.5 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-lg md:text-xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent leading-tight truncate">
                Toán Bàn Tay AI
              </h1>
              <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500/20 text-amber-300 rounded-full border border-amber-400/30">
                Lĩnh vực AI 🧮
              </span>
            </div>
            <p className="text-[9px] sm:text-xs text-slate-400 font-medium truncate flex items-center gap-1">
              <span className="font-semibold text-indigo-400">THCS Thu Cúc</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 truncate">Sáng tạo Trẻ toàn quốc</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Camera Status Indicator */}
          <div
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
              isStreaming
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse"
                : "bg-amber-500/10 text-amber-300 border-amber-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStreaming ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="hidden xs:inline">{isStreaming ? "Cam Bật" : "Cam Tắt"}</span>
          </div>

          {/* Gemini Mode Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleGeminiMode();
            }}
            title="Đổi chế độ AI: MediaPipe Tốc độ cao hoặc Gemini AI"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all border cursor-pointer min-h-[30px] sm:min-h-[34px] ${
              useGemini
                ? "bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-xs"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">{useGemini ? "Gemini AI" : "MediaPipe"}</span>
            <span className="sm:hidden">{useGemini ? "Gemini" : "Fast"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundManager.playClick();
            }}
            title={soundOn ? "Tắt Giọng Nói & Âm Thanh" : "Mở Giọng Nói & Âm Thanh"}
            className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer min-h-[30px] min-w-[30px] sm:min-h-[34px] sm:min-w-[34px] flex items-center justify-center"
          >
            {soundOn ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            )}
          </button>

          {/* Educational Info Modal */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleInfoModal();
            }}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all text-[10px] sm:text-xs font-semibold cursor-pointer min-h-[30px] sm:min-h-[34px]"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden xs:inline">Hướng Dẫn</span>
          </button>
        </div>
      </div>
    </header>
  );
};

