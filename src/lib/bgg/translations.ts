// BGG カテゴリ・メカニクスの英語→日本語変換マップ
// 登録済みのものだけ統計に表示される（未登録は除外）

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

export const mechanicJa: Record<string, string> = {
  // アクション系
  "Action Points": "アクションポイント",
  "Action Queue": "アクションキュー",
  "Action Retrieval": "アクション回収",
  "Action Drafting": "アクションドラフト",
  "Action / Event": "アクション/イベント",
  "Force Commitment": "アクション宣言",
  "Once-Per-Game Abilities": "1回限り能力",
  "Variable Player Powers": "特殊能力",

  // エリア・移動系
  "Area Majority / Influence": "エリアマジョリティ",
  "Area Control / Area Influence": "エリアコントロール", // BGG旧名称（既存データ対応）
  "Area Enclosure": "エリア囲い込み",
  "Area Movement": "エリア移動",
  "Enclosure": "囲い込み",
  "Grid Movement": "グリッド移動",
  "Grid Coverage": "グリッド埋め",
  "Hexagon Grid": "六角形グリッド",
  "Square Grid": "方眼グリッド",
  "Hex-and-Counter": "ヘックスカウンター",
  "Hidden Movement": "隠密移動",
  "Movement Points": "移動ポイント",
  "Pattern Movement": "パターン移動",
  "Point to Point Movement": "ポイント移動",
  "Programmed / Scripted Movement": "プログラム移動",
  "Roll / Spin and Move": "サイコロ移動",
  "Track Movement": "トラック移動",
  "Line of Sight": "視線",
  "Zone of Control": "支配圏",

  // ネットワーク・ルート
  "Network and Route Building": "ルート構築",
  "Route/Network Building": "ルート構築",
  "Connections": "ルート接続",

  // ドラフト・選択系
  "Card Drafting": "カードドラフト",
  "Closed Drafting": "クローズドドラフト",
  "Drafting": "ドラフト",
  "Open Drafting": "オープンドラフト",

  // オークション・入札系
  "Auction / Bidding": "オークション",
  "Auction: Dutch": "ダッチオークション",
  "Auction: English": "競り上げ",
  "Auction: Multiple Lot": "複数出品オークション",
  "Auction: Sealed Bid": "封入入札",
  "Betting and Bluffing": "賭け・ブラフ",
  "Turn Order: Auction": "ターン順オークション",

  // デッキ・手札管理
  "Deck, Bag, and Pool Building": "デッキ構築",
  "Deck Construction": "デッキ構築",
  "Deck": "デッキ構築", // "Deck, Bag, and Pool Building" の誤分割対応
  "Hand Management": "手札管理",
  "Multi-Use Cards": "多用途カード",

  // ダイス系
  "Dice Rolling": "ダイスロール",
  "Die Icon Resolution": "ダイスアイコン",
  "Push Your Luck": "プッシュユアラック",
  "Re-rolling and Locking": "振り直し",
  "Worker Placement with Dice Workers": "ダイスワーカー",

  // 協力・チーム系
  "Cooperative Game": "協力ゲーム",
  "Semi-Cooperative Game": "半協力",
  "Team-Based Game": "チーム戦",
  "Communication Limits": "コミュニケーション制限",

  // 正体隠蔽・推理系
  "Deduction": "推理",
  "Hidden Roles": "隠し役職",
  "Hidden Victory Points": "隠し得点",
  "Traitor Game": "裏切り者",
  "Roles with Asymmetric Information": "非対称情報役職",
  "Secret Unit Deployment": "秘密配置",

  // エンジン・構築系
  "Engine Building": "エンジン構築",
  "Tableau Building": "タブロー構築",
  "Pattern Building": "パターン構築",
  "Tech Trees / Tech Tracks": "テックツリー",

  // 収集・セット系
  "Set Collection": "セットコレクション",
  "Matching": "マッチング",

  // ワーカープレイスメント系
  "Worker Placement": "ワーカープレイスメント",
  "Worker Placement, Different Worker Types": "ワーカー種別",
  "Different Worker Types": "ワーカー種別",

  // タイル・ボード系
  "Tile Placement": "タイル配置",
  "Modular Board": "モジュラーボード",
  "Map Addition": "マップ追加",
  "Legacy Game": "レガシー",

  // 経済・交易系
  "Trading": "トレード",
  "Negotiation": "交渉",
  "Market": "マーケット",
  "Stock Holding": "株式",
  "Income": "収入",
  "Investment": "投資",
  "Contracts": "契約",
  "Pick-up and Deliver": "輸送",
  "Random Production": "ランダム生産",

  // レース・競争系
  "Race": "レース",
  "King of the Hill": "山の王",
  "Tug of War": "綱引き",
  "Player Elimination": "プレイヤー脱落",
  "Take That": "テイクザット",

  // リアルタイム・特殊
  "Real-Time": "リアルタイム",
  "Simultaneous Action Selection": "同時アクション",
  "Elapsed Real Time Ending": "時間制限",
  "Follow": "フォロー",

  // ナラティブ・ロールプレイ系
  "Narrative Choice / Paragraph": "ナラティブ",
  "Storytelling": "ストーリーテリング",
  "Role Playing": "ロールプレイ",
  "Acting": "演技",
  "Campaign / Battle Card Driven": "カード駆動キャンペーン",
  "Scenario / Mission / Campaign Game": "シナリオゲーム",
  "Events": "イベント",

  // パターン・パズル系
  "Pattern Recognition": "パターン認識",
  "Chaining": "チェイン",
  "Layering": "レイヤリング",

  // 記憶・情報系
  "Memory": "記憶",

  // ソロ・フォーマット
  "Solo / Solitaire Game": "ソロ",

  // アナログ
  "Paper-and-Pencil": "ペンシルゲーム",
  "Drawing": "お絵描き",
  "Flicking": "フリック",
  "Stacking and Balancing": "積み上げ",

  // トリック・カードゲーム系
  "Trick-taking": "トリックテイキング",
  "Ladder Climbing": "大富豪系",

  // ターン順系
  "Turn Order: Claim Action": "ターン順取り合い",
  "Turn Order: Progressive": "累進ターン順",
  "Turn Order: Role Order": "役職ターン順",
  "Turn Order: Stat-Based": "ステータスターン順",

  // フィジカル系
  "Physical Removal": "コンポーネント除去",
  "Slide / Push": "スライド＆押し出し",
  "Speed Matching": "スピードマッチング",

  // カード特殊操作
  "Melding and Splaying": "メルドスプレイ",
  "Line Drawing": "線引き",
  "Pieces as Map": "ピース配置マップ",
  "Multiple Maps": "複数マップ",
  "Score-and-Reset Game": "スコアリセット型",

  // 経済・ルール
  "Loans": "借金・ローン",
  "Lose a Turn": "1回休み",
  "Induction": "帰納的推理",
  "Sudden Death Ending": "サドンデス終了",
  "Singing": "歌唱",
  "Rock-Paper-Scissors": "じゃんけん",
  "Bingo": "ビンゴ",

  // その他
  "Variable Phase Order": "フェーズ変動",
  "Variable Set-up": "可変セットアップ",
  "End Game Bonuses": "終了ボーナス",
  "Hidden Victory Points ": "隠し得点",
  "I Cut, You Choose": "カット&チョーズ",
  "Rondel": "ロンデル",
  "Time Track": "タイムトラック",
  "Voting": "投票",
  "Victory Points as a Resource": "勝利点リソース化",
  "Simulation": "シミュレーション",
  "Player Judge": "プレイヤー判定",
}

