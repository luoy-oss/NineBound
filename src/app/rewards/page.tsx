"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LuojiuAssistant from "@/components/LuojiuAssistant";

export default function RewardsPage() {
  const router = useRouter();
  const [pending, setPending] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [luojiuTrigger, setLuojiuTrigger] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("nb_token");
    if (!t) {
      router.push("/");
      return;
    }
    fetchPending(t);
  }, []);

  // 倒计时
  useEffect(() => {
    if (!tokenExpiry) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((tokenExpiry.getTime() - Date.now()) / 1000));
      setCountdown(diff);
      if (diff <= 0) {
        setToken(null);
        setTokenExpiry(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenExpiry]);

  const fetchPending = async (jwt: string) => {
    try {
      const res = await fetch("/api/rewards/pending", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      setPending(data);
      if (data.hasToken && data.token) {
        setToken(data.token);
        setTokenExpiry(new Date(data.tokenExpiry));
      }
    } catch {}
  };

  const generateToken = async () => {
    setLoading(true);
    const t = localStorage.getItem("nb_token");
    try {
      const res = await fetch("/api/rewards/generate-token", {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setTokenExpiry(new Date(data.expiry));
        setLuojiuTrigger("token");
        fetchPending(t!);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LuojiuAssistant trigger={luojiuTrigger} />

      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-3 card-space border-0 border-b border-purple-500/20">
        <button onClick={() => router.push("/game")} className="text-purple-300 hover:text-purple-100 text-sm">
          ← 返回战斗
        </button>
        <span className="text-purple-300 font-bold">奖励池</span>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="card-space w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-purple-300 mb-6 text-center">待领取奖励</h2>

          {!pending || (pending.coins === 0 && pending.items?.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-purple-400">暂无待领取奖励</p>
              <p className="text-xs text-purple-500 mt-2">通关后奖励会暂存在这里</p>
            </div>
          ) : (
            <>
              {/* 金币 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-900/30 mb-3">
                <span className="text-purple-300">待领取金币</span>
                <span className="text-yellow-400 font-bold">{pending.coins}</span>
              </div>

              {/* 道具 */}
              {pending.items?.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm text-purple-400 mb-2 block">待领取道具</span>
                  <div className="space-y-2">
                    {pending.items.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-purple-900/20"
                      >
                        <span className="text-sm text-purple-200">{item.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            item.rarity === "epic"
                              ? "bg-red-900/50 text-red-300"
                              : item.rarity === "rare"
                              ? "bg-yellow-900/50 text-yellow-300"
                              : "bg-gray-800/50 text-gray-300"
                          }`}
                        >
                          {item.rarity === "epic" ? "史诗" : item.rarity === "rare" ? "稀有" : "普通"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Token区域 */}
              {!claimed && (
                <div className="border-t border-purple-500/20 pt-4 mt-4">
                  {token ? (
                    <div className="text-center">
                      <p className="text-sm text-purple-300 mb-2">你的领取码</p>
                      <div className="text-3xl font-bold text-purple-200 tracking-[0.5em] mb-2 purple-glow-text">
                        {token}
                      </div>
                      <p className="text-sm text-yellow-400 mb-1">有效期：{formatTime(countdown)}</p>
                      <p className="text-xs text-purple-400 mt-3">
                        请在QQ群内向洛玖发送：
                      </p>
                      <p className="text-sm text-purple-200 font-bold mt-1 bg-purple-900/50 rounded px-3 py-1 inline-block">
                        /领取 {token}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-purple-400 mb-3">
                        生成领取码后，在QQ群内发送给洛玖即可领取
                      </p>
                      <button
                        className="btn-primary"
                        onClick={generateToken}
                        disabled={loading}
                      >
                        {loading ? "生成中..." : "生成领取Token"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {claimed && (
                <div className="text-center border-t border-purple-500/20 pt-4 mt-4">
                  <p className="text-green-400">奖励已发放至账户</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
