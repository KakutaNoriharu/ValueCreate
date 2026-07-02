from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.chicken_race import ChickenRace, Season
from app.core.auth import get_current_user
from app.websocket.manager import manager
from app.utils.obituary_template import build_obituary

router = APIRouter()


def _serialize_season(season: Season) -> dict:
    return {
        "season_id": season.season_id,
        "name": season.name,
        "theme": season.theme,
        "status": season.status,
        "started_at": season.started_at.isoformat() if season.started_at else None,
        "ended_at": season.ended_at.isoformat() if season.ended_at else None,
    }


def _serialize_entry(entry: ChickenRace) -> dict:
    return {
        "entry_id": entry.entry_id,
        "season_id": entry.season_id,
        "user_id": entry.user_id,
        "user": {
            "user_id": entry.user.user_id,
            "nickname": entry.user.nickname,
            "character_stage": entry.user.character_stage,
            "contamination_pt": entry.user.contamination_pt,
        } if entry.user else None,
        "status": entry.status,
        "survived_days": entry.survived_days,
        "joined_at": entry.joined_at.isoformat(),
        "eliminated_at": entry.eliminated_at.isoformat() if entry.eliminated_at else None,
        "elimination_reason": entry.elimination_reason,
    }


async def _get_active_season(db: AsyncSession) -> Season | None:
    result = await db.execute(
        select(Season)
        .where(Season.status.in_(["active", "preseason"]))
        .order_by(Season.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.get("/current-season")
async def get_current_season(db: AsyncSession = Depends(get_db)):
    season = await _get_active_season(db)
    if not season:
        return {"season": None, "survivor_count": 0, "today_eliminated": 0, "total_entries": 0}

    survivor_count = (await db.execute(
        select(func.count(ChickenRace.entry_id))
        .where(ChickenRace.season_id == season.season_id, ChickenRace.status == "alive")
    )).scalar_one()

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_eliminated = (await db.execute(
        select(func.count(ChickenRace.entry_id))
        .where(
            ChickenRace.season_id == season.season_id,
            ChickenRace.status == "eliminated",
            ChickenRace.eliminated_at >= today_start,
        )
    )).scalar_one()

    total_entries = (await db.execute(
        select(func.count(ChickenRace.entry_id))
        .where(ChickenRace.season_id == season.season_id)
    )).scalar_one()

    return {
        "season": _serialize_season(season),
        "survivor_count": survivor_count,
        "today_eliminated": today_eliminated,
        "total_entries": total_entries,
    }


@router.get("/survivors")
async def get_survivors(
    season_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChickenRace)
        .options(selectinload(ChickenRace.user))
        .where(ChickenRace.season_id == season_id, ChickenRace.status == "alive")
        .order_by(ChickenRace.survived_days.desc())
    )
    return [_serialize_entry(e) for e in result.scalars().all()]


@router.get("/obituaries")
async def get_obituaries(
    season_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChickenRace)
        .options(selectinload(ChickenRace.user))
        .where(ChickenRace.season_id == season_id, ChickenRace.status == "eliminated")
        .order_by(ChickenRace.eliminated_at.desc())
    )
    return [_serialize_entry(e) for e in result.scalars().all()]


@router.get("/my-status")
async def get_my_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    season = await _get_active_season(db)
    if not season:
        return {"entry": None, "season": None}

    result = await db.execute(
        select(ChickenRace)
        .options(selectinload(ChickenRace.user))
        .where(
            ChickenRace.user_id == current_user.user_id,
            ChickenRace.season_id == season.season_id,
        )
    )
    entry = result.scalar_one_or_none()
    return {
        "entry": _serialize_entry(entry) if entry else None,
        "season": _serialize_season(season),
    }


@router.post("/enter")
async def enter_race(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    season = await _get_active_season(db)
    if not season:
        raise HTTPException(status_code=404, detail="現在参加可能なシーズンがありません")

    existing = await db.execute(
        select(ChickenRace).where(
            ChickenRace.user_id == current_user.user_id,
            ChickenRace.season_id == season.season_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="既にエントリー済みです")

    entry = ChickenRace(
        season_id=season.season_id,
        user_id=current_user.user_id,
        status="alive" if season.status == "active" else "preseason",
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    await db.refresh(entry, ["user"])
    return _serialize_entry(entry)


@router.post("/eliminate")
async def eliminate(
    reason: str = Query("es"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    season = await _get_active_season(db)
    if not season:
        raise HTTPException(status_code=404, detail="参加中のシーズンが見つかりません")

    result = await db.execute(
        select(ChickenRace)
        .options(selectinload(ChickenRace.user))
        .where(
            ChickenRace.user_id == current_user.user_id,
            ChickenRace.season_id == season.season_id,
            ChickenRace.status == "alive",
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        return {"message": "チキンレースに参加していません"}

    now = datetime.now(timezone.utc)
    entry.status = "eliminated"
    entry.eliminated_at = now
    entry.elimination_reason = reason

    # 訃報投稿を自動作成
    obituary_text = build_obituary(
        nickname=current_user.nickname,
        reason=reason,
        survived_days=entry.survived_days,
        contamination_pt=current_user.contamination_pt,
    )
    obituary_post = Post(
        user_id=current_user.user_id,
        content=obituary_text[:140],
        post_type="elimination",
    )
    db.add(obituary_post)
    await db.commit()
    await db.refresh(entry, ["user"])

    # WebSocket ブロードキャスト
    await manager.broadcast({
        "type": "elimination",
        "entry": _serialize_entry(entry),
    })

    return {"message": "脱落しました。ご冥福をお祈りいたします。", "entry": _serialize_entry(entry)}
