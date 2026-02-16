import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AppLayout from "@/app/(main)/layout";

const mockReplace = jest.fn();
const mockIsAuthenticated = jest.fn();
const mockConnectSocket = jest.fn();
const mockDisconnectSocket = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
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
  isAuthenticated: () => mockIsAuthenticated(),
  getToken: jest.fn().mockReturnValue("fake-token"),
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

jest.mock("@/lib/NotificationContext", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="notification-provider">{children}</div>
  ),
}));

jest.mock("@/lib/CurrentUserContext", () => ({
  CurrentUserProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="current-user-provider">{children}</div>
  ),
}));

jest.mock("@/lib/ServersContext", () => ({
  ServersProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="servers-provider">{children}</div>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AppLayout (main layout)", () => {
  it("redirects to /login when not authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <AppLayout>
        <div data-testid="child-content">Child</div>
      </AppLayout>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("renders children wrapped in providers when authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(true);

    render(
      <AppLayout>
        <div data-testid="child-content">Child</div>
      </AppLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    expect(mockConnectSocket).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows Loading... while checking auth", () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <AppLayout>
        <div data-testid="child-content">Child</div>
      </AppLayout>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("calls disconnectSocket on unmount", async () => {
    mockIsAuthenticated.mockReturnValue(true);

    const { unmount } = render(
      <AppLayout>
        <div>Child</div>
      </AppLayout>
    );

    await waitFor(() => {
      expect(mockConnectSocket).toHaveBeenCalled();
    });

    unmount();

    expect(mockDisconnectSocket).toHaveBeenCalled();
  });
});
