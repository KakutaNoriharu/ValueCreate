# NNC — 画面設計書（screen_design.md）

> React Native（Expo）実装向け画面設計。全11画面。
> v4.0 — プロトタイプフィードバック反映（リアクション簡素化・月間シーズン制・キャラ8段階化・他メンバー手帳追加・タブ名変更）

---

## ナビゲーション構成

```
RootNavigator
├─ AuthStack（未認証）
│   ├─ P-01 TopScreen（トップ／ランディング）
│   └─ P-02 SignUpScreen（入会画面）
│
└─ MainStack（認証済み）
    ├─ BottomTabNavigator
    │   ├─ Tab 1: HomeScreen（P-03 ホーム・タイムライン）
    │   ├─ Tab 2: ChickenRaceScreen（P-06 チキンレース）
    │   │         └─ TopTabNavigator
    │   │             ├─ RankingTab（ランキング）
    │   │             └─ SeasonEventTab（シーズンイベント）
    │   ├─ Tab 3: PostButton（P-04 記録＆投稿・モーダル）
    │   ├─ Tab 4: ToolsHubScreen（P-10 ツール）
    │   │         └─ TopTabNavigator
    │   │             ├─ CalendarTab（カレンダー）
    │   │             └─ CompanyLinksTab（P-10b 企業リンク帳）
    │   └─ Tab 5: ProfileScreen（P-05 クラブ手帳）
    │
    └─ StackNavigator（タブ外・モーダル）
        ├─ OtherUserProfileScreen（P-07 他メンバー手帳）
        ├─ ReminderDetailScreen（P-11 リマインダー詳細）
        ├─ SettingsScreen（P-08 設定）
        └─ EditProfileModal
```

### 設計判断メモ

**カレンダー・企業リンク帳の配置：上部タブ（TopTab）を採用**

| 案 | メリット | デメリット |
|---|---|---|
| A. 上部タブ（採用） | 1タップで切替可能・就活シーズン中の高頻度利用に最適・タブ追加で拡張容易 | ツールタブが多機能になりすぎるリスク |
| B. ハンバーガーメニュー | 画面がすっきりする・設定系と一括管理 | 2タップ必要・実用ツールが埋もれる・「ふざけてるし使えない」評価のリスク |

就活シーズン中のカレンダー・企業リンク帳は毎日使う実用ツール。ハンバーガーに隠すとNotionやGoogleカレンダーに負ける。「ツール」タブをハブにして上部タブで切り替える方が、発見性・操作性ともに優れる。将来的にタブを追加（例：面接メモ、OB訪問記録）する際も上部タブなら自然に拡張できる。

**チキンレース画面への上部タブ追加**

シーズンイベント（開幕速報・中間報告・カウントダウン等）をレースタブ内に配置する。レースの文脈でイベントを見る方がユーザーの動線として自然。ツールタブ（旧イベントタブ）は実用ツール専用のハブとして機能を分離する。

---

## ボトムタブ構成

| 順番 | アイコン | 画面 | ラベル |
|---|---|---|---|
| 1 | ti-home | HomeScreen | ホーム |
| 2 | ti-trophy | ChickenRaceScreen | レース |
| 3 | （丸い+ボタン） | PostModal | 記録 |
| 4 | ti-tool | ToolsHubScreen | ツール |
| 5 | ti-user | ProfileScreen | 手帳 |

### タブデザイン補足
- Tab 3（記録＆投稿）は他のタブより一回り大きい丸ボタン（FAB風）で中央に配置
- 未読リマインダーがある場合、Tab 4（ツール）にバッジドットを表示
- Tab 5（手帳）にはキャラアイコンのミニアバターを使用してもよい

---

## P-01｜トップ／ランディング

**役割：** 未ログインの人が最初に見る画面。世界観を一発で伝え入会を促す。

