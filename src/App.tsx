import React, { useState, useCallback } from "react";
import { Header } from "./components/Header";
import { IntegratedARMathScreen } from "./components/IntegratedARMathScreen";
import { GestureGuide } from "./components/GestureGuide";
import { PracticeHistory } from "./components/PracticeHistory";
import { TeacherInfoModal } from "./components/TeacherInfoModal";
import { RecognitionResult } from "./types";
import { soundManager } from "./utils/soundEffects";
import { BookOpen, History, Sparkles, Trophy } from "lucide-react";

export default function App() {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [useGemini, setUseGemini] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);
  const [showReferenceGuide, setShowReferenceGuide] = useState<boolean>(false);

  // Handle gesture detection result
  const handleGestureDetected = useCallback(
    (result: RecognitionResult) => {
      setCurrentResult(result);
    },
    []
  );

  const handleToggleSound = () => {
    setSoundOn(!soundOn);
    soundManager.soundEnabled = !soundOn;
    soundManager.speechEnabled = !soundOn;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        isStreaming={isStreaming}
        onToggleInfoModal={() => setInfoModalOpen(true)}
        useGemini={useGemini}
        onToggleGeminiMode={() => setUseGemini(!useGemini)}
        soundOn={soundOn}
        onToggleSound={handleToggleSound}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col gap-3">
        {/* =========================================================================
            CORE 3-IN-1 UNIFIED SCREEN:
            LỒNG GHÉP BÀI TOÁN + CAMERA AI TRỰC TIẾP + KẾT QUẢ NHẬN DIỆN AI
           ========================================================================= */}
        <IntegratedARMathScreen
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
          onGestureDetected={handleGestureDetected}
          useGemini={useGemini}
        />

        {/* Collapsible Reference Guide & History Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
          <button
            onClick={() => {
              soundManager.playClick();
              setShowReferenceGuide(!showReferenceGuide);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>{showReferenceGuide ? "Ẩn Thư Viện Ký Hiệu & Lịch Sử" : "📖 Xem Thư Viện Ký Hiệu & Lịch Sử"}</span>
          </button>

          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI nhận diện tự động qua MediaPipe Vision</span>
          </div>
        </div>

        {/* Optional Collapsible Gesture Guide & History */}
        {showReferenceGuide && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start animate-fadeIn">
            <div className="lg:col-span-7">
              <GestureGuide />
            </div>
            <div className="lg:col-span-5">
              <PracticeHistory />
            </div>
          </div>
        )}
      </main>

      {/* Footer & Copyright */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-center">
          {/* Main Copyright Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-center text-xs text-slate-200">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              🏆 Bản quyền thuộc về PTDTBT THCS Thu Cúc
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="font-semibold text-indigo-300">
              Sáng tạo Trẻ toàn quốc (Lĩnh vực AI)
            </span>
          </div>
        </div>
      </footer>

      {/* Educational Information Modal */}
      <TeacherInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />
    </div>
  );
}

