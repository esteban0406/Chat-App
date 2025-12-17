import { runWithEndpointContext } from "@better-auth/core/context";
import { getBetterAuth } from "../../auth/betterAuth.js";

let userCounter = 0;

const createInternalRunContext = (baseContext) => ({
  method: "TEST",
  path: "internal:better-auth-test-helper",
  headers: typeof Headers !== "undefined" ? new Headers() : undefined,
  request: undefined,
  context: {
    ...baseContext,
    returned: undefined,
    responseHeaders: undefined,
    session: null,
  },
});

const runWithAuthContext = async (operation) => {
  const { auth } = await getBetterAuth();
  const baseContext = await auth.$context;
  if (!baseContext?.internalAdapter) {
    throw new Error("Better Auth internal adapter not available for tests");
  }

  return runWithEndpointContext(
    createInternalRunContext(baseContext),
    () => operation(baseContext),
  );
};

export async function createBetterAuthTestUser({
  username,
  email,
  rememberMe = true,
} = {}) {
  userCounter += 1;
  const fallbackName = username ?? `test-user-${userCounter}`;
  const fallbackEmail = email ?? `test-user-${userCounter}@mail.com`;

  return runWithAuthContext(async (baseContext) => {
    const adapter = baseContext.internalAdapter;
    const user = await adapter.createUser({
      email: fallbackEmail.toLowerCase(),
      name: fallbackName,
      image: null,
      emailVerified: true,
      username: fallbackName,
    });

    if (!user) {
      throw new Error("Failed to create Better Auth test user");
    }

    const session = await adapter.createSession(user.id, rememberMe === false);
    if (!session) {
      throw new Error("Failed to create Better Auth session for test user");
    }

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email ?? fallbackEmail,
        username: user.name ?? fallbackName,
        ...user,
      },
    };
  });
}
