jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  unwrapList: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

jest.mock('@/lib/useNotificationSocket', () => ({
  useNotificationSocket: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FriendRequestsList from '@/ui/home/FriendRequestsList';
import { backendFetch, unwrapList, extractErrorMessage } from '@/lib/backend-client';
import { mockFriendship, mockUser } from '../../../helpers/fixtures';
import type { Friendship } from '@/lib/definitions';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockUnwrapList = unwrapList as jest.MockedFunction<typeof unwrapList>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

function setupLoadRequests(requests: Friendship[] = []) {
  const res = {
    ok: true,
    json: jest.fn().mockResolvedValue({ data: { requests } }),
  } as unknown as Response;

  mockBackendFetch.mockResolvedValueOnce(res);
  mockUnwrapList.mockReturnValueOnce(requests);
}

function setupLoadError(message = 'No se pudieron cargar las solicitudes') {
  const res = {
    ok: false,
    json: jest.fn().mockResolvedValue({ message }),
  } as unknown as Response;

  mockBackendFetch.mockResolvedValueOnce(res);
  mockExtractErrorMessage.mockResolvedValueOnce(message);
}

describe('FriendRequestsList', () => {
  it('shows loading state initially', () => {
    // Never resolve the fetch so it stays in loading
    mockBackendFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<FriendRequestsList />);

    expect(screen.getByText('Cargando solicitudes...')).toBeInTheDocument();
  });

  it('shows empty state when no pending requests', async () => {
    setupLoadRequests([]);

    render(<FriendRequestsList />);

    await waitFor(() => {
      expect(screen.getByText('No tienes solicitudes pendientes.')).toBeInTheDocument();
    });
  });

  it('renders requests with sender username and email', async () => {
    setupLoadRequests([mockFriendship]);

    render(<FriendRequestsList />);

    await waitFor(() => {
      expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    });

    expect(screen.getByText(`(${mockUser.email})`)).toBeInTheDocument();
  });

  it('accept button calls PATCH with ACCEPTED', async () => {
    const user = userEvent.setup();
    setupLoadRequests([mockFriendship]);

    render(<FriendRequestsList />);

    await waitFor(() => {
      expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    });

    const acceptRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValueOnce(acceptRes);

    const acceptButton = screen.getByRole('button', { name: 'Aceptar' });
    await user.click(acceptButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/friendships/${mockFriendship.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACCEPTED' }),
        },
      );
    });
  });

  it('reject button calls PATCH with REJECTED', async () => {
    const user = userEvent.setup();
    setupLoadRequests([mockFriendship]);

    render(<FriendRequestsList />);

    await waitFor(() => {
      expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    });

    const rejectRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValueOnce(rejectRes);

    const rejectButton = screen.getByRole('button', { name: 'Rechazar' });
    await user.click(rejectButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/friendships/${mockFriendship.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED' }),
        },
      );
    });
  });

  it('shows error when load fails', async () => {
    setupLoadError('Error de red');

    render(<FriendRequestsList />);

    await waitFor(() => {
      expect(screen.getByText('Error de red')).toBeInTheDocument();
    });
  });
});
