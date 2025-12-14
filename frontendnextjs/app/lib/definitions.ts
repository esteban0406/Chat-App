export type User = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  provider: "local" | "google" | "microsoft";
  status: "online" | "offline" | "idle";
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  text: string;
  sender: string | User;
  channel: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
};

export type Channel = {
  id: string;
  name: string;
  type: "text" | "voice";
  server: string;
  messages?: string[] | Message[];
  createdAt: string;
  updatedAt: string;
};

export type Server = {
  id: string;
  name: string;
  description?: string;
  owner: string | User;
  members: string[] | User[];
  channels: string[] | Channel[];
  createdAt: string;
  updatedAt: string;
};

export type FriendRequest = {
  id: string;
  from: string | User;
  to: string | User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type ServerInvite = {
  id: string;
  from: string | User;
  to: string | User;
  server: string | Server;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
};
