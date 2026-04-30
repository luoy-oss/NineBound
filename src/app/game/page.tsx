"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/GameCanvas";
import LuojiuAssistant from "@/components/LuojiuAssistant";
import { GameState } from "@/engine/types";

interface PlayerData {
  uid: string;
  nickname: string;
  floor: number;
  power: number;
  coins: number;
  gems: number;
}

export default function GamePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [luojiuTrigger, setLuojiuTrigger] = useState<string | null>(null);
  const [lastFloor, setLastFloor] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("nb_token");
    if (!token) { router.push("/"); return; }

    fetch("/api/player/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push("/"); return; }
        setPlayer(data);
        setLastFloor(data.floor);
        if (data.floor === 1) setLuojiuTrigger("first_login");
      })
      .catch(() => router.push("/"));
  }, []);

  const handleWaveComplete = async (floor: number, coinsEarned: number) => {
    const token = localStorage.getItem("nb_token");
    try {
      const res = await fetch("/api/floor/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ floor, coinsEarned }),
      });
      const data = await res.json();
      if (data.success && player) {
        setPlayer({
          ...player,
          floor: data.newFloor,
          power: player.power + (floor % 50 === 0 ? 50 : floor % 10 === 0 ? 20 : 5),
          coins: player.coins + coinsEarned,
        });
      }
    } catch {}
  };

  const handleStateChange = (state: GameState) => {
    // Sync coins from engine
    if (player) {
      setPlayer(prev => prev ? { ...prev, coins: state.coins } : prev);
    }
    // Update Luojiu triggers
    if (state.floor !== lastFloor) {
      setLastFloor(state.floor);
      if (state.floor === 10) setLuojiuTrigger("floor_10");
      else if (state.floor === 50) setLuojiuTrigger("floor_50");
      else if (state.floor === 100) setLuojiuTrigger("floor_100");
      else if (state.floor === 500) setLuojiuTrigger("floor_500");
    }
  };

  const handlePlayerDeath = () => {
    setLuojiuTrigger("fail");
  };

  if (!player) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-purple-400 animate-pulse">正在连接...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <LuojiuAssistant trigger={luojiuTrigger} floor={lastFloor} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 card-space border-0 border-b border-purple-500/20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-purple-300 font-bold text-sm">{player.nickname}</span>
          <span className="text-xs text-purple-400">战力 {player.power}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-yellow-400">💰 {player.coins}</span>
          <span className="text-cyan-400">💎 {player.gems}</span>
          <button
            onClick={() => router.push("/rewards")}
            className="text-xs text-purple-300 hover:text-purple-100 underline"
          >
            奖励池
          </button>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 min-h-0">
        <GameCanvas
          playerData={{ floor: player.floor, power: player.power, coins: player.coins }}
          onWaveComplete={handleWaveComplete}
          onPlayerDeath={handlePlayerDeath}
          onStateChange={handleStateChange}
        />
      </div>
    </div>
  );
}
