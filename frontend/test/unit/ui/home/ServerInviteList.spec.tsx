jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  unwrapList: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

jest.mock('@/lib/useNotificationSocket', () => ({
  useNotificationSocket: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServerInviteList from '@/ui/home/ServerInviteList';
import { backendFetch, unwrapList, extractErrorMessage } from '@/lib/backend-client';
import { useRouter } from 'next/navigation';
import { mockServerInvite, mockServer } from '../../../helpers/fixtures';
import type { ServerInvite } from '@/lib/definitions';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockUnwrapList = unwrapList as jest.MockedFunction<typeof unwrapList>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

function setupLoadInvites(invites: ServerInvite[] = []) {
  const res = {
    ok: true,
    json: jest.fn().mockResolvedValue({ data: { invites } }),
  } as unknown as Response;

  mockBackendFetch.mockResolvedValueOnce(res);
  mockUnwrapList.mockReturnValueOnce(invites);
}

function setupLoadError(message = 'No se pudieron cargar las invitaciones') {
  const res = {
    ok: false,
    json: jest.fn().mockResolvedValue({ message }),
  } as unknown as Response;

  mockBackendFetch.mockResolvedValueOnce(res);
  mockExtractErrorMessage.mockResolvedValueOnce(message);
}

describe('ServerInviteList', () => {
  it('shows loading state initially', () => {
    mockBackendFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<ServerInviteList />);

    expect(screen.getByText('Cargando invitaciones...')).toBeInTheDocument();
  });

  it('shows empty state when no pending invites', async () => {
    setupLoadInvites([]);

    render(<ServerInviteList />);

    await waitFor(() => {
      expect(screen.getByText('No tienes invitaciones pendientes.')).toBeInTheDocument();
    });
  });

  it('renders invites with server name', async () => {
    setupLoadInvites([mockServerInvite]);

    render(<ServerInviteList />);

    await waitFor(() => {
      expect(screen.getByText(mockServer.name)).toBeInTheDocument();
    });
  });

  it('accept calls POST to accept endpoint and navigates', async () => {
    const user = userEvent.setup();
    setupLoadInvites([mockServerInvite]);

    render(<ServerInviteList />);

    await waitFor(() => {
      expect(screen.getByText(mockServer.name)).toBeInTheDocument();
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
        `/api/server-invites/${mockServerInvite.id}/accept`,
        { method: 'POST' },
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/servers/${mockServer.id}`);
    });
  });

  it('reject calls POST to reject endpoint', async () => {
    const user = userEvent.setup();
    setupLoadInvites([mockServerInvite]);

    render(<ServerInviteList />);

    await waitFor(() => {
      expect(screen.getByText(mockServer.name)).toBeInTheDocument();
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
        `/api/server-invites/${mockServerInvite.id}/reject`,
        { method: 'POST' },
      );
    });
  });

  it('shows error when load fails', async () => {
    setupLoadError('Error de conexión');

    render(<ServerInviteList />);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });
  });
});
