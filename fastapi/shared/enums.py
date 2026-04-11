import enum


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class UserStatus(str, enum.Enum):
    OFFLINE = "OFFLINE"
    ONLINE = "ONLINE"


class ChannelType(str, enum.Enum):
    TEXT = "TEXT"
    VOICE = "VOICE"


class ServerPermission(str, enum.Enum):
    CREATE_CHANNEL = "CREATE_CHANNEL"
    DELETE_CHANNEL = "DELETE_CHANNEL"
    DELETE_SERVER = "DELETE_SERVER"
    INVITE_MEMBER = "INVITE_MEMBER"
    REMOVE_MEMBER = "REMOVE_MEMBER"
    MANAGE_ROLES = "MANAGE_ROLES"
    RENAME_SERVER = "RENAME_SERVER"
