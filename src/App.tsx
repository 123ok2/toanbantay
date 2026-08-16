import React, { useState, useCallback } from "react";
import { Header } from "./components/Header";
import { IntegratedARMathScreen } from "./components/IntegratedARMathScreen";
import { TeacherInfoModal } from "./components/TeacherInfoModal";
import { RecognitionResult } from "./types";
import { soundManager } from "./utils/soundEffects";

export default function App() {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [useGemini, setUseGemini] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/60 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Decorative ambient color orbs in background for depth and vibrancy */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-10 w-72 h-72 bg-amber-300/15 rounded-full blur-3xl pointer-events-none -z-10" />

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
      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-2.5 sm:py-4 flex flex-col gap-3">
        {/* Core Screen */}
        <IntegratedARMathScreen
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
          onGestureDetected={handleGestureDetected}
          useGemini={useGemini}
        />
      </main>

      {/* Footer & Copyright */}
      <footer className="border-t border-slate-200/80 py-3 text-center text-xs text-slate-600 mt-auto bg-white/80 backdrop-blur-xs shadow-xs">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Bản quyền thuộc về PTDTBT THCS Thu Cúc
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-indigo-600 font-semibold">
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

