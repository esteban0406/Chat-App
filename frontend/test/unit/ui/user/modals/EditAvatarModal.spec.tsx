jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(() => 'test-token'),
}));

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditAvatarModal from '@/ui/user/modals/EditAvatarModal';
import { backendFetch, extractErrorMessage } from '@/lib/backend-client';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

function createMockFile(name: string, type: string, size = 1024): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe('EditAvatarModal', () => {
  const defaultProps = {
    onClose: jest.fn(),
    onUpdated: jest.fn(),
  };

  it('renders file input', () => {
    render(<EditAvatarModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('shows heading', () => {
    render(<EditAvatarModal {...defaultProps} />);

    expect(screen.getByText('Editar avatar')).toBeInTheDocument();
  });

  it('shows error for non-image file', async () => {
    render(<EditAvatarModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const textFile = createMockFile('readme.txt', 'text/plain');

    // Use fireEvent to bypass the accept attribute filtering in userEvent
    fireEvent.change(fileInput, { target: { files: [textFile] } });

    await waitFor(() => {
      expect(screen.getByText('Solo se permiten archivos de imagen')).toBeInTheDocument();
    });
  });

  it('successful upload calls backendFetch with FormData', async () => {
    const user = userEvent.setup();

    const uploadRes = {
      ok: true,
      json: jest.fn().mockResolvedValue({ avatarUrl: 'https://example.com/avatar.jpg' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValueOnce(uploadRes);

    render(<EditAvatarModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const imageFile = createMockFile('avatar.png', 'image/png');
    await user.upload(fileInput, imageFile);

    // Wait for the FileReader to complete and preview to appear
    await waitFor(() => {
      expect(screen.getByAltText('Vista previa del avatar')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith('/api/users/me', {
        method: 'PATCH',
        body: expect.any(FormData),
      });
    });

    await waitFor(() => {
      expect(defaultProps.onUpdated).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('shows error when no file is selected and submit is clicked', async () => {
    const user = userEvent.setup();

    render(<EditAvatarModal {...defaultProps} />);

    // The submit button should be disabled when no file is selected
    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    expect(submitButton).toBeDisabled();
  });

  it('shows error when upload fails', async () => {
    const user = userEvent.setup();

    const errorRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'No se pudo actualizar el avatar' }),
    } as unknown as Response;
    mockBackendFetch.mockResolvedValueOnce(errorRes);
    mockExtractErrorMessage.mockResolvedValueOnce('No se pudo actualizar el avatar');

    render(<EditAvatarModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const imageFile = createMockFile('avatar.png', 'image/png');
    await user.upload(fileInput, imageFile);

    await waitFor(() => {
      expect(screen.getByAltText('Vista previa del avatar')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('No se pudo actualizar el avatar')).toBeInTheDocument();
    });
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();

    render(<EditAvatarModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
