import type { Server } from 'http';
import request from 'supertest';
import { getTestApp } from './app.helper';

export const connectTestDatabase = async () => {};

export const resetTestDatabase = async () => {
  const app = getTestApp();
  if (!app)
    throw new Error('Test app is not initialized. Call createTestApp() first.');
  await request(app.getHttpServer() as Server).post('/api/test/reset').expect(200);
};

export const disconnectTestDatabase = async () => {};
