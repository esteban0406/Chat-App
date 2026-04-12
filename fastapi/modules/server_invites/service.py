from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import check_server_permission
from models.server_invite import ServerInvite
from modules.gateway.socket import emit_to_user
from modules.server_invites import repository
from modules.server_invites.schemas import SendServerInviteDTO
from shared import exceptions
from shared.enums import RequestStatus, ServerPermission


async def get_pending_invites(db: AsyncSession, user_id: str) -> list[ServerInvite]:
    return await repository.find_pending_received(db, user_id)


async def get_sent_invites(db: AsyncSession, user_id: str) -> list[ServerInvite]:
    return await repository.find_pending_sent(db, user_id)


async def send_invite(
    db: AsyncSession, sender_id: str, server_id: str, dto: SendServerInviteDTO
) -> ServerInvite:
    if dto.receiver_id == sender_id:
        raise exceptions.bad_request("No puedes invitarte a ti mismo")

    await check_server_permission(db, server_id, sender_id, ServerPermission.INVITE_MEMBER)

    receiver = await repository.get_user_by_id(db, dto.receiver_id)
    if not receiver:
        raise exceptions.not_found("Usuario no encontrado")

    already_member = await repository.get_member(db, server_id, dto.receiver_id)
    if already_member:
        raise exceptions.bad_request("El usuario ya es miembro del servidor")

    existing = await repository.find_existing_pending(db, sender_id, dto.receiver_id, server_id)
    if existing:
        raise exceptions.conflict("Ya existe una invitación pendiente para este usuario")

    invite = await repository.create(db, sender_id, dto.receiver_id, server_id)
    await emit_to_user(invite.receiver_id, "serverInvite:received", {
        "id": invite.id,
        "senderId": invite.sender_id,
        "receiverId": invite.receiver_id,
        "serverId": invite.server_id,
        "status": invite.status.value,
    })
    return invite


async def accept_invite(db: AsyncSession, invite_id: str, user_id: str) -> ServerInvite:
    invite = await repository.find_by_id(db, invite_id)
    if not invite:
        raise exceptions.not_found("Invitación no encontrada")
    if invite.receiver_id != user_id:
        raise exceptions.forbidden("No puedes aceptar esta invitación")
    if invite.status != RequestStatus.PENDING:
        raise exceptions.bad_request("La invitación ya fue respondida")

    await repository.add_member_to_server(db, invite.server_id, user_id)
    await repository.update_status(db, invite, RequestStatus.ACCEPTED)
    await db.commit()

    accepted = await repository.find_by_id(db, invite_id)
    await emit_to_user(accepted.sender_id, "serverInvite:accepted", {
        "inviteId": invite_id,
        "receiverId": user_id,
        "serverId": accepted.server_id,
        "serverName": accepted.server.name,
    })
    return accepted


async def reject_invite(db: AsyncSession, invite_id: str, user_id: str) -> ServerInvite:
    invite = await repository.find_by_id(db, invite_id)
    if not invite:
        raise exceptions.not_found("Invitación no encontrada")
    if invite.receiver_id != user_id:
        raise exceptions.forbidden("No puedes rechazar esta invitación")
    if invite.status != RequestStatus.PENDING:
        raise exceptions.bad_request("La invitación ya fue respondida")

    rejected = await repository.update_status(db, invite, RequestStatus.REJECTED)
    await emit_to_user(rejected.sender_id, "serverInvite:rejected", {
        "inviteId": invite_id,
        "receiverId": user_id,
        "serverId": rejected.server_id,
    })
    return rejected


async def cancel_invite(db: AsyncSession, invite_id: str, user_id: str) -> None:
    invite = await repository.find_by_id(db, invite_id)
    if not invite:
        raise exceptions.not_found("Invitación no encontrada")
    if invite.sender_id != user_id:
        raise exceptions.forbidden("No puedes cancelar esta invitación")
    if invite.status != RequestStatus.PENDING:
        raise exceptions.bad_request("La invitación ya fue respondida")

    await emit_to_user(invite.receiver_id, "serverInvite:cancelled", {
        "inviteId": invite_id,
        "cancelledBy": user_id,
        "serverId": invite.server_id,
    })
    await repository.delete(db, invite)
