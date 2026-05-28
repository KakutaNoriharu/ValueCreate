import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    event_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    event_type: Mapped[str] = mapped_column(
        Enum(
            "es", "briefing", "internship_short", "internship_long",
            "ob_visit", "spi", "interview", "other",
            name="calendar_event_type_enum",
        ),
        default="other",
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    remind_before: Mapped[int] = mapped_column(Integer, default=1440)
    status: Mapped[str] = mapped_column(
        Enum("pending", "done", "skipped", "ignored", name="calendar_status_enum"),
        default="pending",
    )
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("companies.company_id"), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notif_day_before: Mapped[bool] = mapped_column(default=True)
    notif_one_hour: Mapped[bool] = mapped_column(default=True)
    notif_followup: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="calendar_events")
