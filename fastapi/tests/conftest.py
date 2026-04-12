import os

# Load test environment BEFORE importing app (Settings() reads os.environ > env_file)
_env_path = os.path.join(os.path.dirname(__file__), "..", ".env.test")
with open(_env_path) as _f:
    for _line in _f:
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _key, _val = _line.split("=", 1)
            os.environ[_key.strip()] = _val.strip()

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from core.database import AsyncSessionLocal  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture
async def clean_db():
    async with AsyncSessionLocal() as session:
        await session.execute(
            text("TRUNCATE TABLE friendships, accounts, users RESTART IDENTITY CASCADE")
        )
        await session.commit()


@pytest.fixture
async def client(clean_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
