from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.contamination import ContaminationLog
from app.models.chicken_race import ChickenRace, Season
from app.schemas.contamination import ContaminationReport
from app.core.auth import get_current_user
from app.utils.character_stage import compute_stage
from app.utils.obituary_template import build_obituary
from app.websocket.manager import manager

router = APIRouter()

# チキンレース脱落トリガーとなる就活行動
ELIMINATION_TRIGGERS = {"es", "internship_short", "internship_long", "naitei"}

ACTION_POINTS = {
    "es": 10,
    "briefing": 5,
    "internship_short": 20,
    "internship_long": 50,
    "ob_visit": 15,
    "spi": 8,
    "suit": 30,
    "naitei": 9999,
}


async def _auto_eliminate(user: User, reason: str, db: AsyncSession):
    """汚染申告がチキンレース脱落トリガーの場合、自動的に脱落処理する"""
    season_result = await db.execute(
        select(Season)
        .where(Season.status.in_(["active", "preseason"]))
        .order_by(Season.created_at.desc())
        .limit(1)
    )
    season = season_result.scalar_one_or_none()
    if not season:
        return

    entry_result = await db.execute(
        select(ChickenRace)
        .options(selectinload(ChickenRace.user))
        .where(
            ChickenRace.user_id == user.user_id,
            ChickenRace.season_id == season.season_id,
            ChickenRace.status == "alive",
        )
    )
    entry = entry_result.scalar_one_or_none()
    if not entry:
        return

    now = datetime.now(timezone.utc)
    entry.status = "eliminated"
    entry.eliminated_at = now
    entry.elimination_reason = reason

    obituary_text = build_obituary(
        nickname=user.nickname,
        reason=reason,
        survived_days=entry.survived_days,
        contamination_pt=user.contamination_pt,
    )
    db.add(Post(
        user_id=user.user_id,
        content=obituary_text[:140],
        post_type="elimination",
    ))

    await manager.broadcast({
        "type": "elimination",
        "entry": {
            "entry_id": entry.entry_id,
            "user_id": user.user_id,
            "user": {"nickname": user.nickname, "character_stage": user.character_stage},
            "status": "eliminated",
            "survived_days": entry.survived_days,
            "elimination_reason": reason,
            "eliminated_at": now.isoformat(),
        },
    })


@router.post("/report")
async def report_contamination(
    body: ContaminationReport,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    point = ACTION_POINTS.get(body.action_type, 0)
    source = body.source if body.source in ("manual", "reminder", "post") else "manual"

    if body.action_type == "naitei":
        current_user.is_banned = True
        current_user.character_stage = "banned"
        current_user.contamination_pt += point
        db.add(ContaminationLog(
            user_id=current_user.user_id,
            action_type=body.action_type,
            point_added=point,
            source=source,
        ))
        await _auto_eliminate(current_user, "naitei", db)
        await db.commit()
        return {"message": "内定おめでとうございます。クラブから追放されました。", "banned": True}

    current_user.contamination_pt += point
    current_user.streak_days = 0
    current_user.character_stage = compute_stage(current_user.contamination_pt)

    db.add(ContaminationLog(
        user_id=current_user.user_id,
        action_type=body.action_type,
        point_added=point,
        source=source,
    ))

    if body.action_type in ELIMINATION_TRIGGERS:
        await _auto_eliminate(current_user, body.action_type, db)

    await db.commit()
    return {
        "message": f"汚染ポイントが+{point}pt加算されました",
        "contamination_pt": current_user.contamination_pt,
        "character_stage": current_user.character_stage,
        "point_added": point,
        "eliminated_from_race": body.action_type in ELIMINATION_TRIGGERS,
    }
