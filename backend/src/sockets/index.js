import { Server } from "socket.io";
import registerChatHandlers from "./chat.js";
import registerChannelHandlers from "./channels.js";

let io; 

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
