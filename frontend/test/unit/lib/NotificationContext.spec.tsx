import React from "react";
import { render, screen, act } from "@testing-library/react";
import { NotificationProvider, useNotifications } from "@/lib/context/NotificationContext";

type SocketCallbacks = {
  onFriendRequestReceived?: () => void;
  onServerInviteReceived?: () => void;
};

let capturedCallbacks: SocketCallbacks = {};

jest.mock("@/lib/useNotificationSocket", () => ({
  useNotificationSocket: (cbs: SocketCallbacks) => {
    capturedCallbacks = cbs;
  },
}));

function TestConsumer() {
  const {
    hasNewFriendRequests,
    hasNewServerInvites,
    clearFriendRequests,
    clearServerInvites,
  } = useNotifications();
  return (
    <div>
      <span data-testid="friend-requests">{String(hasNewFriendRequests)}</span>
      <span data-testid="server-invites">{String(hasNewServerInvites)}</span>
      <button onClick={clearFriendRequests}>clearFR</button>
      <button onClick={clearServerInvites}>clearSI</button>
    </div>
  );
}

beforeEach(() => {
  capturedCallbacks = {};
});

describe("NotificationContext", () => {
  it("initially hasNewFriendRequests and hasNewServerInvites are false", () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    expect(screen.getByTestId("friend-requests").textContent).toBe("false");
    expect(screen.getByTestId("server-invites").textContent).toBe("false");
  });

  it("sets hasNewFriendRequests to true when onFriendRequestReceived fires", () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    expect(screen.getByTestId("friend-requests").textContent).toBe("false");

    act(() => {
      capturedCallbacks.onFriendRequestReceived?.();
    });

    expect(screen.getByTestId("friend-requests").textContent).toBe("true");
  });

  it("sets hasNewServerInvites to true when onServerInviteReceived fires", () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    expect(screen.getByTestId("server-invites").textContent).toBe("false");

    act(() => {
      capturedCallbacks.onServerInviteReceived?.();
    });

    expect(screen.getByTestId("server-invites").textContent).toBe("true");
  });

  it("clearFriendRequests resets the flag", () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    act(() => {
      capturedCallbacks.onFriendRequestReceived?.();
    });
    expect(screen.getByTestId("friend-requests").textContent).toBe("true");

    act(() => {
      screen.getByRole("button", { name: "clearFR" }).click();
    });
    expect(screen.getByTestId("friend-requests").textContent).toBe("false");
  });

  it("clearServerInvites resets the flag", () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    act(() => {
      capturedCallbacks.onServerInviteReceived?.();
    });
    expect(screen.getByTestId("server-invites").textContent).toBe("true");

    act(() => {
      screen.getByRole("button", { name: "clearSI" }).click();
    });
    expect(screen.getByTestId("server-invites").textContent).toBe("false");
  });
});
