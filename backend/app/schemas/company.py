from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class CompanyCreate(BaseModel):
    name: str
    mypage_url: Optional[str] = None
    status: str = "pending"
    deadline: Optional[date] = None
    memo: Optional[str] = None


class CompanyResponse(BaseModel):
    company_id: str
    user_id: str
    name: str
    mypage_url: Optional[str] = None
    status: str
    deadline: Optional[date] = None
    memo: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompanyPatch(BaseModel):
    name: Optional[str] = None
    mypage_url: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[date] = None
    memo: Optional[str] = None
