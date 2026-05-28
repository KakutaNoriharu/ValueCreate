from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CalendarEventCreate(BaseModel):
    title: str
    event_type: str = "other"
    scheduled_at: datetime
    remind_before: int = 1440
    memo: Optional[str] = None
    company_id: Optional[str] = None
    notif_day_before: bool = True
    notif_one_hour: bool = True
    notif_followup: bool = True


class CalendarEventResponse(BaseModel):
    event_id: str
    user_id: str
    title: str
    event_type: str
    scheduled_at: datetime
    remind_before: int
    status: str
    memo: Optional[str] = None
    company_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    notif_day_before: bool
    notif_one_hour: bool
    notif_followup: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CalendarEventPatch(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    remind_before: Optional[int] = None
    memo: Optional[str] = None
    status: Optional[str] = None


class CalendarNotificationSettings(BaseModel):
    notif_day_before: Optional[bool] = None
    notif_one_hour: Optional[bool] = None
    notif_followup: Optional[bool] = None
