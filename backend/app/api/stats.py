from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date

from app.database import get_db
from app.models.chicken_race import ChickenRace, Season

router = APIRouter()


@router.get("/survivors")
async def get_survivor_stats(db: AsyncSession = Depends(get_db)):
    season_result = await db.execute(
        select(Season).where(Season.status == "active").limit(1)
    )
    season = season_result.scalar_one_or_none()

    if not season:
        return {"survivor_count": 0, "today_eliminated": 0, "total_members": 0}

    survivor_count = await db.execute(
        select(func.count(ChickenRace.entry_id)).where(
            ChickenRace.season_id == season.season_id,
            ChickenRace.status == "alive",
        )
    )
    today_eliminated = await db.execute(
        select(func.count(ChickenRace.entry_id)).where(
            ChickenRace.season_id == season.season_id,
            ChickenRace.status == "eliminated",
            func.date(ChickenRace.eliminated_at) == date.today(),
        )
    )
    total_members = await db.execute(
        select(func.count(ChickenRace.entry_id)).where(
            ChickenRace.season_id == season.season_id,
        )
    )

    return {
        "survivor_count": survivor_count.scalar_one(),
        "today_eliminated": today_eliminated.scalar_one(),
        "total_members": total_members.scalar_one(),
    }
