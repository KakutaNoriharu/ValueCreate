from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SeasonResponse(BaseModel):
    season_id: str
    name: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ChickenRaceEntry(BaseModel):
    entry_id: str
    season_id: str
    user_id: str
    nickname: str
    character_stage: str
    status: str
    survived_days: int
    contamination_pt: int
    joined_at: datetime
    eliminated_at: Optional[datetime] = None
    elimination_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class SurvivorStats(BaseModel):
    survivor_count: int
    eliminated_today: int
    season: Optional[SeasonResponse] = None
