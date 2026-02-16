jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditChannelModal from '@/ui/channels/modals/EditChannelModal';
import { backendFetch, extractErrorMessage } from '@/lib/backend-client';
import { mockChannel } from '../../../../helpers/fixtures';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('EditChannelModal', () => {
  const defaultProps = {
    channel: mockChannel,
    onClose: jest.fn(),
    onUpdated: jest.fn(),
  };

  it('renders "Editar canal" heading', () => {
    render(<EditChannelModal {...defaultProps} />);

    expect(screen.getByText('Editar canal')).toBeInTheDocument();
  });

  it('pre-fills name input with channel name', () => {
    render(<EditChannelModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('general');
  });

  it('submit calls backendFetch with PATCH and updated name', async () => {
    const user = userEvent.setup();
    const updatedChannel = { ...mockChannel, name: 'updated-name' };
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { channel: updatedChannel } }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<EditChannelModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'updated-name');

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/servers/${mockChannel.serverId}/channels/${mockChannel.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'updated-name' }),
        }
      );
    });

    expect(defaultProps.onUpdated).toHaveBeenCalledWith(updatedChannel);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays error when backendFetch response is not ok', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Forbidden' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockExtractErrorMessage.mockResolvedValue('No se pudo actualizar el canal');

    render(<EditChannelModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'new-name');

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('No se pudo actualizar el canal')).toBeInTheDocument();
    });
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<EditChannelModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
