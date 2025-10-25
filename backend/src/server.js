import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";

import { setupSocket, getIO } from "./sockets/index.js";
import {
  requestLogger,
  unknownEndpoint,
  errorHandler,
} from "./utils/middleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import serverRoutes from "./routes/server.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import createMessageRoutes from "./routes/message.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import serverInviteRoutes from "./routes/serverInvite.routes.js";
import voiceRoutes from "./routes/voice.routes.js";

import { corsConfig, MONGODB_URI, PORT } from "./config/config.js";

export async function createServer() {
  const app = express();
  const server = http.createServer(app);

  // Middlewares
  app.use(cors(corsConfig));
  app.use(express.json());
  app.use(requestLogger);

  // DB connection
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ connected to MongoDB");
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }

  // Sockets
  setupSocket(server);
  const io = getIO();

  // REST routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/servers", serverRoutes);
  app.use("/api/channels", channelRoutes);
  app.use("/api/messages", createMessageRoutes(io));
  app.use("/api/friends", friendRoutes);
  app.use("/api/invites", serverInviteRoutes);
  app.use("/api/voice", voiceRoutes);

  // Root
  app.get("/", (req, res) => res.send("API funcionando 🚀"));

  // Error handlers
  app.use(unknownEndpoint);
  app.use(errorHandler);

  return { app, server };
}

export async function startServer() {
  const { server } = await createServer();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("🛑 Shutting down...");
    await mongoose.disconnect();
    server.close(() => {
      console.log("👋 Server closed gracefully");
      process.exit(0);
    });
  });
}
