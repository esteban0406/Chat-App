export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  sessionId?: string;
}

export interface RequestWithUser {
  user: AuthenticatedUser;
}
