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
import CreateServerModal from '@/ui/servers/modals/CreateServerModal';
import { backendFetch, extractErrorMessage } from '@/lib/backend-client';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreateServerModal', () => {
  const defaultProps = {
    onClose: jest.fn(),
    created: jest.fn(),
  };

  it('renders "Crear Servidor" heading', () => {
    render(<CreateServerModal {...defaultProps} />);

    expect(screen.getByText('Crear Servidor')).toBeInTheDocument();
  });

  it('renders name input and description textarea', () => {
    render(<CreateServerModal {...defaultProps} />);

    expect(screen.getByPlaceholderText('Nombre del servidor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Descripción (opcional)')).toBeInTheDocument();
  });

  it('submit calls backendFetch POST with name and description', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'new-server-1' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<CreateServerModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Nombre del servidor');
    await user.type(nameInput, 'My Server');

    const descInput = screen.getByPlaceholderText('Descripción (opcional)');
    await user.type(descInput, 'A test server');

    const submitButton = screen.getByRole('button', { name: 'Crear' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Server', description: 'A test server' }),
      });
    });

    expect(defaultProps.created).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/servers/new-server-1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays error when backendFetch response is not ok', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Nombre ya existe' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockExtractErrorMessage.mockResolvedValue('Nombre ya existe');

    render(<CreateServerModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Nombre del servidor');
    await user.type(nameInput, 'Duplicate');

    const submitButton = screen.getByRole('button', { name: 'Crear' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Nombre ya existe')).toBeInTheDocument();
    });
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<CreateServerModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('redirects on successful creation', async () => {
    const user = userEvent.setup();
    const mockRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'server-abc' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);

    render(<CreateServerModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Nombre del servidor');
    await user.type(nameInput, 'New Server');

    const submitButton = screen.getByRole('button', { name: 'Crear' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/servers/server-abc');
    });
  });
});
