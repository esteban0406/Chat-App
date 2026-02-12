import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';

export const createTestApp = async (): Promise<INestApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
};

export const closeTestApp = async (app?: INestApplication) => {
  if (!app) {
    return;
  }
  try {
    const prismaService = app.get(PrismaService, { strict: false });
    if (prismaService) {
      await prismaService.$disconnect();
    }
  } catch {
    // Best effort shutdown for e2e teardown.
  }
  await app.close();
};