### 主要コンポーネント
```
TopScreen
├─ Header（NNCロゴ）
├─ HeroSection
│   ├─ アイコン（⚰️）
│   ├─ キャッチコピー「内定ないクラブへようこそ」
│   ├─ サブコピー「内定取れば即サービス出禁」
│   ├─ SurvivorCounter（生存者数リアルタイム表示）
│   └─ PrimaryButton「クラブに入会する」→ P-02
├─ RulesSection（クラブの掟3箇条）
│   ├─ 1. 就活を始めた者は即時追放
│   ├─ 2. 内定を取った者は永久追放
│   └─ 3. 最後まで残った者が優勝
├─ LatestObituaryFeed（最新の訃報フィード・未ログインでも閲覧可）
└─ SignUpFooter
    ├─ PrimaryButton「入会する」→ P-02
    └─ TextLink「すでにメンバーの方はこちら →」→ ログイン画面
```

### データ
- `GET /api/stats/survivors`：生存者数・今日の脱落者数（WebSocketで更新）
- `GET /api/obituaries/recent`：最新訃報5件

---

## P-02｜入会画面

**役割：** メールアドレスでアカウントを作成する。

### 主要コンポーネント
```
SignUpScreen
├─ Header（戻るボタン・「入会手続き」）
├─ SignUpForm
│   ├─ nickname（必須・1〜50文字）
│   ├─ email（必須・メールアドレス形式）
│   ├─ password（必須・8文字以上）
│   ├─ password_confirm（必須・一致確認）
│   ├─ university（任意）
│   ├─ faculty（任意）
│   └─ grade（任意・select: 学部1年/学部2年/学部3年/学部4年/修士1年/修士2年）
├─ InfoBanner（認証メールの説明）
├─ AgreementCheckbox（クラブ規約・プライバシーポリシー同意）
└─ SubmitButton「確認メールを送信する」
```

### バリデーション
- nickname：1〜50文字
- email：一般的なメールアドレス形式（ドメイン不問）
- password：8文字以上
- password_confirm：passwordと一致
- checkbox：チェック必須

### API
- `POST /api/auth/signup`
- body: `{ nickname, email, password, university?, faculty?, grade? }`

---

## P-03｜ホーム（タイムライン）

**役割：** 入会後に毎日開くメイン画面。投稿フィード・訃報速報・サボり状況を表示。

### 主要コンポーネント
```
HomeScreen
├─ Header
│   ├─ NNCロゴ
│   ├─ NotificationBell（未読バッジつき）
│   └─ UserAvatar → ProfileScreen
├─ TabBar（全体 / フォロー中）
├─ SurvivorBanner（生存者数・今日の脱落者数・常時表示）
├─ ObituaryBanner（速報・誰かが脱落したときのみ表示）
├─ QuickPostBar（簡易投稿入力 → P-04モーダルを開く）
├─ PostFeed（無限スクロール）
│   └─ PostCard × n
│       ├─ UserAvatar（キャラアイコン）→ タップで P-07（他メンバー手帳）へ遷移
│       ├─ UserName + CharacterBadge + LevelBadge + Timestamp → タップで P-07 へ遷移
│       ├─ ContaminationBanner（汚染度35pt以上のみ表示）
│       ├─ PostContent（テキスト・画像）
│       ├─ ReactionButton（「わかる」ボタン・カウント表示）
│       ├─ TemplateCommentBar（テンプレコメント選択肢・横スクロール）
│       │   └─ 「ご愁傷様です」「まだ間に合う」「帰ってこい」「同志よ…」「最高のサボりだ」
│       ├─ CommentSection（コメント一覧・フリーテキスト入力）
│       └─ ObituaryCard（脱落報告投稿の場合・特殊レイアウト）
└─ BottomTabBar
```

### PostCardの状態分岐
```
汚染度 0〜14pt  → 通常表示
汚染度 15〜34pt → 「⚠️汚染注意」バッジ表示
汚染度 35pt〜   → 背景薄オレンジ・「🚨就活汚染注意🚨」バナー
脱落報告投稿    → 訃報カードレイアウト（灰色背景・取り消し線）
```

### 他メンバープロフィールへの遷移
- PostCard内のUserAvatarまたはUserNameをタップ → P-07（他メンバー手帳）へStack遷移
- 自分のPostCardの場合は → P-05（自分のクラブ手帳）へ遷移

