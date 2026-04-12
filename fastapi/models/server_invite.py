from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from models.base import Base
from shared.enums import RequestStatus

if TYPE_CHECKING:
    from models.server import Server
    from models.user import User


class ServerInvite(Base):
    __tablename__ = "server_invites"
    __table_args__ = (UniqueConstraint("sender_id", "receiver_id", "server_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    receiver_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    server_id: Mapped[str] = mapped_column(
        String, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[RequestStatus] = mapped_column(
        SAEnum(RequestStatus, name="requeststatus", create_type=False),
        default=RequestStatus.PENDING,
        nullable=False,
        server_default=RequestStatus.PENDING.value,
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    sender: Mapped[User] = relationship("User", foreign_keys="[ServerInvite.sender_id]")
    receiver: Mapped[User] = relationship("User", foreign_keys="[ServerInvite.receiver_id]")
    server: Mapped[Server] = relationship("Server", back_populates="invites")
