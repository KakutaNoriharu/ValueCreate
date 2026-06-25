import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, SignUpRequest, TokenResponse
from app.core.auth import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.contact_email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="このメールアドレスは既に使用されています")

    verify_token = secrets.token_urlsafe(32)
    user = User(
        nickname=body.nickname,
        contact_email=body.email.lower(),
        password_hash=hash_password(body.password),
        auth_type=body.auth_type,
        university=body.university,
        faculty=body.faculty,
        grade=body.grade,
        university_email=body.email.lower() if body.auth_type == "university" else None,
        email_verified=False,
        email_verify_token=verify_token,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # TODO: send verification email via Resend
    # send_verification_email(user.contact_email, verify_token)

    token = create_access_token(user.user_id)
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        auth_type=user.auth_type,
        nickname=user.nickname,
        email_verified=user.email_verified,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.contact_email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="このアカウントは追放されています")

    token = create_access_token(user.user_id)
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        auth_type=user.auth_type,
        nickname=user.nickname,
        email_verified=user.email_verified,
    )


@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email_verify_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="無効または期限切れの認証トークンです")

    user.email_verified = True
    user.email_verify_token = None
    await db.commit()
    return {"message": "メール認証が完了しました。クラブへようこそ！"}


