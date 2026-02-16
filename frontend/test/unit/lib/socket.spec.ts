const mockSocket = {
  connected: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  io: { opts: { query: undefined as Record<string, string> | undefined } },
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(),
}));

import { getToken } from '@/lib/auth';
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

// We need to clear the module-level singleton between tests
beforeEach(() => {
  jest.clearAllMocks();
  mockSocket.connected = false;
  mockSocket.io.opts.query = undefined;
  // Reset the module to clear the socket singleton
  jest.resetModules();
});

describe('socket', () => {
  it('getSocket creates a socket instance with token', () => {
    mockGetToken.mockReturnValue('test-token');

    // Re-require after resetModules
    const { getSocket } = jest.requireActual('@/lib/socket') as typeof import('@/lib/socket');
    const socket = getSocket();

    expect(socket).toBeDefined();
  });

  it('getSocket returns the same instance on subsequent calls', () => {
    mockGetToken.mockReturnValue('test-token');

    const { getSocket } = jest.requireActual('@/lib/socket') as typeof import('@/lib/socket');
    const socket1 = getSocket();
    const socket2 = getSocket();

    expect(socket1).toBe(socket2);
  });

  it('connectSocket connects if not already connected', () => {
    mockGetToken.mockReturnValue('test-token');
    mockSocket.connected = false;

    const { connectSocket } = jest.requireActual('@/lib/socket') as typeof import('@/lib/socket');
    connectSocket();

    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('connectSocket does not reconnect if already connected', () => {
    mockGetToken.mockReturnValue('test-token');
    mockSocket.connected = true;

    const { connectSocket } = jest.requireActual('@/lib/socket') as typeof import('@/lib/socket');
    connectSocket();

    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('disconnectSocket disconnects if connected', () => {
    mockGetToken.mockReturnValue('test-token');
    mockSocket.connected = true;

    const { getSocket, disconnectSocket } = jest.requireActual('@/lib/socket') as typeof import('@/lib/socket');
    getSocket(); // ensure socket is created
    disconnectSocket();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('disconnectSocket is a no-op if not connected', () => {
    mockGetToken.mockReturnValue('test-token');
    mockSocket.connected = false;

    const { getSocket, disconnectSocket } = jest.requireActual('@/lib/socket') as typeof import('@/lib/socket');
    getSocket();
    disconnectSocket();

    expect(mockSocket.disconnect).not.toHaveBeenCalled();
  });
});
