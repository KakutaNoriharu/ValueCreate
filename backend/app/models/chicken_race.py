import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Season(Base):
    __tablename__ = "seasons"

    season_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    theme: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("preseason", "active", "finished", name="season_status_enum"),
        default="preseason",
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    entries: Mapped[list["ChickenRace"]] = relationship("ChickenRace", back_populates="season", lazy="select")


class ChickenRace(Base):
    __tablename__ = "chicken_race"

    entry_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    season_id: Mapped[str] = mapped_column(String(36), ForeignKey("seasons.season_id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("preseason", "alive", "eliminated", "completed", name="chicken_race_status_enum"),
        default="alive",
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    survived_days: Mapped[int] = mapped_column(Integer, default=0)
    eliminated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    elimination_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)

    season: Mapped["Season"] = relationship("Season", back_populates="entries")
    user: Mapped["User"] = relationship("User", back_populates="chicken_race_entries")
