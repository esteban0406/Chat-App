"use client";

import { io, Socket } from "socket.io-client";
import { getToken } from "./auth";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  const token = getToken();

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,
      query: token ? { token } : undefined,
    });
  } else if (token) {
    socket.io.opts.query = { token };
  }

  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
