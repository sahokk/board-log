import Link from "next/link"
import type { Metadata } from "next"
import { TYPE_DEFINITIONS } from "@/lib/boardgame-type"

export const metadata: Metadata = {
  title: "ボドゲタイプ一覧 | Boardory",
  description: "Boardoryのボードゲームタイプ10種類を紹介。戦略派・パーティ派・カジュアル派など、あなたはどのタイプ？",
}

const AXIS_DESCRIPTIONS = [
  {
    icon: "♟️",
    label: "戦略性",
    detail:
      "ゲームのメカニクス（ワーカープレイスメント・エンジン構築など）とBGGのweight値から算出。思考を要するゲームをよく遊ぶほど高くなります。",
  },
  {
    icon: "🤝",
    label: "対人性",
    detail:
      "エリアコントロール・交渉・ブラフなど他プレイヤーへの干渉度から算出。駆け引きや対決を楽しむゲームほど高くなります。",
  },
  {
    icon: "🎉",
    label: "盛り上がり",
    detail:
      "パーティゲームやロールプレイ・ストーリーテリングなどのメカニクスから算出。場を盛り上げるゲームほど高くなります。",
  },
  {
    icon: "🎲",
    label: "運要素",
    detail:
      "ダイスロール・プッシュユアラック・ランダム生産などのメカニクスから算出。運が勝敗に影響するゲームほど高くなります。",
  },
  {
    icon: "⚡",
    label: "テンポ",
    detail:
      "リアルタイム系やスピードマッチングなどから算出。テンポよく進むゲームほど高く、重い戦略ゲームは低くなります。",
  },
]

export default function TypesPage() {
  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-6">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-4xl">🎲</p>
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">ボドゲタイプ一覧</h1>
          <p className="mt-3 text-sm text-amber-800/70">
            プレイ記録から5つの軸を算出し、10種類のタイプに分類します
          </p>
          <Link
            href="/try"
            className="mt-5 inline-block rounded-xl bg-amber-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800"
          >
            いますぐ診断する →
          </Link>
        </div>

        {/* Types grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {TYPE_DEFINITIONS.map((type) => (
            <div key={type.id} className="wood-card overflow-hidden rounded-2xl shadow-sm">
              <div className="bg-linear-to-br from-amber-800 to-amber-950 px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{type.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{type.name}</h2>
                    <p className="text-xs text-amber-300/90">{type.tagline}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm leading-relaxed text-amber-900">{type.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 診断の仕組み */}
        <div className="wood-card mt-10 rounded-2xl p-6 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-amber-950">診断の仕組み</h2>
          <p className="mb-4 text-sm text-amber-900/80">
            BGGに登録されたゲームのメカニクス情報とプレイ回数をもとに、5つの軸でスコアを算出します。
            スコアの組み合わせによって上の10種類のいずれかのタイプが決まります。
          </p>
          <div className="space-y-4">
            {AXIS_DESCRIPTIONS.map(({ icon, label, detail }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="mt-0.5 text-lg shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-amber-950">{label}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-amber-900/80">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="mb-3 text-sm text-amber-800/70">
            ログインすると遊んだゲームのプレイ回数が反映され、より精度の高い診断になります
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try"
              className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-2.5 text-sm font-medium text-amber-900 transition-all hover:bg-amber-100"
            >
              ログインなしで試す
            </Link>
            <Link
              href="/api/auth/signin"
              className="rounded-xl bg-amber-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800"
            >
              ログインして診断する
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
