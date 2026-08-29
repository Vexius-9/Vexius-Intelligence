import { Test, TestingModule } from '@nestjs/testing';
import { AutomationProcessor } from './automation.processor';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { Job } from 'bullmq';

describe('AutomationProcessor', () => {
  let processor: AutomationProcessor;
  let prisma: PrismaService;
  let aiService: AiService;

  beforeEach(async () => {
    const mockPrisma = {
      automation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'auto-123',
          name: 'Weekly Report',
          prompt: 'Find NVIDIA earnings',
          workspaceId: 'workspace-123',
          userId: 'user-123',
          status: 'active',
        }),
        update: jest.fn().mockResolvedValue(true),
      },
      automationRun: {
        create: jest.fn().mockResolvedValue({ id: 'run-123' }),
        update: jest.fn().mockResolvedValue(true),
      },
    };

    const mockAiService = {
      runAgent: jest.fn().mockResolvedValue({ id: 'doc-456', name: 'Deep Research - Weekly Report.md' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    processor = module.get<AutomationProcessor>(AutomationProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    aiService = module.get<AiService>(AiService);
  });

  it('should process active scheduled automation jobs and generate research reports', async () => {
    const mockJob = {
      data: { automationId: 'auto-123' },
    } as Job;

    await processor.process(mockJob);

    expect(prisma.automation.findUnique).toHaveBeenCalledWith({ where: { id: 'auto-123' } });
    expect(aiService.runAgent).toHaveBeenCalledWith(
      'deep-researcher',
      'temp-research-id',
      'workspace-123',
      'user-123',
      'Find NVIDIA earnings'
    );
    expect(prisma.automationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-123' },
        data: expect.objectContaining({ status: 'completed' }),
      })
    );
  });
});