### API
- `GET /api/posts/feed?tab={all|following}&cursor={cursor}`
- `POST /api/posts/{post_id}/reactions`（リアクション）
- `POST /api/posts/{post_id}/comments`（コメント・テンプレコメント）
- WebSocket：`ws://api/ws/obituaries`（脱落速報）

---

## P-04｜記録＆投稿

**役割：** サボり投稿・汚染申告の2モードを持つ投稿作成モーダル。ボトムタブ中央の丸ボタンから起動。

### 表示方式
- モーダル（BottomSheetまたはFullScreenModal）

### 主要コンポーネント
```
PostCreateModal
├─ Header（閉じるボタン・「記録＆投稿」・送信ボタン）
├─ TabBar（通常投稿 / 汚染申告）
├─ UserInfo（アバター・ニックネーム・キャラ・Streak日数）
│
├─ 【通常投稿タブ】
│   ├─ TextInput（最大140文字・残り文字数カウンター）
│   ├─ DailyFormatToggle「📋 デイリーフォーマットを使う」（トグル・1日1回のみ）
│   ├─ DailyFormatSection（トグルON時のみ表示）
│   │   ├─ skip_input（スキップした就活行動）
│   │   ├─ instead_input（代わりにやったこと）
│   │   └─ comment_input（一言）
│   ├─ ActivitySelector「今日は就活しましたか？」
│   │   ├─ Button「してない（セーフ）」
│   │   └─ Button「した（汚染申告）」→ 汚染申告タブに切り替え
│   └─ ToolBar
│       ├─ ImagePicker（画像添付）
│       └─ ScopeSelector（公開範囲）
│
└─ 【汚染申告タブ】
    ├─ ContaminationForm
    │   ├─ ActionTypeSelector（ES提出 / 説明会 / インターン等）
    │   ├─ CompanySelector（企業リンク帳から選択・任意）
    │   ├─ PostToggle「タイムラインにも投稿する」（デフォルトON・OFFで記録のみ）
    │   ├─ TextInput（PostToggle ON時のみ表示・最大140文字）
    │   └─ ConfirmButton「申告して汚染される（+Xpt）」
    └─ RecordOnlyNote（PostToggle OFF時に表示）
        └─ 「記録のみ。タイムラインには投稿されません」
```

### 設計判断メモ
- **デイリーフォーマット統合：** 旧3タブ（通常投稿/デイリー報告/汚染申告）を2タブ（通常投稿/汚染申告）に簡素化。デイリーフォーマットは通常投稿内のオプショナルなテンプレートとして提供。
- **記録のみオプション：** 汚染申告タブで「タイムラインにも投稿する」をOFFにすると、ContaminationLogsにのみ記録される。タイムラインに流したくないメンバー向け。

### API
- `POST /api/posts`（通常投稿・デイリー投稿）
- `POST /api/contamination/report`（汚染申告・PostToggle ON時は投稿も同時作成）

---

## P-05｜プロフィール（クラブ手帳）

**役割：** 自分のキャラ・汚染度・Streak・勲章・チキンレース状況を確認する。設定・プロフィール編集への導線もここ。

