from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from modules.auth.router import router as auth_router
from modules.channels.router import router as channels_router
from modules.messages.router import router as messages_router
from modules.server_invites.router import router as server_invites_router
from modules.servers.roles.router import router as roles_router
from modules.servers.router import router as servers_router
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
app.include_router(servers_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(server_invites_router, prefix="/api")
app.include_router(channels_router, prefix="/api")
app.include_router(messages_router, prefix="/api")


@app.get("/")
async def health_check():
    return {"status": "ok"}
