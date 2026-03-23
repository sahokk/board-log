#!/usr/bin/env npx tsx
/**
 * ボドゲーマの日本語メカニクス説明を mechanic-descriptions.json にマージするスクリプト。
 *
 * 処理フロー:
 *   1. bodogamer-mechanics.json (ボドゲーマのスクレイピング結果) を読み込み
 *   2. BGGメカニクス名 → ボドゲーマID のマッピングを適用
 *   3. mechanic-descriptions.json の descriptionJa フィールドを更新
 *
 * 使い方:
 *   npx tsx scripts/merge-mechanic-descriptions.ts
 */

import * as fs from "node:fs"
import * as path from "node:path"
import type { BodoGamerMechanic } from "./fetch-bodogamer-mechanics"
import type { MechanicDescription } from "./fetch-mechanic-descriptions"

// ============================================================
// BGGメカニクス名 → ボドゲーマID マッピング
// ============================================================
// 複数の BGG 名が同じボドゲーマ ID を指す場合あり

// ============================================================
// 要確認マッピング（手動レビュー済みに更新してください）
// ============================================================
// [要確認A] Betting and Bluffing: 「賭け」と「ブラフ」両方含む。
//   9=ブラフ(「相手を欺く」) vs 4=ベッティング(「賭け金でリターン変動」)
//   → ブラフ側(9)で統一中
//
// [要確認B] Campaign / Battle Card Driven:
//   BGG定義=「カード駆動型ウォーゲームシステム」
//   70=バトルカード(「攻撃値-防御値比較」)とは概念が異なる可能性あり
//   → 70で紐づけ中
//
// [要確認C] Prisoner's Dilemma:
//   BGG定義=「協力/裏切りの選択ジレンマ」
//   95=バッティング(「同じ選択をしたらペナルティ」) とは微妙に違う
//   → 95で紐づけ中
//
// [要確認D] Simultaneous Action Selection:
//   87=アクション事前決定(「手番前にアクションを宣言」) と
//   95=バッティング(「同時宣言で被りペナルティ」) の両面あり
//   → 87で紐づけ中
//
// [要確認E] Speed Matching:
//   BGG定義=「素早く同じカード/物を選ぶ」
//   97=リアルタイム(「リアルタイム進行」) vs 37=アクションゲーム(「身体的反応」)
//   → 37で紐づけ中
//
// [要確認F] Abstract Strategy:
//   BGGでは「ゲームカテゴリ」であり「メカニクス」ではない
//   94=アブストラクト(「運なし・全情報公開」) は概念的には近い
//   → 94で紐づけ中
// ============================================================

