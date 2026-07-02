"""テスト用ユーザーとサンプルデータを投入する開発用シードスクリプト。

使い方（backend ディレクトリで venv を有効化した状態で）:

    python -m scripts.seed_test_user

冪等性: 既に同じメールのユーザーがいれば、そのユーザーのサンプルデータを
一度削除してから入れ直します。何度実行しても重複しません。

ログイン情報:
    email:    test@nnc.dev
    password: password123
"""

import asyncio
from datetime import datetime, timedelta

from sqlalchemy import delete, select

from app.core.auth import hash_password
from app.utils.character_stage import compute_stage
from app.database import AsyncSessionLocal, create_tables
from app.models.calendar import CalendarEvent
from app.models.chicken_race import ChickenRace, Season
from app.models.company import Company
from app.models.post import Post, Reaction
from app.models.user import User

TEST_EMAIL = "test@nnc.dev"
TEST_PASSWORD = "password123"


async def seed() -> None:
    # SQLite のテーブルがまだ無い場合に備えて作成
    await create_tables()

    async with AsyncSessionLocal() as db:
        # --- ユーザー（無ければ作成、有れば再利用） ---
        result = await db.execute(select(User).where(User.contact_email == TEST_EMAIL))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(
                nickname="テスト無い男",
                contact_email=TEST_EMAIL,
                password_hash=hash_password(TEST_PASSWORD),
                university="無職大学",
                faculty="ニート学部",
                grade=4,
                email_verified=True,  # ← 認証済みにしておく
                contamination_pt=120,
                character_stage=compute_stage(120),  # 120pt → machine(Lv6 面接マシーン)
                streak_days=37,
            )
            db.add(user)
            await db.flush()
        else:
            # パスワード等を既知の値に更新し、認証済みにする
            user.password_hash = hash_password(TEST_PASSWORD)
            user.email_verified = True
            user.contamination_pt = 120
            user.character_stage = compute_stage(120)  # machine(Lv6)
            user.streak_days = 37
            # 既存のサンプルデータを掃除（冪等性のため）
            await db.execute(delete(Reaction).where(Reaction.user_id == user.user_id))
            await db.execute(delete(Post).where(Post.user_id == user.user_id))
            await db.execute(delete(ChickenRace).where(ChickenRace.user_id == user.user_id))
            await db.execute(delete(CalendarEvent).where(CalendarEvent.user_id == user.user_id))
            await db.execute(delete(Company).where(Company.user_id == user.user_id))
            await db.flush()

        uid = user.user_id
        now = datetime.utcnow()

        # --- 投稿（タイムライン用） ---
        db.add_all([
            Post(
                user_id=uid,
                content="今日もESを書かずに昼まで寝た。順調。",
                post_type="daily",
                daily_skip="ES提出",
                daily_instead="二度寝",
                daily_comment="締め切り？知らない子ですね",
                created_at=now - timedelta(hours=2),
            ),
            Post(
                user_id=uid,
                content="説明会の予約画面を開いて、そっと閉じた。",
                post_type="normal",
                created_at=now - timedelta(hours=6),
            ),
            Post(
                user_id=uid,
                content="【訃報】同期がついに内定を取って追放された。安らかに眠れ。",
                post_type="elimination",
                created_at=now - timedelta(days=1),
            ),
        ])

        # --- チキンレース（シーズン + エントリー） ---
        result = await db.execute(select(Season).where(Season.status == "active"))
        season = result.scalar_one_or_none()
        if season is None:
            season = Season(
                name="第1期 内定回避シーズン",
                theme="梅雨を乗り切れ！内定回避マンスリー",
                status="active",
                started_at=now - timedelta(days=40),
            )
            db.add(season)
            await db.flush()

        db.add(ChickenRace(
            season_id=season.season_id,
            user_id=uid,
            status="alive",
            joined_at=now - timedelta(days=37),
            survived_days=37,
        ))

        # --- 企業リンク帳 ---
        company = Company(
            user_id=uid,
            name="株式会社ニートワークス",
            mypage_url="https://example.com/mypage",
            status="pending",
        )
        db.add(company)
        await db.flush()

        # --- カレンダーイベント ---
        db.add_all([
            CalendarEvent(
                user_id=uid,
                title="エントリーシート締め切り（無視予定）",
                event_type="es",
                scheduled_at=now + timedelta(days=3),
                status="pending",
                company_id=company.company_id,
                memo="出さない",
            ),
            CalendarEvent(
                user_id=uid,
                title="合同説明会",
                event_type="briefing",
                scheduled_at=now + timedelta(days=7),
                status="pending",
            ),
        ])

        await db.commit()

    print("✅ シード完了")
    print(f"   email:    {TEST_EMAIL}")
    print(f"   password: {TEST_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
