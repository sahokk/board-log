// BGGカテゴリの英語→日本語変換マップ
// 登録済みのものだけ統計に表示される（未登録は除外）
//
// ※ メカニクスの日本語名・説明は src/lib/bgg/mechanic-labels.ts を使用すること。
//   (データソース: bgg-to-bodogamer.json + bodogamer-mechanics.json)

export const categoryJa: Record<string, string> = {
  // テーマ・ジャンル
  "Abstract Strategy": "抽象戦略",
  "Action / Dexterity": "アクション",
  "Adventure": "アドベンチャー",
  "Animals": "動物",
  "Bluffing": "ブラフ",
  "Card Game": "カードゲーム",
  "Children's Game": "子ども向け",
  "City Building": "都市建設",
  "Civilization": "文明",
  "Deduction": "推理",
  "Dice": "ダイス",
  "Economic": "経済",
  "Educational": "教育",
  "Exploration": "探索",
  "Fantasy": "ファンタジー",
  "Farming": "農業",
  "Fighting": "格闘",
  "Horror": "ホラー",
  "Humor": "ユーモア",
  "Mafia": "マフィア",
  "Maze": "迷路",
  "Medical": "医療",
  "Memory": "記憶",
  "Miniatures": "ミニチュア",
  "Movies / TV / Radio theme": "映画・TV",
  "Murder / Mystery": "ミステリー",
  "Music": "音楽",
  "Mythology": "神話",
  "Nautical": "海洋",
  "Negotiation": "交渉",
  "Novel-based": "小説原作",
  "Number": "数字",
  "Party Game": "パーティー",
  "Pirates": "海賊",
  "Political": "政治",
  "Prehistoric": "先史時代",
  "Puzzle": "パズル",
  "Racing": "レース",
  "Real-time": "リアルタイム",
  "Religious": "宗教",
  "Renaissance": "ルネサンス",
  "Science Fiction": "SF",
  "Space Exploration": "宇宙探索",
  "Spies / Secret Agents": "スパイ",
  "Sports": "スポーツ",
  "Territory Building": "領土構築",
  "Trains": "鉄道",
  "Transportation": "輸送",
  "Travel": "旅行",
  "Trivia": "トリビア",
  "Video Game Theme": "ビデオゲーム",
  "Wargame": "ウォーゲーム",
  "Word Game": "ワードゲーム",
  "Zombies": "ゾンビ",

  // 歴史
  "Ancient": "古代",
  "Arabian": "アラビアン",
  "Aviation / Flight": "航空",
  "Civil War": "内戦",
  "American Civil War": "南北戦争",
  "American Indian Wars": "先住民戦争",
  "American Revolutionary War": "独立戦争",
  "American West": "西部開拓",
  "Medieval": "中世",
  "Napoleonic": "ナポレオン",
  "World War I": "第一次世界大戦",
  "World War II": "第二次世界大戦",

  // コンポーネント
  "Collectible Components": "コレクタブル",
  "Comic Book / Strip": "コミック",
}

/** BGGカテゴリ名を日本語に変換（未登録の場合は空文字を返して統計から除外） */
export function translateCategory(name: string): string {
  return categoryJa[name] ?? ""
}
