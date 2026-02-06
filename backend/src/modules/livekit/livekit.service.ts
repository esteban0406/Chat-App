import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import 'dotenv/config';

@Injectable()
export class LivekitService {
  private readonly apiKey = process.env.LIVEKIT_API_KEY;
  private readonly apiSecret = process.env.LIVEKIT_API_SECRET;
  private readonly livekitUrl =
    process.env.LIVEKIT_URL || 'ws://localhost:7880';

  async generateToken(
    identity: string,
    room: string,
  ): Promise<{ token: string; url: string }> {
    const at = new AccessToken(this.apiKey, this.apiSecret, { identity });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    });

    const token = await at.toJwt();

    return { token, url: this.livekitUrl };
  }
}
