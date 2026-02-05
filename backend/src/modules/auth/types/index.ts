export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

export interface RequestWithUser {
  user: AuthenticatedUser;
}
