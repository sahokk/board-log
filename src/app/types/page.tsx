import Link from "next/link"
import { TYPE_DEFINITIONS } from "@/lib/boardgame-type"

const AXIS_LABELS: Record<string, { weight: string; variety: string }> = {
  "strategic-explorer": { weight: "ストラテジー寄り", variety: "探索派" },
  "strategic-specialist": { weight: "ストラテジー寄り", variety: "極め派" },
  "party-explorer": { weight: "カジュアル寄り", variety: "探索派" },
  "party-specialist": { weight: "カジュアル寄り", variety: "極め派" },
}

export const metadata = {
  title: "ボドゲタイプ一覧 | Boardory",
  description: "Boardoryのボードゲームタイプ4種類を紹介。あなたはどのタイプ？",
}

export default function TypesPage() {
  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-4xl">🎲</p>
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">ボドゲタイプ一覧</h1>
          <p className="mt-2 text-sm text-amber-800/70">
            Boardoryはあなたのプレイ記録からボードゲームタイプを診断します
          </p>
        </div>

        {/* Types grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {TYPE_DEFINITIONS.map((type) => {
            const axes = AXIS_LABELS[type.id]
            return (
              <div key={type.id} className="wood-card overflow-hidden rounded-2xl shadow-sm">
                {/* Card header */}
                <div className="bg-linear-to-br from-amber-800 to-amber-950 px-5 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{type.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">{type.name}</h2>
                      <p className="text-xs text-amber-300">{type.tagline}</p>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 py-4">
                  <p className="mb-4 text-sm leading-relaxed text-amber-900">{type.description}</p>
                  {axes && (
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                        {axes.weight}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                        {axes.variety}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* How it works */}
        <div className="wood-card mt-8 rounded-2xl p-6 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-amber-950">タイプの決まり方</h2>
          <div className="space-y-3 text-sm text-amber-900/80">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">⚖️</span>
              <div>
                <p className="font-semibold text-amber-950">重さ軸（カジュアル ↔ ストラテジー）</p>
                <p className="mt-0.5 leading-relaxed">
                  BGGのweight値や、ゲームのカテゴリ・メカニクスから算出します。
                  重量級ゲームをよく遊ぶほどストラテジー寄りになります。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">🔍</span>
              <div>
                <p className="font-semibold text-amber-950">探索軸（極め派 ↔ 探索派）</p>
                <p className="mt-0.5 leading-relaxed">
                  1ゲームあたりの平均プレイ回数から算出します。
                  多くのタイトルを幅広く遊ぶほど探索派、同じゲームをリピートするほど極め派になります。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800"
          >
            ゲームを記録して診断する
          </Link>
        </div>
      </div>
    </div>
  )
}
