import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServerSidebar from '@/ui/servers/ServerSidebar';
import { mockServer } from '../../../helpers/fixtures';
import type { Server } from '@/lib/definitions';

jest.mock('@/lib/ServersContext', () => ({
  useServers: jest.fn(),
}));

jest.mock('@/lib/NotificationContext', () => ({
  useNotifications: jest.fn(),
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

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useParams: jest.fn(() => ({})),
}));

// Mock CreateServerModal to avoid its internal dependencies
jest.mock('@/ui/servers/modals/CreateServerModal', () => {
  return function MockCreateServerModal({
    onClose,
  }: {
    onClose: () => void;
  }) {
    return (
      <div data-testid="create-server-modal">
        <button onClick={onClose}>Cerrar</button>
      </div>
    );
  };
});

import { useServers } from '@/lib/ServersContext';
import { useNotifications } from '@/lib/NotificationContext';

const mockUseServers = useServers as jest.MockedFunction<typeof useServers>;
const mockUseNotifications = useNotifications as jest.MockedFunction<
  typeof useNotifications
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseServers.mockReturnValue({
    servers: [],
    loading: false,
    refreshServers: jest.fn(),
  });
  mockUseNotifications.mockReturnValue({
    hasNewFriendRequests: false,
    hasNewServerInvites: false,
    clearFriendRequests: jest.fn(),
    clearServerInvites: jest.fn(),
  });
});

describe('ServerSidebar', () => {
  it('renders home link pointing to /home', () => {
    render(<ServerSidebar />);

    const links = screen.getAllByRole('link');
    const homeLink = links.find((link) => link.getAttribute('href') === '/home');
    expect(homeLink).toBeDefined();
  });

  it('renders server list with server initials', () => {
    const servers: Server[] = [
      mockServer,
      {
        ...mockServer,
        id: 'server-2',
        name: 'Another Server',
      },
    ];

    mockUseServers.mockReturnValue({
      servers,
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ServerSidebar />);

    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders server links with correct hrefs', () => {
    mockUseServers.mockReturnValue({
      servers: [mockServer],
      loading: false,
      refreshServers: jest.fn(),
    });

    render(<ServerSidebar />);

    const serverLink = screen.getByRole('link', { name: 'T' });
    expect(serverLink).toHaveAttribute('href', '/servers/server-1');
  });

  it('shows notification badge when hasNewFriendRequests is true', () => {
    mockUseNotifications.mockReturnValue({
      hasNewFriendRequests: true,
      hasNewServerInvites: false,
      clearFriendRequests: jest.fn(),
      clearServerInvites: jest.fn(),
    });

    const { container } = render(<ServerSidebar />);

    // The badge is a span with bg-ruby class inside the home link
    const badge = container.querySelector('.bg-ruby');
    expect(badge).toBeInTheDocument();
  });

  it('shows notification badge when hasNewServerInvites is true', () => {
    mockUseNotifications.mockReturnValue({
      hasNewFriendRequests: false,
      hasNewServerInvites: true,
      clearFriendRequests: jest.fn(),
      clearServerInvites: jest.fn(),
    });

    const { container } = render(<ServerSidebar />);

    const badge = container.querySelector('.bg-ruby');
    expect(badge).toBeInTheDocument();
  });

  it('does not show notification badge when no notifications', () => {
    const { container } = render(<ServerSidebar />);

    const badge = container.querySelector('.bg-ruby');
    expect(badge).not.toBeInTheDocument();
  });

  it('opens create server modal when "+" button is clicked', async () => {
    const user = userEvent.setup();

    render(<ServerSidebar />);

    expect(screen.queryByTestId('create-server-modal')).not.toBeInTheDocument();

    // Find the "+" button (it contains a Plus icon)
    const buttons = screen.getAllByRole('button');
    const plusButton = buttons.find(
      (btn) => !btn.textContent || btn.textContent.trim() === '',
    );
    expect(plusButton).toBeDefined();

    await user.click(plusButton!);

    expect(screen.getByTestId('create-server-modal')).toBeInTheDocument();
  });
});
