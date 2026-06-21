from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.core.auth import get_current_user

router = APIRouter()


def _serialize(c: Company) -> dict:
    return {
        "company_id": c.company_id,
        "user_id": c.user_id,
        "name": c.name,
        "mypage_url": c.mypage_url,
        "status": c.status,
        "deadline": c.deadline.isoformat() if c.deadline else None,
        "memo": c.memo,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    }


@router.get("")
async def get_companies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Company)
        .where(Company.user_id == current_user.user_id)
        .order_by(Company.created_at.desc())
    )
    return [_serialize(c) for c in result.scalars().all()]


@router.post("", status_code=201)
async def create_company(
    body: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company = Company(
        user_id=current_user.user_id,
        name=body.name,
        mypage_url=body.mypage_url,
        status=body.status,
        deadline=body.deadline,
        memo=body.memo,
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return _serialize(company)


@router.patch("/{company_id}")
async def update_company(
    company_id: str,
    body: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Company).where(
            Company.company_id == company_id,
            Company.user_id == current_user.user_id,
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="企業が見つかりません")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(company, field, value)
    await db.commit()
    return _serialize(company)


@router.delete("/{company_id}", status_code=204)
async def delete_company(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Company).where(
            Company.company_id == company_id,
            Company.user_id == current_user.user_id,
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="企業が見つかりません")
    await db.delete(company)
    await db.commit()
