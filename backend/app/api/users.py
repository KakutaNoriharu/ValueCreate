from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.schemas.user import UserResponse, UserSettingsUpdate
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me/settings")
async def update_settings(
    body: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.commit()
    return {"message": "設定を更新しました"}


@router.get("/me/posts")
async def get_my_posts(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post)
        .where(Post.user_id == current_user.user_id)
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{user_id}")
async def get_member(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """P-07 他メンバー手帳（読み取り専用の公開プロフィール）"""
    member = await db.get(User, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="メンバーが見つかりません")
    return {
        "user_id": member.user_id,
        "nickname": member.nickname,
        "character_stage": member.character_stage,
        "contamination_pt": member.contamination_pt if member.show_contamination else None,
        "show_contamination": member.show_contamination,
        "streak_days": member.streak_days,
        "is_banned": member.is_banned,
        "university": member.university if member.show_university else None,
        "faculty": member.faculty if member.show_university else None,
        "created_at": member.created_at.isoformat(),
    }


@router.get("/{user_id}/posts")
async def get_member_posts(
    user_id: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post)
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.delete("/me")
async def withdraw(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.delete(current_user)
    await db.commit()
    return {"message": "脱退しました"}


@router.post("/me/banned")
async def self_ban(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.is_banned = True
    current_user.character_stage = "banned"
    await db.commit()
    return {"message": "内定おめでとうございます。クラブから追放されました。"}
