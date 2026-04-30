"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [qq, setQq] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);

  const handleAuth = async (isLogin: boolean) => {
    setError("");
    if (!/^\d{5,11}$/.test(qq)) {
      setError("QQ号需为5-11位数字");
      return;
    }
    if (password.length < 6 || password.length > 16) {
      setError("密码长度6-16位");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qq, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "操作失败");
        return;
      }

      localStorage.setItem("nb_token", data.jwt);
      localStorage.setItem("nb_uid", data.uid);
      localStorage.setItem("nb_nickname", data.nickname);

      if (data.isNew) setIsNew(true);
      router.push("/game");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card-space w-full max-w-md p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold purple-glow-text text-purple-400 mb-2">
            玖的远征
          </h1>
          <p className="text-sm text-purple-300/60">NineBound</p>
          <p className="text-xs text-purple-300/40 mt-2">
            锚点已失 · 血洗宇宙 · 找回地球坐标
          </p>
        </div>

        {/* 输入区域 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs text-purple-300/60 mb-1 block">QQ号</label>
            <input
              type="text"
              className="input-space w-full"
              placeholder="输入你的QQ号"
              value={qq}
              onChange={(e) => setQq(e.target.value.replace(/\D/g, "").slice(0, 11))}
              maxLength={11}
            />
          </div>
          <div>
            <label className="text-xs text-purple-300/60 mb-1 block">密码</label>
            <input
              type="password"
              className="input-space w-full"
              placeholder="6-16位密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={16}
            />
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-red-400 text-sm text-center mb-4 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            className="btn-primary flex-1"
            onClick={() => handleAuth(true)}
            disabled={loading}
          >
            {loading ? "连接中..." : "登录"}
          </button>
          <button
            className="btn-primary flex-1 opacity-80"
            onClick={() => handleAuth(false)}
            disabled={loading}
          >
            {loading ? "创建中..." : "注册"}
          </button>
        </div>

        {/* 底部提示 */}
        <p className="text-xs text-purple-300/30 text-center mt-6">
          首次登录将自动注册 · QQ号不可逆加密存储
        </p>
      </div>
    </div>
  );
}
