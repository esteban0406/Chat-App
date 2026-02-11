import { Test, TestingModule } from '@nestjs/testing';
import { LivekitController } from '../../../../src/modules/livekit/livekit.controller';
import { LivekitService } from '../../../../src/modules/livekit/livekit.service';

describe('LivekitController', () => {
  let controller: LivekitController;
  const livekitService = { generateToken: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LivekitController],
      providers: [{ provide: LivekitService, useValue: livekitService }],
    }).compile();

    controller = module.get(LivekitController);
    jest.clearAllMocks();
  });

  it('joinRoom delegates to service', async () => {
    livekitService.generateToken.mockResolvedValue({ token: 't', url: 'u' });

    await expect(
      controller.joinRoom({ identity: 'user', room: 'room1' }),
    ).resolves.toEqual({ token: 't', url: 'u' });

    expect(livekitService.generateToken).toHaveBeenCalledWith('user', 'room1');
  });
});
