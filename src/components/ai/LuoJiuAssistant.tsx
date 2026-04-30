"use client";

import { useState, useCallback } from "react";
import { TypewriterText } from "./TypewriterText";

interface LuoJiuAssistantProps {
  message: string;
  onDismiss?: () => void;
}

export function LuoJiuAssistant({ message, onDismiss }: LuoJiuAssistantProps) {
  const [visible, setVisible] = useState(true);
  const [showDismiss, setShowDismiss] = useState(false);

  const handleComplete = useCallback(() => {
    setShowDismiss(true);
  }, []);

  if (!visible || !message) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-sm">
      <div className="bg-space-800 border border-purple-accent/40 rounded-xl p-4 shadow-lg shadow-purple-accent/10">
        <div className="flex items-start gap-3">
          {/* 洛玖头像 */}
          <div className="flex-shrink-0 w-12 h-12 bg-space-700 rounded-lg border border-purple-accent/30 flex items-center justify-center">
            <div className="w-8 h-8 relative">
              {/* 像素风小机器人 */}
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                <div className="col-start-2 col-span-2 bg-purple-accent rounded-sm" />
                <div className="col-start-1 row-start-2 bg-purple-accent/80 rounded-sm" />
                <div className="col-start-2 col-span-2 row-start-2 bg-purple-deep rounded-sm" />
                <div className="col-start-4 row-start-2 bg-purple-accent/80 rounded-sm" />
                <div className="col-start-1 row-start-3 bg-purple-accent/60 rounded-sm" />
                <div className="col-start-2 col-span-2 row-start-3 bg-purple-accent rounded-sm" />
                <div className="col-start-4 row-start-3 bg-purple-accent/60 rounded-sm" />
                <div className="col-start-2 row-start-4 bg-purple-deep rounded-sm" />
                <div className="col-start-3 row-start-4 bg-purple-deep rounded-sm" />
              </div>
            </div>
          </div>

          {/* 对话内容 */}
          <div className="flex-1 min-w-0">
            <p className="text-purple-accent text-xs font-bold mb-1">洛玖</p>
            <p className="text-gray-200 text-sm leading-relaxed">
              <TypewriterText text={message} speed={40} onComplete={handleComplete} />
            </p>
          </div>
        </div>

        {showDismiss && (
          <div className="mt-3 text-right">
            <button
              onClick={() => {
                setVisible(false);
                onDismiss?.();
              }}
              className="text-xs text-gray-500 hover:text-purple-accent transition-colors"
            >
              知道了
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
