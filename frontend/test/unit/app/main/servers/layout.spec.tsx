import React from "react";
import { render, screen } from "@testing-library/react";
import ServerLayout from "@/app/(main)/servers/[serverId]/layout";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useParams: jest.fn().mockReturnValue({ serverId: "server-1" }),
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

jest.mock("@/ui/layout/SectionShell", () => {
  return function MockSectionShell({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="section-shell">{children}</div>;
  };
});

jest.mock("@/ui/channels/ChannelSidebar", () => {
  return function MockChannelSidebar() {
    return <div data-testid="channel-sidebar" />;
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

jest.mock("@/lib/context/ServersContext", () => ({
  useServers: () => ({
    servers: [],
    loading: false,
    refreshServers: jest.fn(),
  }),
}));

describe("ServerLayout", () => {
  it("renders children inside the SectionShell", () => {
    render(
      <ServerLayout>
        <div data-testid="child-content">Channel content</div>
      </ServerLayout>
    );

    expect(screen.getByTestId("section-shell")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Channel content")).toBeInTheDocument();
  });
});
