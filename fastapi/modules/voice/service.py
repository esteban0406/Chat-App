from livekit.api import AccessToken, VideoGrants

from core.config import settings


def generate_token(identity: str, room: str) -> dict:
    token = (
        AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        .with_identity(identity)
        .with_grants(
            VideoGrants(
                room_join=True,
                room=room,
                can_publish=True,
                can_subscribe=True,
                can_update_own_metadata=True,
            )
        )
    )
    return {"token": token.to_jwt(), "url": settings.LIVEKIT_URL}
