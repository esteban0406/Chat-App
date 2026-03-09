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
    name: 'Software Development Hub',
    description:
      'A realistic community for product engineering, code reviews, architecture, and shipping features.',
    memberEmails: [
      DEMO_OWNER_EMAIL,
      'nina@chatapp.local',
      'marco@chatapp.local',
      'sofia@chatapp.local',
      'leo@chatapp.local',
    ],
    channels: [
      {
        name: 'general',
        type: ChannelType.TEXT,
        messages: [
          {
            authorEmail: 'nina@chatapp.local',
            content:
              'Morning team. I pushed the first pass of the auth flow and left notes about the token refresh edge cases.',
            minutesAfterStart: 0,
          },
          {
            authorEmail: 'demo@chatapp.local',
            content:
              'Nice. I will wire the websocket session handling today so presence is synced when users reconnect.',
            minutesAfterStart: 4,
          },
          {
            authorEmail: 'marco@chatapp.local',
            content:
              'I reviewed the branch. Main risk is duplicate reconnect events creating multiple active sockets for the same member.',
            minutesAfterStart: 8,
          },
          {
            authorEmail: 'leo@chatapp.local',
            content:
              'If we store socket ids per user in Redis later, that problem becomes easier to reason about at scale.',
            minutesAfterStart: 12,
          },
          {
            authorEmail: 'sofia@chatapp.local',
            content:
              'Agreed. For the demo we can keep it in memory, but I want the interface designed so the backend swap is trivial.',
            minutesAfterStart: 17,
          },
        ],
      },
      {
        name: 'frontend',
        type: ChannelType.TEXT,
        messages: [
          {
            authorEmail: 'demo@chatapp.local',
            content:
              'Sidebar is feeling solid. Next pass is making the active channel state more obvious on smaller screens.',
            minutesAfterStart: 24,
          },
          {
            authorEmail: 'nina@chatapp.local',
            content:
              'Please keep the friend list dense. The product feels better when users can scan presence quickly.',
            minutesAfterStart: 28,
          },
          {
            authorEmail: 'leo@chatapp.local',
            content:
              'I can add subtle unread badges and keep the palette restrained so it does not look noisy.',
            minutesAfterStart: 31,
          },
        ],
      },
      {
        name: 'backend',
        type: ChannelType.TEXT,
        messages: [
          {
            authorEmail: 'marco@chatapp.local',
            content:
              'Channel pagination works, but we should seed older messages so the infinite scroll path is easy to verify.',
            minutesAfterStart: 38,
          },
          {
            authorEmail: 'demo@chatapp.local',
            content:
              'That is part of the demo mode work. I am creating seeded channels with enough history to feel like a real workspace.',
            minutesAfterStart: 41,
          },
          {
            authorEmail: 'sofia@chatapp.local',
            content:
              'Also include a project-explanation server. New users should understand the purpose of the app without clicking around too much.',
            minutesAfterStart: 46,
          },
        ],
      },
    ],
  },
  {
    name: 'Demo server',
    description:
      'Project and product context for the demo environment, including what the chat app is for and what should be shown.',
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
            content:
              'Welcome to the demo workspace. This server explains the project and gives the account some believable activity on first load.',
            minutesAfterStart: 0,
          },
          {
            authorEmail: 'camila@chatapp.local',
            content:
              'The goal is simple: when someone enters demo mode, they should immediately understand the product without creating data themselves.',
            minutesAfterStart: 3,
          },
          {
            authorEmail: 'nina@chatapp.local',
            content:
              'Exactly. Empty chat apps feel broken, so the seed should show friends, joined servers, active channels, and natural conversation history.',
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
            content:
              'This project is a real-time chat platform with friendships, servers, channels, and live messaging.',
            minutesAfterStart: 12,
          },
          {
            authorEmail: 'leo@chatapp.local',
            content:
              'Demo mode is for product walkthroughs, portfolio reviews, and testing the UI without manual setup.',
            minutesAfterStart: 16,
          },
          {
            authorEmail: 'camila@chatapp.local',
            content:
              'It is also useful for QA because every run starts from a known dataset and the interface stays easy to validate.',
            minutesAfterStart: 20,
          },
          {
            authorEmail: 'nina@chatapp.local',
            content:
              'If someone asks what to look at first, point them to the friends list, the server switcher, and message history across both servers.',
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
            content:
              'Future improvement: add a few pending notifications so the dashboard feels even more alive.',
            minutesAfterStart: 30,
          },
          {
            authorEmail: DEMO_OWNER_EMAIL,
            content:
              'Agreed, but first I want the core seed to be deterministic and easy to rerun during development.',
            minutesAfterStart: 34,
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
          content: `Seed note: ${serverSeed.description}`,
          createdAt: new Date(
            baseTime.getTime() + (channelIndex + 1) * 90 * 60 * 1000,
          ),
        },
      });
    }
  }
}
