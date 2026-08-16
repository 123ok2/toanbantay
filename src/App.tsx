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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3.5 flex flex-col gap-3">
        {/* Core Screen */}
        <IntegratedARMathScreen
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
          onGestureDetected={handleGestureDetected}
          useGemini={useGemini}
        />
      </main>

      {/* Footer & Copyright */}
      <footer className="border-t border-slate-850 py-3 text-center text-xs text-slate-400 mt-auto bg-slate-950/80 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center text-xs text-slate-400">
            <span className="font-medium text-slate-300">
              Bản quyền thuộc về PTDTBT THCS Thu Cúc
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-indigo-400 font-medium">
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

