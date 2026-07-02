# 汚染度 → キャラ進化（8段階 = 7段階 + 出禁）。SPEC.md v13 F-05 準拠。
# (下限汚染度, stage キー) を降順に並べる
STAGE_THRESHOLDS = [
    (150, "dog"),
    (100, "machine"),
    (60, "zombie"),
    (35, "slave"),
    (15, "ghost"),
    (5, "whisper"),
    (0, "pure"),
]

POINT_MAP: dict[str, int] = {
    "es": 10,
    "briefing": 5,
    "internship_short": 20,
    "internship_long": 50,
    "ob_visit": 15,
    "spi": 8,
    "suit": 30,
    "naitei": 0,  # handled separately as ban
}

STAGE_LABELS: dict[str, str] = {
    "pure": "純粋な魂",
    "whisper": "就活の気配",
    "ghost": "スーツの亡霊",
    "slave": "マイナビの奴隷",
    "zombie": "ガクチカゾンビ",
    "machine": "面接マシーン",
    "dog": "人事部の犬",
    "banned": "社畜の卵（出禁）",
}

STAGE_ICONS: dict[str, str] = {
    "pure": "🌿",
    "whisper": "👀",
    "ghost": "💼",
    "slave": "🤖",
    "zombie": "🧟",
    "machine": "🎭",
    "dog": "🐕",
    "banned": "👔",
}

# Lv 表記（「Lv.X / 8」）。banned は MAX 扱い
STAGE_LEVELS: dict[str, int] = {
    "pure": 1,
    "whisper": 2,
    "ghost": 3,
    "slave": 4,
    "zombie": 5,
    "machine": 6,
    "dog": 7,
    "banned": 8,
}


def compute_stage(contamination_pt: int) -> str:
    for threshold, stage in STAGE_THRESHOLDS:
        if contamination_pt >= threshold:
            return stage
    return "pure"
