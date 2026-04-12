from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from models.base import Base

if TYPE_CHECKING:
    from models.channel import Channel
    from models.server_invite import ServerInvite
    from models.user import User


class Server(Base):
    __tablename__ = "servers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    icon_url: Mapped[str | None] = mapped_column(String, nullable=True)
    owner_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    owner: Mapped[User] = relationship("User", foreign_keys="[Server.owner_id]")
    members: Mapped[list[Member]] = relationship(
        "Member", back_populates="server", cascade="all, delete-orphan"
    )
    channels: Mapped[list[Channel]] = relationship(
        "Channel", back_populates="server", cascade="all, delete-orphan"
    )
    roles: Mapped[list[Role]] = relationship(
        "Role", back_populates="server", cascade="all, delete-orphan"
    )
    invites: Mapped[list[ServerInvite]] = relationship(
        "ServerInvite", back_populates="server", cascade="all, delete-orphan"
    )


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str | None] = mapped_column(String, nullable=True)
    server_id: Mapped[str] = mapped_column(
        String, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    # Store as text[] — cast to/from ServerPermission enum in service layer
    permissions: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    server: Mapped[Server] = relationship("Server", back_populates="roles")
    members: Mapped[list[Member]] = relationship("Member", back_populates="role")


class Member(Base):
    __tablename__ = "members"
    __table_args__ = (UniqueConstraint("user_id", "server_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    server_id: Mapped[str] = mapped_column(
        String, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    role_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True
    )
    joined_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    user: Mapped[User] = relationship("User", foreign_keys="[Member.user_id]")
    server: Mapped[Server] = relationship("Server", back_populates="members")
    role: Mapped[Role | None] = relationship("Role", back_populates="members")
