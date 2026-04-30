"use client";

import { useState, useEffect, useRef } from "react";
import { LUOJIU_LINES } from "@/lib/game-config";

interface Props {
  trigger?: string | null;
  floor?: number;
}

export default function LuojiuAssistant({ trigger, floor }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 根据触发条件显示台词
  useEffect(() => {
    if (!trigger) return;
    const line = LUOJIU_LINES[trigger];
    if (line) {
      setOpen(true);
      typeText(line);
    }
  }, [trigger]);

  // 层数触发
  useEffect(() => {
    if (!floor) return;
    let key = "";
    if (floor === 10) key = "floor_10";
    else if (floor === 50) key = "floor_50";
    else if (floor === 100) key = "floor_100";
    else if (floor === 500) key = "floor_500";
    if (key && LUOJIU_LINES[key]) {
      setOpen(true);
      typeText(LUOJIU_LINES[key]);
    }
  }, [floor]);

  // 点击头像显示随机台词
  const handleClick = () => {
    setOpen(!open);
    if (!open) {
      typeText(LUOJIU_LINES.idle);
    }
  };

  const typeText = (fullText: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setText(fullText);
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    timerRef.current = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 50);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* 头像按钮 */}
      <button
        onClick={handleClick}
        className="w-12 h-12 rounded-full bg-purple-900/80 border-2 border-purple-500 flex items-center justify-center hover:scale-110 transition-transform purple-glow"
      >
        {/* 像素风机器人头像 */}
        <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="2" width="10" height="8" rx="1" fill="#8b5cf6" />
          <rect x="4" y="3" width="3" height="3" rx="0.5" fill="#c4b5fd" />
          <rect x="9" y="3" width="3" height="3" rx="0.5" fill="#c4b5fd" />
          <rect x="6" y="7" width="4" height="1" rx="0.5" fill="#c4b5fd" />
          <rect x="7" y="10" width="2" height="2" fill="#8b5cf6" />
          <rect x="5" y="12" width="6" height="1" rx="0.5" fill="#7c3aed" />
          <rect x="1" y="5" width="2" height="1" rx="0.5" fill="#6d28d9" />
          <rect x="13" y="5" width="2" height="1" rx="0.5" fill="#6d28d9" />
          <rect x="6" y="0" width="4" height="2" rx="0.5" fill="#a78bfa" />
          <rect x="7" y="0" width="2" height="1" fill="#c4b5fd" />
        </svg>
      </button>

      {/* 对话气泡 */}
      {open && (
        <div className="absolute top-14 right-0 w-72 card-space p-4 purple-glow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-purple-800 flex items-center justify-center">
              <span className="text-xs text-purple-300 font-bold">玖</span>
            </div>
            <span className="text-sm text-purple-300 font-bold">洛玖</span>
          </div>
          <p className="text-sm text-purple-100 leading-relaxed">
            {displayedText}
            {isTyping && <span className="typing-caret">&nbsp;</span>}
          </p>
        </div>
      )}
    </div>
  );
}
