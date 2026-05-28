STAGE_THRESHOLDS = [
    (100, "zombie"),
    (35, "slave"),
    (10, "ghost"),
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
    "ghost": "スーツの亡霊",
    "slave": "マイナビの奴隷",
    "zombie": "ガクチカゾンビ",
    "banned": "社畜の卵（出禁）",
}

STAGE_ICONS: dict[str, str] = {
    "pure": "🌿",
    "ghost": "💼",
    "slave": "🤖",
    "zombie": "🧟",
    "banned": "👔",
}


def compute_stage(contamination_pt: int) -> str:
    for threshold, stage in STAGE_THRESHOLDS:
        if contamination_pt >= threshold:
            return stage
    return "pure"
