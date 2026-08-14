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
    <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Calculator className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 bg-clip-text text-transparent">
                Học Toán AI & Cử Chỉ Bàn Tay
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-extrabold bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                Toán Thông Minh 🧮
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Đấu trường toán bàn tay AI, nhận diện camera trực tiếp & trả lời bài toán qua thị giác máy tính
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Camera Status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              useGemini
                ? "bg-purple-100 text-purple-800 border-purple-300 shadow-xs"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{useGemini ? "Gemini AI Math" : "MediaPipe Live"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundManager.playClick();
            }}
            title={soundOn ? "Tắt Giọng Nói & Âm Thanh" : "Mở Giọng Nói & Âm Thanh"}
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all text-xs font-semibold cursor-pointer"
          >
            <Info className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Phương Pháp Học</span>
          </button>
        </div>
      </div>
    </header>
  );
};