const BGG_TO_BODOGAMER: Record<string, number> = {
  // ──────────────────────────────────────────
  // ダイス系 [5]
  // ──────────────────────────────────────────
  "Dice Rolling":              5,
  "Die Icon Resolution":       5,  // ダイス目のシンボル解決
  "Re-rolling and Locking":    5,  // 振り直し・ロック（ヤッツィー式）
  "Random Production":         5,  // ダイスによるランダム資源生成
  "Chit-Pull System":          5,  // チット引き（ランダム処理）
  "Different Dice Movement":   5,  // ダイス種別による移動差

  // ──────────────────────────────────────────
  // タイル配置 [6]
  // ──────────────────────────────────────────
  "Tile Placement":            6,

  // ──────────────────────────────────────────
  // 三すくみ [8]
  // ──────────────────────────────────────────
  "Rock-Paper-Scissors":       8,

  // ──────────────────────────────────────────
  // ブラフ [9]  ※[要確認A]
  // ──────────────────────────────────────────
  "Bluffing":                  9,
  "Betting and Bluffing":      9,

  // ──────────────────────────────────────────
  // 路線・ネットワーク形成 [13]
  // ──────────────────────────────────────────
  "Route/Network Building":    13,
  "Network and Route Building": 13,
  "Connections":               13,  // 接続による得点

  // ──────────────────────────────────────────
  // 記憶 [15]
  // ──────────────────────────────────────────
  "Memory":                    15,

  // ──────────────────────────────────────────
  // エリアマジョリティ・陣取り [16]
  // ──────────────────────────────────────────
  "Area Majority / Influence": 16,
  "Area Control":              16,
  "King of the Hill":          16,  // 中心地点占領 = 陣取りの一形態

  // ──────────────────────────────────────────
  // 正体隠匿 [18]
  // ──────────────────────────────────────────
  "Hidden Roles":              18,
  "Social Deduction":          18,
  "Traitor Game":              18,
  "Roles with Asymmetric Information": 18,  // 非対称情報ロール

  // ──────────────────────────────────────────
  // ドラフト [96]（場札獲得系 [19] と統合）
  // ──────────────────────────────────────────
  "Drafting":                  96,
  "Card Drafting":             96,
  "Open Drafting":             96,
  "Closed Drafting":           96,
  "Action Drafting":           96,

  // ──────────────────────────────────────────
  // 言葉遊び [21]
  // ──────────────────────────────────────────
  "Word Game":                 21,
  "Spelling":                  21,  // スペリング = 言葉遊びの一種

  // ──────────────────────────────────────────
  // 交渉 [22]
  // ──────────────────────────────────────────
  "Negotiation":               22,
  "Contracts":                 22,  // 契約 = 交渉の一形態
  "Bribery":                   22,  // 賄賂 = 交渉の一形態

  // ──────────────────────────────────────────
  // 交換・貿易 [23]
  // ──────────────────────────────────────────
  "Trading":                   23,

  // ──────────────────────────────────────────
  // モジュラーボード [25]
  // ──────────────────────────────────────────
  "Modular Board":             25,

  // ──────────────────────────────────────────
  // アクションポイント [26]
  // ──────────────────────────────────────────
  "Action Points":             26,

  // ──────────────────────────────────────────
  // バースト・プッシュユアラック [27]
  // ──────────────────────────────────────────
  "Push Your Luck":            27,

  // ──────────────────────────────────────────
  // 投票 [30]
  // ──────────────────────────────────────────
  "Voting":                    30,

  // ──────────────────────────────────────────
  // セットコレクション [33]
  // ──────────────────────────────────────────
  "Set Collection":            33,

  // ──────────────────────────────────────────
  // 協力プレイ [34]
  // ──────────────────────────────────────────
  "Cooperative Game":          34,
  "Semi-Cooperative Game":     34,

  // ──────────────────────────────────────────
  // 株・投資 [35]
  // ──────────────────────────────────────────
  "Stock Holding":             35,
  "Commodity Speculation":     35,  // 商品投機

  // ──────────────────────────────────────────
  // アクションゲーム（身体的） [37]  ※[要確認E]
  // ──────────────────────────────────────────
  "Physical":                  37,
  "Speed Matching":            37,  // 素早く一致させる = 身体的反応
  "Flicking":                  37,  // フリック（指で弾く）
  "Stacking and Balancing":    37,  // 積み上げ・バランス

  // ──────────────────────────────────────────
  // 直接攻撃 [41]
  // ──────────────────────────────────────────
  "Take That":                 41,

  // ──────────────────────────────────────────
  // 推理 [44]
  // ──────────────────────────────────────────
  "Deduction":                 44,
  "Induction":                 44,  // 帰納推理 = 推理の一種（アブストラクトではない）
  "Targeted Clues":            44,  // ヒント制限 = 推理ゲーム要素

  // ──────────────────────────────────────────
  // ハンドマネージメント [45]
  // ──────────────────────────────────────────
  "Hand Management":           45,

  // ──────────────────────────────────────────
  // ストーリーメイキング [48]
  // ──────────────────────────────────────────
  "Storytelling":              48,
  "Narrative Choice / Paragraph": 48,  // 文章分岐型
  "Acting":                    48,     // 身体演技（ジェスチャー等）= ストーリー系

  // ──────────────────────────────────────────
  // バリアブルフェーズオーダー [55]
  // ──────────────────────────────────────────
  "Variable Phase Order":      55,

  // ──────────────────────────────────────────
  // プレイヤー別固有能力 [56]
  // ──────────────────────────────────────────
  "Variable Player Powers":    56,

  // ──────────────────────────────────────────
  // ワーカープレイスメント [58]
  // ──────────────────────────────────────────
  "Worker Placement":          58,
  "Worker Placement, Different Worker Types": 58,

  // ──────────────────────────────────────────
  // デッキビルディング [59]
  // ──────────────────────────────────────────
  "Deck Building":             59,
  "Deck Construction":         59,
  "Deck, Bag, and Pool Building": 59,

  // ──────────────────────────────────────────
  // チーム戦 [66]
  // ──────────────────────────────────────────
  "Team-Based Game":           66,

  // ──────────────────────────────────────────
  // エリアエンクロージャ（囲み） [67]
  // ──────────────────────────────────────────
  "Enclosure":                 67,

  // ──────────────────────────────────────────
  // エリア移動 [68]
  // ──────────────────────────────────────────
  "Area Movement":             68,
  "Area-Impulse":              68,  // エリアインパルス = エリア内活性化移動

  // ──────────────────────────────────────────
  // バトルカード [70]  ※[要確認B]
  // ──────────────────────────────────────────
  "Campaign / Battle Card Driven": 70,
  "Card Play Conflict Resolution": 70,  // カードで戦闘解決
  "Stat Check Resolution":     70,      // ステータス比較で解決
  "Ratio / Combat Results Table": 70,   // 比率・戦闘結果表

  // ──────────────────────────────────────────
  // グリッド移動 [75]
  // ──────────────────────────────────────────
  "Grid Movement":             75,
  "Hexagon Grid":              75,  // 六角グリッド上の移動
  "Square Grid":               75,  // 正方グリッド上の移動

  // ──────────────────────────────────────────
  // パターンビルディング [78]
  // ──────────────────────────────────────────
  "Pattern Building":          78,
  "Grid Coverage":             78,  // グリッド充填 = パターン形成

  // ──────────────────────────────────────────
  // パターン認識 [79]
  // ──────────────────────────────────────────
  "Pattern Recognition":       79,
  "Matching":                  79,  // マッチング = 一致判断

  // ──────────────────────────────────────────
  // プレイヤーの脱落 [80]
  // ──────────────────────────────────────────
  "Player Elimination":        80,

  // ──────────────────────────────────────────
  // 接続マスへの移動・ポイント間移動 [81]
  // ──────────────────────────────────────────
  "Point to Point Movement":   81,

  // ──────────────────────────────────────────
  // チキンレース（リスク増大） [82]
  // → Push Your Luck (27) と混同注意。82 は継続するほどリスク増大、27 はバースト
  // ──────────────────────────────────────────
  // ※現在このグループに対応するBGGメカニクスなし

  // ──────────────────────────────────────────
  // キャラクター・役割担当 [83]
  // ──────────────────────────────────────────
  "Role Playing":              83,

  // ──────────────────────────────────────────
  // 出目移動 [84]
  // ──────────────────────────────────────────
  "Roll / Spin and Move":      84,
  "Track Movement":            84,  // トラック上を移動（多くはダイス使用）

  // ──────────────────────────────────────────
  // シークレットユニット [85]
  // ──────────────────────────────────────────
  "Hidden Movement":           85,
  "Secret Unit Deployment":    85,  // ユニットの秘匿配置

  // ──────────────────────────────────────────
  // アクション事前決定 [87]  ※[要確認D]
  // ──────────────────────────────────────────
  "Simultaneous Action Selection": 87,
  "Programmed Movement":       87,  // プログラム移動（Robo Rally等）
  "Force Commitment":          87,  // 宣言後変更不可
  "Order Counters":            87,  // 順序カウンター = 事前宣言
  "Action Queue":              87,  // アクションキュー = 行動列の事前設定
  "Action Retrieval":          87,  // 使用アクションの回収管理

  // ──────────────────────────────────────────
  // タイムトラック（行動順変動） [89]
  // ──────────────────────────────────────────
  "Turn Order: Time Track":    89,
  "Turn Order: Progressive":   89,
  "Turn Order: Stat-Based":    89,
  "Turn Order: Claim Action":  89,
  "Turn Order: Pass Order":    89,
  "Turn Order: Role Order":    89,
  "Turn Order: Random":        89,

  // ──────────────────────────────────────────
  // アブストラクト [94]  ※[要確認F]
  // ──────────────────────────────────────────
  "Abstract Strategy":         94,

  // ──────────────────────────────────────────
  // バッティング [95]  ※[要確認C]
  // ──────────────────────────────────────────
  "Prisoner's Dilemma":        95,

  // ──────────────────────────────────────────
  // リアルタイム [97]
  // ──────────────────────────────────────────
  "Real-Time":                 97,

  // ──────────────────────────────────────────
  // コミュニケーション禁止 [98]
  // ──────────────────────────────────────────
  "Communication Limits":      98,

  // ──────────────────────────────────────────
  // レガシーシステム [99]
  // ──────────────────────────────────────────
  "Legacy Game":               99,

  // ──────────────────────────────────────────
  // 謎解き [100]
  // ──────────────────────────────────────────
  // ※ Deduction は [44] 推理で統一

  // ──────────────────────────────────────────
  // 割り込み [101]
  // ──────────────────────────────────────────
  "Interrupts":                101,

  // ──────────────────────────────────────────
  // ダイスプレイスメント [102]
  // ──────────────────────────────────────────
  "Worker Placement with Dice Workers": 102,

  // ──────────────────────────────────────────
  // ロンデル [103]
  // ──────────────────────────────────────────
  "Rondel":                    103,

  // ──────────────────────────────────────────
  // オークション [2]
  // ──────────────────────────────────────────
  "Auction / Bidding":         2,
  "Auction/Bidding":           2,
  "Bidding":                   2,
  "Auction: English":          2,
  "Auction: Dutch":            2,
  "Auction: Dutch Priority":   2,
  "Auction: Sealed Bid":       2,
  "Auction: Once Around":      2,
  "Auction: Multiple Lot":     2,
  "Auction: Fixed Placement":  2,
  "Auction: Dexterity":        2,
  "Auction: Turn Order Until Pass": 2,
  "Constrained Bidding":       2,
  "Selection Order Bid":       2,
}

