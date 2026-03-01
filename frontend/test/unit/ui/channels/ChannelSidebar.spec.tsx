import React from 'react';
import { render, screen } from '@testing-library/react';
import ChannelSidebar from '@/ui/channels/ChannelSidebar';
import {
  mockServer
} from '../../../helpers/fixtures';
import type { Server } from '@/lib/definitions';

jest.mock('@/lib/context/ServersContext', () => ({
  useServers: jest.fn(),
}));

jest.mock('@/lib/useServerPermissions', () => ({
  useServerPermissions: jest.fn(),
}));

jest.mock('@/ui/layout/LayoutContext', () => ({
  useLayoutContext: jest.fn(() => ({
    isSectionSidebarOpen: false,
    closeSectionSidebar: jest.fn(),
  })),
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  };
});

// Mock all modal components to avoid their internal dependencies
jest.mock('@/ui/channels/modals/CreateChannelModal', () => {
  return function MockModal() {
    return <div data-testid="create-channel-modal" />;
  };
});
jest.mock('@/ui/channels/modals/EditChannelModal', () => {
  return function MockModal() {
    return <div data-testid="edit-channel-modal" />;
  };
});
jest.mock('@/ui/channels/modals/DeleteChannelModal', () => {
  return function MockModal() {
    return <div data-testid="delete-channel-modal" />;
  };
});
jest.mock('@/ui/servers/modals/InviteFriendsModal', () => {
  return function MockModal() {
    return <div data-testid="invite-friends-modal" />;
  };
});
jest.mock('@/ui/servers/modals/EditServerModal', () => {
  return function MockModal() {
    return <div data-testid="edit-server-modal" />;
  };
});
jest.mock('@/ui/servers/modals/DeleteServerModal', () => {
  return function MockModal() {
    return <div data-testid="delete-server-modal" />;
  };
});
jest.mock('@/ui/servers/modals/ManageRolesModal', () => {
  return function MockModal() {
    return <div data-testid="manage-roles-modal" />;
  };
});
jest.mock('@/ui/servers/modals/RenameServerModal', () => {
  return function MockModal() {
    return <div data-testid="rename-server-modal" />;
  };
});

import { useServers } from '@/lib/context/ServersContext';
import { useServerPermissions } from '@/lib/useServerPermissions';
import { useParams } from 'next/navigation';

const mockUseServers = useServers as jest.MockedFunction<typeof useServers>;
const mockUseServerPermissions = useServerPermissions as jest.MockedFunction<
  typeof useServerPermissions
>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

beforeEach(() => {
  jest.clearAllMocks();

  mockUseServers.mockReturnValue({
    servers: [],
    loading: false,
    refreshServers: jest.fn(),
  });

  mockUseServerPermissions.mockReturnValue({
    hasPermission: jest.fn(() => true),
    isOwner: false,
    loading: false,
  });

  mockUseParams.mockReturnValue({});
});

describe('ChannelSidebar', () => {
  it('returns fallback message when no serverId in params', () => {
    render(<ChannelSidebar />);

    expect(
      screen.getByText('Selecciona un servidor para ver sus canales.'),
    ).toBeInTheDocument();
  });

  it('renders server name in header', () => {
    mockUseParams.mockReturnValue({
      serverId: 'server-1',
      channelId: 'channel-1',
    });
    mockUseServers.mockReturnValue({
      servers: [mockServer],
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ChannelSidebar />);

    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('shows text channel section heading', () => {
    mockUseParams.mockReturnValue({
      serverId: 'server-1',
      channelId: 'channel-1',
    });
    mockUseServers.mockReturnValue({
      servers: [mockServer],
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ChannelSidebar />);

    expect(screen.getByText('Canales de texto')).toBeInTheDocument();
  });

  it('shows voice channel section heading', () => {
    mockUseParams.mockReturnValue({
      serverId: 'server-1',
      channelId: 'channel-1',
    });
    mockUseServers.mockReturnValue({
      servers: [mockServer],
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ChannelSidebar />);

    expect(screen.getByText('Canales de voz')).toBeInTheDocument();
  });

  it('renders text channel links', () => {
    mockUseParams.mockReturnValue({
      serverId: 'server-1',
      channelId: 'channel-1',
    });
    mockUseServers.mockReturnValue({
      servers: [mockServer],
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ChannelSidebar />);

    const channelLink = screen.getByRole('link', { name: /general/ });
    expect(channelLink).toHaveAttribute(
      'href',
      '/servers/server-1/channels/channel-1',
    );
  });

  it('renders voice channel links', () => {
    mockUseParams.mockReturnValue({
      serverId: 'server-1',
      channelId: 'channel-1',
    });
    mockUseServers.mockReturnValue({
      servers: [mockServer],
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ChannelSidebar />);

    const voiceLink = screen.getByRole('link', { name: /voice-chat/ });
    expect(voiceLink).toHaveAttribute(
      'href',
      '/servers/server-1/channels/channel-2',
    );
  });

  it('shows "Aún no hay canales." when a section has no channels', () => {
    const serverNoChannels: Server = {
      ...mockServer,
      channels: [],
    };

    mockUseParams.mockReturnValue({
      serverId: 'server-1',
      channelId: undefined,
    });
    mockUseServers.mockReturnValue({
      servers: [serverNoChannels],
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ChannelSidebar />);

    const emptyMessages = screen.getAllByText('Aún no hay canales.');
    // Both text and voice sections should show the empty message
    expect(emptyMessages).toHaveLength(2);
  });

  it('falls back to "Servidor" when server is not found', () => {
    mockUseParams.mockReturnValue({
      serverId: 'nonexistent',
      channelId: undefined,
    });
    mockUseServers.mockReturnValue({
      servers: [mockServer],
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ChannelSidebar />);

    expect(screen.getByText('Servidor')).toBeInTheDocument();
  });
});