### 主要コンポーネント
```
ProfileScreen
├─ Header（「クラブ手帳」・⚙️設定ボタン → P-08）
├─ ProfileHeader（黒背景）
│   ├─ CharacterAvatar（キャラアイコン・大）
│   ├─ Nickname
│   ├─ EditNicknameButton（✏️ニックネーム変更 → EditProfileModal）
│   ├─ UniversityInfo（設定で入力している場合のみ）
│   ├─ CharacterInfo
│   │   ├─ CharacterName（例：「ガクチカゾンビ」）
│   │   ├─ LevelBadge（例：「Lv.5 / 8」）
│   │   └─ CharacterDescription（例：「ガクチカを語り始めると止まらない。仲間が距離を置き始める」）
│   ├─ ContaminationCard（汚染度・プログレスバー・次ステージまでのpt）
│   └─ StreakCard（連続日数・プログレスバー・次称号まで）
├─ CharacterStageTable（全8段階一覧・現在位置をハイライト）
│   └─ StageRow × 8
│       ├─ LevelNumber（Lv.1〜Lv.8/MAX）
│       ├─ CharacterIcon
│       ├─ CharacterName
│       ├─ PointRange（例：「0pt」「5〜14pt」...）
│       ├─ Description（説明文）
│       └─ CurrentHighlight（現在のステージに緑枠・チェックマーク）
├─ BadgeSection（勲章一覧）
│   ├─ EarnedBadge（獲得済み・色つき）× n
│   └─ LockedBadge（未獲得・鍵マーク・点線枠）× n
├─ ChickenRaceStatus
│   └─ StatusCard（生存中/脱落済・参加日数・順位・今月のシーズン情報）
├─ RecentPosts（最近の投稿2〜3件）
└─ EditProfileButton → EditProfileModal
```

### EditProfileModal
```
EditProfileModal
├─ Header（「プロフィール編集」・閉じるボタン・保存ボタン）
├─ NicknameInput（現在のニックネームがプリフィル・1〜50文字）
├─ UniversityInput（任意）
├─ FacultyInput（任意）
├─ GradeSelect（任意）
└─ SaveButton「保存する」
```

### API
- `GET /api/users/me`
- `PATCH /api/users/me`（ニックネーム・大学名等の更新）
- `GET /api/users/me/posts?limit=3`

---

## P-06｜チキンレース

**役割：** チキンレースのランキング・シーズンイベントを表示。月間ミニシーズン制。

### 主要コンポーネント
```
ChickenRaceScreen
├─ Header（「チキンレース」・シーズンバッジ）
├─ TopTabNavigator
│   ├─ RankingTab（ランキング）
│   └─ SeasonEventTab（シーズンイベント）
│
├─ 【ランキングタブ】
│   ├─ SeasonStats（黒背景）
│   │   ├─ SeasonName（例：「6月 ESチキンレース」）
│   │   ├─ SurvivorCount（現在の生存者数）
│   │   ├─ TodayEliminated（今日の脱落者数）
│   │   └─ SeasonProgressBar（シーズン終了までの残り日数・プログレスバー）
│   ├─ MyStatusBanner（自分の生存状況・緑バナー）
│   │   └─ 生存日数・順位・汚染度
│   ├─ SubTabBar（生存者 / 脱落者 / 賭け市場）
│   ├─ SurvivorList（生存者タブ）
│   │   └─ SurvivorItem × n
│   │       ├─ Rank（1〜3位は金銀銅背景）
│   │       ├─ UserAvatar + Nickname + CharacterBadge + LevelBadge → タップで P-07
│   │       ├─ SurvivedDays
│   │       └─ ContaminationPt
│   │       ※ 自分の行は緑枠ハイライト
│   ├─ ObituaryList（脱落者タブ）
│   │   └─ ObituaryItem × n（暗赤色・取り消し線）
│   └─ BettingMarket（賭け市場タブ）※フェーズ3
│
└─ 【シーズンイベントタブ】
    ├─ CurrentSeasonCard（今月のシーズン概要）
    │   ├─ SeasonName + Theme
    │   ├─ Period（開始日〜終了日）
    │   └─ Description（テーマの説明）
    ├─ SeasonEventFeed（シーズン関連のお知らせ一覧）
    │   └─ EventCard × n
    │       ├─ EventType（開幕速報 / 中間報告 / カウントダウン / 終了速報）
    │       ├─ EventContent
    │       └─ Timestamp
    ├─ PastSeasonsLink（過去シーズンの結果一覧へのリンク）
    └─ ParentLineBotCard（親LINEBot ON/OFF）※フェーズ3
```

### シーズン状態の分岐
```
preseason → 「次のシーズン開幕まで練習中」バナー表示
active    → 通常表示（ランキング・カウントダウン）
finished  → 「シーズン終了・最終結果」表示・次シーズン予告
```

