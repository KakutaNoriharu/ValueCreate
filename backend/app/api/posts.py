from collections import Counter
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.post import Post, Reaction, Comment
from app.schemas.post import PostCreate, CommentCreate
from app.core.auth import get_current_user

router = APIRouter()

def _serialize_post(post: Post, current_user_id: str) -> dict:
    counts = Counter(r.reaction_type for r in post.reactions)
    my_reaction = next(
        (r.reaction_type for r in post.reactions if r.user_id == current_user_id), None
    )
    # comments はリレーション未ロードのこともあるため安全に件数を取る
    try:
        comment_count = len(post.comments)
    except Exception:
        comment_count = 0
    return {
        "post_id": post.post_id,
        "user_id": post.user_id,
        "user": {
            "user_id": post.user.user_id,
            "nickname": post.user.nickname,
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
        "comment_count": comment_count,
        "created_at": post.created_at.isoformat(),
    }


def _serialize_comment(comment: Comment) -> dict:
    return {
        "comment_id": comment.comment_id,
        "post_id": comment.post_id,
        "content": comment.content,
        "is_template": comment.is_template,
        "user": {
            "user_id": comment.user.user_id,
            "nickname": comment.user.nickname,
            "character_stage": comment.user.character_stage,
        } if comment.user else None,
        "created_at": comment.created_at.isoformat(),
    }


@router.get("/feed")
async def get_feed(
    tab: str = Query("all", pattern="^(all|following)$"),
    cursor: Optional[str] = None,
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Post).options(
        selectinload(Post.user),
        selectinload(Post.reactions),
        selectinload(Post.comments),
    )

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
    await db.refresh(post, ["user", "reactions", "comments"])
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
    # リアクションは「わかる」の1種のみ（v13で尊い・草は廃止）
    if reaction_type != "wakaru":
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


@router.get("/{post_id}/comments")
async def get_comments(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()
    return [_serialize_comment(c) for c in comments]


@router.post("/{post_id}/comments", status_code=201)
async def create_comment(
    post_id: str,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="投稿が見つかりません")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.user_id,
        content=body.content,
        is_template=body.is_template,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment, ["user"])
    return _serialize_comment(comment)
