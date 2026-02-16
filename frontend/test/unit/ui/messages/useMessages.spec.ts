const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

jest.mock('@/lib/socket', () => ({
  connectSocket: jest.fn(() => mockSocket),
}));

jest.mock('@/lib/backend-client', () => ({
  backendFetch: jest.fn(),
  unwrapList: jest.fn(),
  extractErrorMessage: jest.fn(),
}));

import { renderHook, waitFor, act } from '@testing-library/react';
import { useMessages } from '@/ui/messages/useMessages';
import { backendFetch, unwrapList, extractErrorMessage } from '@/lib/backend-client';
import { mockMessage } from '@/test/helpers/fixtures';
import type { Message } from '@/lib/definitions';

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;
const mockUnwrapList = unwrapList as jest.MockedFunction<typeof unwrapList>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useMessages', () => {
  it('returns empty messages and no loading when channelId is undefined', () => {
    const { result } = renderHook(() => useMessages(undefined));

    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches messages when channelId is provided', async () => {
    const messageList: Message[] = [mockMessage];
    const mockRes = { ok: true, json: jest.fn().mockResolvedValue({ messages: messageList }) } as unknown as Response;

    mockBackendFetch.mockResolvedValue(mockRes);
    mockUnwrapList.mockReturnValue(messageList);

    const { result } = renderHook(() => useMessages('channel-1'));

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockBackendFetch).toHaveBeenCalledWith('/api/messages/channel/channel-1', { cache: 'no-store' });
    expect(result.current.messages).toEqual(messageList);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    const mockRes = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Forbidden' }),
    } as unknown as Response;

    mockBackendFetch.mockResolvedValue(mockRes);
    mockExtractErrorMessage.mockResolvedValue('Forbidden');

    const { result } = renderHook(() => useMessages('channel-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Forbidden');
    expect(result.current.messages).toEqual([]);
  });

  it('emits joinChannel on socket when channelId is provided', async () => {
    const mockRes = { ok: true, json: jest.fn().mockResolvedValue({ messages: [] }) } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockUnwrapList.mockReturnValue([]);

    renderHook(() => useMessages('channel-1'));

    expect(mockSocket.emit).toHaveBeenCalledWith('joinChannel', 'channel-1');
    expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('emits leaveChannel on cleanup', async () => {
    const mockRes = { ok: true, json: jest.fn().mockResolvedValue({ messages: [] }) } as unknown as Response;
    mockBackendFetch.mockResolvedValue(mockRes);
    mockUnwrapList.mockReturnValue([]);

    const { unmount } = renderHook(() => useMessages('channel-1'));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('joinChannel', 'channel-1');
    });

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('leaveChannel', 'channel-1');
    expect(mockSocket.off).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('appends incoming socket message to list', async () => {
    const initialMessages: Message[] = [mockMessage];
    const mockRes = { ok: true, json: jest.fn().mockResolvedValue({ messages: initialMessages }) } as unknown as Response;

    mockBackendFetch.mockResolvedValue(mockRes);
    mockUnwrapList.mockReturnValue(initialMessages);

    const { result } = renderHook(() => useMessages('channel-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toEqual(initialMessages);

    // Extract the socket 'message' handler
    const [, messageHandler] = mockSocket.on.mock.calls.find(
      ([event]: [string]) => event === 'message',
    )!;

    const incomingMessage: Message = {
      ...mockMessage,
      id: 'msg-2',
      content: 'New message',
      channelId: 'channel-1',
    };

    act(() => {
      messageHandler(incomingMessage);
    });

    expect(result.current.messages).toEqual([...initialMessages, incomingMessage]);
  });

  it('does not append message from a different channel', async () => {
    const initialMessages: Message[] = [mockMessage];
    const mockRes = { ok: true, json: jest.fn().mockResolvedValue({ messages: initialMessages }) } as unknown as Response;

    mockBackendFetch.mockResolvedValue(mockRes);
    mockUnwrapList.mockReturnValue(initialMessages);

    const { result } = renderHook(() => useMessages('channel-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const [, messageHandler] = mockSocket.on.mock.calls.find(
      ([event]: [string]) => event === 'message',
    )!;

    const otherChannelMessage: Message = {
      ...mockMessage,
      id: 'msg-99',
      content: 'Wrong channel',
      channelId: 'channel-other',
    };

    act(() => {
      messageHandler(otherChannelMessage);
    });

    // List should remain unchanged
    expect(result.current.messages).toEqual(initialMessages);
  });
});
