import { User } from "./auth";

export type { User };

export type Message = {
  id: string;
  content: string;
  author: User;
  channelId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

export type Channel = {
  id: string;
  name: string;
  type: "TEXT" | "VOICE";
  serverId: string;
  server?: Server;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
};

export type Server = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: User;
  members?: Member[];
  channels?: Channel[];
  createdAt: string;
  updatedAt: string;
};

export type ServerPermission =
  | "CREATE_CHANNEL"
  | "DELETE_CHANNEL"
  | "DELETE_SERVER"
  | "INVITE_MEMBER"
  | "REMOVE_MEMBER"
  | "MANAGE_ROLES"
  | "RENAME_SERVER";

export type Role = {
  id: string;
  name: string;
  color?: string;
  serverId: string;
  permissions: ServerPermission[];
  createdAt: string;
  _count?: { members: number };
  members?: Member[];
};

export type Member = {
  id: string;
  userId: string;
  serverId: string;
  roleId?: string;
  role?: Role;
  user?: User;
  createdAt: string;
  updatedAt: string;
};

export type Friendship = {
  id: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export type ServerInvite = {
  id: string;
  senderId: string;
  receiverId: string;
  serverId: string;
  sender?: User;
  receiver?: User;
  server?: Server;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};
