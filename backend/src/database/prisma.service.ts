import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();

      await this.$queryRaw`SELECT 1`;

      if (process.env.NODE_ENV === 'test') {
        console.log(
          'Conexión a la base de datos establecida en test environment',
        );
      } else {
        console.log('Conexión a la base de datos establecida');
      }
    } catch (error: unknown) {
      console.error('Error de conexión detectado en PrismaService:');
      console.error(error);

      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
