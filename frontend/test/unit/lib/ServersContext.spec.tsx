import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { ServersProvider, useServers } from "@/lib/ServersContext";
import { Server } from "@/lib/definitions";

const mockBackendFetch = jest.fn<Promise<unknown>, [string, ...unknown[]]>();
const mockUnwrapList = jest.fn<Server[], [unknown, string]>();
const mockExtractErrorMessage = jest.fn<Promise<string>, [unknown, string]>();

jest.mock("@/lib/backend-client", () => ({
  backendFetch: (...args: unknown[]) => mockBackendFetch(...(args as [string, ...unknown[]])),
  unwrapList: (...args: unknown[]) => mockUnwrapList(...(args as [unknown, string])),
  extractErrorMessage: (...args: unknown[]) => mockExtractErrorMessage(...(args as [unknown, string])),
}));

const fakeServers: Server[] = [
  {
    id: "s1",
    name: "Server One",
    ownerId: "u1",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "s2",
    name: "Server Two",
    ownerId: "u2",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

function TestConsumer() {
  const { servers, loading, refreshServers } = useServers();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="count">{servers.length}</span>
      <span data-testid="names">{servers.map((s) => s.name).join(",")}</span>
      <button onClick={refreshServers}>refresh</button>
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

describe("ServersContext", () => {
  it("fetches servers on mount and provides them", async () => {
    const body = { data: { servers: fakeServers } };
    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);
    mockUnwrapList.mockReturnValue(fakeServers);

    render(
      <ServersProvider>
        <TestConsumer />
      </ServersProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(mockBackendFetch).toHaveBeenCalledWith("/api/servers", { cache: "no-store" });
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("names").textContent).toBe("Server One,Server Two");
  });

  it("handles error gracefully and sets empty array", async () => {
    mockBackendFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Error" }),
    } as unknown as Response);
    mockExtractErrorMessage.mockResolvedValue("No se pudieron cargar los servidores");

    render(
      <ServersProvider>
        <TestConsumer />
      </ServersProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("refreshServers re-fetches", async () => {
    const body = { data: { servers: fakeServers } };
    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);
    mockUnwrapList.mockReturnValue(fakeServers);

    render(
      <ServersProvider>
        <TestConsumer />
      </ServersProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(mockBackendFetch).toHaveBeenCalledTimes(1);

    const newServer: Server = {
      id: "s3",
      name: "Server Three",
      ownerId: "u1",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    const updatedList = [...fakeServers, newServer];
    const updatedBody = { data: { servers: updatedList } };
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
    expect(screen.getByTestId("names").textContent).toBe("Server One,Server Two,Server Three");
  });
});
