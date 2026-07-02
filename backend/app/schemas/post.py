from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PostAuthor(BaseModel):
    user_id: str
    nickname: str
    character_stage: str
    contamination_pt: int
    show_contamination: bool

    model_config = {"from_attributes": True}


class ReactionCount(BaseModel):
    # リアクションは「わかる」の1種のみ（v13）
    wakaru: int = 0


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
    comment_count: int = 0
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
    reaction_type: str = "wakaru"  # v13: 「わかる」のみ


class CommentCreate(BaseModel):
    content: str
    is_template: bool = False  # テンプレコメント由来か


class CommentResponse(BaseModel):
    comment_id: str
    post_id: str
    content: str
    is_template: bool
    user: Optional[PostAuthor] = None
    created_at: datetime

    model_config = {"from_attributes": True}
