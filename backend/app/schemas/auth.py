from typing import Optional

from pydantic import BaseModel, field_validator


class SignUpRequest(BaseModel):
    nickname: str
    email: str
    password: str
    university: Optional[str] = None
    faculty: Optional[str] = None
    grade: Optional[int] = None

    @field_validator("nickname")
    @classmethod
    def nickname_length(cls, v: str) -> str:
        if not 1 <= len(v) <= 50:
            raise ValueError("ニックネームは1〜50文字で入力してください")
        return v

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("メールアドレスの形式が正しくありません")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("パスワードは8文字以上で入力してください")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    nickname: str
    email_verified: bool = False
