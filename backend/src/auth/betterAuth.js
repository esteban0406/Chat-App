import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer, genericOAuth, microsoftEntraId, username, admin } from "better-auth/plugins";
import { toNodeHandler } from "better-auth/node";
import mongoose from "mongoose";

let cached;

export async function getBetterAuth() {
  if (cached) return cached;

  const client = mongoose.connection.getClient();
  const db = client.db();

  const plugins = [
    bearer(),
    username(),
    admin({
      defaultRole: "admin",
    }),
  ];

  if (process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET && process.env.MS_TENANT_ID) {
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

  const auth = betterAuth({
    baseURL: process.env.BACKEND_URL || `http://localhost:3000`,
    basePath: "/api/auth",
    trustedOrigins: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : undefined,
    secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db, { client }),
    emailAndPassword: { enabled: true },
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
  });

  cached = {
    auth,
    handler: toNodeHandler(auth),
  };

  return cached;
}
