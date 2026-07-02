# NNC（Naitei Nai Club）実装プロンプト — Claude Code用

## プロジェクト概要

NNC（Naitei Nai Club）は「内定ない」を誇れる逆インセンティブ型就活SNSアプリ。
就活を始めない方が強い世界観で、サボり投稿・チキンレース・汚染度システムなどのゲーム要素と、カレンダー・企業リンク帳などの実用ツールを組み合わせたアプリ。

## 指示

このプロジェクトの実装を段階的に進めてほしい。
設計ドキュメントは以下の2ファイルにまとまっている：

- `docs/02_SPEC.md` — 要求・要件・機能定義・データモデル・技術スタック
- `docs/02_screen_design.md` — 画面設計・ナビゲーション構成・コンポーネント構成・API定義・カラーパレット

**まず上記2ファイルを熟読してから作業を開始すること。**

## 技術スタック（確定済み）

- **フロントエンド（MVP）：** React Native + Expo（TypeScript）
- **バックエンド：** FastAPI（Python）
- **DB：** PostgreSQL
- **キャッシュ：** Redis
- **状態管理：** Zustand
- **ナビゲーション：** React Navigation
- **プッシュ通知：** Expo Notifications
- **認証：** メール認証 + OAuth（Google/Apple）
- **インフラ：** Railway（バックエンド）、EAS Build（モバイルビルド）
- **ストレージ：** Cloudflare R2（画像）
- **メール送信：** Resend

## リポジトリ構成

以下のモノレポ構成で作成すること：

```
ValueCreate/
├── apps/
│   └── mobile/          # React Native + Expo アプリ
│       ├── app/         # Expo Router or React Navigation
│       ├── components/  # UIコンポーネント
│       ├── hooks/       # カスタムフック
│       ├── stores/      # Zustand ストア
│       ├── services/    # API通信
│       ├── types/       # TypeScript型定義
│       ├── constants/   # カラーパレット・定数
│       ├── utils/       # ユーティリティ
│       └── assets/      # 画像・フォント
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/         # ルーター（posts, auth, users, etc.）
│   │   ├── models/      # SQLAlchemyモデル
│   │   ├── schemas/     # Pydanticスキーマ
│   │   ├── services/    # ビジネスロジック
│   │   ├── core/        # 設定・認証・DB接続
│   │   └── websocket/   # WebSocketハンドラ
│   ├── alembic/         # DBマイグレーション
│   ├── requirements.txt
│   └── Dockerfile
├── docs/
│   ├── 02_SPEC.md
│   └── 02_screen_design.md
├── CLAUDE.md
└── README.md
```

## 実装順序

### フェーズ1：基盤構築
1. Expo + TypeScript プロジェクト初期化（`apps/mobile/`）
2. FastAPI プロジェクト初期化（`backend/`）
3. PostgreSQL データモデル定義（Alembic マイグレーション）
4. 共通定数・カラーパレット・型定義
5. React Navigation セットアップ（AuthStack / MainStack / BottomTab / TopTab）
6. Zustand ストア基本構成

### フェーズ2：認証（F-01）
1. バックエンド：認証API（signup, login, verify-email, upgrade）
2. 大学メール（.ac.jp）検証ロジック
3. フロント：P-01（トップ画面）、P-02（入会画面）
4. 認証状態管理（AsyncStorage + Zustand）

### フェーズ3：コアSNS機能（F-02）
1. バックエンド：投稿CRUD API、リアクションAPI
2. フロント：P-03（ホーム・タイムライン）
3. フロント：P-04（記録＆投稿モーダル）
4. 無限スクロール・リアクション・投稿制限ロジック

### フェーズ4：ゲーム機能（F-03, F-04, F-05）
1. バックエンド：No-ES Streak 自動計算
2. バックエンド：汚染度システム・キャラ進化ロジック
3. バックエンド：チキンレース（シーズン・脱落・訃報）
4. WebSocket：脱落速報・生存者数リアルタイム更新
5. フロント：P-06（チキンレース画面）
6. フロント：P-05（プロフィール・クラブ手帳）

### フェーズ5：実用ツール（F-14, F-15）
1. バックエンド：カレンダーイベントCRUD API
2. バックエンド：企業リンク帳CRUD API
3. フロント：P-10（各種イベントハブ + 上部タブ）
4. フロント：P-10a（カレンダータブ）
5. フロント：P-10b（企業リンク帳タブ）
6. フロント：P-11（リマインダー詳細）
7. プッシュ通知連携（Expo Notifications）

### フェーズ6：設定・仕上げ
1. フロント：P-08（設定画面）
2. 認証アップグレードフロー（normal → university）
3. 脱退・追放フロー
4. エラーハンドリング・ローディング状態・空状態の統一

## コーディング規約

- TypeScript strict mode を有効にする
- コンポーネントは関数コンポーネント + hooks で統一
- APIレスポンスの型は `types/` に集約
- NNCクラブ語彙を使う（ユーザー→メンバー、ログイン→クラブに入る、等。詳細は02_SPEC.mdのセクション0を参照）
- カラーは `constants/colors.ts` に集約し直接ハードコードしない
- 日本語UIテキストは将来のi18n対応を考慮し `constants/strings.ts` に集約

## 注意事項

- 企業リンク帳にIDとパスワードは絶対に保存しない
- 汚染ポイントの加算はリマインダーの「完了」ボタン押下時のみ（登録・通知受信だけでは加算しない）
- 🕵️怪しいやつ（normalメンバー）の機能制限を必ず実装する（投稿1日3回、リアクション「草」のみ、チキンレース観戦のみ、等）
- WebSocketは脱落通知・生存者数更新に使用

## 開始方法

まず `docs/02_SPEC.md` と `docs/02_screen_design.md` を読み、内容を理解した上で、フェーズ1の基盤構築から始めてください。各フェーズの完了時に何を実装したか報告してください。