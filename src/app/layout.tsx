import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "玖的远征 | NineBound",
  description: "锚点已失，血洗宇宙找回地球坐标",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="relative min-h-screen">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
