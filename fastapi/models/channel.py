from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from models.base import Base
from shared.enums import ChannelType

if TYPE_CHECKING:
    from models.message import Message
    from models.server import Server


class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    server_id: Mapped[str] = mapped_column(
        String, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[ChannelType] = mapped_column(
        SAEnum(ChannelType, name="channeltype", create_type=True),
        default=ChannelType.TEXT,
        nullable=False,
        server_default=ChannelType.TEXT.value,
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    server: Mapped[Server] = relationship("Server", back_populates="channels")
    messages: Mapped[list[Message]] = relationship(
        "Message", back_populates="channel", cascade="all, delete-orphan"
    )
