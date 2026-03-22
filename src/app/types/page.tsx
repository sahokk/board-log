import Link from "next/link"
import { GiDiceSixFacesFive, GiChessPawn } from "react-icons/gi"
import { MdBalance } from "react-icons/md"
import { TYPE_DEFINITIONS } from "@/lib/boardgame-type"

export const metadata = {
  title: "ボドゲタイプ一覧 | Boardory",
  description: "Boardoryのボードゲームタイプ5種類を紹介。あなたはどのタイプ？",
}

export default function TypesPage() {
  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-2 flex justify-center text-amber-700"><GiDiceSixFacesFive size={48} /></div>
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">ボドゲタイプ一覧</h1>
          <p className="mt-2 text-sm text-amber-800/70">
            Boardoryはあなたのプレイ記録からボードゲームタイプを診断します
          </p>
        </div>

        {/* Types grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {TYPE_DEFINITIONS.map((type) => (
            <div key={type.id} className="wood-card overflow-hidden rounded-2xl shadow-sm">
              {/* Card header */}
              <div className="bg-linear-to-br from-amber-800 to-amber-950 px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <type.icon size={40} className="text-white" />
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{type.name}</h2>
                    <p className="text-xs text-amber-300">{type.tagline}</p>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4">
                <p className="text-sm leading-relaxed text-amber-900">{type.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="wood-card mt-8 rounded-2xl p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-amber-950">タイプの決まり方</h2>
          <div className="space-y-4 text-sm text-amber-900/80">
            <div className="flex items-start gap-3">
              <GiChessPawn size={20} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-950">戦略性・対人性・盛り上がり</p>
                <p className="mt-0.5 leading-relaxed">
                  BGGのメカニクス情報から算出します。ワーカープレイスメントやデッキ構築は戦略性、
                  エリアコントロールや交渉は対人性、パーティゲームは盛り上がりに反映されます。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GiDiceSixFacesFive size={20} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-950">運要素・テンポ</p>
                <p className="mt-0.5 leading-relaxed">
                  ダイスロールやリアルタイム系メカニクスから算出します。
                  これらが高く戦略・対人・盛り上がりを上回るとカジュアルタイプになります。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MdBalance size={20} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-950">BGG weight補正</p>
                <p className="mt-0.5 leading-relaxed">
                  BGGのweight値（ゲームの複雑さ）が高いほど戦略性が上昇し、テンポが下がります。
                  複雑なゲームを好む人ほどストラテジストに近づきます。
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
            遊んだゲームを登録して診断する
          </Link>
        </div>
      </div>
    </div>
  )
}
