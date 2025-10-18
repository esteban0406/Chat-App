import { Server } from "socket.io";
import jwt from "jsonwebtoken";
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

    socket.data = socket.data || {};

    const token = socket.handshake?.query?.token;
    if (token && typeof token === "string") {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.userId = decoded?.id || decoded?._id;
      } catch (err) {
        console.warn("⚠️  Invalid socket token:", err.message);
      }
    }

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
