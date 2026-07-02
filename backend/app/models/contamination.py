import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ContaminationLog(Base):
    __tablename__ = "contamination_logs"

    log_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    action_type: Mapped[str] = mapped_column(
        Enum(
            "es", "briefing", "internship_short", "internship_long",
            "ob_visit", "spi", "suit", "naitei",
            name="action_type_enum",
        ),
        nullable=False,
    )
    point_added: Mapped[int] = mapped_column(Integer, nullable=False)
    # 申告経路: A=手動申告(記録のみ) / B=リマインダー完了 / C=投稿時選択
    source: Mapped[str] = mapped_column(
        Enum("manual", "reminder", "post", name="contamination_source_enum"),
        default="manual",
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="contamination_logs")
