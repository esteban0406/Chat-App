jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test } from '@nestjs/testing';
import { MessagesModule } from '../../../../src/modules/messages/messages.module';
import { MessagesService } from '../../../../src/modules/messages/messages.service';

describe('MessagesModule', () => {
  it('compiles with mocked service', async () => {
    const mod = await Test.createTestingModule({ imports: [MessagesModule] })
      .overrideProvider(MessagesService)
      .useValue({})
      .compile();

    expect(mod.get(MessagesModule)).toBeDefined();
  });
});
