// src/auth/betterAuth.ts
import { betterAuth, BetterAuthOptions } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import {
  bearer,
  genericOAuth,
  microsoftEntraId,
  username,
  admin
} from "better-auth/plugins";
import { toNodeHandler } from "better-auth/node";
import mongoose from "mongoose";
import { User } from "../services/user/user.model.js";

interface BetterAuthInstance {
  auth: ReturnType<typeof betterAuth>;
  handler: ReturnType<typeof toNodeHandler>;
}

let cached: BetterAuthInstance | null = null;

export async function getBetterAuth(): Promise<BetterAuthInstance> {
  if (cached) return cached;

  // Ensure MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB must be connected before initializing Better Auth");
  }

  const client = mongoose.connection.getClient();
  const db = client.db();

  // Build plugins array dynamically
  const plugins: BetterAuthOptions["plugins"] = [
    bearer(),
    username(),
    admin({
      defaultRole: "admin",
    }),
  ];

  // Add Microsoft OAuth if credentials are available
  if (
    process.env.MS_CLIENT_ID &&
    process.env.MS_CLIENT_SECRET &&
    process.env.MS_TENANT_ID
  ) {
    plugins.push(
      genericOAuth({
        config: [
          microsoftEntraId({
            clientId: process.env.MS_CLIENT_ID,
            clientSecret: process.env.MS_CLIENT_SECRET,
            tenantId: process.env.MS_TENANT_ID,
          }),
        ],
      })
    );
  }

  // Validate required environment variables
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
  }

  const auth = betterAuth({
    baseURL: process.env.BACKEND_URL || "http://localhost:3000",
    basePath: "/api/auth",
    trustedOrigins: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : undefined,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db, { client }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {},
    plugins,
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path.startsWith("/sign-up")) {
          const newSession = ctx.context.newSession;
          if (newSession?.user) {
            await User.create({ authUserId: newSession.user.id });
          }
        }
      }),
    },
  });

  cached = {
    auth,
    handler: toNodeHandler(auth),
  };

  return cached;
}

// Helper to get the auth instance (for use in middleware/services)
export async function getAuthInstance() {
  const { auth } = await getBetterAuth();
  return auth;
}

// Export type for $Infer usage in betterAuth.types.ts
export type Auth = Awaited<ReturnType<typeof getBetterAuth>>["auth"];