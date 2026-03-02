import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { FriendsProvider, useFriends } from "@/lib/context/FriendsContext";
import { User } from "@/lib/definitions";

const mockBackendFetch = jest.fn<Promise<unknown>, [string, ...unknown[]]>();
const mockUnwrapList = jest.fn<User[], [unknown, string]>();
const mockExtractErrorMessage = jest.fn<Promise<string>, [unknown, string]>();

jest.mock("@/lib/backend-client", () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...(args as [string, ...unknown[]])),
  unwrapList: (...args: unknown[]) => mockUnwrapList(...(args as [unknown, string])),
  extractErrorMessage: (...args: unknown[]) => mockExtractErrorMessage(...(args as [unknown, string])),
}));

const fakeFriends: User[] = [
  {
    id: "f1",
    email: "friend1@example.com",
    username: "friend1",
    avatarUrl: null,
    status: "ONLINE",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "f2",
    email: "friend2@example.com",
    username: "friend2",
    avatarUrl: null,
    status: "OFFLINE",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

function TestConsumer() {
  const { friends, loading, error, refreshFriends } = useFriends();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ?? "null"}</span>
      <span data-testid="count">{friends.length}</span>
      <span data-testid="names">{friends.map((f) => f.username).join(",")}</span>
      <button onClick={refreshFriends}>refresh</button>
    </div>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("FriendsContext", () => {
  it("fetches friends on mount and provides them", async () => {
    const body = { data: { friends: fakeFriends } };
    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);
    mockUnwrapList.mockReturnValue(fakeFriends);

    render(
      <FriendsProvider>
        <TestConsumer />
      </FriendsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(mockBackendFetch).toHaveBeenCalledWith("/api/friendships", { cache: "no-store" });
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("names").textContent).toBe("friend1,friend2");
    expect(screen.getByTestId("error").textContent).toBe("null");
  });

  it("shows loading state initially", async () => {
    let resolveBackend!: (value: unknown) => void;
    mockBackendFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveBackend = resolve;
      }),
    );

    render(
      <FriendsProvider>
        <TestConsumer />
      </FriendsProvider>,
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("count").textContent).toBe("0");

    const body = { data: { friends: fakeFriends } };
    mockUnwrapList.mockReturnValue(fakeFriends);

    await act(async () => {
      resolveBackend({
        ok: true,
        json: jest.fn().mockResolvedValue(body),
      } as unknown as Response);
    });

    expect(screen.getByTestId("loading").textContent).toBe("false");
  });

  it("handles API error and sets error message", async () => {
    const errorMsg = "Servidor no disponible";
    mockBackendFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: errorMsg }),
    } as unknown as Response);
    mockExtractErrorMessage.mockResolvedValue(errorMsg);

    render(
      <FriendsProvider>
        <TestConsumer />
      </FriendsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("error").textContent).toBe(errorMsg);
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("refreshFriends re-fetches", async () => {
    const body = { data: { friends: fakeFriends } };
    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);
    mockUnwrapList.mockReturnValue(fakeFriends);

    render(
      <FriendsProvider>
        <TestConsumer />
      </FriendsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(mockBackendFetch).toHaveBeenCalledTimes(1);

    const newFriend: User = {
      id: "f3",
      email: "friend3@example.com",
      username: "friend3",
      avatarUrl: null,
      status: "ONLINE",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    const updatedList = [...fakeFriends, newFriend];
    const updatedBody = { data: { friends: updatedList } };
    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(updatedBody),
    } as unknown as Response);
    mockUnwrapList.mockReturnValue(updatedList);

    await act(async () => {
      screen.getByRole("button", { name: "refresh" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(mockBackendFetch).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("count").textContent).toBe("3");
  });
});
