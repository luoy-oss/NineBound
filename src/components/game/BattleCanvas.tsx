"use client";

import { useRef, useEffect, useCallback } from "react";
import { GameEngine, type GameCallbacks } from "@/engine/GameEngine";
import type { BattleState, FloorReward } from "@/types/game";
import type { SkillState } from "@/engine/BattleManager";

interface BattleCanvasProps {
  startFloor: number;
  onFloorComplete: (floor: number, reward: FloorReward) => void;
  onStateChange: (state: BattleState) => void;
  onStatsUpdate: (stats: {
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    enemyMaxHp: number;
    enemyName: string;
    isElite: boolean;
    isBoss: boolean;
    skills: SkillState[];
  }) => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export function BattleCanvas({
  startFloor,
  onFloorComplete,
  onStateChange,
  onStatsUpdate,
  engineRef,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initRef = useRef(false);

  const stableCallbacks = useRef<GameCallbacks>({
    onFloorComplete,
    onStateChange,
    onStatsUpdate,
  });
  stableCallbacks.current.onFloorComplete = onFloorComplete;
  stableCallbacks.current.onStateChange = onStateChange;
  stableCallbacks.current.onStatsUpdate = onStatsUpdate;

  useEffect(() => {
    if (!canvasRef.current || initRef.current) return;
    initRef.current = true;

    const engine = new GameEngine(canvasRef.current, {
      onFloorComplete: (f, r) => stableCallbacks.current.onFloorComplete(f, r),
      onStateChange: (s) => stableCallbacks.current.onStateChange(s),
      onStatsUpdate: (s) => stableCallbacks.current.onStatsUpdate(s),
    });

    engineRef.current = engine;
    engine.startFloor(startFloor);
    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [startFloor, engineRef]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={480}
      className="w-full max-w-[800px] rounded-lg border border-space-600"
    />
  );
}
