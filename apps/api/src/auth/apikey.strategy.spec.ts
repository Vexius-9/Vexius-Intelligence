import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyStrategy } from './apikey.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('ApiKeyStrategy', () => {
  let strategy: ApiKeyStrategy;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockPrisma = {
      apiKey: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyStrategy,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    strategy = module.get<ApiKeyStrategy>(ApiKeyStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should throw UnauthorizedException if authorization header is missing', async () => {
    const mockReq = { headers: {} };
    await expect(strategy.validate(mockReq)).rejects.toThrow(UnauthorizedException);
  });

  it('should validate API key correctly and return profile object', async () => {
    const mockReq = { headers: { authorization: 'Bearer vexius-api-key' } };
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      key: 'vexius-api-key',
      userId: 'user-123',
      workspaceId: 'workspace-123',
      expiresAt: null,
    });

    const user = await strategy.validate(mockReq);
    expect(user).toEqual({
      id: 'user-123',
      workspaceId: 'workspace-123',
      isApiKey: true,
    });
  });

  it('should throw UnauthorizedException for expired key', async () => {
    const mockReq = { headers: { 'x-api-key': 'expired-key' } };
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      key: 'expired-key',
      userId: 'user-123',
      workspaceId: 'workspace-123',
      expiresAt: new Date(Date.now() - 10000), // expired 10s ago
    });

    await expect(strategy.validate(mockReq)).rejects.toThrow(UnauthorizedException);
  });
});
