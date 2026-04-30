"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-space-950 flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-space-900/80 backdrop-blur-sm border-b border-space-600 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/play" className="text-purple-accent font-bold text-lg tracking-wider">
            玖的远征
          </Link>
          <nav className="flex gap-1">
            <Link
              href="/play"
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname === "/play"
                  ? "bg-purple-accent/20 text-purple-accent"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              战斗
            </Link>
            <Link
              href="/rewards"
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname === "/rewards"
                  ? "bg-purple-accent/20 text-purple-accent"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              奖励
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