async function main() {
  console.log("\nメカニクス説明マージスクリプト")
  console.log("=".repeat(50))

  const bodogamerPath = path.join(process.cwd(), "src/data/bodogamer-mechanics.json")
  const descriptionsPath = path.join(process.cwd(), "src/data/mechanic-descriptions.json")

  if (!fs.existsSync(bodogamerPath)) {
    console.error("❌ bodogamer-mechanics.json が見つかりません。先に fetch-bodogamer-mechanics.ts を実行してください。")
    process.exit(1)
  }

  // ボドゲーマデータをIDでインデックス
  const bdgList: BodoGamerMechanic[] = JSON.parse(fs.readFileSync(bodogamerPath, "utf-8"))
  const bdgById = new Map(bdgList.map((m) => [m.id, m]))
  console.log(`ボドゲーマデータ: ${bdgList.length} 件`)

  // 既存の mechanic-descriptions.json を読み込み
  let descriptions: Record<string, MechanicDescription> = {}
  if (fs.existsSync(descriptionsPath)) {
    descriptions = JSON.parse(fs.readFileSync(descriptionsPath, "utf-8"))
    console.log(`既存説明データ: ${Object.keys(descriptions).length} 件`)
  }

  // mechanics-map.json から全メカニクス名を取得
  const mechanicsMapPath = path.join(process.cwd(), "src/data/mechanics-map.json")
  const mechanicsMap: Record<string, unknown> = JSON.parse(fs.readFileSync(mechanicsMapPath, "utf-8"))
  const allMechanics = new Set([
    ...Object.keys(mechanicsMap),
    ...Object.keys(descriptions),
  ])

  let updated = 0
  let notMapped = 0

  for (const bggName of allMechanics) {
    const bdgId = BGG_TO_BODOGAMER[bggName]
    if (!bdgId) {
      notMapped++
      continue
    }

    const bdgMechanic = bdgById.get(bdgId)
    if (!bdgMechanic) continue

    const existing = descriptions[bggName] ?? { bggId: "", description: "" }
    descriptions[bggName] = {
      ...existing,
      descriptionJa: bdgMechanic.shortDesc,
    }
    updated++
  }

  console.log(`\nマッピング適用: ${updated} 件`)
  console.log(`未マッピング: ${notMapped} 件`)

  // 未マッピングのメカニクスを表示
  const unmapped = [...allMechanics].filter((name) => !BGG_TO_BODOGAMER[name])
  if (unmapped.length > 0) {
    console.log(`\n未マッピングのメカニクス (${unmapped.length} 件):`)
    for (const name of unmapped.sort()) {
      const has = descriptions[name]?.descriptionJa ? " (既存あり)" : ""
      console.log(`  - ${name}${has}`)
    }
  }

  // ソートして保存
  const sorted = Object.fromEntries(
    Object.entries(descriptions).sort(([a], [b]) => a.localeCompare(b))
  )
  fs.writeFileSync(descriptionsPath, JSON.stringify(sorted, null, 2), "utf-8")
  console.log(`\n✓ ${Object.keys(sorted).length} 件を保存: ${descriptionsPath}`)

  // ボドゲーマ側で未使用のIDを報告
  const usedIds = new Set(Object.values(BGG_TO_BODOGAMER))
  const unusedBdg = bdgList.filter((m) => !usedIds.has(m.id))
  if (unusedBdg.length > 0) {
    console.log(`\nボドゲーマ未使用メカニクス (参考):`)
    for (const m of unusedBdg) {
      console.log(`  ID ${m.id}: ${m.jaName} — ${m.shortDesc}`)
    }
  }
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
