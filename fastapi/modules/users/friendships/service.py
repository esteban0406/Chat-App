from sqlalchemy.ext.asyncio import AsyncSession

from models.friendship import Friendship
from models.user import User
from modules.gateway.socket import emit_to_user
from modules.users.friendships import repository
from modules.users.friendships.schemas import RespondRequestDTO, SendRequestDTO
from shared import exceptions
from shared.enums import RequestStatus


async def send_request(db: AsyncSession, sender: User, dto: SendRequestDTO) -> Friendship:
    if sender.id == dto.receiver_id:
        raise exceptions.bad_request("No puedes enviarte una solicitud a ti mismo")

    existing = await repository.find_existing(db, sender.id, dto.receiver_id)
    if existing:
        raise exceptions.conflict(
            "Ya existe una solicitud de amistad o amistad con este usuario"
        )

    friendship = await repository.create(db, sender.id, dto.receiver_id)
    await emit_to_user(friendship.receiver_id, "friendRequest:received", {
        "id": friendship.id,
        "senderId": friendship.sender_id,
        "receiverId": friendship.receiver_id,
        "status": friendship.status.value,
    })
    return friendship


async def respond_to_request(
    db: AsyncSession,
    current_user: User,
    friendship_id: str,
    dto: RespondRequestDTO,
) -> Friendship:
    friendship = await repository.find_by_id(db, friendship_id)
    if not friendship:
        raise exceptions.not_found("Solicitud de amistad no encontrada")
    if friendship.receiver_id != current_user.id:
        raise exceptions.forbidden("Solo el receptor puede responder a la solicitud")
    if friendship.status != RequestStatus.PENDING:
        raise exceptions.bad_request("La solicitud ya fue respondida")
    if dto.status not in (RequestStatus.ACCEPTED, RequestStatus.REJECTED):
        raise exceptions.bad_request("Estado inválido")

    friendship = await repository.update_status(db, friendship, dto.status)
    await emit_to_user(friendship.sender_id, "friendRequest:responded", {
        "id": friendship.id,
        "senderId": friendship.sender_id,
        "receiverId": friendship.receiver_id,
        "status": friendship.status.value,
    })
    return friendship


async def get_friends(db: AsyncSession, user: User) -> list[Friendship]:
    return await repository.get_friends(db, user.id)


async def get_pending(db: AsyncSession, user: User) -> list[Friendship]:
    return await repository.get_pending(db, user.id)


async def get_sent(db: AsyncSession, user: User) -> list[Friendship]:
    return await repository.get_sent(db, user.id)


async def remove_friend(db: AsyncSession, current_user: User, friendship_id: str) -> dict:
    friendship = await repository.find_by_id(db, friendship_id)
    if not friendship:
        raise exceptions.not_found("Amistad no encontrada")
    if friendship.sender_id != current_user.id and friendship.receiver_id != current_user.id:
        raise exceptions.forbidden("No tienes acceso a esta amistad")
    if friendship.status != RequestStatus.ACCEPTED:
        raise exceptions.bad_request("Esta solicitud no es una amistad activa")

    other_id = friendship.receiver_id if friendship.sender_id == current_user.id else friendship.sender_id
    await repository.delete(db, friendship)
    await emit_to_user(other_id, "friendship:removed", {
        "friendshipId": friendship_id,
        "removedBy": current_user.id,
    })
    return {"message": "Amistad eliminada exitosamente"}


async def cancel_request(db: AsyncSession, current_user: User, friendship_id: str) -> dict:
    friendship = await repository.find_by_id(db, friendship_id)
    if not friendship:
        raise exceptions.not_found("Solicitud de amistad no encontrada")
    if friendship.sender_id != current_user.id:
        raise exceptions.forbidden("Solo el remitente puede cancelar la solicitud")
    if friendship.status != RequestStatus.PENDING:
        raise exceptions.bad_request("La solicitud ya fue respondida")

    await emit_to_user(friendship.receiver_id, "friendRequest:cancelled", {
        "friendshipId": friendship_id,
        "cancelledBy": current_user.id,
    })
    await repository.delete(db, friendship)
    return {"message": "Solicitud cancelada exitosamente"}
