# BoardLog

## プロジェクト概要

ボードゲームのプレイ体験を記録し、「思い出アルバム」のように振り返れるWebアプリ。
箱画像を中心としたビジュアルで履歴を表示する。

## コンセプト

**ボードゲームの思い出アルバム + 自分のボドゲ棚**

既存サービス（BGG, BG Stats）がデータ管理寄りなのに対し、
本サービスは「プレイ体験のアルバム化」にフォーカスする。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| UI | React 19 + Tailwind CSS v4 |
| 認証 | NextAuth.js (Auth.js v5) |
| DB | Supabase (PostgreSQL) |
| ORM | Prisma |
| 外部API | BoardGameGeek XML API2 |

## ディレクトリ構成

```
src/
├── app/                  # App Router ページ・レイアウト
│   ├── api/              # API Routes
│   ├── (auth)/           # 認証関連ページ
│   ├── search/           # ゲーム検索
│   ├── plays/            # プレイ履歴・詳細
│   └── record/           # プレイ記録
├── components/           # 共通UIコンポーネント
├── lib/                  # ユーティリティ・外部API連携
│   ├── bgg/              # BGG APIクライアント
│   ├── prisma/           # Prismaクライアント
│   └── auth/             # 認証設定
└── types/                # 型定義
```

## データモデル

- **User** : id, name, email, image
- **Game** : id (BGG ID), name, imageUrl (BGGからキャッシュ)
- **PlayRecord** : id, userId, gameId, playedAt, rating (1-5), memo

## MVP スコープ

### 実装する機能
1. ゲーム検索（BGG API経由）
2. プレイ記録（日付・評価・メモ）
3. プレイ履歴一覧（箱画像グリッド）
4. プレイ詳細表示

### 実装しない機能（Phase2以降）
- ボドゲ棚・プロフィール公開
- SNS共有
- フレンド・コメント
- 統計機能

## 開発フェーズ

### Phase 1: 基盤構築
- Supabase セットアップ
- Prisma スキーマ定義・マイグレーション
- NextAuth.js 認証設定
- 共通レイアウト・ナビゲーション

### Phase 2: BGG API 連携
- BGG XML API2 クライアント実装
- ゲーム検索 API Route
- ゲームデータキャッシュ

### Phase 3: コア機能
- ゲーム検索UI
- プレイ記録フォーム
- プレイ履歴グリッド表示
- プレイ詳細ページ

### Phase 4: 仕上げ
- レスポンシブ対応
- 画像最適化・LazyLoad
- エラーハンドリング
- デプロイ

## コマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # プロダクションビルド
npm run start  # プロダクション起動
npm run lint   # ESLint 実行
```

## コーディング規約

- コンポーネントは関数コンポーネント + TypeScript
- パスエイリアス `@/*` → `src/*`
- Server Components をデフォルトとし、必要な場合のみ `"use client"` を使用
- 日本語コメント可

## Git コミットルール

- 作業が一つの意味のある単位として完結したタイミングでコミットする
- コミットの粒度の目安:
  - 新しいライブラリの導入・設定 → 1コミット
  - 1つの機能（ページ・API Route・コンポーネント）の追加 → 1コミット
  - スキーマ変更・マイグレーション → 1コミット
  - バグ修正 → 1コミット
  - リファクタリング → 1コミット
- 複数の無関係な変更を1コミットに混ぜない
- コミットメッセージは英語で、以下のプレフィックスを使用:
  - `feat:` 新機能
  - `fix:` バグ修正
  - `refactor:` リファクタリング
  - `chore:` 設定・依存関係など
  - `docs:` ドキュメント
  - `style:` スタイル変更
- コミット前に `npm run build` が通ることを確認する
