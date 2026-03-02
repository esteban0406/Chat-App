import type { User } from '@/lib/auth';
import type {
  Message,
  Channel,
  Server,
  Member,
  Role,
  Friendship,
  ServerInvite,
} from '@/lib/definitions';
import type { FriendEntry } from '@/lib/context/FriendsContext';

export const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  avatarUrl: null,
  status: 'ONLINE',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockUser2: User = {
  id: 'user-2',
  email: 'other@example.com',
  username: 'otheruser',
  avatarUrl: null,
  status: 'ONLINE',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockRole: Role = {
  id: 'role-1',
  name: 'Admin',
  color: '#FFD700',
  serverId: 'server-1',
  permissions: ['CREATE_CHANNEL', 'DELETE_CHANNEL', 'INVITE_MEMBER', 'REMOVE_MEMBER', 'MANAGE_ROLES'],
  createdAt: '2024-01-01T00:00:00Z',
  _count: { members: 1 },
};

export const mockMember: Member = {
  id: 'member-1',
  userId: 'user-1',
  serverId: 'server-1',
  roleId: 'role-1',
  role: mockRole,
  user: mockUser,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockChannel: Channel = {
  id: 'channel-1',
  name: 'general',
  type: 'TEXT',
  serverId: 'server-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockVoiceChannel: Channel = {
  id: 'channel-2',
  name: 'voice-chat',
  type: 'VOICE',
  serverId: 'server-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockServer: Server = {
  id: 'server-1',
  name: 'Test Server',
  description: 'A test server',
  ownerId: 'user-1',
  owner: mockUser,
  members: [mockMember],
  channels: [mockChannel, mockVoiceChannel],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockMessage: Message = {
  id: 'msg-1',
  content: 'Hello world',
  author: mockUser,
  channelId: 'channel-1',
  authorId: 'user-1',
  createdAt: '2024-01-01T12:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z',
};

export const mockFriendship: Friendship = {
  id: 'friendship-1',
  senderId: 'user-1',
  receiverId: 'user-2',
  sender: mockUser,
  receiver: mockUser2,
  status: 'PENDING',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockServerInvite: ServerInvite = {
  id: 'invite-1',
  senderId: 'user-1',
  receiverId: 'user-2',
  serverId: 'server-1',
  sender: mockUser,
  receiver: mockUser2,
  server: mockServer,
  status: 'PENDING',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockCustomRole: Role = {
  id: 'role-custom',
  name: 'Moderador',
  color: '#ff5500',
  serverId: 'server-1',
  permissions: ['CREATE_CHANNEL', 'INVITE_MEMBER'],
  createdAt: '2024-01-01T00:00:00Z',
  _count: { members: 3 },
  members: [mockMember],
};

export const mockDefaultMemberRole: Role = {
  id: 'role-member',
  name: 'Member',
  color: '#8B95A8',
  serverId: 'server-1',
  permissions: [],
  createdAt: '2024-01-01T00:00:00Z',
  _count: { members: 5 },
  members: [],
};

export const mockFriendEntry: FriendEntry = { ...mockUser, friendshipId: 'friendship-1' };
export const mockFriendEntry2: FriendEntry = { ...mockUser2, friendshipId: 'friendship-2' };

export const mockMember2: Member = {
  id: 'member-2',
  userId: 'user-2',
  serverId: 'server-1',
  roleId: 'role-custom',
  user: mockUser2,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};
