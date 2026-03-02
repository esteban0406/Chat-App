jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  unwrapList: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

jest.mock('@/lib/context/CurrentUserContext', () => ({
  useCurrentUser: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteForm from '@/ui/home/InviteForm';
import { backendFetch, unwrapList, extractErrorMessage } from '@/lib/backend-client';
import { useCurrentUser } from '@/lib/context/CurrentUserContext';
import { mockUser, mockUser2 } from '../../../helpers/fixtures';
import type { User } from '@/lib/auth';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockUnwrapList = unwrapList as jest.MockedFunction<typeof unwrapList>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;
const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCurrentUser.mockReturnValue({
    currentUser: mockUser,
    loading: false,
    refreshUser: jest.fn(),
  });
});

function setupFriendsLoad(friends: User[] = []) {
  const friendsRes = {
    ok: true,
    json: jest.fn().mockResolvedValue({ data: { friends } }),
  } as unknown as Response;

  mockBackendFetch.mockResolvedValueOnce(friendsRes);
  mockUnwrapList.mockReturnValueOnce(friends);
}

describe('InviteForm', () => {
  it('renders search input and button', () => {
    setupFriendsLoad();

    render(<InviteForm />);

    expect(screen.getByPlaceholderText('Nombre de usuario')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
  });

  it('search triggers API call and displays results', async () => {
    const user = userEvent.setup();
    setupFriendsLoad([]);

    render(<InviteForm />);

    const searchInput = screen.getByPlaceholderText('Nombre de usuario');
    await user.type(searchInput, 'otheruser');

    // Setup search response
    const searchRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { users: [mockUser2] } }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValueOnce(searchRes);
    mockUnwrapList.mockReturnValueOnce([mockUser2]);

    const searchButton = screen.getByRole('button', { name: 'Buscar' });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        '/api/users/search?username=otheruser',
      );
    });

    await waitFor(() => {
      expect(screen.getByText('otheruser')).toBeInTheDocument();
    });
  });

  it('invite button sends POST with receiverId', async () => {
    const user = userEvent.setup();
    setupFriendsLoad([]);

    render(<InviteForm />);

    // Trigger search first
    const searchInput = screen.getByPlaceholderText('Nombre de usuario');
    await user.type(searchInput, 'otheruser');

    const searchRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { users: [mockUser2] } }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValueOnce(searchRes);
    mockUnwrapList.mockReturnValueOnce([mockUser2]);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(screen.getByText('otheruser')).toBeInTheDocument();
    });

    // Setup invite response
    const inviteRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValueOnce(inviteRes);

    const inviteButton = screen.getByRole('button', { name: 'Invitar' });
    await user.click(inviteButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith('/api/friendships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: mockUser2.id }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText(`Invitación enviada a ${mockUser2.username}`)).toBeInTheDocument();
    });
  });

  it('displays error when search fails', async () => {
    const user = userEvent.setup();
    setupFriendsLoad([]);

    render(<InviteForm />);

    const searchInput = screen.getByPlaceholderText('Nombre de usuario');
    await user.type(searchInput, 'test');

    const errorRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'No se pudo buscar usuarios' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValueOnce(errorRes);
    mockExtractErrorMessage.mockResolvedValueOnce('No se pudo buscar usuarios');

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(screen.getByText('No se pudo buscar usuarios')).toBeInTheDocument();
    });
  });

  it('shows message when searching with empty input', async () => {
    const user = userEvent.setup();
    setupFriendsLoad([]);

    render(<InviteForm />);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(screen.getByText('Ingresa un nombre de usuario')).toBeInTheDocument();
    });
  });
});
