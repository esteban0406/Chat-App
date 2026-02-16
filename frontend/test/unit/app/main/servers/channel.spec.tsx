import React from "react";
import { render, screen } from "@testing-library/react";
import ChannelPage from "@/app/(main)/servers/[serverId]/channels/[channelId]/page";
import { mockServer, mockChannel, mockVoiceChannel, mockUser } from "../../../../helpers/fixtures";

const mockUseParams = jest.fn();
const mockUseServers = jest.fn();
const mockUseCurrentUser = jest.fn();
const mockUseMessages = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useParams: () => mockUseParams(),
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

jest.mock("@/lib/ServersContext", () => ({
  useServers: () => mockUseServers(),
}));

jest.mock("@/lib/CurrentUserContext", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

jest.mock("@/ui/messages/useMessages", () => ({
  useMessages: (...args: unknown[]) => mockUseMessages(...args),
}));

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

jest.mock("@/ui/messages/ChatMessages", () => {
  return function MockChatMessages() {
    return <div data-testid="chat-messages">ChatMessages</div>;
  };
});

jest.mock("@/ui/messages/ChatInput", () => {
  return function MockChatInput() {
    return <div data-testid="chat-input">ChatInput</div>;
  };
});

jest.mock("@/ui/voice/VoiceRoom", () => {
  return function MockVoiceRoom() {
    return <div data-testid="voice-room">VoiceRoom</div>;
  };
});

jest.mock("lucide-react", () => ({
  Menu: () => <span data-testid="icon-menu" />,
  Hash: () => <span data-testid="icon-hash" />,
  Volume2: () => <span data-testid="icon-volume" />,
  CircleUser: () => <span data-testid="icon-circle-user" />,
}));

beforeEach(() => {
  jest.clearAllMocks();

  mockUseParams.mockReturnValue({
    serverId: mockServer.id,
    channelId: mockChannel.id,
  });

  mockUseServers.mockReturnValue({
    servers: [mockServer],
    loading: false,
    refreshServers: jest.fn(),
  });

  mockUseCurrentUser.mockReturnValue({
    currentUser: mockUser,
    loading: false,
    refreshUser: jest.fn(),
  });

  mockUseMessages.mockReturnValue({
    messages: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
  });
});

describe("ChannelPage", () => {
  it("renders the channel name for a TEXT channel", () => {
    render(<ChannelPage />);

    expect(screen.getByText(mockChannel.name)).toBeInTheDocument();
  });

  it("shows ChatMessages and ChatInput for a TEXT channel", () => {
    render(<ChannelPage />);

    expect(screen.getByTestId("chat-messages")).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
    expect(screen.queryByTestId("voice-room")).not.toBeInTheDocument();
  });

  it("shows VoiceRoom for a VOICE channel", () => {
    mockUseParams.mockReturnValue({
      serverId: mockServer.id,
      channelId: mockVoiceChannel.id,
    });

    render(<ChannelPage />);

    expect(screen.getByTestId("voice-room")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-messages")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat-input")).not.toBeInTheDocument();
  });

  it("shows a fallback channel name when channel is not found", () => {
    mockUseParams.mockReturnValue({
      serverId: mockServer.id,
      channelId: "unknown-channel",
    });

    render(<ChannelPage />);

    expect(screen.getByText("Canal unknown-channel")).toBeInTheDocument();
  });

  it("passes channelId to useMessages", () => {
    render(<ChannelPage />);

    expect(mockUseMessages).toHaveBeenCalledWith(mockChannel.id);
  });
});