### API
- `GET /api/seasons/current`
- `GET /api/seasons/{id}/events`（シーズンイベント一覧）
- `GET /api/chicken-race/survivors?season_id={id}`
- `GET /api/chicken-race/obituaries?season_id={id}`
- WebSocket：`ws://api/ws/survivors`

---

## P-07｜他メンバー手帳（新規追加）

**役割：** 他のメンバーのプロフィールを閲覧する読み取り専用画面。タイムラインやランキングからの遷移先。

### 遷移元
- P-03（ホーム）のPostCard内 UserAvatar / UserName タップ
- P-06（チキンレース）のSurvivorItem内 UserAvatar / Nickname タップ

### 主要コンポーネント
```
OtherUserProfileScreen
├─ Header（戻るボタン・「メンバー手帳」）
├─ ProfileHeader（黒背景）
│   ├─ CharacterAvatar（キャラアイコン・大）
│   ├─ Nickname
│   ├─ UniversityInfo（公開設定の場合のみ）
│   ├─ CharacterInfo
│   │   ├─ CharacterName
│   │   ├─ LevelBadge（例：「Lv.5 / 8」）
│   │   └─ CharacterDescription
│   ├─ ContaminationCard（汚染度・公開設定の場合のみ）
│   └─ StreakCard（連続日数）
├─ BadgeSection（勲章一覧）
├─ ChickenRaceStatus
│   └─ StatusCard（生存中/脱落済・参加日数・順位）
├─ RecentPosts（最近の投稿2〜3件）
└─ FollowButton（フォロー / フォロー解除）
```

### P-05との差分
- ニックネーム変更ボタンなし
- EditProfileButtonなし
- 設定ボタンなし
- プライバシー設定で非公開にされた情報は表示しない
- CharacterStageTable（全8段階一覧）は表示しない（自分専用）
- FollowButtonを追加

### API
- `GET /api/users/{user_id}`
- `GET /api/users/{user_id}/posts?limit=3`
- `POST /api/users/{user_id}/follow`
- `DELETE /api/users/{user_id}/follow`

---

## P-08｜設定

**役割：** 通知設定・プライバシー設定・脱退・追放を管理。プロフィール画面の⚙️ボタンから遷移。

### 主要コンポーネント
```
SettingsScreen
├─ Header（戻るボタン・「設定」）
├─ AccountSection
│   └─ AccountCard（メールアドレス表示）
├─ NotificationSection
│   ├─ Toggle: 訃報速報（デフォルトON）
│   ├─ Toggle: リマインダー通知（デフォルトON）
│   └─ Toggle: 親LINEBot（デフォルトOFF）※フェーズ3
├─ PrivacySection
│   ├─ Toggle: 汚染度を公開（デフォルトON）
│   └─ Toggle: 大学名を公開（デフォルトON）
├─ LegalSection
│   ├─ Link: クラブ規約
│   ├─ Link: プライバシーポリシー
│   └─ Link: お問い合わせ
└─ DangerZone
    ├─ Button「クラブを脱退する」（赤枠・確認ダイアログあり）
    └─ Button「内定を報告して追放される」（黒背景・赤文字・確認ダイアログあり）
```

### API
- `GET /api/users/me/settings`
- `PATCH /api/users/me/settings`
- `DELETE /api/users/me`（脱退）
- `POST /api/users/me/banned`（内定報告・追放）

---

## P-10｜ツール（旧：各種イベント）

**役割：** 就活の実用ツールを集約するハブ画面。上部タブでカレンダーと企業リンク帳を切り替える。ボトムタブ4番目（ツール）から直接アクセス。

### ナビゲーション構造
```
ToolsHubScreen
└─ TopTabNavigator（MaterialTopTabBar）
    ├─ CalendarTab（カレンダー）
    └─ CompanyLinksTab（企業リンク帳）
```

### 拡張性
将来的に以下のタブを追加可能：
- 面接メモ
- OB訪問記録
- ES管理（下書き・提出済み一覧）

---

### P-10a｜カレンダータブ

**役割：** 就活イベントをカレンダー形式で管理する。

