// src/server.ts
import express, { Express } from "express";
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

// =======================
// Types
// =======================
interface CreateServerOptions {
  extraRoutes?: (app: Express) => void;
}

interface ServerInstance {
  app: Express;
  server: http.Server;
}

// =======================
// Server Creation
// =======================
export async function createServer(
  options: CreateServerOptions = {}
): Promise<ServerInstance> {
  const { extraRoutes } = options;
  const app = express();
  const server = http.createServer(app);

  // =======================
  // Base middlewares
  // =======================
  app.use(cors(corsConfig));
  // Express 5.x: Handle preflight for all routes
  app.options(/.*/, cors(corsConfig));

  // =======================
  // MongoDB connection
  // =======================
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(
      NODE_ENV === "test"
        ? "Connected to MongoMemoryServer"
        : "Connected to MongoDB"
    );
  } catch (err) {
    const error = err as Error;
    console.error("DB connection error:", error.message);
    process.exit(1);
  }

  // =======================
  // Better Auth (REST endpoints under /api/auth/*)
  // Better Auth handles its own body parsing
  // =======================
  const { handler: betterAuthHandler } = await getBetterAuth();
  app.use("/api/auth", betterAuthHandler);

  // =======================
  // Parse JSON for the rest of the API
  // (Better Auth routes already handled above)
  // =======================
  app.use(express.json());
  app.use(requestLogger);

  // =======================
  // Socket.io configuration
  // =======================
  setupSocket(server);
  const io = getIO();

  // =======================
  // REST API routes - Service Registration
  // =======================
  registerUserService(app);
  registerServerService(app);
  registerServerInviteService(app);
  registerChannelService(app);
  registerMessageService(app, { io });
  registerFriendRequestService(app);
  app.use("/api/voice", voiceRoutes);

  // Extra routes for testing or extensions
  if (extraRoutes) {
    extraRoutes(app);
  }

  // =======================
  // Root & Error Handlers
  // =======================
  app.get("/", (req, res) => {
    res.send("API funcionando 🚀");
  });
  app.use(unknownEndpoint);
  app.use(errorHandler);

  return { app, server };
}

// =======================
// Server Startup
// =======================
export async function startServer(
  createServerFn: (options?: CreateServerOptions) => Promise<ServerInstance> = createServer
): Promise<void> {
  const { server } = await createServerFn();
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${NODE_ENV}`);
  });

  // Graceful shutdown handler
  process.once("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    
    try {
      await mongoose.disconnect();
      console.log("✅ MongoDB disconnected");
      
      server.close(() => {
        console.log("✅ HTTP server closed");
        console.log("👋 Goodbye!");
        process.exit(0);
      });
    } catch (err) {
      const error = err as Error;
      console.error("❌ Error during shutdown:", error.message);
      process.exit(1);
    }
  });
}