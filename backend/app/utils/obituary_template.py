REASON_LABELS = {
    "es": "ES提出",
    "internship_short": "インターン参加",
    "internship_long": "長期インターン参加",
    "briefing": "説明会参加",
    "ob_visit": "OB/OG訪問",
    "spi": "SPI勉強",
    "suit": "スーツ購入",
    "naitei": "内定獲得",
}


def build_obituary(nickname: str, reason: str, survived_days: int, contamination_pt: int) -> str:
    reason_label = REASON_LABELS.get(reason, reason)
    return generate_obituary(nickname, reason_label, survived_days, contamination_pt)


def generate_obituary(nickname: str, elimination_reason: str, survived_days: int, contamination_pt: int) -> str:
    return (
        "━━━━━━━━━━━━━━━━━━\n"
        "　　　　訃　報\n\n"
        f"　　@{nickname} 氏は\n"
        f"　　本日、{elimination_reason} されました。\n\n"
        f"　　在サボり日数：{survived_days}日\n"
        f"　　汚染度：{contamination_pt}pt\n\n"
        "　　ご冥福をお祈りいたします。\n"
        "━━━━━━━━━━━━━━━━━━"
    )
