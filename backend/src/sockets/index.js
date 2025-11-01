import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import registerChatHandlers from "./chat.js";
import registerChannelHandlers from "./channels.js";
import { corsConfig } from "../config/config.js"; 

let io;

export function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: corsConfig.origin, 
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);

    // --- Attach user if JWT is valid ---
    const token = socket.handshake?.query?.token;
    if (token && typeof token === "string") {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.userId = decoded?.id || decoded?._id;
      } catch (err) {
        console.warn("⚠️ Invalid socket token:", err.message);
      }
    }

    // --- Register handlers ---
    registerChatHandlers(io, socket);
    registerChannelHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized yet!");
  return io;
}
