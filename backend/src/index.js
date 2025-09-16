import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import {
  requestLogger,
  unknownEndpoint,
  errorHandler,
} from "./utils/middleware.js";

// Rutas
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import serverRoutes from "./routes/server.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import messageRoutes from "./routes/message.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import serverInviteRoutes from "./routes/serverInvite.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://frontend:5173"],
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://frontend:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const MONGODB_URI = process.env.MONGODB_URI;
console.log("connecting to", MONGODB_URI);

// Middlewares
app.use(express.json());
app.use(requestLogger);

// Conectar DB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ connected to MongoDB");
  })
  .catch((error) => {
    console.log("❌ error connection to MongoDB:", error.message);
  });


// ✅ Registrar rutas REST
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/invites", serverInviteRoutes);


// Ruta simple de prueba
app.get("/", (req, res) => res.send("API funcionando 🚀"));

// 🔌 Sockets
io.on("connection", (socket) => {
  console.log("⚡ Cliente conectado:", socket.id);

  socket.on("message", (msg) => {
    io.emit("message", msg); // broadcast a todos los clientes
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
