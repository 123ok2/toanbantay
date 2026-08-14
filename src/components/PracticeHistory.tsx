import React from "react";
import { History, Trash2, Clock, Sparkles } from "lucide-react";
import { HistoryItem } from "../types";
import { soundManager } from "../utils/soundEffects";

interface PracticeHistoryProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

export const PracticeHistory: React.FC<PracticeHistoryProps> = ({
  history,
  onClearHistory,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Lịch Sử Thực Hành ({history.length})
            </h3>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => {
                soundManager.playClick();
                onClearHistory();
              }}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">
              Chưa có cử chỉ nào được ghi nhận.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hãy giơ bàn tay thực hiện cử chỉ trước camera để bắt đầu!
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-indigo-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {item.gestureName}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {item.timestamp}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {item.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          🔒 Không lưu ảnh hay thông tin riêng tư. Xử lý trực tiếp trên trình duyệt.
        </p>
      </div>
    </div>
  );
};
