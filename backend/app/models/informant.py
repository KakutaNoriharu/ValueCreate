import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Informant(Base):
    __tablename__ = "informants"

    inform_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    from_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    to_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    inform_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
