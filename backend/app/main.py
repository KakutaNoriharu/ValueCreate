from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables
from app.api import auth, users, posts, contamination, chicken_race, calendar, companies, stats
from app.websocket.manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(title="NNC API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])
app.include_router(contamination.router, prefix="/api/contamination", tags=["contamination"])
app.include_router(chicken_race.router, prefix="/api/chicken-race", tags=["chicken-race"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])


@app.websocket("/ws/survivors")
async def ws_survivors(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/health")
async def health():
    return {"status": "ok"}
