import type { CharacterStage } from '../types';

// 汚染度 → キャラ進化（8段階 = 7段階 + 出禁）。SPEC.md v13 F-05 準拠。
// バックエンドの app/utils/character_stage.py と必ず一致させること。

export interface StageDef {
  stage: CharacterStage;
  level: number; // 「Lv.X / 8」表記の X
  label: string;
  icon: string;
  description: string;
  minPt: number; // この段階に入る下限汚染度（banned は内定で別扱い = -1）
  maxPt: number | null; // 上限（null = 上限なし手前段階）
}

// 表示順（Lv昇順）
export const CHARACTER_STAGES: StageDef[] = [
  {
    stage: 'pure',
    level: 1,
    label: '純粋な魂',
    icon: '🌿',
    description: 'まだ汚染されていない清廉な存在。みんなから愛される',
    minPt: 0,
    maxPt: 4,
  },
  {
    stage: 'whisper',
    level: 2,
    label: '就活の気配',
    icon: '👀',
    description: 'なんとなく就活サイトを覗いた形跡がある。まだセーフ',
    minPt: 5,
    maxPt: 14,
  },
  {
    stage: 'ghost',
    level: 3,
    label: 'スーツの亡霊',
    icon: '💼',
    description: 'うっすらスーツが透けて見え始める。仲間から「大丈夫？」と心配される',
    minPt: 15,
    maxPt: 34,
  },
  {
    stage: 'slave',
    level: 4,
    label: 'マイナビの奴隷',
    icon: '🤖',
    description: '目が死んでいる。口癖が「御社の〇〇という点に魅力を感じ」になっている',
    minPt: 35,
    maxPt: 59,
  },
  {
    stage: 'zombie',
    level: 5,
    label: 'ガクチカゾンビ',
    icon: '🧟',
    description: 'ガクチカを語り始めると止まらない。仲間が距離を置き始める',
    minPt: 60,
    maxPt: 99,
  },
  {
    stage: 'machine',
    level: 6,
    label: '面接マシーン',
    icon: '🎭',
    description: '「私の強みはコミュニケーション能力です」が口癖。もう手遅れ',
    minPt: 100,
    maxPt: 149,
  },
  {
    stage: 'dog',
    level: 7,
    label: '人事部の犬',
    icon: '🐕',
    description: '完全に就活に染まった。「弊社」「貴社」を日常会話で使う',
    minPt: 150,
    maxPt: 199,
  },
  {
    stage: 'banned',
    level: 8,
    label: '社畜の卵（出禁）',
    icon: '👔',
    description: 'クラブ永久追放。称号「裏切り者」付与',
    minPt: -1,
    maxPt: null,
  },
];

export const TOTAL_STAGES = 7; // 「Lv.X / 8」だが進化段階自体は7 + 出禁。表記上は /8

const STAGE_MAP: Record<CharacterStage, StageDef> = CHARACTER_STAGES.reduce(
  (acc, s) => {
    acc[s.stage] = s;
    return acc;
  },
  {} as Record<CharacterStage, StageDef>,
);

export function getStageDef(stage: CharacterStage): StageDef {
  return STAGE_MAP[stage] ?? CHARACTER_STAGES[0];
}

// 汚染度からステージを算出（banned は内定処理で別途設定されるため算出対象外）
export function computeStage(contaminationPt: number): CharacterStage {
  const ordered = [...CHARACTER_STAGES]
    .filter((s) => s.stage !== 'banned')
    .sort((a, b) => b.minPt - a.minPt);
  for (const s of ordered) {
    if (contaminationPt >= s.minPt) return s.stage;
  }
  return 'pure';
}
