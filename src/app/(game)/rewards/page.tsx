"use client";

import { useState, useEffect, useCallback } from "react";
import { LuoJiuAssistant } from "@/components/ai/LuoJiuAssistant";
import { getLuoJiuMessage } from "@/components/ai/messages";

interface PendingRewards {
  coins: number;
  items: Array<{
    id: string;
    name: string;
    type: string;
    rarity: string;
    stats: Record<string, number>;
  }>;
  hasToken: boolean;
  token: string | null;
  tokenExpiry: string | null;
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<PendingRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [luojiuMsg, setLuojiuMsg] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch("/api/rewards/pending");
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
        if (data.tokenExpiry) {
          const remaining = Math.max(
            0,
            Math.floor((new Date(data.tokenExpiry).getTime() - Date.now()) / 1000)
          );
          setCountdown(remaining);
        }
      }
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleGenerateToken = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/rewards/generate-token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCountdown(300);
        setLuojiuMsg(getLuoJiuMessage("token_generated")!);
        await fetchRewards();
      }
    } catch {
      // 静默
    } finally {
      setGenerating(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const rarityColor: Record<string, string> = {
    common: "text-gray-400",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-gold",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-purple-accent animate-pulse">加载中...</div>
      </div>
    );
  }

  const hasPending = rewards && (rewards.coins > 0 || rewards.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-purple-accent mb-6">奖励池</h1>

      {!hasPending ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-2">暂无待领取奖励</p>
          <p className="text-gray-600 text-sm">通关关卡后奖励将存入此处</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 奖励概览 */}
          <div className="bg-space-800 border border-space-600 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">待领取奖励</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-space-900 rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">金币</p>
                <p className="text-gold text-2xl font-bold">{rewards.coins}</p>
              </div>
              <div className="bg-space-900 rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">道具数量</p>
                <p className="text-purple-accent text-2xl font-bold">
                  {rewards.items.length}
                </p>
              </div>
            </div>

            {/* 道具列表 */}
            {rewards.items.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm text-gray-400">道具列表</h3>
                {rewards.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-space-900 rounded-lg px-4 py-2"
                  >
                    <span className={rarityColor[item.rarity] || "text-gray-300"}>
                      {item.name}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Token区域 */}
          <div className="bg-space-800 border border-space-600 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">领取验证码</h2>

            {rewards.hasToken && countdown > 0 ? (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">
                  请在QQ群内向洛玖发送：
                </p>
                <div className="bg-space-900 rounded-lg p-4 mb-3">
                  <p className="text-purple-accent font-mono text-sm">
                    /领取 {rewards.token}
                  </p>
                </div>
                <p className="text-gray-500 text-sm">
                  有效期: <span className="text-gold">{formatCountdown(countdown)}</span>
                </p>
              </div>
            ) : (
              <div className="text-center">
                {rewards.hasToken && countdown === 0 && (
                  <p className="text-hp-red text-sm mb-3">验证码已过期</p>
                )}
                <button
                  onClick={handleGenerateToken}
                  disabled={generating}
                  className="px-6 py-3 bg-purple-accent text-white rounded-lg hover:bg-purple-glow transition-colors disabled:opacity-50"
                >
                  {generating ? "生成中..." : "生成领取验证码"}
                </button>
              </div>
            )}
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
