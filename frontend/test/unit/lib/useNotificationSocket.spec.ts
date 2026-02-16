const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock('@/lib/socket', () => ({
  getSocket: jest.fn(() => mockSocket),
}));

import { renderHook } from '@testing-library/react';
import { useNotificationSocket } from '@/lib/useNotificationSocket';
import { mockFriendship } from '@/test/helpers/fixtures';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useNotificationSocket', () => {
  it('registers socket.on listeners for each provided callback', () => {
    const callbacks = {
      onFriendRequestReceived: jest.fn(),
      onFriendshipRemoved: jest.fn(),
    };

    renderHook(() => useNotificationSocket(callbacks));

    expect(mockSocket.on).toHaveBeenCalledTimes(2);
    expect(mockSocket.on).toHaveBeenCalledWith('friendRequest:received', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('friendship:removed', expect.any(Function));
  });

  it('calls the callback when the socket event fires', () => {
    const onFriendRequestReceived = jest.fn();
    renderHook(() => useNotificationSocket({ onFriendRequestReceived }));

    // Extract the handler registered for 'friendRequest:received'
    const [, handler] = mockSocket.on.mock.calls.find(
      ([event]: [string]) => event === 'friendRequest:received',
    )!;

    handler(mockFriendship);

    expect(onFriendRequestReceived).toHaveBeenCalledWith(mockFriendship);
  });

  it('cleans up listeners on unmount (calls socket.off)', () => {
    const callbacks = {
      onFriendRequestReceived: jest.fn(),
      onServerInviteReceived: jest.fn(),
    };

    const { unmount } = renderHook(() => useNotificationSocket(callbacks));

    // Capture the handlers that were registered
    const registeredHandlers = mockSocket.on.mock.calls.map(
      ([event, handler]: [string, Function]) => [event, handler],
    );

    unmount();

    expect(mockSocket.off).toHaveBeenCalledTimes(2);
    for (const [event, handler] of registeredHandlers) {
      expect(mockSocket.off).toHaveBeenCalledWith(event, handler);
    }
  });

  it('only registers listeners for callbacks that are provided', () => {
    renderHook(() =>
      useNotificationSocket({
        onServerInviteCancelled: jest.fn(),
      }),
    );

    expect(mockSocket.on).toHaveBeenCalledTimes(1);
    expect(mockSocket.on).toHaveBeenCalledWith('serverInvite:cancelled', expect.any(Function));
  });

  it('registers all 8 listeners when all callbacks are provided', () => {
    const allCallbacks = {
      onFriendRequestReceived: jest.fn(),
      onFriendRequestResponded: jest.fn(),
      onFriendRequestCancelled: jest.fn(),
      onFriendshipRemoved: jest.fn(),
      onServerInviteReceived: jest.fn(),
      onServerInviteAccepted: jest.fn(),
      onServerInviteRejected: jest.fn(),
      onServerInviteCancelled: jest.fn(),
    };

    renderHook(() => useNotificationSocket(allCallbacks));

    expect(mockSocket.on).toHaveBeenCalledTimes(8);
  });

  it('does not register any listener when callbacks object is empty', () => {
    renderHook(() => useNotificationSocket({}));

    expect(mockSocket.on).not.toHaveBeenCalled();
  });

  it('uses the latest callback ref (avoids stale closures)', () => {
    const firstCb = jest.fn();
    const secondCb = jest.fn();

    const { rerender } = renderHook(
      ({ cb }) => useNotificationSocket({ onFriendRequestReceived: cb }),
      { initialProps: { cb: firstCb } },
    );

    // Rerender with a new callback — the ref should be updated
    rerender({ cb: secondCb });

    // Extract the handler and fire it
    const [, handler] = mockSocket.on.mock.calls.find(
      ([event]: [string]) => event === 'friendRequest:received',
    )!;

    handler(mockFriendship);

    // The second (latest) callback should be called, not the first
    expect(secondCb).toHaveBeenCalledWith(mockFriendship);
    expect(firstCb).not.toHaveBeenCalled();
  });
});
