import React from 'react';
import { render, screen } from '@testing-library/react';
import FriendList from '@/ui/home/FriendList';
import { mockUser, mockUser2 } from '../../../helpers/fixtures';

jest.mock('@/lib/context/FriendsContext', () => ({
  useFriends: jest.fn(),
}));

import { useFriends } from '@/lib/context/FriendsContext';

const mockUseFriends = useFriends as jest.MockedFunction<typeof useFriends>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FriendList', () => {
  it('shows loading text when loading is true', () => {
    mockUseFriends.mockReturnValue({
      friends: [],
      loading: true,
      error: null,
      refreshFriends: jest.fn(),
    });

    render(<FriendList />);

    expect(screen.getByText('Cargando amigos...')).toBeInTheDocument();
  });

  it('shows error text when error is provided', () => {
    mockUseFriends.mockReturnValue({
      friends: [],
      loading: false,
      error: 'No se pudieron cargar tus amigos',
      refreshFriends: jest.fn(),
    });

    render(<FriendList />);

    expect(
      screen.getByText('No se pudieron cargar tus amigos'),
    ).toBeInTheDocument();
  });

  it('shows empty state when friends list is empty', () => {
    mockUseFriends.mockReturnValue({
      friends: [],
      loading: false,
      error: null,
      refreshFriends: jest.fn(),
    });

    render(<FriendList />);

    expect(
      screen.getByText('No tienes amigos todavía.'),
    ).toBeInTheDocument();
  });

  it('renders friends with username and email', () => {
    mockUseFriends.mockReturnValue({
      friends: [mockUser, mockUser2],
      loading: false,
      error: null,
      refreshFriends: jest.fn(),
    });

    render(<FriendList />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('(test@example.com)')).toBeInTheDocument();
    expect(screen.getByText('otheruser')).toBeInTheDocument();
    expect(screen.getByText('(other@example.com)')).toBeInTheDocument();
  });

  it('shows "Eliminar" button for each friend', () => {
    mockUseFriends.mockReturnValue({
      friends: [mockUser],
      loading: false,
      error: null,
      refreshFriends: jest.fn(),
    });

    render(<FriendList />);

    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('renders avatar initial when no avatar URL', () => {
    mockUseFriends.mockReturnValue({
      friends: [mockUser],
      loading: false,
      error: null,
      refreshFriends: jest.fn(),
    });

    render(<FriendList />);

    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
