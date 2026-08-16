import React from "react";
import { Sparkles, Volume2, VolumeX, Info, Calculator, Award } from "lucide-react";
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
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-indigo-500/20 sticky top-0 z-30 shadow-md shadow-indigo-950/20">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Contest Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0 border border-white/15">
            <Calculator className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight truncate">
                Toán Bàn Tay AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-md">
                <Award className="w-3 h-3 text-amber-400" />
                <span>Sáng tạo Trẻ</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate flex items-center gap-1.5">
              <span className="text-cyan-400 font-semibold">PTDTBT THCS Thu Cúc</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 truncate">Thị giác Máy tính AI</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* AI Model Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleGeminiMode();
            }}
            title="Đổi công nghệ AI: MediaPipe Tốc độ cao hoặc Gemini AI"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              useGemini
                ? "bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-sm"
                : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700/80 hover:border-indigo-500/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden xs:inline">{useGemini ? "Gemini AI" : "MediaPipe AI"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundManager.playClick();
            }}
            title={soundOn ? "Tắt âm thanh hướng dẫn" : "Bật âm thanh hướng dẫn"}
            className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500/40 transition-all cursor-pointer flex items-center justify-center"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Project Details Modal */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleInfoModal();
            }}
            title="Hồ sơ dự án & Thuyết minh"
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xs:inline">Thuyết minh</span>
          </button>
        </div>
      </div>
    </header>
  );
};


