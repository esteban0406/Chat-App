// src/auth/betterAuth.types.ts
import type { Auth } from "./betterAuth.js";

// Use Better Auth's inferred types via $Infer
export type Session = Auth["$Infer"]["Session"];
export type User = Session["user"];

// Extend User for YOUR custom fields and plugin fields
export interface SanitizedUser extends User {
  // From username plugin
  username?: string;
  displayUsername?: string;
  // Backward compatibility alias
  avatar?: string;
  // From your custom User model
  status?: string;
}

// AuthContext - simple headers for API calls
export interface AuthContext {
  headers?: Record<string, string | string[] | undefined>;
}
