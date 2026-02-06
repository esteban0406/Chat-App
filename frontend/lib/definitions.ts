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

export type Member = {
  id: string;
  userId: string;
  serverId: string;
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
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
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
