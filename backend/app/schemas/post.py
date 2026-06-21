from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PostAuthor(BaseModel):
    user_id: str
    nickname: str
    auth_type: str
    character_stage: str
    contamination_pt: int
    show_contamination: bool

    model_config = {"from_attributes": True}


class ReactionCount(BaseModel):
    wakaru: int = 0
    toutoi: int = 0
    kusa: int = 0


class PostResponse(BaseModel):
    post_id: str
    user: PostAuthor
    content: str
    image_url: Optional[str] = None
    post_type: str
    daily_skip: Optional[str] = None
    daily_instead: Optional[str] = None
    daily_comment: Optional[str] = None
    reactions: ReactionCount
    my_reaction: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    post_type: str = "normal"
    daily_skip: Optional[str] = None
    daily_instead: Optional[str] = None
    daily_comment: Optional[str] = None


class ReactionCreate(BaseModel):
    reaction_type: str  # wakaru / toutoi / kusa
