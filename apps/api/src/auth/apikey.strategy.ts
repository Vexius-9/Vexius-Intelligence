import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
    if (!authHeader) {
      throw new UnauthorizedException('API key is missing.');
    }

    let rawKey = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.substring(7);
    }

    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { key: rawKey },
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API Key.');
    }

    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      throw new UnauthorizedException('API Key has expired.');
    }

    // Return the authorized user structure mimicking CurrentUser profile context
    return {
      id: keyRecord.userId,
      workspaceId: keyRecord.workspaceId,
      isApiKey: true,
    };
  }
}