### 主要コンポーネント
```
CalendarTab
├─ Header（「ツール」・追加ボタン → AddEventModal）
├─ TopTabBar（カレンダー / 企業リンク帳）← 現在のタブ
├─ ViewSwitcher（月表示 / 週表示 / リスト）
├─ MonthCalendar（月表示）
│   ├─ MonthNavigation（前月・翌月）
│   ├─ CalendarGrid（7×6）
│   │   └─ 各日付セル
│   │       ├─ 日付数字（今日は黒丸）
│   │       └─ EventDots（イベント種別ごとに色ドット）
│   └─ ColorLegend（ES締切：赤 / 説明会：青 / 面接：緑）
├─ EventList（選択日 or 選択月のイベント一覧）
│   └─ EventItem × n → タップで P-11（リマインダー詳細）へ遷移
│       ├─ ColorBar（種別カラー）
│       ├─ EventTitle + Date
│       └─ DaysUntil（残り日数）
└─ AddEventModal
    ├─ Title（必須）
    ├─ EventType（ES締切 / 説明会 / インターン / 面接 / その他）
    ├─ DateTime（DateTimePicker）
    ├─ CompanySelector（企業リンク帳から選択・任意）
    ├─ RemindBefore（前日 / 当日1時間前 / なし）
    └─ Memo（任意）
```

### イベント種別カラー
| 種別 | カラー |
|---|---|
| ES締切 | #e24b4a（赤） |
| 説明会 | #378add（青） |
| インターン | #ef9f27（アンバー） |
| 面接 | #1d9e75（緑） |
| その他 | #888780（グレー） |

### API
- `GET /api/calendar/events?year={year}&month={month}`
- `POST /api/calendar/events`
- `PATCH /api/calendar/events/{id}`
- `DELETE /api/calendar/events/{id}`

---

### P-10b｜企業リンク帳タブ

**役割：** 就活企業のマイページURLを一覧管理する実用ツール。

### 主要コンポーネント
```
CompanyLinksTab
├─ Header（「ツール」・追加ボタン → AddCompanyModal）
├─ TopTabBar（カレンダー / 企業リンク帳）← 現在のタブ
├─ FilterChips（すべて / 未着手 / ES提出済 / 選考中 / 終了）
├─ DeadlineWarningBanner（締切が近い企業がある場合のみ表示）
├─ CompanyList
│   └─ CompanyCard × n
│       ├─ CompanyName + StatusBadge（未着手・ES提出済・選考中・終了）
│       ├─ DeadlineInfo（締切日・残り日数・3日以内は赤・7日以内はオレンジ）
│       ├─ MemoPreview（1行プレビュー）
│       ├─ Button「マイページを開く」（URLをブラウザで開く）
│       └─ EditButton → EditCompanyModal
└─ AddButton（一覧下部 or FAB）
```

### AddCompanyModal / EditCompanyModal
```
├─ CompanyName（必須）
├─ MypageUrl（任意・URL形式バリデーション）
├─ Status（select: 未着手 / ES提出済 / 選考中 / 終了）
├─ Deadline（DatePicker・任意）
└─ Memo（任意・最大200文字）
```

### 重要
- `mypage_url` のみ保存。IDとパスワードの入力フィールドは存在しない
- URLタップ時は `Linking.openURL()` でブラウザを起動
- 企業を新規登録した瞬間「また増えた…」と一言トースト表示（演出のみ）

### API
- `GET /api/companies`
- `POST /api/companies`
- `PATCH /api/companies/{id}`
- `DELETE /api/companies/{id}`

---

## P-11｜リマインダー詳細

**役割：** 特定イベントの詳細確認・完了/サボり申告・通知設定変更。

### 表示タイミング
- 通知をタップした時
- カレンダータブのイベントをタップした時

### 遷移元
- P-10a（カレンダータブ）のEventItemタップ → Stack遷移
- プッシュ通知タップ → ディープリンク遷移

