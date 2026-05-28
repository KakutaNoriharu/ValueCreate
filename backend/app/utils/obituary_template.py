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
