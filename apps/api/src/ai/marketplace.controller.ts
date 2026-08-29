import { Controller, Post, Get, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard';

export interface PublishManifest {
  name: string;
  description: string;
  version: string;
  author: string;
  manifestUrl: string;
}

@Controller('marketplace')
@UseGuards(HybridAuthGuard)
export class MarketplaceController {
  constructor(private prisma: PrismaService) {}

  @Get('agents')
  async listAgents() {
    return this.prisma.marketplaceAgent.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('publish')
  async publishAgent(@Body() body: PublishManifest) {
    const { name, description, version, author, manifestUrl } = body;
    if (!name || !version || !manifestUrl) {
      throw new BadRequestException('name, version, and manifestUrl are required.');
    }

    // Verify manifest contents by fetching manifestUrl (mocked validation simulation)
    if (!manifestUrl.startsWith('http://') && !manifestUrl.startsWith('https://')) {
      throw new BadRequestException('manifestUrl must be a valid URL.');
    }

    const created = await this.prisma.marketplaceAgent.create({
      data: {
        name,
        description: description || '',
        version,
        author: author || 'Unknown',
        manifestUrl,
      },
    });

    return {
      status: 'success',
      message: 'Agent published successfully to the marketplace registry.',
      agent: created,
    };
  }
}
