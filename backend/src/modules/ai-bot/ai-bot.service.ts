import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';
import * as fs from 'fs/promises';
import * as path from 'path';

const MAX_HISTORY_ENTRIES = 20;
const MODEL = 'gemini-3.1-flash-lite-preview';

@Injectable()
export class AiBotService implements OnModuleInit {
  private readonly logger = new Logger(AiBotService.name);
  private readonly ai: GoogleGenAI;
  private readonly chatHistories = new Map<string, Content[]>();
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
      const readmePath = path.join(process.cwd(), '..', 'README.md');
      this.readmeContent = await fs.readFile(readmePath, 'utf-8');
      this.logger.log('README.md loaded successfully for AI bot context');
    } catch {
      this.logger.warn(
        'Could not load README.md — AI bot will operate without project context',
      );
    }
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

  async chat(userId: string, userMessage: string): Promise<string> {
    const history = this.chatHistories.get(userId) ?? [];

    const chatSession = this.ai.chats.create({
      model: MODEL,
      config: { systemInstruction: this.buildSystemInstruction() },
      history,
    });

    const response = await chatSession.sendMessage({ message: userMessage });

    let replyText: string;
    try {
      replyText = response.text ?? 'Lo siento, no pude generar una respuesta.';
    } catch {
      replyText =
        'Lo siento, la respuesta fue bloqueada por los filtros de seguridad.';
    }

    const updatedHistory: Content[] = [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: [{ text: replyText }] },
    ];

    this.chatHistories.set(userId, updatedHistory.slice(-MAX_HISTORY_ENTRIES));

    return replyText;
  }

  clearHistory(userId: string): void {
    this.chatHistories.delete(userId);
  }
}
