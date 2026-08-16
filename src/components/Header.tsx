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
    <header className="bg-white/85 backdrop-blur-lg border-b border-indigo-150 sticky top-0 z-30 shadow-md shadow-indigo-100/40">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Contest Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0 border border-white/40 ring-2 ring-indigo-200/50">
            <Calculator className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent tracking-tight leading-tight truncate">
                Toán Bàn Tay AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-xs shadow-amber-500/20">
                <Award className="w-3 h-3 text-amber-100" />
                <span>Sáng tạo Trẻ</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
              <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded-md border border-indigo-100">PTDTBT THCS Thu Cúc</span>
              <span className="text-slate-300">•</span>
              <span className="text-purple-600 font-semibold truncate">Thị giác Máy tính AI</span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              useGemini
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-purple-500/25"
                : "bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 border-indigo-200/80"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${useGemini ? "text-amber-300 animate-spin" : "text-indigo-600"}`} />
            <span className="hidden xs:inline">{useGemini ? "Gemini AI" : "MediaPipe AI"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundManager.playClick();
            }}
            title={soundOn ? "Tắt âm thanh hướng dẫn" : "Bật âm thanh hướng dẫn"}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50 hover:from-slate-100 hover:to-indigo-100 text-slate-700 border border-slate-200/90 transition-all cursor-pointer flex items-center justify-center shadow-xs"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-indigo-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Project Details Modal */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleInfoModal();
            }}
            title="Hồ sơ dự án & Thuyết minh"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-orange-500/20 active:scale-95"
          >
            <Info className="w-3.5 h-3.5 text-amber-100" />
            <span className="hidden xs:inline">Thuyết minh</span>
          </button>
        </div>
      </div>
    </header>
  );
};


