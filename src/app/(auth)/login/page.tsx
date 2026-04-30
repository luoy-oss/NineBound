"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [qq, setQq] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qq, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      localStorage.setItem("nb_uid", data.uid);
      localStorage.setItem("nb_nickname", data.nickname);
      router.push("/play");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-space-800/80 backdrop-blur-sm border border-purple-accent/20 rounded-2xl p-8">
      <h1 className="text-2xl font-bold text-purple-accent text-center mb-2">
        登录
      </h1>
      <p className="text-gray-500 text-sm text-center mb-6">
        重返远征之路
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">QQ号</label>
          <input
            type="text"
            value={qq}
            onChange={(e) => setQq(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="输入QQ号"
            className="w-full px-4 py-3 bg-space-900 border border-space-600 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-accent transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            className="w-full px-4 py-3 bg-space-900 border border-space-600 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-accent transition-colors"
            required
          />
        </div>

        {error && (
          <p className="text-hp-red text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-accent text-white rounded-lg font-medium hover:bg-purple-glow transition-colors disabled:opacity-50"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        还没有账号？
        <Link href="/register" className="text-purple-accent hover:underline ml-1">
          注册
        </Link>
      </p>
    </div>
  );
}
