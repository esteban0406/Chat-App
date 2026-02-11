import { Test } from '@nestjs/testing';
import { LivekitModule } from '../../../../src/modules/livekit/livekit.module';
import { LivekitService } from '../../../../src/modules/livekit/livekit.service';

describe('LivekitModule', () => {
  it('compiles with mocked service', async () => {
    const mod = await Test.createTestingModule({ imports: [LivekitModule] })
      .overrideProvider(LivekitService)
      .useValue({})
      .compile();

    expect(mod.get(LivekitModule)).toBeDefined();
  });
});
