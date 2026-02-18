jest.mock('@/lib/auth', () => ({
  updateUser: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditNameModal from '@/ui/user/modals/EditNameModal';
import { updateUser } from '@/lib/auth';
import { mockUser } from '../../../../helpers/fixtures';

const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('EditNameModal', () => {
  const defaultProps = {
    user: mockUser,
    onClose: jest.fn(),
    onUpdated: jest.fn(),
  };

  it('pre-fills name input with current username', () => {
    render(<EditNameModal {...defaultProps} />);

    const input = screen.getByDisplayValue(mockUser.username);
    expect(input).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();

    render(<EditNameModal {...defaultProps} />);

    const input = screen.getByDisplayValue(mockUser.username);
    await user.clear(input);

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre no puede estar vacío')).toBeInTheDocument();
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows validation error when name is the same', async () => {
    const user = userEvent.setup();

    render(<EditNameModal {...defaultProps} />);

    // Name is already pre-filled with the current username, just submit
    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Debes ingresar un nombre diferente')).toBeInTheDocument();
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('successful submit calls updateUser and closes modal', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValueOnce({ ...mockUser, username: 'newname' });

    render(<EditNameModal {...defaultProps} />);

    const input = screen.getByDisplayValue(mockUser.username);
    await user.clear(input);
    await user.type(input, 'newname');

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ username: 'newname' });
    });

    await waitFor(() => {
      expect(defaultProps.onUpdated).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('shows error when updateUser fails', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockRejectedValueOnce(new Error('Error del servidor'));

    render(<EditNameModal {...defaultProps} />);

    const input = screen.getByDisplayValue(mockUser.username);
    await user.clear(input);
    await user.type(input, 'differentname');

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error del servidor')).toBeInTheDocument();
    });
  });

  it('shows duplicate username error from server', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockRejectedValueOnce(new Error('El nombre de usuario ya está en uso'));

    render(<EditNameModal {...defaultProps} />);

    const input = screen.getByDisplayValue(mockUser.username);
    await user.clear(input);
    await user.type(input, 'takenname');

    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario ya está en uso')).toBeInTheDocument();
    });
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();

    render(<EditNameModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
