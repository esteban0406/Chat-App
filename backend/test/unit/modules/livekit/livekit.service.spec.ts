import { Test, TestingModule } from '@nestjs/testing';
import { LivekitService } from '../../../../src/modules/livekit/livekit.service';

describe('LivekitService', () => {
  let service: LivekitService;

  beforeEach(async () => {
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret';
    process.env.LIVEKIT_URL = 'ws://localhost:7880';

    const module: TestingModule = await Test.createTestingModule({
      providers: [LivekitService],
    }).compile();

    service = module.get(LivekitService);
  });

  it('generates token response with token and url', async () => {
    const result = await service.generateToken('user-1', 'room-1');
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('url');
  });
});
