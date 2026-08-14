import React, { useState, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { CameraView } from "./components/CameraView";
import { GestureResultCard } from "./components/GestureResultCard";
import { CameraMathInteractiveGame } from "./components/CameraMathInteractiveGame";
import { TeacherInfoModal } from "./components/TeacherInfoModal";
import { RecognitionResult } from "./types";
import { soundManager } from "./utils/soundEffects";

export default function App() {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [geminiExplanation, setGeminiExplanation] = useState<string | null>(null);
  const [useGemini, setUseGemini] = useState<boolean>(false);
  const [isAnalyzingGemini, setIsAnalyzingGemini] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);

  // Handle gesture detection result from CameraView
  const handleGestureDetected = useCallback(
    (result: RecognitionResult) => {
      setCurrentResult(result);
    },
    []
  );

  // Trigger Gemini AI Vision Analysis
  const handleTriggerGeminiAnalysis = async (imageBase64: string) => {
    setIsAnalyzingGemini(true);
    setGeminiExplanation(null);
    try {
      const response = await fetch("/api/analyze-gesture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await response.json();

      if (data.explanation) {
        setGeminiExplanation(data.explanation);
        soundManager.playSuccessChime();
      } else if (data.gestureName) {
        setGeminiExplanation(
          `Cử chỉ phát hiện: ${data.emoji} ${data.gestureName} (Độ tin cậy: ${data.confidence || 90}%).`
        );
      } else {
        setGeminiExplanation("Gemini AI đã phân tích khung hình nhưng chưa xác định rõ ngón tay.");
      }
    } catch (err) {
      console.error("Lỗi khi gọi API Gemini:", err);
      setGeminiExplanation("Không thể kết nối dịch vụ Gemini AI. Vui lòng kiểm tra lại mạng.");
    } finally {
      setIsAnalyzingGemini(false);
    }
  };

  const handleClearResult = () => {
    setCurrentResult(null);
    setGeminiExplanation(null);
  };

  const handleToggleSound = () => {
    setSoundOn(!soundOn);
    soundManager.soundEnabled = !soundOn;
    soundManager.speechEnabled = !soundOn;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-5 sm:space-y-6">
        {/* Top Section: Camera AI Trực Tiếp & Kết Quả Nhận Diện AI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Column: Camera AI Trực Tiếp (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <CameraView
              isStreaming={isStreaming}
              setIsStreaming={setIsStreaming}
              onGestureDetected={handleGestureDetected}
              useGemini={useGemini}
              isAnalyzingGemini={isAnalyzingGemini}
              onTriggerGeminiAnalysis={handleTriggerGeminiAnalysis}
            />
          </div>

          {/* Right Column: Kết Quả Nhận Diện AI (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <GestureResultCard
              result={currentResult}
              onClearResult={handleClearResult}
              geminiExplanation={geminiExplanation}
            />
          </div>
        </div>

        {/* Core Feature: Đấu Trường Toán Bàn Tay AI */}
        <section>
          <CameraMathInteractiveGame
            currentResult={currentResult}
            isStreaming={isStreaming}
            onStartCamera={() => setIsStreaming(true)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-5 text-center text-xs text-slate-500 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-600">
            🧮 **Đấu Trường Toán Bàn Tay & Nhận Diện Camera AI** — Học toán thông minh & phản xạ ngón tay qua thị giác máy tính
          </p>
          <p className="text-slate-400">
            React + TypeScript + MediaPipe Computer Vision + Gemini AI
          </p>
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

