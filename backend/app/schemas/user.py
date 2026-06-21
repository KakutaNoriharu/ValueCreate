from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserProfile(BaseModel):
    user_id: str
    nickname: str
    auth_type: str
    university: Optional[str] = None
    faculty: Optional[str] = None
    grade: Optional[int] = None
    contamination_pt: int
    character_stage: str
    streak_days: int
    is_banned: bool
    show_contamination: bool
    show_university: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSettings(BaseModel):
    notif_obituary: bool
    notif_reminder: bool
    notif_police: bool
    notif_parent_bot: bool
    show_contamination: bool
    show_university: bool

    model_config = {"from_attributes": True}


class UserSettingsPatch(BaseModel):
    notif_obituary: Optional[bool] = None
    notif_reminder: Optional[bool] = None
    notif_police: Optional[bool] = None
    notif_parent_bot: Optional[bool] = None
    show_contamination: Optional[bool] = None
    show_university: Optional[bool] = None


class UserProfilePatch(BaseModel):
    nickname: Optional[str] = None
    university: Optional[str] = None
    faculty: Optional[str] = None
    grade: Optional[int] = None


UserResponse = UserProfile
UserSettingsUpdate = UserSettingsPatch
