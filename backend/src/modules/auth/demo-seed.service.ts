import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import {
  ChannelType,
  RequestStatus,
  ServerPermission,
  UserStatus,
} from '../../generated/prisma/client';

type SeedUser = {
  email: string;
  username: string;
  status: UserStatus;
};

type SeedMessage = {
  authorEmail: string;
  content: string;
  minutesAfterStart: number;
};

type SeedChannel = {
  name: string;
  type: ChannelType;
  messages: SeedMessage[];
};

type SeedServer = {
  name: string;
  description: string;
  memberEmails: string[];
  channels: SeedChannel[];
};

const DEMO_PASSWORD = 'Demo123!';
export const DEMO_OWNER_EMAIL = 'demo@chatapp.local';
const SALT_ROUNDS = 10;
const ALL_SERVER_PERMISSIONS = Object.values(ServerPermission);

const seedUsers: SeedUser[] = [
  { email: DEMO_OWNER_EMAIL, username: 'demo', status: UserStatus.ONLINE },
  { email: 'nina@chatapp.local', username: 'nina', status: UserStatus.ONLINE },
  {
    email: 'marco@chatapp.local',
    username: 'marco',
    status: UserStatus.ONLINE,
  },
  {
    email: 'sofia@chatapp.local',
    username: 'sofia',
    status: UserStatus.OFFLINE,
  },
  { email: 'leo@chatapp.local', username: 'leo', status: UserStatus.ONLINE },
  {
    email: 'camila@chatapp.local',
    username: 'camila',
    status: UserStatus.OFFLINE,
  },
];

const demoServers: SeedServer[] = [
  {
    name: 'Demo server',
    description: 'i18n:demo:seed.seedNote',
    memberEmails: [
      DEMO_OWNER_EMAIL,
      'nina@chatapp.local',
      'camila@chatapp.local',
      'leo@chatapp.local',
    ],
    channels: [
      {
        name: 'welcome',
        type: ChannelType.TEXT,
        messages: [
          {
            authorEmail: DEMO_OWNER_EMAIL,
            content: 'i18n:demo:seed.welcome.msg0',
            minutesAfterStart: 0,
          },
          {
            authorEmail: 'camila@chatapp.local',
            content: 'i18n:demo:seed.welcome.msg1',
            minutesAfterStart: 3,
          },
          {
            authorEmail: 'nina@chatapp.local',
            content: 'i18n:demo:seed.welcome.msg2',
            minutesAfterStart: 7,
          },
        ],
      },
      {
        name: 'project-context',
        type: ChannelType.TEXT,
        messages: [
          {
            authorEmail: DEMO_OWNER_EMAIL,
            content: 'i18n:demo:seed.projectContext.msg0',
            minutesAfterStart: 12,
          },
          {
            authorEmail: 'leo@chatapp.local',
            content: 'i18n:demo:seed.projectContext.msg1',
            minutesAfterStart: 16,
          },
          {
            authorEmail: 'camila@chatapp.local',
            content: 'i18n:demo:seed.projectContext.msg2',
            minutesAfterStart: 20,
          },
          {
            authorEmail: 'nina@chatapp.local',
            content: 'i18n:demo:seed.projectContext.msg3',
            minutesAfterStart: 24,
          },
        ],
      },
      {
        name: 'feedback',
        type: ChannelType.TEXT,
        messages: [
          {
            authorEmail: 'camila@chatapp.local',
            content: 'i18n:demo:seed.feedback.msg0',
            minutesAfterStart: 30,
          },
          {
            authorEmail: DEMO_OWNER_EMAIL,
            content: 'i18n:demo:seed.feedback.msg1',
            minutesAfterStart: 34,
          },
        ],
      },
      {
        name: 'ai-chatbot',
        type: ChannelType.TEXT,
        messages: [
          {
            authorEmail: DEMO_OWNER_EMAIL,
            content: 'i18n:demo:seed.aiChatbot.msg0',
            minutesAfterStart: 40,
          },
          {
            authorEmail: 'nina@chatapp.local',
            content: 'i18n:demo:seed.aiChatbot.msg1',
            minutesAfterStart: 43,
          },
        ],
      },
    ],
  },
];

