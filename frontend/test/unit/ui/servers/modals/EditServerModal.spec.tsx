jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditServerModal from '@/ui/servers/modals/EditServerModal';
import { backendFetch, extractErrorMessage } from '@/lib/backend-client';
import { mockServer, mockUser2, mockMember, mockRole } from '../../../../helpers/fixtures';
import type { Server, Member } from '@/lib/definitions';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

const nonOwnerMember: Member = {
  id: 'member-2',
  userId: 'user-2',
  serverId: 'server-1',
  roleId: 'role-1',
  role: mockRole,
  user: mockUser2,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const serverWithMembers: Server = {
  ...mockServer,
  ownerId: 'user-1',
  members: [mockMember, nonOwnerMember],
};

describe('EditServerModal', () => {
  const defaultProps = {
    server: serverWithMembers,
    onClose: jest.fn(),
    onMemberRemoved: jest.fn(),
  };

  it('renders "Miembros de" heading with server name', () => {
    render(<EditServerModal {...defaultProps} />);

    expect(screen.getByText(`Miembros de ${serverWithMembers.name}`)).toBeInTheDocument();
  });

  it('renders non-owner members with remove button', () => {
    render(<EditServerModal {...defaultProps} />);

    // Non-owner member should have an Eliminar button
    expect(screen.getByText(/otheruser/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  it('does not render remove button for owner', () => {
    render(<EditServerModal {...defaultProps} />);

    // Owner member should NOT have an Eliminar button rendered for them
    // Only one Eliminar button for non-owner member
    const removeButtons = screen.getAllByRole('button', { name: 'Eliminar' });
    expect(removeButtons).toHaveLength(1);
  });

  it('remove member calls backendFetch with DELETE', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<EditServerModal {...defaultProps} />);

    const removeButton = screen.getByRole('button', { name: 'Eliminar' });
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/servers/${serverWithMembers.id}/members/${nonOwnerMember.id}`,
        { method: 'DELETE' }
      );
    });

    expect(defaultProps.onMemberRemoved).toHaveBeenCalledWith(nonOwnerMember.id);
  });

  it('displays error when remove fails', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Forbidden' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockExtractErrorMessage.mockResolvedValue('Failed to remove member');

    render(<EditServerModal {...defaultProps} />);

    const removeButton = screen.getByRole('button', { name: 'Eliminar' });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to remove member')).toBeInTheDocument();
    });
  });

  it('close button calls onClose', async () => {
    const user = userEvent.setup();
    render(<EditServerModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: 'Cerrar' });
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders null when server is falsy', () => {
    const { container } = render(
      <EditServerModal server={null as unknown as Server} onClose={jest.fn()} />
    );

    expect(container.innerHTML).toBe('');
  });
});
