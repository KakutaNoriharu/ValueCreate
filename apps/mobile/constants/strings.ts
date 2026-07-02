export const Strings = {
  appName: 'NNC',
  appFullName: '内定ないクラブ',

  auth: {
    signUp: '入会',
    login: 'クラブに入る',
    logout: '退出',
    withdraw: '脱退',
    banned: '追放',
    verifyEmail: '確認メールを送信する',
  },

  member: {
    profile: 'クラブ手帳',
    notification: 'クラブからの伝達',
    report: '密告',
    admin: 'クラブ本部',
    rules: 'クラブ規約',
    badge: '勲章',
    stigma: '烙印',
    obituary: '訃報',
    survivor: '生存者',
    eliminated: '脱落',
  },

  nav: {
    home: 'ホーム',
    race: 'レース',
    post: '記録',
    tools: 'ツール',
    profile: '手帳',
    calendar: 'カレンダー',
    companies: '企業リンク帳',
    settings: '設定',
    reminderDetail: 'リマインダー詳細',
    ranking: 'ランキング',
    seasonEvent: 'シーズンイベント',
  },

  contamination: {
    pure: '純粋な魂',
    whisper: '就活の気配',
    ghost: 'スーツの亡霊',
    slave: 'マイナビの奴隷',
    zombie: 'ガクチカゾンビ',
    machine: '面接マシーン',
    dog: '人事部の犬',
    banned: '社畜の卵（出禁）',
    warningLow: '⚠️汚染注意',
    warningHigh: '🚨就活汚染注意🚨',
    purify: 'まだ間に合う',
  },

  reaction: {
    wakaru: 'わかる',
  },

  // フリーテキストコメントと併用するテンプレコメント5種（F-02）
  templateComments: [
    'ご愁傷様です',
    'まだ間に合う',
    '帰ってこい',
    '同志よ…',
    '最高のサボりだ',
  ],

  company: {
    securityNote: '⚠️ IDとパスワードは保存できません。ブラウザのパスワード管理機能をご利用ください。',
    addedToast: 'また増えた…',
  },

  streak: {
    titles: {
      stage1: '様子見中',
      stage2: '準備運動中',
      week1: '1週間の猛者',
      day30: '悟りの境地',
      day60: '無敵モード',
      day100: '伝説のサボリスト',
    },
  },
} as const;
