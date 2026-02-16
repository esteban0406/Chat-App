jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteChannelModal from '@/ui/channels/modals/DeleteChannelModal';
import { backendFetch, extractErrorMessage } from '@/lib/backend-client';
import { mockChannel } from '../../../../helpers/fixtures';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DeleteChannelModal', () => {
  const defaultProps = {
    channel: mockChannel,
    onClose: jest.fn(),
    onDeleted: jest.fn(),
  };

  it('shows channel name in confirmation text', () => {
    render(<DeleteChannelModal {...defaultProps} />);

    expect(screen.getByText(`#${mockChannel.name}`)).toBeInTheDocument();
    expect(screen.getByText('Eliminar canal')).toBeInTheDocument();
  });

  it('delete button calls backendFetch with DELETE', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<DeleteChannelModal {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: 'Eliminar' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/servers/${mockChannel.serverId}/channels/${mockChannel.id}`,
        { method: 'DELETE' }
      );
    });

    expect(defaultProps.onDeleted).toHaveBeenCalledWith(mockChannel.id);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays error when backendFetch response is not ok', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Forbidden' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockExtractErrorMessage.mockResolvedValue('No se pudo eliminar el canal');

    render(<DeleteChannelModal {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: 'Eliminar' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('No se pudo eliminar el canal')).toBeInTheDocument();
    });
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<DeleteChannelModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
