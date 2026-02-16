jest.mock('@/lib/CurrentUserContext', () => ({
  useCurrentUser: jest.fn(),
}));

import { renderHook } from '@testing-library/react';
import { useCurrentUser } from '@/lib/CurrentUserContext';
import { useServerPermissions } from '@/lib/useServerPermissions';
import { mockUser, mockUser2, mockServer, mockMember, mockRole } from '@/test/helpers/fixtures';
import type { Server, Member } from '@/lib/definitions';

const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useServerPermissions', () => {
  // ---------- isOwner ----------

  it('isOwner returns true when currentUser is the server owner', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser, // id = 'user-1', same as mockServer.ownerId
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(mockServer));

    expect(result.current.isOwner).toBe(true);
  });

  it('isOwner returns false when currentUser is not owner', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser2, // id = 'user-2'
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(mockServer));

    expect(result.current.isOwner).toBe(false);
  });

  it('isOwner returns false when server is undefined', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(undefined));

    expect(result.current.isOwner).toBe(false);
  });

  it('isOwner returns false when currentUser is null', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: null,
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(mockServer));

    expect(result.current.isOwner).toBe(false);
  });

  // ---------- hasPermission while loading ----------

  it('hasPermission returns true while loading (permissive)', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: null,
      loading: true,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(mockServer));

    expect(result.current.hasPermission('CREATE_CHANNEL')).toBe(true);
  });

  // ---------- hasPermission when owner ----------

  it('hasPermission returns true when user is owner (regardless of role)', () => {
    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(mockServer));

    // Owner should have every permission, even ones not in any role
    expect(result.current.hasPermission('DELETE_SERVER')).toBe(true);
    expect(result.current.hasPermission('MANAGE_ROLES')).toBe(true);
  });

  // ---------- hasPermission when member has no role ----------

  it('hasPermission returns true when member has no role data', () => {
    const memberWithoutRole: Member = {
      ...mockMember,
      userId: 'user-2',
      role: undefined,
      roleId: undefined,
    };
    const serverWithRolelessMember: Server = {
      ...mockServer,
      ownerId: 'user-999', // not user-2
      members: [memberWithoutRole],
    };

    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser2, // id = 'user-2'
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(serverWithRolelessMember));

    expect(result.current.hasPermission('CREATE_CHANNEL')).toBe(true);
  });

  // ---------- hasPermission when member not found ----------

  it('hasPermission returns false when member not found in server', () => {
    const serverWithoutUser2: Server = {
      ...mockServer,
      ownerId: 'user-999',
      members: [mockMember], // only user-1
    };

    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser2, // id = 'user-2', not in members
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(serverWithoutUser2));

    expect(result.current.hasPermission('CREATE_CHANNEL')).toBe(false);
  });

  // ---------- hasPermission with role permissions ----------

  it('hasPermission returns true when role includes the permission', () => {
    const memberWithRole: Member = {
      ...mockMember,
      userId: 'user-2',
      role: { ...mockRole, permissions: ['CREATE_CHANNEL', 'INVITE_MEMBER'] },
    };
    const server: Server = {
      ...mockServer,
      ownerId: 'user-999',
      members: [memberWithRole],
    };

    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser2,
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(server));

    expect(result.current.hasPermission('CREATE_CHANNEL')).toBe(true);
    expect(result.current.hasPermission('INVITE_MEMBER')).toBe(true);
  });

  it('hasPermission returns false when role does not include the permission', () => {
    const memberWithLimitedRole: Member = {
      ...mockMember,
      userId: 'user-2',
      role: { ...mockRole, permissions: ['INVITE_MEMBER'] },
    };
    const server: Server = {
      ...mockServer,
      ownerId: 'user-999',
      members: [memberWithLimitedRole],
    };

    mockUseCurrentUser.mockReturnValue({
      currentUser: mockUser2,
      loading: false,
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useServerPermissions(server));

    expect(result.current.hasPermission('DELETE_CHANNEL')).toBe(false);
    expect(result.current.hasPermission('MANAGE_ROLES')).toBe(false);
  });
});