### 主要コンポーネント
```
ReminderDetailScreen
├─ Header（戻るボタン・「イベント詳細」）
├─ EventDetailCard
│   ├─ EventIcon（種別アイコン）
│   ├─ EventTitle + DateTime
│   ├─ EventTypeBadge
│   ├─ RemindInfo（通知タイミング）
│   ├─ MemoText
│   ├─ CompanyLink（企業リンク帳と連携している場合・タップでマイページを開く）
│   ├─ ContaminationInfo（「完了すると+Xpt加算されます」）
│   └─ ActionButtons
│       ├─ Button「行った（+Xpt 汚染）」→ 汚染ポイント加算・申告経路B
│       └─ Button「サボった」→ サボり投稿の下書きを自動生成
├─ NotificationPreviewCard（当日通知のプレビュー）
│   └─ MockNotification
│       ├─ NNCアイコン + タイトル + 本文
│       └─ ActionButtons（「行った」「サボった」）
├─ FollowUpPreviewCard（翌日フォローアップのプレビュー）
│   └─ MockNotification
│       └─ ActionButtons（「行った（遅れて申告）」「行かなかった💪」）
└─ NotificationSettingsCard
    ├─ Toggle: 前日通知
    ├─ Toggle: 当日 1時間前
    └─ Toggle: 翌日フォローアップ
```

### 重要
- 「行った」ボタンを押した時のみ汚染ポイントを加算（申告経路B）
- 「サボった」ボタンはP-04（記録＆投稿）をサボり内容を入力済みで開く
- 「行かなかった💪」はStreakカウントを継続させる

### API
- `GET /api/calendar/events/{id}`
- `POST /api/contamination/report`（行った・申告経路B）
- `PATCH /api/calendar/events/{id}/settings`（通知設定変更）

---

## 共通コンポーネント

```
BottomTabBar          -- 全メイン画面共通（5タブ）
CharacterAvatar       -- キャラアイコン（汚染度に応じて変化・8段階対応）
ContaminationBadge    -- 汚染度バッジ（色・キャラ名・Lv表記）
LevelBadge            -- レベル表記（「Lv.X / 8」）
ObituaryCard          -- 訃報カード（脱落速報）
SurvivorCounter       -- 生存者数リアルタイム表示
Toast                 -- 一言演出トースト（「また増えた…」等）
TemplateCommentBar    -- テンプレコメント選択肢（横スクロール）
```

---

## 画面一覧（総括）

| 画面ID | 画面名 | アクセス方法 |
|---|---|---|
| P-01 | トップ／ランディング | 未ログイン時の初期画面 |
| P-02 | 入会画面 | P-01から遷移 |
| P-03 | ホーム（タイムライン） | ボトムタブ1 |
| P-04 | 記録＆投稿（モーダル） | ボトムタブ3（中央丸ボタン） |
| P-05 | プロフィール（クラブ手帳） | ボトムタブ5 |
| P-06 | チキンレース | ボトムタブ2 |
| P-07 | 他メンバー手帳 | P-03・P-06のアバター/ユーザー名タップ |
| P-08 | 設定 | P-05の⚙️ボタンから遷移 |
| P-10a | カレンダー | ボトムタブ4 → 上部タブ1 |
| P-10b | 企業リンク帳 | ボトムタブ4 → 上部タブ2 |
| P-11 | リマインダー詳細 | P-10aのイベントタップ or 通知タップ |

---

## カラーパレット（NNCブランドカラー）

```
Primary（クラブカラー）：#1a1a1a（黒）
OnPrimary：#f5f5f5（白）
Contamination（汚染）：#e24b4a（赤）
Survival（生存）：#1d9e75（緑）
ES締切：#e24b4a（赤）
説明会：#378add（青）
面接：#1d9e75（緑）
インターン：#ef9f27（アンバー）
PureCharacter（純粋な魂）：#e1f5ee（薄緑）
ContaminatedCharacter（汚染済）：#faece7（薄赤）
TopTabActive：#1a1a1a（黒・アクティブ文字）
TopTabInactive：#888780（グレー・非アクティブ文字）
TopTabIndicator：#e24b4a（赤・アンダーライン）
```