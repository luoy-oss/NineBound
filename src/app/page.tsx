import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-space-950 relative overflow-hidden">
      {/* 星空背景 */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 137) % 100}%`,
              top: `${(i * 251) % 100}%`,
              width: `${(i % 3) + 1}px`,
              height: `${(i % 3) + 1}px`,
              opacity: 0.1 + (i % 5) * 0.1,
            }}
          />
        ))}
      </div>

      {/* 紫色光晕 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-accent/5 blur-[100px]" />

      <div className="relative z-10 text-center px-4">
        <h1 className="text-6xl md:text-8xl font-bold text-purple-accent mb-2 tracking-wider">
          玖的远征
        </h1>
        <p className="text-xl md:text-2xl text-purple-accent/60 mb-2 tracking-[0.3em]">
          NINEBOUND
        </p>
        <p className="text-gray-400 mb-12 max-w-md mx-auto leading-relaxed">
          锚点已失，全宇宙的地球人沦为丧家之犬。
          <br />
          在洛玖的指引下，踏上去无尽远征。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-purple-accent text-white rounded-lg font-medium hover:bg-purple-glow transition-colors glow-border"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border border-purple-accent/50 text-purple-accent rounded-lg font-medium hover:bg-purple-accent/10 transition-colors"
          >
            注册
          </Link>
        </div>

        <p className="text-gray-600 text-sm mt-8">
          QQ号登录 · 无尽闯关 · 自动战斗 · AI助手洛玖
        </p>
      </div>
    </div>
  );
}
