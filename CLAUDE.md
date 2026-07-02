# NNC（Naitei Nai Club）実装プロンプト — Claude Code用

## プロジェクト概要

NNC（Naitei Nai Club）は「内定ない」を誇れる逆インセンティブ型就活SNSアプリ。
就活を始めない方が強い世界観で、サボり投稿・チキンレース・汚染度システムなどのゲーム要素と、カレンダー・企業リンク帳などの実用ツールを組み合わせたアプリ。

## 指示

このプロジェクトの実装を段階的に進めてほしい。
設計ドキュメントは以下の3ファイルにまとまっている：

- `docs/SPEC.md` — 要求・要件・機能定義・データモデル・技術スタック（v13.0）
- `docs/screen_design.md` — 画面設計・ナビゲーション構成・コンポーネント構成・API定義・カラーパレット（v4.0）
- `docs/動作確認手順.md` — ローカル環境での起動・テスト手順

**まず上記ファイルを熟読してから作業を開始すること。**

## 技術スタック（確定済み）

- **フロントエンド（MVP）：** React Native + Expo（TypeScript）
- **バックエンド：** FastAPI（Python）
- **DB：** PostgreSQL
- **キャッシュ：** Redis
- **状態管理：** Zustand
- **ナビゲーション：** React Navigation
- **プッシュ通知：** Expo Notifications
- **認証：** メールアドレス + パスワード（ドメイン制限なし）
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
│   ├── SPEC.md
│   ├── screen_design.md
│   └── 動作確認手順.md
├── CLAUDE.md
└── README.md
```

## 画面一覧（全11画面）

| 画面ID | 画面名 | 所属 |
|---|---|---|
| P-01 | トップ／ランディング | AuthStack |
| P-02 | 入会画面 | AuthStack |
| P-03 | ホーム（タイムライン） | BottomTab 1「ホーム」 |
| P-04 | 記録＆投稿（モーダル） | BottomTab 3「記録」（FAB） |
| P-05 | プロフィール（クラブ手帳） | BottomTab 5「手帳」 |
| P-06 | チキンレース | BottomTab 2「レース」→ TopTab（ランキング / シーズンイベント） |
| P-07 | 他メンバー手帳 | Stack（P-03・P-06からの遷移先） |
| P-08 | 設定 | Stack（P-05から遷移） |
| P-10a | カレンダー | BottomTab 4「ツール」→ TopTab 1 |
| P-10b | 企業リンク帳 | BottomTab 4「ツール」→ TopTab 2 |
| P-11 | リマインダー詳細 | Stack（P-10aから遷移） |

## 実装順序

### フェーズ1：基盤構築
1. Expo + TypeScript プロジェクト初期化（`apps/mobile/`）
2. FastAPI プロジェクト初期化（`backend/`）
3. PostgreSQL データモデル定義（Alembic マイグレーション）
   - `character_stage` は8段階: `pure`, `whisper`, `ghost`, `slave`, `zombie`, `machine`, `dog`, `banned`
   - `reaction_type` は `wakaru` のみ
   - `Comments` テーブルを新設（`is_template` フラグでテンプレコメントを区別）
   - `Seasons` テーブルに `theme` カラムを追加（月間ミニシーズン対応）
   - `ContaminationLogs` テーブルに `source` カラムを追加（申告経路 A/B/C の区別）
4. 共通定数・カラーパレット・型定義
5. React Navigation セットアップ
   - AuthStack: P-01, P-02
   - MainStack > BottomTab: ホーム / レース / 記録 / ツール / 手帳
   - P-06 内に TopTab: ランキング / シーズンイベント
   - P-10 内に TopTab: カレンダー / 企業リンク帳
   - Stack: P-07, P-08, P-11, EditProfileModal
6. Zustand ストア基本構成

### フェーズ2：認証（F-01）
1. バックエンド：認証API（signup, login, verify-email）
2. メール認証ロジック（ドメイン制限なし・確認メール送信）
3. フロント：P-01（トップ画面）、P-02（入会画面）
4. 認証状態管理（AsyncStorage + Zustand）

### フェーズ3：コアSNS機能（F-02）
1. バックエンド：投稿CRUD API
2. バックエンド：リアクションAPI（「わかる」の1種のみ）
3. バックエンド：コメントAPI（フリーテキスト + テンプレコメント5種）
   - テンプレ：「ご愁傷様です」「まだ間に合う」「帰ってこい」「同志よ…」「最高のサボりだ」
4. フロント：P-03（ホーム・タイムライン）
   - PostCard内のUserAvatar / UserNameタップ → P-07（他メンバー手帳）への遷移
   - ReactionButton（「わかる」1種）
   - TemplateCommentBar（テンプレコメント横スクロール）
   - CommentSection（フリーテキストコメント）
5. フロント：P-04（記録＆投稿モーダル）
   - 2タブ構成：通常投稿 / 汚染申告（旧3タブからデイリー報告を統合）
   - 通常投稿タブ内にデイリーフォーマットのトグル（オプション・1日1回制限）
   - 汚染申告タブにPostToggle「タイムラインにも投稿する」（OFF=記録のみ）
6. 無限スクロール
7. フロント：P-07（他メンバー手帳・読み取り専用プロフィール）

### フェーズ4：ゲーム機能（F-03, F-04, F-05）
1. バックエンド：No-ES Streak 自動計算（シーズン非連動・汚染申告時にリセット）
2. バックエンド：汚染度システム・キャラ進化ロジック（8段階）
   - 申告経路A（手動・記録のみ）：投稿を作らずContaminationLogsにのみ記録
   - 申告経路B（リマインダー完了）：完了ボタン押下時のみ加算
   - 申告経路C（投稿時選択）：投稿と同時に加算
3. バックエンド：チキンレース（月間ミニシーズン制・テーマ・脱落・訃報）
   - Seasonsテーブルのthemeでシーズンテーマを管理
   - シーズンイベント（開幕速報・中間報告・カウントダウン・終了速報）
4. WebSocket：脱落速報・生存者数リアルタイム更新
5. フロント：P-06（チキンレース画面）
   - TopTab: ランキングタブ（生存者/脱落者/賭け市場の切替）+ シーズンイベントタブ
   - SurvivorItem内のアバター/ニックネームタップ → P-07へ遷移
6. フロント：P-05（プロフィール・クラブ手帳）
   - CharacterStageTable（全8段階一覧・現在位置ハイライト）
   - LevelBadge（「Lv.X / 8」表記）
   - CharacterDescription（キャラ説明文）
   - EditNicknameButton → EditProfileModal（ニックネーム変更）

### フェーズ5：実用ツール（F-14, F-15）
1. バックエンド：カレンダーイベントCRUD API
2. バックエンド：企業リンク帳CRUD API
3. フロント：P-10（ツールハブ + 上部タブ）
4. フロント：P-10a（カレンダータブ）
5. フロント：P-10b（企業リンク帳タブ）
   - SecurityNote（パスワード警告）は表示しない。入力フィールド自体が存在しない設計
6. フロント：P-11（リマインダー詳細）
7. プッシュ通知連携（Expo Notifications）

### フェーズ6：設定・仕上げ
1. フロント：P-08（設定画面）
2. 脱退・追放フロー
3. エラーハンドリング・ローディング状態・空状態の統一

## コーディング規約

- TypeScript strict mode を有効にする
- コンポーネントは関数コンポーネント + hooks で統一
- APIレスポンスの型は `types/` に集約
- NNCクラブ語彙を使う（ユーザー→メンバー、ログイン→クラブに入る、等。詳細はSPEC.mdのセクション0を参照）
- カラーは `constants/colors.ts` に集約し直接ハードコードしない
- 日本語UIテキストは将来のi18n対応を考慮し `constants/strings.ts` に集約

## 注意事項

- 企業リンク帳にIDとパスワードは絶対に保存しない（入力フィールド自体を作らない）
- 汚染ポイントの加算はリマインダーの「完了」ボタン押下時のみ（登録・通知受信だけでは加算しない）
- 汚染申告の経路Aは「記録のみ」で投稿を伴わない。ContaminationLogsにのみ記録する
- 認証はメールアドレス＋パスワードのみ（大学メール認証は廃止済み・ドメイン制限なし）
- 全メンバーが全機能に平等にアクセスできる（機能制限なし）
- WebSocketは脱落通知・生存者数更新に使用
- リアクションは「わかる」の1種のみ。旧3種（わかる・尊い・草）は廃止
- デイリー投稿フォーマットは独立機能ではなく、通常投稿内のオプショナルなトグル
- キャラ進化は8段階（7段階+出禁）。各ステージにLv表記と説明文を併記
- チキンレースは月間ミニシーズン制（毎月1日〜末日）。テーマは月ごとに設定
- ボトムタブのTab 4は「ツール」（旧「イベント」から変更）

## 開始方法

まず `docs/SPEC.md` と `docs/screen_design.md` を読み、内容を理解した上で、フェーズ1の基盤構築から始めてください。各フェーズの完了時に何を実装したか報告してください。