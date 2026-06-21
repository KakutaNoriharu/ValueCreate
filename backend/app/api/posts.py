from collections import Counter
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.post import Post, Reaction
from app.schemas.post import PostCreate
from app.core.auth import get_current_user

router = APIRouter()

DAILY_POST_LIMIT_NORMAL = 3


def _serialize_post(post: Post, current_user_id: str) -> dict:
    counts = Counter(r.reaction_type for r in post.reactions)
    my_reaction = next(
        (r.reaction_type for r in post.reactions if r.user_id == current_user_id), None
    )
    return {
        "post_id": post.post_id,
        "user_id": post.user_id,
        "user": {
            "user_id": post.user.user_id,
            "nickname": post.user.nickname,
            "auth_type": post.user.auth_type,
            "character_stage": post.user.character_stage,
            "contamination_pt": post.user.contamination_pt,
        } if post.user else None,
        "content": post.content,
        "image_url": post.image_url,
        "post_type": post.post_type,
        "daily_skip": post.daily_skip,
        "daily_instead": post.daily_instead,
        "daily_comment": post.daily_comment,
        "reactions": [
            {"reaction_type": rt, "count": cnt}
            for rt, cnt in sorted(counts.items())
        ],
        "my_reaction": my_reaction,
        "created_at": post.created_at.isoformat(),
    }


@router.get("/feed")
async def get_feed(
    tab: str = Query("all", pattern="^(all|following)$"),
    cursor: Optional[str] = None,
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Post).options(selectinload(Post.user), selectinload(Post.reactions))

    if cursor:
        q = q.where(Post.created_at < cursor)

    q = q.order_by(Post.created_at.desc()).limit(limit + 1)
    result = await db.execute(q)
    posts = list(result.scalars().all())

    has_more = len(posts) > limit
    posts = posts[:limit]
    next_cursor = posts[-1].created_at.isoformat() if has_more and posts else None

    return {
        "posts": [_serialize_post(p, current_user.user_id) for p in posts],
        "cursor": next_cursor,
    }


@router.post("", status_code=201)
async def create_post(
    body: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.auth_type == "normal":
        from datetime import date, datetime, timezone
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        count_result = await db.execute(
            select(func.count(Post.post_id))
            .where(Post.user_id == current_user.user_id)
            .where(Post.created_at >= today_start)
        )
        count = count_result.scalar_one()
        if count >= DAILY_POST_LIMIT_NORMAL:
            raise HTTPException(
                status_code=429,
                detail=f"🕵️ 怪しいやつは1日{DAILY_POST_LIMIT_NORMAL}回までしか投稿できません",
            )

    post = Post(
        user_id=current_user.user_id,
        content=body.content,
        image_url=body.image_url,
        post_type=body.post_type,
        daily_skip=body.daily_skip,
        daily_instead=body.daily_instead,
        daily_comment=body.daily_comment,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    await db.refresh(post, ["user", "reactions"])
    return _serialize_post(post, current_user.user_id)


@router.get("/obituaries/recent")
async def get_recent_obituaries(
    limit: int = Query(5, le=20),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.post_type == "elimination")
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    posts = result.scalars().all()
    return [
        {
            "post_id": p.post_id,
            "content": p.content,
            "created_at": p.created_at.isoformat(),
            "user": {
                "user_id": p.user.user_id,
                "nickname": p.user.nickname,
                "character_stage": p.user.character_stage,
            } if p.user else None,
        }
        for p in posts
    ]


@router.post("/{post_id}/reactions")
async def react_to_post(
    post_id: str,
    reaction_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.auth_type == "normal" and reaction_type != "kusa":
        raise HTTPException(status_code=403, detail="🕵️ 怪しいやつは「草」のリアクションのみ使用できます")

    if reaction_type not in ("wakaru", "toutoi", "kusa"):
        raise HTTPException(status_code=400, detail="無効なリアクションタイプです")

    existing = await db.execute(
        select(Reaction).where(
            Reaction.post_id == post_id,
            Reaction.user_id == current_user.user_id,
        )
    )
    existing_reaction = existing.scalar_one_or_none()

    if existing_reaction:
        if existing_reaction.reaction_type == reaction_type:
            await db.delete(existing_reaction)
            await db.commit()
            return {"message": "リアクションを取り消しました"}
        existing_reaction.reaction_type = reaction_type
    else:
        db.add(Reaction(post_id=post_id, user_id=current_user.user_id, reaction_type=reaction_type))

    await db.commit()
    return {"message": "リアクションしました"}
