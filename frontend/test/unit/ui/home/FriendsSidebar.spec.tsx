import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FriendsSidebar from '@/ui/home/FriendsSidebar';
import { mockUser, mockUser2 } from '../../../helpers/fixtures';
import type { User } from '@/lib/auth';

jest.mock('@/lib/context/FriendsContext', () => ({
  useFriends: jest.fn(),
}));

import { useFriends } from '@/lib/context/FriendsContext';

const mockUseFriends = useFriends as jest.MockedFunction<typeof useFriends>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FriendsSidebar', () => {
  const defaultFriendsState = {
    friends: [] as User[],
    loading: false,
    error: null,
    refreshFriends: jest.fn(),
  };

  it('renders "Amigos" header', () => {
    mockUseFriends.mockReturnValue(defaultFriendsState);

    render(<FriendsSidebar />);

    expect(screen.getByText('Amigos')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    mockUseFriends.mockReturnValue(defaultFriendsState);

    render(<FriendsSidebar />);

    expect(
      screen.getByPlaceholderText('Buscar amigos...'),
    ).toBeInTheDocument();
  });

  it('renders friends list with usernames', () => {
    mockUseFriends.mockReturnValue({
      ...defaultFriendsState,
      friends: [mockUser, mockUser2],
    });

    render(<FriendsSidebar />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('otheruser')).toBeInTheDocument();
  });

  it('filters friends by search query', async () => {
    const user = userEvent.setup();
    mockUseFriends.mockReturnValue({
      ...defaultFriendsState,
      friends: [mockUser, mockUser2],
    });

    render(<FriendsSidebar />);

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');
    await user.type(searchInput, 'other');

    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
    expect(screen.getByText('otheruser')).toBeInTheDocument();
  });

  it('shows "Sin resultados." when search matches nothing', async () => {
    const user = userEvent.setup();
    mockUseFriends.mockReturnValue({
      ...defaultFriendsState,
      friends: [mockUser],
    });

    render(<FriendsSidebar />);

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');
    await user.type(searchInput, 'zzzzz');

    expect(screen.getByText('Sin resultados.')).toBeInTheDocument();
  });

  it('shows "No hay amigos aún." when friends list is empty and no search', () => {
    mockUseFriends.mockReturnValue(defaultFriendsState);

    render(<FriendsSidebar />);

    expect(screen.getByText('No hay amigos aún.')).toBeInTheDocument();
  });

  it('shows close button when sidebarControls.closeSidebar is provided', () => {
    mockUseFriends.mockReturnValue(defaultFriendsState);

    render(
      <FriendsSidebar
        sidebarControls={{ closeSidebar: jest.fn() }}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Cerrar menú' }),
    ).toBeInTheDocument();
  });

  it('calls closeSidebar when close button is clicked', async () => {
    const user = userEvent.setup();
    const closeSidebar = jest.fn();
    mockUseFriends.mockReturnValue(defaultFriendsState);

    render(
      <FriendsSidebar
        sidebarControls={{ closeSidebar }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));

    expect(closeSidebar).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when no sidebarControls', () => {
    mockUseFriends.mockReturnValue(defaultFriendsState);

    render(<FriendsSidebar />);

    expect(
      screen.queryByRole('button', { name: 'Cerrar menú' }),
    ).not.toBeInTheDocument();
  });

  it('shows online count matching filtered friends', () => {
    mockUseFriends.mockReturnValue({
      ...defaultFriendsState,
      friends: [mockUser, mockUser2],
    });

    render(<FriendsSidebar />);

    expect(screen.getByText(/En línea — 2/)).toBeInTheDocument();
  });
});
