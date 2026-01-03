// src/server.js
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
import voiceRoutes from "./routes/voice.routes.js";
import registerUserService, {
  registerFriendRequestService,
} from "./services/user/index.js";
import registerServerService, {
  registerServerInviteService,
} from "./services/server/index.js";
import registerChannelService from "./services/channel/index.js";
import registerMessageService from "./services/message/index.js";
import { getBetterAuth } from "./auth/betterAuth.js";
import { corsConfig, MONGODB_URI, PORT, NODE_ENV } from "./config/config.js";

export async function createServer(options = {}) {
  const { extraRoutes } = options;
  const app = express();
  const server = http.createServer(app);

  // =======================
  // Base middlewares
  // =======================
  app.use(cors(corsConfig));
  app.options(/.*/, cors(corsConfig));

  // =======================
  // MongoDB connection
  // =======================
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(
      NODE_ENV === "test"
        ? "Connected to MongoMemoryServer"
        : "Connected to MongoDB"
    );
  } catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1);
  }

  // =======================
  // Better Auth (REST endpoints under /api/auth/*)
  // =======================
  const { handler: betterAuthHandler } = await getBetterAuth();
  app.use("/api/auth", betterAuthHandler);

  // Parse JSON for the rest of the API
  app.use(express.json());
  app.use(requestLogger);

  // =======================
  // Socket configuration
  // =======================
  setupSocket(server);
  const io = getIO();

  // =======================
  // REST API routes
  // =======================
  registerUserService(app);
  registerServerService(app);
  registerServerInviteService(app);
  registerChannelService(app);
  registerMessageService(app, { io });
  registerFriendRequestService(app);
  app.use("/api/voice", voiceRoutes);

  if (typeof extraRoutes === "function") {
    extraRoutes(app);
  }

  // =======================
  // Root & Error Handlers
  // =======================
  app.get("/", (req, res) => res.send("API funcionando 🚀"));
  app.use(unknownEndpoint);
  app.use(errorHandler);

  return { app, server };
}

export async function startServer(createServerFn = createServer) {
  const { server } = await createServerFn();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  process.once("SIGINT", async () => {
    console.log("🛑 Shutting down...");
    await mongoose.disconnect();
    server.close(() => {
      console.log("👋 Server closed gracefully");
      process.exit(0);
    });
  });
}
