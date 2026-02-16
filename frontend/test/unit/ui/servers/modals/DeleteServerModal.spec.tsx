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
import DeleteServerModal from '@/ui/servers/modals/DeleteServerModal';
import { backendFetch, extractErrorMessage } from '@/lib/backend-client';
import { mockServer } from '../../../../helpers/fixtures';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DeleteServerModal', () => {
  const defaultProps = {
    server: mockServer,
    onClose: jest.fn(),
    onDeleted: jest.fn(),
  };

  it('shows server name in confirmation text', () => {
    render(<DeleteServerModal {...defaultProps} />);

    expect(screen.getByText(mockServer.name)).toBeInTheDocument();
    expect(screen.getByText('Eliminar servidor')).toBeInTheDocument();
  });

  it('delete button calls backendFetch with DELETE and navigates to /home', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<DeleteServerModal {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: 'Eliminar' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/servers/${mockServer.id}`,
        { method: 'DELETE' }
      );
    });

    expect(defaultProps.onDeleted).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('displays error when backendFetch response is not ok', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Forbidden' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockExtractErrorMessage.mockResolvedValue('No se pudo eliminar el servidor');

    render(<DeleteServerModal {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: 'Eliminar' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('No se pudo eliminar el servidor')).toBeInTheDocument();
    });
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<DeleteServerModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders null when server is null', () => {
    const { container } = render(
      <DeleteServerModal server={null} onClose={jest.fn()} />
    );

    expect(container.innerHTML).toBe('');
  });
});
