from pydantic import BaseModel


class ContaminationReport(BaseModel):
    action_type: str  # es, briefing, internship_short, internship_long, ob_visit, spi, suit, naitei
    company_id: str | None = None


class ContaminationResult(BaseModel):
    action_type: str
    point_added: int
    new_contamination_pt: int
    new_character_stage: str
    is_banned: bool
    obituary_text: str | None = None
