from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from modules.auth.router import router as auth_router
from modules.users.friendships.router import router as friendships_router
from modules.users.router import router as users_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(title="Chat App API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGIN.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(friendships_router, prefix="/api")


@app.get("/")
async def health_check():
    return {"status": "ok"}
