jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RenameServerModal from '@/ui/servers/modals/RenameServerModal';
import { backendFetch, extractErrorMessage } from '@/lib/backend-client';
import { mockServer } from '../../../../helpers/fixtures';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RenameServerModal', () => {
  const defaultProps = {
    server: mockServer,
    onClose: jest.fn(),
    onRenamed: jest.fn(),
  };

  it('renders heading "Cambiar nombre del servidor"', () => {
    render(<RenameServerModal {...defaultProps} />);

    expect(screen.getByText('Cambiar nombre del servidor')).toBeInTheDocument();
  });

  it('pre-fills the name input with the current server name', () => {
    render(<RenameServerModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(mockServer.name);
  });

  it('calls backendFetch with PATCH and the new name on submit', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ...mockServer, name: 'New Name' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<RenameServerModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Name');

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/servers/${mockServer.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Name' }),
        }
      );
    });

    expect(defaultProps.onRenamed).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays error message when backendFetch response is not ok', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Forbidden' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockExtractErrorMessage.mockResolvedValue('No se pudo renombrar el servidor');

    render(<RenameServerModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('No se pudo renombrar el servidor')).toBeInTheDocument();
    });

    expect(defaultProps.onRenamed).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<RenameServerModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('submit button is disabled when name input is empty', async () => {
    const user = userEvent.setup();
    render(<RenameServerModal {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    expect(submitButton).toBeDisabled();
  });
});
