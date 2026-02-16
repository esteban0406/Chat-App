import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { CurrentUserProvider, useCurrentUser } from "@/lib/CurrentUserContext";
import { User } from "@/lib/auth";

const mockGetMe = jest.fn<Promise<User | null>, []>();

jest.mock("@/lib/auth", () => ({
  getMe: (...args: unknown[]) => mockGetMe(...(args as [])),
}));

function TestConsumer() {
  const { currentUser, loading, refreshUser } = useCurrentUser();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{currentUser ? currentUser.username : "null"}</span>
      <button onClick={refreshUser}>refresh</button>
    </div>
  );
}

const fakeUser: User = {
  id: "u1",
  email: "test@example.com",
  username: "testuser",
  avatarUrl: null,
  status: "ONLINE",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CurrentUserContext", () => {
  it("calls getMe on mount and provides user", async () => {
    mockGetMe.mockResolvedValue(fakeUser);

    render(
      <CurrentUserProvider>
        <TestConsumer />
      </CurrentUserProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(mockGetMe).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("user").textContent).toBe("testuser");
  });

  it("shows loading true while fetching", async () => {
    let resolveGetMe!: (value: User | null) => void;
    mockGetMe.mockReturnValue(
      new Promise<User | null>((resolve) => {
        resolveGetMe = resolve;
      }),
    );

    render(
      <CurrentUserProvider>
        <TestConsumer />
      </CurrentUserProvider>,
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("null");

    await act(async () => {
      resolveGetMe(fakeUser);
    });

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("testuser");
  });

  it("refreshUser re-fetches the user", async () => {
    mockGetMe.mockResolvedValue(fakeUser);

    render(
      <CurrentUserProvider>
        <TestConsumer />
      </CurrentUserProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(mockGetMe).toHaveBeenCalledTimes(1);

    const updatedUser: User = { ...fakeUser, username: "updated" };
    mockGetMe.mockResolvedValue(updatedUser);

    await act(async () => {
      screen.getByRole("button", { name: "refresh" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(mockGetMe).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("user").textContent).toBe("updated");
  });
});
