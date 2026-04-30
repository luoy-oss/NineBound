"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { BattleCanvas } from "@/components/game/BattleCanvas";
import { BattleHUD } from "@/components/game/BattleHUD";
import { SkillBar } from "@/components/game/SkillBar";
import { BuffSelector } from "@/components/game/BuffSelector";
import { LuoJiuAssistant } from "@/components/ai/LuoJiuAssistant";
import { getLuoJiuMessage } from "@/components/ai/messages";
import { GameEngine } from "@/engine/GameEngine";
import type { SkillState } from "@/engine/BattleManager";
import type { BattleState, FloorReward, BuffOption } from "@/types/game";

export default function PlayPage() {
  const engineRef = useRef<GameEngine | null>(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [battleState, setBattleState] = useState<BattleState>("idle");
  const [showBuff, setShowBuff] = useState(false);
  const [stats, setStats] = useState({
    playerHp: 500,
    playerMaxHp: 500,
    enemyHp: 100,
    enemyMaxHp: 100,
    enemyName: "",
    isElite: false,
    isBoss: false,
    skills: [] as SkillState[],
  });
  const [luojiuMsg, setLuojiuMsg] = useState<string | null>(null);
  const [rewardPopup, setRewardPopup] = useState<FloorReward | null>(null);
  const isFirstMount = useRef(true);

  // 首次登录欢迎语
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      const seen = sessionStorage.getItem("nb_seen_welcome");
      if (!seen) {
        setLuojiuMsg(getLuoJiuMessage("first_login")!);
        sessionStorage.setItem("nb_seen_welcome", "1");
      }
    }
  }, []);

  const handleFloorComplete = useCallback(async (floor: number, reward: FloorReward) => {
    setRewardPopup(reward);

    // 通知服务器
    try {
      const res = await fetch("/api/floor/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floor }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentFloor(data.newFloor);
      }
    } catch {
      // 静默失败，前端状态已更新
    }

    // 检查里程碑消息
    const msg = getLuoJiuMessage("floor_milestone", floor);
    if (msg) {
      setTimeout(() => setLuojiuMsg(msg), 1500);
    }
  }, []);

  const handleStateChange = useCallback((state: BattleState) => {
    setBattleState(state);
    if (state === "defeated") {
      setLuojiuMsg(getLuoJiuMessage("defeat")!);
    }
  }, []);

  const handleStatsUpdate = useCallback(
    (newStats: {
      playerHp: number;
      playerMaxHp: number;
      enemyHp: number;
      enemyMaxHp: number;
      enemyName: string;
      isElite: boolean;
      isBoss: boolean;
      skills: SkillState[];
    }) => {
      setStats(newStats);
    },
    []
  );

  const handleSkillActivate = useCallback((slot: number) => {
    engineRef.current?.activateSkill(slot);
  }, []);

  const handleContinue = useCallback(() => {
    setRewardPopup(null);
    if (engineRef.current) {
      const nextFloor = engineRef.current.currentFloor;
      if (engineRef.current.needsBuffSelection) {
        setShowBuff(true);
      } else {
        engineRef.current.startFloor(nextFloor);
      }
    }
  }, []);

  const handleBuffSelect = useCallback((buff: BuffOption) => {
    engineRef.current?.applyBuff(buff.type, buff.value);
    setShowBuff(false);
    if (engineRef.current) {
      engineRef.current.startFloor(engineRef.current.currentFloor);
    }
  }, []);

  const handleRetry = useCallback(() => {
    engineRef.current?.retryFloor();
  }, []);

  return (
    <div className="flex flex-col items-center py-4 px-4 gap-4">
      <BattleHUD
        floor={currentFloor}
        playerHp={stats.playerHp}
        playerMaxHp={stats.playerMaxHp}
        enemyHp={stats.enemyHp}
        enemyMaxHp={stats.enemyMaxHp}
        enemyName={stats.enemyName}
        isElite={stats.isElite}
        isBoss={stats.isBoss}
      />

      <BattleCanvas
        startFloor={currentFloor}
        onFloorComplete={handleFloorComplete}
        onStateChange={handleStateChange}
        onStatsUpdate={handleStatsUpdate}
        engineRef={engineRef}
      />

      <SkillBar
        skills={stats.skills}
        onActivate={handleSkillActivate}
        disabled={battleState !== "battle"}
      />

      {/* 操作按钮 */}
      {battleState === "floor_complete" && !showBuff && (
        <button
          onClick={handleContinue}
          className="px-6 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-glow transition-colors"
        >
          继续下一层
        </button>
      )}

      {battleState === "defeated" && (
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-hp-red/80 text-white rounded-lg hover:bg-hp-red transition-colors"
        >
          重新挑战
        </button>
      )}

      {/* Buff选择 */}
      {showBuff && <BuffSelector onSelect={handleBuffSelect} />}

      {/* 奖励弹窗 */}
      {rewardPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-space-800 border border-gold/30 rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
            <h3 className="text-gold text-xl font-bold mb-4">通关奖励</h3>
            <p className="text-gray-300 mb-2">
              金币: <span className="text-gold font-bold">+{rewardPopup.coins}</span>
            </p>
            {rewardPopup.gems > 0 && (
              <p className="text-gray-300 mb-2">
                宝石: <span className="text-purple-accent font-bold">+{rewardPopup.gems}</span>
              </p>
            )}
            <p className="text-gray-500 text-xs mb-4">
              奖励已存入待领取池，前往奖励页面生成领取码
            </p>
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-glow transition-colors"
            >
              确认
            </button>
          </div>
        </div>
      )}

      {/* 洛玖助手 */}
      {luojiuMsg && (
        <LuoJiuAssistant
          message={luojiuMsg}
          onDismiss={() => setLuojiuMsg(null)}
        />
      )}
    </div>
  );
}
