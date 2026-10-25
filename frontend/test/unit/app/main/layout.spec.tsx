import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AppLayout from "@/app/(main)/layout";

const mockReplace = jest.fn();
const mockCheckSession = jest.fn();
const mockConnectSocket = jest.fn();
const mockDisconnectSocket = jest.fn();

// Stable across renders, like Next's real router (the layout effect depends on it).
const mockRouter = {
  push: jest.fn(),
  replace: mockReplace,
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: jest.fn().mockReturnValue("/home"),
}));

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("@/lib/auth", () => ({
  checkSession: () => mockCheckSession(),
  getToken: jest.fn().mockReturnValue("fake-token"),
  isDemoMode: jest.fn().mockReturnValue(false),
}));

jest.mock("@/lib/socket", () => ({
  connectSocket: (...args: unknown[]) => mockConnectSocket(...args),
  disconnectSocket: (...args: unknown[]) => mockDisconnectSocket(...args),
}));

jest.mock("@/ui/servers/ServerSidebar", () => {
  return function MockServerSidebar() {
    return <div data-testid="server-sidebar" />;
  };
});

jest.mock("@/ui/user/UserProfileBar", () => {
  return function MockUserProfileBar() {
    return <div data-testid="user-profile-bar" />;
  };
});

jest.mock("@/ui/common/MobileDrawer", () => {
  return function MockMobileDrawer({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="mobile-drawer">{children}</div>;
  };
});

jest.mock("@/ui/layout/LayoutContext", () => ({
  LayoutContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout-provider">{children}</div>
  ),
  useLayoutContext: () => ({
    isServerDrawerOpen: false,
    isProfileDrawerOpen: false,
    isSectionSidebarOpen: false,
    openServerDrawer: jest.fn(),
    closeServerDrawer: jest.fn(),
    openSectionSidebar: jest.fn(),
    closeSectionSidebar: jest.fn(),
    openProfileDrawer: jest.fn(),
    closeProfileDrawer: jest.fn(),
  }),
}));

jest.mock("@/lib/context/NotificationContext", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="notification-provider">{children}</div>
  ),
}));

jest.mock("@/lib/context/CurrentUserContext", () => ({
  CurrentUserProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="current-user-provider">{children}</div>
  ),
}));

jest.mock("@/lib/context/ServersContext", () => ({
  ServersProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="servers-provider">{children}</div>
  ),
}));

const fakeUser = {
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
  mockCheckSession.mockResolvedValue({ status: "authenticated", user: fakeUser });
});

describe("AppLayout (main layout)", () => {
  const renderLayout = () =>
    render(
      <AppLayout>
        <div data-testid="child-content">Child</div>
      </AppLayout>
    );

  it("redirects to /login when the session is rejected", async () => {
    mockCheckSession.mockResolvedValue({ status: "unauthenticated" });

    renderLayout();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(mockConnectSocket).not.toHaveBeenCalled();
    expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
  });

  it("renders children wrapped in providers when authenticated", async () => {
    renderLayout();

    await waitFor(() => {
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    expect(mockConnectSocket).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows Loading... while checking the session", () => {
    mockCheckSession.mockReturnValue(new Promise(() => {}));

    renderLayout();

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("shows a connection error with retry when the backend is unreachable", async () => {
    mockCheckSession.mockResolvedValueOnce({ status: "unreachable" });

    renderLayout();

    expect(await screen.findByText("No se pudo conectar con el servidor.")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockConnectSocket).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => {
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
    expect(mockCheckSession).toHaveBeenCalledTimes(2);
    expect(mockConnectSocket).toHaveBeenCalled();
  });

  it("calls disconnectSocket on unmount", async () => {
    const { unmount } = renderLayout();

    await waitFor(() => {
      expect(mockConnectSocket).toHaveBeenCalled();
    });

    unmount();

    expect(mockDisconnectSocket).toHaveBeenCalled();
  });
});
