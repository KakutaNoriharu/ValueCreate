import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Post(Base):
    __tablename__ = "posts"

    post_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    content: Mapped[str] = mapped_column(String(140), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    post_type: Mapped[str] = mapped_column(
        Enum("normal", "daily", "elimination", name="post_type_enum"),
        default="normal",
    )
    daily_skip: Mapped[str | None] = mapped_column(String(200), nullable=True)
    daily_instead: Mapped[str | None] = mapped_column(String(200), nullable=True)
    daily_comment: Mapped[str | None] = mapped_column(String(140), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="posts")
    reactions: Mapped[list["Reaction"]] = relationship("Reaction", back_populates="post", lazy="select", cascade="all, delete-orphan")


class Reaction(Base):
    __tablename__ = "reactions"

    reaction_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id: Mapped[str] = mapped_column(String(36), ForeignKey("posts.post_id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    reaction_type: Mapped[str] = mapped_column(
        Enum("wakaru", "toutoi", "kusa", name="reaction_type_enum"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    post: Mapped["Post"] = relationship("Post", back_populates="reactions")
    user: Mapped["User"] = relationship("User", back_populates="reactions")
