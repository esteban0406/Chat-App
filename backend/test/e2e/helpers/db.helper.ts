import { PrismaService } from '../../../src/database/prisma.service';

export const prisma = new PrismaService();

export const connectTestDatabase = async () => {
  await prisma.$connect();
};

export const resetTestDatabase = async () => {
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.channel.deleteMany(),
    prisma.member.deleteMany(),
    prisma.role.deleteMany(),
    prisma.serverInvite.deleteMany(),
    prisma.friendship.deleteMany(),
    prisma.account.deleteMany(),
    prisma.server.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

export const disconnectTestDatabase = async () => {
  await prisma.$disconnect();
};
