import { toBackendURL } from "./backend-client";

const TOKEN_KEY = "accessToken";

function parseErrorMessage(body: { message?: string | string[] }, fallback: string): string {
  if (!body.message) return fallback;
  return Array.isArray(body.message) ? body.message.join(", ") : body.message;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  status: "ONLINE" | "OFFLINE";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Token management
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// Auth API calls
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(toBackendURL("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(parseErrorMessage(error, "Login failed"));
  }

  const data: AuthResponse = await response.json();
  setToken(data.accessToken);
  return data;
}

export async function register(
  email: string,
  password: string,
  username: string
): Promise<AuthResponse> {
  const response = await fetch(toBackendURL("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(parseErrorMessage(error, "Registration failed"));
  }

  const data: AuthResponse = await response.json();
  setToken(data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    await fetch(toBackendURL("/api/auth/logout"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  removeToken();
}

export async function getMe(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(toBackendURL("/api/auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      return null;
    }
    return null;
  }

  return response.json();
}

export async function updateUser(data: {
  username?: string;
}): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(toBackendURL("/api/users/me"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(parseErrorMessage(error, "Update failed"));
  }

  return response.json();
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
