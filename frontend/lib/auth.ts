import { toBackendURL } from "./backend-client";

const TOKEN_KEY = "accessToken";
const DEMO_MODE_KEY = "isDemoMode";
const DEMO_TOUR_STEP_KEY = "demoTourStep";
const DEMO_TOUR_DONE_KEY = "demoTourCompleted";

function parseErrorMessage(body: { message?: string | string[]; detail?: string }, fallback: string): string {
  // FastAPI uses `detail`, NestJS used `message`
  if (body.detail) return body.detail;
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

export function setDemoMode(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_MODE_KEY, "true");
  localStorage.setItem(DEMO_TOUR_STEP_KEY, "0");
  localStorage.removeItem(DEMO_TOUR_DONE_KEY);
}

export function clearDemoMode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_MODE_KEY);
  localStorage.removeItem(DEMO_TOUR_STEP_KEY);
  localStorage.removeItem(DEMO_TOUR_DONE_KEY);
}

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_MODE_KEY) === "true";
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
  clearDemoMode();
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

export async function loginDemo(): Promise<AuthResponse> {
  const response = await fetch(toBackendURL("/api/auth/demo"), {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(parseErrorMessage(error, "Demo login failed"));
  }

  const data: AuthResponse = await response.json();
  setToken(data.accessToken);
  setDemoMode();
  return data;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
