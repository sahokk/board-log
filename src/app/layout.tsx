import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoardLog",
  description: "ボードゲームのプレイ体験を記録する思い出アルバム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
