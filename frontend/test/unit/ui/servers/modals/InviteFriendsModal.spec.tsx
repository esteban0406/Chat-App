jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  unwrapList: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteFriendsModal from '@/ui/servers/modals/InviteFriendsModal';
import { backendFetch, unwrapList } from '@/lib/backend-client';
import { mockServer, mockUser2 } from '../../../../helpers/fixtures';
import type { User } from '@/lib/auth';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockUnwrapList = unwrapList as jest.MockedFunction<typeof unwrapList>;

beforeEach(() => {
  jest.clearAllMocks();
});

// Friend who is NOT already a member of the server
const eligibleFriend: User = {
  id: 'user-3',
  email: 'friend3@example.com',
  username: 'friend3',
  avatarUrl: null,
  status: 'ONLINE',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('InviteFriendsModal', () => {
  const defaultProps = {
    server: mockServer,
    onClose: jest.fn(),
  };

  function setupMocks(friends: User[] = [], pendingInvites: unknown[] = []) {
    // First call = load friends, second call = load pending invites
    const friendsRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { friends } }),
    } as unknown as Response;

    const pendingRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { invites: pendingInvites } }),
    } as unknown as Response;

    mockBackendFetch
      .mockResolvedValueOnce(friendsRes)
      .mockResolvedValueOnce(pendingRes);

    mockUnwrapList
      .mockReturnValueOnce(friends)
      .mockReturnValueOnce(pendingInvites);
  }

  it('renders heading with server name', async () => {
    setupMocks();
    render(<InviteFriendsModal {...defaultProps} />);

    expect(screen.getByText(`Invitar amigos a ${mockServer.name}`)).toBeInTheDocument();
  });

  it('loads friends and filters out existing members', async () => {
    // mockUser (user-1) is already a member of mockServer
    setupMocks([mockUser2, eligibleFriend]);

    render(<InviteFriendsModal {...defaultProps} />);

    await waitFor(() => {
      // eligibleFriend (user-3) should be shown since not a member
      expect(screen.getByText('friend3')).toBeInTheDocument();
    });

    // mockUser2 (user-2) is not a member either, but let's check both appear
    // Actually mockUser (user-1) is the member, user-2 is not a member
    expect(screen.getByText('otheruser')).toBeInTheDocument();
  });

  it('shows empty state when no eligible friends', async () => {
    // Only friend is mockUser who IS a member (user-1 is in mockServer.members)
    const memberFriend: User = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      avatarUrl: null,
      status: 'ONLINE',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    setupMocks([memberFriend]);

    render(<InviteFriendsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No hay amigos disponibles para invitar.')).toBeInTheDocument();
    });
  });

  it('invite sends POST and shows success message', async () => {
    const user = userEvent.setup();
    setupMocks([eligibleFriend]);

    const inviteRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'invite-new',
        receiverId: eligibleFriend.id,
        serverId: mockServer.id,
      }),
    } as unknown as Response;

    render(<InviteFriendsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('friend3')).toBeInTheDocument();
    });

    // Now mock the invite call
    mockBackendFetch.mockResolvedValueOnce(inviteRes);

    const inviteButton = screen.getByRole('button', { name: 'Invitar' });
    await user.click(inviteButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/server-invites/server/${mockServer.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId: eligibleFriend.id }),
        }
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Invitación enviada')).toBeInTheDocument();
    });
  });

  it('close button calls onClose', async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<InviteFriendsModal {...defaultProps} />);

    // The close button is the X button
    const closeButton = screen.getByRole('button', { name: /✕/ });
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
