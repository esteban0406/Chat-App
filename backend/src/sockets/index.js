import { Server } from "socket.io";
import registerChatHandlers from "./chat.js";
import registerVoiceHandlers from "./voice.js";
import registerChannelHandlers from "./channels.js";

let io; // private reference

export function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://frontend:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ Cliente conectado:", socket.id);

    registerChatHandlers(io, socket);
    registerVoiceHandlers(io, socket);
    registerChannelHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("❌ Cliente desconectado:", socket.id);
    });
  });
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized yet!");
  return io;
}
