"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Vec2 { x: number; y: number; }

interface Props {
  onMove: (dir: Vec2) => void;
}

export default function MobileControls({ onMove }: Props) {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState<Vec2>({ x: 0, y: 0 });
  const [knob, setKnob] = useState<Vec2>({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const maxDist = 50;

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setOrigin({ x: touch.clientX, y: touch.clientY });
    setKnob({ x: touch.clientX, y: touch.clientY });
    setActive(true);
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== touchIdRef.current) continue;

      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, maxDist);

      if (dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        setKnob({ x: origin.x + nx * clamped, y: origin.y + ny * clamped });
        onMove({ x: nx, y: ny });
      }
    }
  }, [origin, onMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  }, [onMove]);

  if (!isTouch) return null;

  return (
    <div
      className="absolute bottom-0 left-0 w-1/2 h-1/2 z-40"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ touchAction: "none" }}
    >
      {active && (
        <>
          {/* Outer ring */}
          <div
            className="absolute rounded-full border-2 border-purple-500/30 bg-purple-900/10"
            style={{
              width: maxDist * 2,
              height: maxDist * 2,
              left: origin.x - maxDist,
              top: origin.y - maxDist,
            }}
          />
          {/* Inner knob */}
          <div
            className="absolute rounded-full bg-purple-500/50"
            style={{
              width: 30,
              height: 30,
              left: knob.x - 15,
              top: knob.y - 15,
            }}
          />
        </>
      )}
    </div>
  );
}
