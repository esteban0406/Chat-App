import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { Chat } from '@google/genai';
import * as fs from 'fs/promises';
import * as path from 'path';

const MODEL = 'gemini-3.1-flash-lite-preview';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes

interface ChatSession {
  chat: Chat;
  lastActivity: Date;
}

@Injectable()
export class AiBotService implements OnModuleInit {
  private readonly logger = new Logger(AiBotService.name);
  private readonly ai: GoogleGenAI;
  private readonly sessions = new Map<string, ChatSession>();
  private readmeContent = '';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async onModuleInit() {
    if (!process.env.GEMINI_API_KEY) {
      this.logger.warn(
        'GEMINI_API_KEY is not set — AI bot will fail at runtime',
      );
    }
    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      this.readmeContent = await fs.readFile(readmePath, 'utf-8');
      this.logger.log('README.md loaded successfully for AI bot context');
    } catch {
      this.logger.warn(
        'Could not load README.md — AI bot will operate without project context',
      );
    }

    setInterval(() => this.evictStaleSessions(), CLEANUP_INTERVAL_MS);
  }

  private buildSystemInstruction(): string {
    return `Eres un asistente útil para el proyecto Discol — una aplicación de chat en tiempo real inspirada en Discord.

Tu ÚNICO rol es responder preguntas sobre este proyecto: qué es, cómo funciona, su arquitectura, stack tecnológico, características y decisiones de diseño.

Si el usuario pregunta algo que no esté relacionado con Discol o con este proyecto, declina amablemente y anímale a preguntar sobre el proyecto en cambio.

Responde siempre en el mismo idioma en que te escriba el usuario.

Aquí tienes la documentación completa del proyecto como contexto:

---
${this.readmeContent}
---`;
  }

  private getSessionKey(user: { id: string; sessionId?: string }): string {
    return user.sessionId ?? user.id;
  }

  private getOrCreateSession(key: string): ChatSession {
    if (!this.sessions.has(key)) {
      const chat = this.ai.chats.create({
        model: MODEL,
        config: { systemInstruction: this.buildSystemInstruction() },
      });
      this.sessions.set(key, { chat, lastActivity: new Date() });
    }
    const session = this.sessions.get(key)!;
    session.lastActivity = new Date();
    return session;
  }

  private evictStaleSessions(): void {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [key, session] of this.sessions) {
      if (session.lastActivity.getTime() < cutoff) {
        this.sessions.delete(key);
      }
    }
  }

  async chat(
    user: { id: string; sessionId?: string },
    userMessage: string,
  ): Promise<string> {
    const key = this.getSessionKey(user);
    const { chat } = this.getOrCreateSession(key);

    let response: Awaited<ReturnType<Chat['sendMessage']>>;
    try {
      response = await chat.sendMessage({ message: userMessage });
    } catch (error) {
      this.handleUpstreamError(error);
    }

    try {
      return response.text ?? 'Lo siento, no pude generar una respuesta.';
    } catch {
      return 'Lo siento, la respuesta fue bloqueada por los filtros de seguridad.';
    }
  }

  private handleUpstreamError(error: unknown): never {
    const { status, message } = this.extractErrorDetails(error);
    const statusLabel = status ?? 'unknown';
    const safeMessage = message ?? 'Unknown error';
    this.logger.error(
      `AI upstream error (${statusLabel}): ${safeMessage}`,
      error instanceof Error ? error.stack : undefined,
    );

    if (status === 429) {
      throw new HttpException(
        'El asistente IA está recibiendo demasiadas solicitudes. Intenta más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (status === 503) {
      throw new ServiceUnavailableException(
        'El modelo está con alta demanda. Intenta más tarde.',
      );
    }

    throw new BadGatewayException(
      'No se pudo obtener respuesta del asistente IA. Intenta más tarde.',
    );
  }

  private extractErrorDetails(error: unknown): {
    status?: number;
    message?: string;
  } {
    if (!error || typeof error !== 'object') {
      return {};
    }

    const candidate = error as {
      status?: number;
      message?: string;
      error?: {
        code?: number;
        message?: string;
        status?: string;
      };
    };

    const status =
      typeof candidate.status === 'number'
        ? candidate.status
        : typeof candidate.error?.code === 'number'
          ? candidate.error?.code
          : undefined;

    const message =
      typeof candidate.error?.message === 'string'
        ? candidate.error.message
        : typeof candidate.message === 'string'
          ? candidate.message
          : undefined;

    return { status, message };
  }

  clearHistory(user: { id: string; sessionId?: string }): void {
    this.sessions.delete(this.getSessionKey(user));
  }
}