/** BGGカテゴリ名を日本語に変換（未登録の場合は空文字を返して統計から除外） */
export function translateCategory(name: string): string {
  return categoryJa[name] ?? ""
}

/** BGGメカニクス名を日本語に変換（未登録の場合は空文字を返して統計から除外） */
export function translateMechanic(name: string): string {
  return mechanicJa[name] ?? ""
}

// メカニクスの説明文（日本語）
export const mechanicDescJa: Record<string, string> = {
  "Action Points": "手番ごとに決まったポイントを消費して行動を選ぶ。何をどれだけやるかを自分で配分できる。",
  "Action Queue": "アクションをあらかじめ登録しておき、順番に実行する。先読みと計画が重要。",
  "Action Retrieval": "使ったアクションを回収してから再使用できる。タイミングの管理が鍵。",
  "Action Drafting": "アクションをドラフト形式で選び取る。何を選ぶかで戦略が変わる。",
  "Area Majority / Influence": "盤面のエリアを占領・支配することを競う。陣地争いが中心。",
  "Area Control / Area Influence": "盤面のエリアを占領・支配することを競う。陣地争いが中心。",
  "Area Enclosure": "相手の駒やエリアを囲んで確保する。囲碁的な発想。",
  "Area Movement": "エリア間をユニットが移動する。戦略ゲームに多い。",
  "Auction / Bidding": "カードやリソースを競り落とす。いくら出すかの読み合いが面白い。",
  "Auction: Dutch": "価格が高いところから始まり、誰かが止めた時点で落札。早取りの緊張感がある。",
  "Auction: English": "値段を競り上げていく。最高額を出した人が落札。",
  "Auction: Sealed Bid": "全員が同時に入札額を出して公開する。相手の読みが重要。",
  "Betting and Bluffing": "賭けやハッタリで相手を騙したり、読み合いを楽しむ。",
  "Campaign / Battle Card Driven": "カードを使って戦闘や行動を決めるキャンペーン型ゲーム。",
  "Card Drafting": "複数のカードから好きなものを選び、残りを次の人に回す。選択と読みのゲーム。",
  "Closed Drafting": "手札を見せずに選んでいくドラフト。相手が何を取ったかを推理する。",
  "Communication Limits": "チームメンバーと話せる内容や量が制限される。言葉以外で伝える工夫が必要。",
  "Cooperative Game": "全プレイヤーが協力して共通の目標を目指す。全員で勝つか負けるか。",
  "Deck, Bag, and Pool Building": "ゲーム中にカードや駒を集めてデッキを強化していく。成長感が楽しい。",
  "Deck Construction": "ゲーム中にカードや駒を集めてデッキを強化していく。成長感が楽しい。",
  "Deduction": "手がかりを集めて答えを論理的に導き出す。推理・謎解き系に多い。",
  "Dice Rolling": "サイコロを振って結果に従う。運の要素が絡む。",
  "Die Icon Resolution": "サイコロの目がアイコンで表され、それに対応したアクションを行う。",
  "Drafting": "複数の選択肢から選んで残りを次の人に渡す、選択系メカニクス。",
  "Drawing": "絵を描いてお題を当ててもらう。絵心よりもユーモアが光る。",
  "Elapsed Real Time Ending": "実際の時間が終わったらゲームが終わる。リアルタイムの焦りが緊張感に。",
  "Enclosure": "コマや区画を囲って得点や支配を確立する。",
  "End Game Bonuses": "ゲーム終了時に条件を満たすと追加得点が入る。終盤の逆転要素になることも。",
  "Engine Building": "序盤に仕組みを作り、後半に効率的に得点を稼ぐ。コンボが爽快。",
  "Flicking": "指でコマを弾く物理アクション。器用さが問われる。",
  "Follow": "ある人がアクションを選ぶと、他のプレイヤーも同じアクションをできる。",
  "Grid Coverage": "グリッド上にタイルやコマを置いて面積を埋めていく。",
  "Grid Movement": "升目状のボード上をコマが移動する。チェスや将棋に近い動き方。",
  "Hand Management": "手札の使うタイミングや順番を管理する。温存か即使いかの判断が重要。",
  "Hex-and-Counter": "六角形のマスにユニットを置いて戦う、ウォーゲーム定番のスタイル。",
  "Hexagon Grid": "六角形グリッドを使ったゲーム。移動や射程の計算に特徴がある。",
  "Hidden Movement": "一部のプレイヤーの位置や行動が他から見えない。追いかけっこや鬼ごっこ的な緊張感。",
  "Hidden Roles": "自分の役職を他プレイヤーに隠す。人狼や正体隠蔽ゲームの核心。",
  "Hidden Victory Points": "得点が終了まで公開されない。誰が勝っているか分からないドキドキ感。",
  "I Cut, You Choose": "1人が分け、もう1人が先に選ぶ。公平な分配を生む古典的な方法。",
  "Income": "ラウンドごとにリソースや資金が定期的に入る仕組み。",
  "Ladder Climbing": "場に出ている組み合わせより強い組み合わせを出す、大富豪スタイルのトリック系。",
  "Legacy Game": "ゲームプレイのたびにボードやカードに変化が残る。一度きりの体験。",
  "Matching": "同じ種類のカードや絵柄を合わせる。神経衰弱やセット集め。",
  "Memory": "一度見た情報を覚えておいて活用する。記憶力が試される。",
  "Modular Board": "ボードがパーツに分かれており、毎回異なるマップを作れる。リプレイ性が高い。",
  "Movement Points": "移動できる距離や回数がポイントで管理される。効率的なルート選びが重要。",
  "Multi-Use Cards": "1枚のカードを複数の用途に使い分けられる。選択の幅が広い。",
  "Narrative Choice / Paragraph": "物語の分岐を選んで進める。ゲームブックやアドベンチャー系に多い。",
  "Negotiation": "プレイヤー間で交渉してリソースや行動を決める。説得力が重要。",
  "Network and Route Building": "道や路線をつないでネットワークを構築する。鉄道ゲームの定番。",
  "Once-Per-Game Abilities": "1回だけ使える強力な特殊能力。使いどころが勝負を分ける。",
  "Open Drafting": "全員に見える選択肢から選ぶドラフト。相手の動きを見ながら戦略を立てられる。",
  "Paper-and-Pencil": "紙と鉛筆で記録や図を描きながら遊ぶ。書き込み式ゲーム。",
  "Pattern Building": "特定の形やパターンを作ることを目指す。テトリス的な発想。",
  "Pattern Recognition": "パターンを見つけることが得点や行動のトリガーになる。",
  "Pick-up and Deliver": "何かを拾って別の場所へ届ける。輸送・物流系ゲームの基本。",
  "Player Elimination": "負けたプレイヤーがゲームから抜けていく。バトルロワイヤル的な展開。",
  "Point to Point Movement": "指定されたポイント間をコマが移動する。路線図や地図ゲームに多い。",
  "Programmed / Scripted Movement": "移動をあらかじめ宣言・プログラムしてから実行する。予測と裏切りが楽しい。",
  "Push Your Luck": "リスクを取ってさらに行動するか、安全に止まるかを選ぶ。欲張りとの戦い。",
  "Real-Time": "リアルタイムで同時進行するゲーム。焦りと判断の速さが問われる。",
  "Re-rolling and Locking": "サイコロの一部をキープして残りを振り直す。ヤッツィーの仕組み。",
  "Roll / Spin and Move": "サイコロを振って出た目の分だけコマを進める。すごろく式移動。",
  "Rondel": "円形のトラックを使って行動を選ぶ。どの行動を取るか、コストも変わる。",
  "Scenario / Mission / Campaign Game": "シナリオやミッションをこなしていくキャンペーン型ゲーム。",
  "Semi-Cooperative Game": "基本は協力しつつ、条件によって裏切りや個人勝利もありうる。",
  "Set Collection": "同じ種類や条件のカード・タイルを集めて得点を狙う。コレクション欲を刺激。",
  "Simultaneous Action Selection": "全員が同時に行動を選んで一斉に公開する。読み合いと予測が楽しい。",
  "Solo / Solitaire Game": "1人でプレイできる、またはソロ専用のゲーム。",
  "Stacking and Balancing": "物を積み上げてバランスを保つ物理系アクション。",
  "Stock Holding": "株を持ち、価値が上がったら売って利益を得る。投資・投機シミュレーション。",
  "Storytelling": "プレイヤーが物語を語りながら進める。想像力と表現力が活きる。",
  "Tableau Building": "自分の前にカードを並べ、その効果を組み合わせて強化していく。",
  "Take That": "他のプレイヤーを直接妨害できる。攻撃性が高く、盛り上がりやすい。",
  "Team-Based Game": "チームに分かれて対戦する。協力と連携が重要。",
  "Tech Trees / Tech Tracks": "技術ツリーを進めることで能力が強化される。発展の達成感がある。",
  "Tile Placement": "タイルを並べてマップや模様を作る。パズル的な要素が強い。",
  "Time Track": "アクションをするたびに時間が進み、最も時間が戻ったプレイヤーが次の手番になる。",
  "Trading": "プレイヤー間でリソースやカードを交換する。交渉と駆け引きが生まれる。",
  "Traitor Game": "プレイヤーの中に裏切り者が潜んでいる。誰が敵か分からない心理戦。",
  "Trick-taking": "手札からカードを出して「トリック」を取り合う。ブリッジやナポレオンのスタイル。",
  "Variable Phase Order": "ラウンドのフェーズ順序がプレイヤーの選択や条件で変わる。",
  "Variable Player Powers": "プレイヤーごとに異なる特殊能力を持つ。非対称な強みを活かす戦略。",
  "Variable Set-up": "毎回ゲームの初期配置が変わる。同じゲームでも毎回新鮮。",
  "Voting": "全員の投票で物事を決める。多数決や交渉が生まれる。",
  "Worker Placement": "ワーカー（駒）をボード上の場所に置いてアクションを実行する。資源と行動の管理が肝。",
  "Worker Placement with Dice Workers": "ダイスの目がワーカーの能力を決めるワーカープレイスメント。",
  "Worker Placement, Different Worker Types": "能力の違うワーカーを使い分けるワーカープレイスメント。",
  "Zone of Control": "ユニットの周囲が影響範囲となり、敵の移動を制限できる。",
}

/** メカニクスの日本語説明文を取得する */
export function getMechanicDesc(name: string): string | undefined {
  return mechanicDescJa[name]
}
