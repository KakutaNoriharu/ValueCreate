from pydantic import BaseModel


class ContaminationReport(BaseModel):
    action_type: str  # es, briefing, internship_short, internship_long, ob_visit, spi, suit, naitei
    company_id: str | None = None
    # 申告経路: manual=A(手動・記録のみ) / reminder=B(リマインダー完了) / post=C(投稿時選択)
    source: str = "manual"


class ContaminationResult(BaseModel):
    action_type: str
    point_added: int
    new_contamination_pt: int
    new_character_stage: str
    is_banned: bool
    obituary_text: str | None = None
