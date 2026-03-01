import React from "react";
import { render, screen } from "@testing-library/react";
import FriendsLayout from "@/app/(main)/home/layout";

const mockUsePathname = jest.fn();
const mockHasNewFriendRequests = jest.fn();
const mockHasNewServerInvites = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

jest.mock("@/lib/context/FriendsContext", () => ({
  FriendsProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useFriends: () => ({
    friends: [],
    loading: false,
    error: null,
    refreshFriends: jest.fn(),
  }),
}));

jest.mock("@/lib/context/NotificationContext", () => ({
  useNotifications: () => ({
    hasNewFriendRequests: mockHasNewFriendRequests(),
    hasNewServerInvites: mockHasNewServerInvites(),
    clearFriendRequests: jest.fn(),
    clearServerInvites: jest.fn(),
  }),
}));

jest.mock("@/ui/layout/SectionShell", () => {
  return function MockSectionShell({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="section-shell">{children}</div>;
  };
});

jest.mock("@/ui/home/FriendsSidebar", () => {
  return function MockFriendsSidebar() {
    return <div data-testid="friends-sidebar" />;
  };
});

jest.mock("@/ui/layout/LayoutContext", () => ({
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

jest.mock("lucide-react", () => ({
  Menu: () => <span data-testid="icon-menu" />,
  Users: () => <span data-testid="icon-users" />,
  CircleUser: () => <span data-testid="icon-circle-user" />,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePathname.mockReturnValue("/home");
  mockHasNewFriendRequests.mockReturnValue(false);
  mockHasNewServerInvites.mockReturnValue(false);
});

describe("FriendsLayout (home layout)", () => {
  it("renders tab links: Todos, Solicitudes de amistad, Solicitudes a servidores, Agregar amigos", () => {
    render(
      <FriendsLayout>
        <div>children</div>
      </FriendsLayout>
    );

    expect(screen.getAllByText("Todos").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Solicitudes de amistad").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Solicitudes a servidores").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders link to /home for Todos tab", () => {
    render(
      <FriendsLayout>
        <div>children</div>
      </FriendsLayout>
    );

    const todosLinks = screen.getAllByText("Todos");
    const link = todosLinks[0].closest("a");
    expect(link).toHaveAttribute("href", "/home");
  });

  it("renders link to /home/requests for Solicitudes de amistad", () => {
    render(
      <FriendsLayout>
        <div>children</div>
      </FriendsLayout>
    );

    const links = screen.getAllByText("Solicitudes de amistad");
    const link = links[0].closest("a");
    expect(link).toHaveAttribute("href", "/home/requests");
  });

  it("renders link to /home/server-requests for Solicitudes a servidores", () => {
    render(
      <FriendsLayout>
        <div>children</div>
      </FriendsLayout>
    );

    const links = screen.getAllByText("Solicitudes a servidores");
    const link = links[0].closest("a");
    expect(link).toHaveAttribute("href", "/home/server-requests");
  });

  it("renders the Agregar amigos link pointing to /home/add", () => {
    render(
      <FriendsLayout>
        <div>children</div>
      </FriendsLayout>
    );

    const addLinks = screen.getAllByText(/agregar amigo/i);
    const link = addLinks[0].closest("a");
    expect(link).toHaveAttribute("href", "/home/add");
  });

  it("renders children content", () => {
    render(
      <FriendsLayout>
        <div data-testid="child-content">My content</div>
      </FriendsLayout>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("shows notification dot for friend requests when hasNewFriendRequests is true and not on requests page", () => {
    mockUsePathname.mockReturnValue("/home");
    mockHasNewFriendRequests.mockReturnValue(true);

    const { container } = render(
      <FriendsLayout>
        <div>children</div>
      </FriendsLayout>
    );

    const dots = container.querySelectorAll(".bg-ruby");
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it("shows notification dot for server invites when hasNewServerInvites is true and not on server-requests page", () => {
    mockUsePathname.mockReturnValue("/home");
    mockHasNewServerInvites.mockReturnValue(true);

    const { container } = render(
      <FriendsLayout>
        <div>children</div>
      </FriendsLayout>
    );

    const dots = container.querySelectorAll(".bg-ruby");
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT show notification dot for friend requests when already on /home/requests", () => {
    mockUsePathname.mockReturnValue("/home/requests");
    mockHasNewFriendRequests.mockReturnValue(true);

    const { container } = render(
      <FriendsLayout>
        <div>children</div>
      </FriendsLayout>
    );

    const dots = container.querySelectorAll(".bg-ruby");
    expect(dots.length).toBe(0);
  });
});
