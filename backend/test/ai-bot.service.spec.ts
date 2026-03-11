import {
  BadGatewayException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AiBotService } from '../src/modules/ai-bot/ai-bot.service';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
}));

describe('AiBotService', () => {
  let sendMessageMock: jest.Mock;
  let createMock: jest.Mock;

  beforeEach(() => {
    sendMessageMock = jest.fn();
    createMock = jest.fn().mockReturnValue({ sendMessage: sendMessageMock });
    (GoogleGenAI as jest.Mock).mockImplementation(() => ({
      chats: { create: createMock },
    }));
  });

  it('returns response text on success', async () => {
    sendMessageMock.mockResolvedValue({ text: 'Hola' });
    const service = new AiBotService();

    const reply = await service.chat({ id: '1' }, 'Hola');

    expect(reply).toBe('Hola');
    expect(sendMessageMock).toHaveBeenCalledWith({ message: 'Hola' });
  });

  it('returns blocked response message when text accessor throws', async () => {
    const response: { text?: string } = {};
    Object.defineProperty(response, 'text', {
      get() {
        throw new Error('blocked');
      },
    });
    sendMessageMock.mockResolvedValue(response);
    const service = new AiBotService();

    const reply = await service.chat({ id: '1' }, 'Hola');

    expect(reply).toBe(
      'Lo siento, la respuesta fue bloqueada por los filtros de seguridad.',
    );
  });

  it('maps 503 upstream errors to ServiceUnavailableException', async () => {
    sendMessageMock.mockRejectedValue({
      status: 503,
      error: {
        code: 503,
        message:
          'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
        status: 'UNAVAILABLE',
      },
    });
    const service = new AiBotService();

    let thrown: unknown;
    try {
      await service.chat({ id: '1' }, 'Hola');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ServiceUnavailableException);
    expect(thrown).toMatchObject({
      message: 'El modelo está con alta demanda. Intenta más tarde.',
    });
  });

  it('maps 429 upstream errors to TooManyRequestsException', async () => {
    sendMessageMock.mockRejectedValue({
      status: 429,
      error: {
        code: 429,
        message: 'Too many requests',
        status: 'RESOURCE_EXHAUSTED',
      },
    });
    const service = new AiBotService();

    let thrown: unknown;
    try {
      await service.chat({ id: '1' }, 'Hola');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(429);
  });

  it('maps unknown upstream errors to BadGatewayException', async () => {
    sendMessageMock.mockRejectedValue(new Error('boom'));
    const service = new AiBotService();

    await expect(service.chat({ id: '1' }, 'Hola')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
