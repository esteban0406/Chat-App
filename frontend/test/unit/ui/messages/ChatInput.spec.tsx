const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: true,
  connect: jest.fn(),
};

jest.mock('@/lib/socket', () => ({
  connectSocket: jest.fn(() => mockSocket),
}));

jest.mock('lucide-react', () => ({
  SendHorizontal: (props: Record<string, unknown>) => <svg data-testid="send-icon" {...props} />,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '@/ui/messages/ChatInput';
import { connectSocket } from '@/lib/socket';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ChatInput', () => {
  it('renders placeholder "Escribe un mensaje..."', () => {
    render(<ChatInput channelId="channel-1" senderId="user-1" />);

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    expect(input).toBeInTheDocument();
  });

  it('submitting with text emits socket message event', async () => {
    const user = userEvent.setup();
    render(<ChatInput channelId="channel-1" senderId="user-1" />);

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    await user.type(input, 'Hello world');

    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(connectSocket).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('message', {
      channelId: 'channel-1',
      senderId: 'user-1',
      text: 'Hello world',
    });
  });

  it('clears input after successful submit', async () => {
    const user = userEvent.setup();
    render(<ChatInput channelId="channel-1" senderId="user-1" />);

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    await user.type(input, 'Hello world');
    expect(input).toHaveValue('Hello world');

    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(input).toHaveValue('');
  });

  it('does not emit when text is empty', async () => {
    const user = userEvent.setup();
    render(<ChatInput channelId="channel-1" senderId="user-1" />);

    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(connectSocket).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('does not emit when text is whitespace only', async () => {
    const user = userEvent.setup();
    render(<ChatInput channelId="channel-1" senderId="user-1" />);

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    await user.type(input, '   ');

    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(connectSocket).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('does not emit when senderId is undefined', async () => {
    const user = userEvent.setup();
    render(<ChatInput channelId="channel-1" />);

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    await user.type(input, 'Hello');

    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(connectSocket).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled prop is true', () => {
    render(<ChatInput channelId="channel-1" senderId="user-1" disabled />);

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    expect(input).toBeDisabled();

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('shows error when connectSocket throws', async () => {
    const onError = jest.fn();
    (connectSocket as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Socket error');
    });

    const user = userEvent.setup();
    render(
      <ChatInput channelId="channel-1" senderId="user-1" onError={onError} />
    );

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    await user.type(input, 'Hello');

    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(screen.getByText('Socket error')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('Socket error');
  });
});
