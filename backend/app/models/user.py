import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    university: Mapped[str | None] = mapped_column(String(100), nullable=True)
    faculty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grade: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    contamination_pt: Mapped[int] = mapped_column(Integer, default=0)
    character_stage: Mapped[str] = mapped_column(
        Enum(
            "pure", "whisper", "ghost", "slave", "zombie", "machine", "dog", "banned",
            name="character_stage_enum",
        ),
        default="pure",
    )
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False)
    show_contamination: Mapped[bool] = mapped_column(Boolean, default=True)
    show_university: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_obituary: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_reminder: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_police: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_parent_bot: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verify_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    posts: Mapped[list["Post"]] = relationship("Post", back_populates="user", lazy="select")
    reactions: Mapped[list["Reaction"]] = relationship("Reaction", back_populates="user", lazy="select")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="user", lazy="select")
    contamination_logs: Mapped[list["ContaminationLog"]] = relationship("ContaminationLog", back_populates="user", lazy="select")
    chicken_race_entries: Mapped[list["ChickenRace"]] = relationship("ChickenRace", back_populates="user", lazy="select")
    calendar_events: Mapped[list["CalendarEvent"]] = relationship("CalendarEvent", back_populates="user", lazy="select")
    companies: Mapped[list["Company"]] = relationship("Company", back_populates="user", lazy="select")
