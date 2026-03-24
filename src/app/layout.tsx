import type { Metadata } from "next"
import { Klee_One, M_PLUS_Rounded_1c } from "next/font/google"
import "./globals.css"
import { config } from "@fortawesome/fontawesome-svg-core"
config.autoAddCss = false
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Providers } from "@/components/Providers"

const kleeOne = Klee_One({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-klee",
  display: "swap",
})

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-mplus",
  display: "swap",
})

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
        className={`${kleeOne.variable} ${mPlusRounded.variable} antialiased`}
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