@Injectable()
export class DemoSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    this.logger.log('Seeding demo data on startup…');
    await this.run();
  }

  @Cron('0 */6 * * *')
  async resetDemo(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    this.logger.log('Running scheduled 6-hour demo reset…');
    await this.run();
  }

  async run(): Promise<void> {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

    // True reset: wipe all data owned by demo users before re-seeding
    const demoEmails = seedUsers.map((u) => u.email);
    const existingDemoUsers = await this.prisma.user.findMany({
      where: { email: { in: demoEmails } },
      select: { id: true },
    });
    const demoUserIds = existingDemoUsers.map((u) => u.id);

    if (demoUserIds.length > 0) {
      await this.prisma.server.deleteMany({
        where: { ownerId: { in: demoUserIds } },
      });
      await this.prisma.friendship.deleteMany({
        where: {
          OR: [
            { senderId: { in: demoUserIds } },
            { receiverId: { in: demoUserIds } },
          ],
        },
      });
    }

    const users = await Promise.all(
      seedUsers.map((user) => this.upsertSeedUser(user, passwordHash)),
    );

    const userIdByEmail = new Map(users.map((u) => [u.email!, u.id]));
    const demoUserId = userIdByEmail.get(DEMO_OWNER_EMAIL)!;

    const friendEmails = [
      'nina@chatapp.local',
      'marco@chatapp.local',
      'sofia@chatapp.local',
      'leo@chatapp.local',
      'camila@chatapp.local',
    ];
    const friendshipStart = new Date('2026-02-18T14:00:00.000Z');

    for (let index = 0; index < friendEmails.length; index++) {
      const friendId = userIdByEmail.get(friendEmails[index])!;
      await this.ensureAcceptedFriendship(
        demoUserId,
        friendId,
        new Date(friendshipStart.getTime() + index * 24 * 60 * 60 * 1000),
      );
    }

    for (const serverSeed of demoServers) {
      await this.seedServer(serverSeed, userIdByEmail);
    }
  }

  private async upsertSeedUser(user: SeedUser, passwordHash: string) {
    return this.prisma.user.upsert({
      where: { email: user.email },
      update: { username: user.username, passwordHash, status: user.status },
      create: {
        email: user.email,
        username: user.username,
        passwordHash,
        status: user.status,
      },
    });
  }

  private async ensureAcceptedFriendship(
    userAId: string,
    userBId: string,
    createdAt: Date,
  ) {
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userAId, receiverId: userBId },
          { senderId: userBId, receiverId: userAId },
        ],
      },
    });

    if (existing) {
      await this.prisma.friendship.update({
        where: { id: existing.id },
        data: { status: RequestStatus.ACCEPTED },
      });
      return;
    }

    await this.prisma.friendship.create({
      data: {
        senderId: userAId,
        receiverId: userBId,
        status: RequestStatus.ACCEPTED,
        createdAt,
      },
    });
  }

  private async seedServer(
    serverSeed: SeedServer,
    userIdByEmail: Map<string, string>,
  ) {
    const ownerId = userIdByEmail.get(DEMO_OWNER_EMAIL)!;

    await this.prisma.server.deleteMany({
      where: { ownerId, name: serverSeed.name },
    });

    const server = await this.prisma.server.create({
      data: { name: serverSeed.name, ownerId },
    });

    const [adminRole, memberRole] = await Promise.all([
      this.prisma.role.create({
        data: {
          serverId: server.id,
          name: 'Admin',
          color: '#ef4444',
          permissions: ALL_SERVER_PERMISSIONS,
        },
      }),
      this.prisma.role.create({
        data: {
          serverId: server.id,
          name: 'Member',
          color: '#3b82f6',
          permissions: [],
        },
      }),
    ]);

    await this.prisma.member.createMany({
      data: serverSeed.memberEmails.map((email) => ({
        userId: userIdByEmail.get(email)!,
        serverId: server.id,
        roleId: email === DEMO_OWNER_EMAIL ? adminRole.id : memberRole.id,
      })),
    });

    const baseTime = new Date('2026-02-20T15:00:00.000Z');

    for (
      let channelIndex = 0;
      channelIndex < serverSeed.channels.length;
      channelIndex++
    ) {
      const channelSeed = serverSeed.channels[channelIndex];
      const channel = await this.prisma.channel.create({
        data: {
          serverId: server.id,
          name: channelSeed.name,
          type: channelSeed.type,
          createdAt: new Date(
            baseTime.getTime() + channelIndex * 60 * 60 * 1000,
          ),
        },
      });

      await this.prisma.message.createMany({
        data: channelSeed.messages.map((msg) => ({
          channelId: channel.id,
          authorId: userIdByEmail.get(msg.authorEmail)!,
          content: msg.content,
          createdAt: new Date(
            baseTime.getTime() + msg.minutesAfterStart * 60 * 1000,
          ),
        })),
      });

      await this.prisma.message.create({
        data: {
          channelId: channel.id,
          authorId: ownerId,
          content: serverSeed.description,
          createdAt: new Date(
            baseTime.getTime() + (channelIndex + 1) * 90 * 60 * 1000,
          ),
        },
      });
    }
  }
}
