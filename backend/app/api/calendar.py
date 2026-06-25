from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract

from app.database import get_db
from app.models.user import User
from app.models.calendar import CalendarEvent
from app.models.contamination import ContaminationLog
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate, CalendarNotificationSettings
from app.core.auth import get_current_user
from app.utils.character_stage import compute_stage

router = APIRouter()

# イベント種別 → 汚染ポイントのマッピング（申告経路B）
EVENT_TO_POINTS = {
    "es": 10,
    "briefing": 5,
    "internship_short": 20,
    "internship_long": 50,
    "ob_visit": 15,
    "spi": 8,
    "interview": 0,
    "other": 0,
}

# 汚染ポイントが発生するイベント種別（チキンレース脱落トリガー）
ELIMINATION_EVENT_TYPES = {"es", "internship_short", "internship_long"}


def _serialize_event(event: CalendarEvent) -> dict:
    return {
        "event_id": event.event_id,
        "user_id": event.user_id,
        "title": event.title,
        "event_type": event.event_type,
        "scheduled_at": event.scheduled_at.isoformat(),
        "remind_before": event.remind_before,
        "status": event.status,
        "memo": event.memo,
        "company_id": event.company_id,
        "completed_at": event.completed_at.isoformat() if event.completed_at else None,
        "notif_day_before": event.notif_day_before,
        "notif_one_hour": event.notif_one_hour,
        "notif_followup": event.notif_followup,
        "created_at": event.created_at.isoformat(),
        "contamination_points": EVENT_TO_POINTS.get(event.event_type, 0),
    }


@router.get("/events")
async def get_events(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalendarEvent)
        .where(
            CalendarEvent.user_id == current_user.user_id,
            extract("year", CalendarEvent.scheduled_at) == year,
            extract("month", CalendarEvent.scheduled_at) == month,
        )
        .order_by(CalendarEvent.scheduled_at)
    )
    return [_serialize_event(e) for e in result.scalars().all()]


@router.post("/events", status_code=201)
async def create_event(
    body: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = CalendarEvent(
        user_id=current_user.user_id,
        title=body.title,
        event_type=body.event_type,
        scheduled_at=body.scheduled_at,
        remind_before=body.remind_before,
        memo=body.memo,
        company_id=body.company_id,
        notif_day_before=body.notif_day_before,
        notif_one_hour=body.notif_one_hour,
        notif_followup=body.notif_followup,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return _serialize_event(event)


@router.get("/events/{event_id}")
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.event_id == event_id,
            CalendarEvent.user_id == current_user.user_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="イベントが見つかりません")
    return _serialize_event(event)


@router.patch("/events/{event_id}")
async def update_event(
    event_id: str,
    body: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.event_id == event_id,
            CalendarEvent.user_id == current_user.user_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="イベントが見つかりません")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    await db.commit()
    return _serialize_event(event)


@router.post("/events/{event_id}/complete")
async def complete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """「行った✅」— イベントを完了にして汚染ポイントを加算（申告経路B）"""
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.event_id == event_id,
            CalendarEvent.user_id == current_user.user_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="イベントが見つかりません")
    if event.status == "done":
        raise HTTPException(status_code=400, detail="既に完了済みです")

    now = datetime.now(timezone.utc)
    event.status = "done"
    event.completed_at = now

    points = EVENT_TO_POINTS.get(event.event_type, 0)
    if points > 0:
        current_user.contamination_pt += points
        current_user.streak_days = 0
        current_user.character_stage = compute_stage(current_user.contamination_pt)
        db.add(ContaminationLog(
            user_id=current_user.user_id,
            action_type=event.event_type,
            point_added=points,
        ))

        # チキンレース自動脱落
        if event.event_type in ELIMINATION_EVENT_TYPES:
            from app.api.chicken_race import _get_active_season
            from app.models.chicken_race import ChickenRace
            from app.models.post import Post
            from app.websocket.manager import manager
            from app.utils.obituary_template import build_obituary
            from sqlalchemy.orm import selectinload

            season = await _get_active_season(db)
            if season:
                entry_res = await db.execute(
                    select(ChickenRace)
                    .options(selectinload(ChickenRace.user))
                    .where(
                        ChickenRace.user_id == current_user.user_id,
                        ChickenRace.season_id == season.season_id,
                        ChickenRace.status == "alive",
                    )
                )
                entry = entry_res.scalar_one_or_none()
                if entry:
                    entry.status = "eliminated"
                    entry.eliminated_at = now
                    entry.elimination_reason = event.event_type
                    obituary = build_obituary(
                        nickname=current_user.nickname,
                        reason=event.event_type,
                        survived_days=entry.survived_days,
                        contamination_pt=current_user.contamination_pt,
                    )
                    db.add(Post(
                        user_id=current_user.user_id,
                        content=obituary[:140],
                        post_type="elimination",
                    ))
                    await manager.broadcast({
                        "type": "elimination",
                        "entry": {
                            "user_id": current_user.user_id,
                            "user": {"nickname": current_user.nickname},
                            "survived_days": entry.survived_days,
                            "elimination_reason": event.event_type,
                        },
                    })

    await db.commit()
    return {
        "message": "完了しました",
        "point_added": points,
        "contamination_pt": current_user.contamination_pt,
        "character_stage": current_user.character_stage,
    }


@router.post("/events/{event_id}/skip")
async def skip_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """「サボった🛋️」— イベントをスキップ済みにする"""
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.event_id == event_id,
            CalendarEvent.user_id == current_user.user_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="イベントが見つかりません")

    event.status = "skipped"
    await db.commit()
    return {"message": "スキップしました", "event": _serialize_event(event)}


@router.patch("/events/{event_id}/settings")
async def update_event_settings(
    event_id: str,
    body: CalendarNotificationSettings,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.event_id == event_id,
            CalendarEvent.user_id == current_user.user_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="イベントが見つかりません")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    await db.commit()
    return _serialize_event(event)


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.event_id == event_id,
            CalendarEvent.user_id == current_user.user_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="イベントが見つかりません")
    await db.delete(event)
    await db.commit()
