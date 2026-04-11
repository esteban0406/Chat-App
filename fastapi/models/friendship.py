import uuid
from datetime import datetime

from sqlalchemy import Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from models.base import Base
from shared.enums import RequestStatus


class Friendship(Base):
    __tablename__ = "friendships"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    receiver_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[RequestStatus] = mapped_column(
        SAEnum(RequestStatus, name="requeststatus", create_type=True),
        default=RequestStatus.PENDING,
        nullable=False,
        server_default=RequestStatus.PENDING.value,
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    sender: Mapped["User"] = relationship("User", foreign_keys="[Friendship.sender_id]")
    receiver: Mapped["User"] = relationship("User", foreign_keys="[Friendship.receiver_id]")
