import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessages from '@/ui/messages/ChatMessages';
import { mockMessage, mockUser2 } from '../../../helpers/fixtures';
import type { Message } from '@/lib/definitions';

describe('ChatMessages', () => {
  it('shows loading text when loading is true', () => {
    render(<ChatMessages messages={[]} loading={true} error={null} />);

    expect(screen.getByText('Cargando mensajes...')).toBeInTheDocument();
  });

  it('shows error text when error is provided', () => {
    render(
      <ChatMessages
        messages={[]}
        loading={false}
        error="No se pudieron cargar los mensajes"
      />,
    );

    expect(
      screen.getByText('No se pudieron cargar los mensajes'),
    ).toBeInTheDocument();
  });

  it('shows empty state when messages array is empty', () => {
    render(<ChatMessages messages={[]} loading={false} error={null} />);

    expect(
      screen.getByText('Aún no hay mensajes en este canal.'),
    ).toBeInTheDocument();
  });

  it('renders messages with author names and content', () => {
    const messages: Message[] = [
      mockMessage,
      {
        ...mockMessage,
        id: 'msg-2',
        content: 'Second message',
        author: mockUser2,
        authorId: 'user-2',
      },
    ];

    render(
      <ChatMessages
        messages={messages}
        loading={false}
        error={null}
        currentUserId="user-1"
      />,
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('otheruser')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('renders first letter of author name as avatar', () => {
    render(
      <ChatMessages
        messages={[mockMessage]}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('falls back to "Usuario" when author is missing', () => {
    const noAuthorMessage: Message = {
      ...mockMessage,
      author: undefined as unknown as Message['author'],
    };

    render(
      <ChatMessages
        messages={[noAuthorMessage]}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('prioritises loading over error and empty states', () => {
    render(
      <ChatMessages
        messages={[]}
        loading={true}
        error="Some error"
      />,
    );

    expect(screen.getByText('Cargando mensajes...')).toBeInTheDocument();
    expect(screen.queryByText('Some error')).not.toBeInTheDocument();
  });
});
