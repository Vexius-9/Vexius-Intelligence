import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceController } from './marketplace.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('MarketplaceController', () => {
  let controller: MarketplaceController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockPrisma = {
      marketplaceAgent: {
        findMany: jest.fn().mockResolvedValue([{ id: 'agent-123', name: 'Solana Trader Agent' }]),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'agent-999', ...args.data })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketplaceController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<MarketplaceController>(MarketplaceController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should list published marketplace agents correctly', async () => {
    const agents = await controller.listAgents();
    expect(agents).toBeDefined();
    expect(agents[0].name).toBe('Solana Trader Agent');
  });

  it('should successfully publish validated manifest data', async () => {
    const response = await controller.publishAgent({
      name: 'Custom Writer',
      description: 'Generates text documents',
      version: '1.0.0',
      author: 'Antigravity Developer',
      manifestUrl: 'https://vexiusintelligence.tech/manifests/writer.json',
    });

    expect(response.status).toBe('success');
    expect(response.agent.name).toBe('Custom Writer');
  });

  it('should throw BadRequestException if manifestUrl is invalid', async () => {
    await expect(
      controller.publishAgent({
        name: 'Custom Writer',
        description: 'Generates text documents',
        version: '1.0.0',
        author: 'Antigravity Developer',
        manifestUrl: 'ftp://invalid-url.json',
      })
    ).rejects.toThrow(BadRequestException);
  });
});
