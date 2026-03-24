import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { config } from "@fortawesome/fontawesome-svg-core"
config.autoAddCss = false
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Providers } from "@/components/Providers"

export const metadata: Metadata = {
  title: "Boardory - ボードゲームの思い出アルバム",
  description:
    "遊んだボードゲームを記録して、思い出アルバムのように振り返ろう",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
