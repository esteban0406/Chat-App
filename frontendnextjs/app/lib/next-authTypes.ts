import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    username?: string;
    accessToken?: string;
    avatar?: string;
  }

  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id?: string;
      email?: string;
      username?: string;
      avatar?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    username?: string;
  }
}
