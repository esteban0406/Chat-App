jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateChannelModal from '@/ui/channels/modals/CreateChannelModal';
import { backendFetch, extractErrorMessage } from '@/lib/backend-client';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreateChannelModal', () => {
  const defaultProps = {
    serverId: 'server-1',
    onClose: jest.fn(),
    onCreated: jest.fn(),
  };

  it('renders "Crear canal" heading', () => {
    render(<CreateChannelModal {...defaultProps} />);

    expect(screen.getByText('Crear canal')).toBeInTheDocument();
  });

  it('renders name input and type selector', () => {
    render(<CreateChannelModal {...defaultProps} />);

    expect(screen.getByPlaceholderText('general')).toBeInTheDocument();
    expect(screen.getByText('Texto')).toBeInTheDocument();
    expect(screen.getByText('Voz')).toBeInTheDocument();
  });

  it('submit calls backendFetch with POST and correct body', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'new-channel-1' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<CreateChannelModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('general');
    await user.type(nameInput, 'my-channel');

    const submitButton = screen.getByRole('button', { name: 'Crear' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        '/api/servers/server-1/channels',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'my-channel', type: 'TEXT' }),
        }
      );
    });

    expect(defaultProps.onCreated).toHaveBeenCalledWith('new-channel-1');
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/servers/server-1/channels/new-channel-1');
  });

  it('displays error when backendFetch response is not ok', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Nombre duplicado' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockExtractErrorMessage.mockResolvedValue('Nombre duplicado');

    render(<CreateChannelModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('general');
    await user.type(nameInput, 'duplicate');

    const submitButton = screen.getByRole('button', { name: 'Crear' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Nombre duplicado')).toBeInTheDocument();
    });
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<CreateChannelModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('can select VOICE channel type', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'voice-1' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<CreateChannelModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('general');
    await user.type(nameInput, 'voice-room');

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'VOICE');

    const submitButton = screen.getByRole('button', { name: 'Crear' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        '/api/servers/server-1/channels',
        expect.objectContaining({
          body: JSON.stringify({ name: 'voice-room', type: 'VOICE' }),
        })
      );
    });
  });
});
