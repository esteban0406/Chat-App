import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfileBar from '@/ui/user/UserProfileBar';
import { mockUser } from '../../../helpers/fixtures';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock('@/lib/CurrentUserContext', () => ({
  useCurrentUser: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  logout: jest.fn().mockResolvedValue(undefined),
  getToken: jest.fn(),
}));

jest.mock('@/lib/backend-client', () => ({
  toBackendURL: jest.fn((path: string) => `http://localhost:3001${path}`),
}));

// Mock the modals to avoid their internal dependencies
jest.mock('@/ui/user/modals/EditNameModal', () => {
  return function MockEditNameModal({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="edit-name-modal">
        <button onClick={onClose}>Cerrar</button>
      </div>
    );
  };
});

jest.mock('@/ui/user/modals/EditAvatarModal', () => {
  return function MockEditAvatarModal({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="edit-avatar-modal">
        <button onClick={onClose}>Cerrar</button>
      </div>
    );
  };
});

import { useCurrentUser } from '@/lib/CurrentUserContext';
import { logout } from '@/lib/auth';

const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCurrentUser.mockReturnValue({
    currentUser: null,
    loading: false,
    refreshUser: jest.fn(),
  });
});

describe('UserProfileBar', () => {
  it('returns null when no user', () => {
    const { container } = render(<UserProfileBar />);

    expect(container.innerHTML).toBe('');
  });

  it('renders username when user is available', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      refreshUser: jest.fn(),
    });

    render(<UserProfileBar />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders user status', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      refreshUser: jest.fn(),
    });

    render(<UserProfileBar />);

    expect(screen.getByText('ONLINE')).toBeInTheDocument();
  });

  it('renders user avatar image', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      refreshUser: jest.fn(),
    });

    render(<UserProfileBar />);

    const img = screen.getByRole('img', { name: 'testuser' });
    expect(img).toBeInTheDocument();
  });

  it('opens settings menu and shows menu items', async () => {
    const user = userEvent.setup();
    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      refreshUser: jest.fn(),
    });

    render(<UserProfileBar />);

    // Settings button contains Settings icon, find the Menu.Button
    const settingsButton = screen.getByRole('button');
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Editar nombre')).toBeInTheDocument();
    });
    expect(screen.getByText('Editar avatar')).toBeInTheDocument();
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('calls logout and navigates to /login when "Cerrar sesión" is clicked', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValue(undefined);

    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      refreshUser: jest.fn(),
    });

    render(<UserProfileBar />);

    // Open the menu
    const settingsButton = screen.getByRole('button');
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Cerrar sesión'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
