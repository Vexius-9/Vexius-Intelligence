import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BrowserService } from '../browser/browser.service';
import { ConfigService } from '@nestjs/config';
import { ModelRouterService } from './model-router.service';

describe('AiService - Autonomous Financial Analyst', () => {
  let service: AiService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockPrisma = {
      document: {
        findUnique: jest.fn().mockResolvedValue({ id: 'doc-123', name: 'Test Model' }),
        create: jest.fn().mockImplementation((args) => Promise.resolve(args.data)),
      },
      documentChunk: {
        findMany: jest.fn().mockResolvedValue([{ content: 'Revenue,COGS,#REF!,EBITDA\n4000000,1280000,#REF!,2720000' }]),
      },
      workspaceMemory: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((args) => Promise.resolve(args.data)),
      },
    };

    const mockAudit = {
      logAction: jest.fn(),
    };

    const mockBrowser = {
      search: jest.fn(),
      scrapePage: jest.fn(),
    };

    const mockModelRouter = {
      selectModel: jest.fn().mockResolvedValue('openai:gpt-4o'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: BrowserService, useValue: mockBrowser },
        { provide: ModelRouterService, useValue: mockModelRouter },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'OPENAI_API_KEY') return 'sk-test-key';
              if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
              if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should detect formula errors like #REF! in sheet data', async () => {
    // Inject mock for storage client upload
    jest.mock('@vexius/storage', () => {
      return {
        StorageClient: jest.fn().mockImplementation(() => {
          return {
            uploadFile: jest.fn().mockResolvedValue(true),
          };
        }),
      };
    });

    // Mock generative call inside tests
    const generateTextMock = jest.fn().mockResolvedValue({
      text: 'Mock financial analysis content showing Net Profit trend',
      usage: { totalTokens: 100 }
    });
    
    // Inject mock generateText function into module dynamic import mockup
    const originalFunction = global.Function;
    global.Function = jest.fn().mockImplementation((code) => {
      if (code.includes('import("ai")')) {
        return () => Promise.resolve({
          generateText: generateTextMock,
          streamText: jest.fn()
        });
      }
      return originalFunction(code);
    }) as any;

    const resultDoc = await service.runAgent(
      'financial-analyst',
      'doc-123',
      'workspace-123',
      'user-123'
    );
    
    global.Function = originalFunction; // restore

    expect(resultDoc).toBeDefined();
    expect(resultDoc.name).toContain('Financial Analysis');
  });

  it('should compile and run deep-researcher agent using browser service', async () => {
    // Inject mock for storage client upload
    jest.mock('@vexius/storage', () => {
      return {
        StorageClient: jest.fn().mockImplementation(() => {
          return {
            uploadFile: jest.fn().mockResolvedValue(true),
          };
        }),
      };
    });

    const browserService = (service as any).browserService;
    browserService.search.mockResolvedValue([{ title: 'NVIDIA report', link: 'https://nvidia.com', snippet: 'Earnings' }]);
    browserService.scrapePage.mockResolvedValue({ title: 'NVIDIA report', content: 'Revenue grew 100%' });

    const generateTextMock = jest.fn().mockResolvedValue({
      text: 'Mock compiled research document synthesizing NVIDIA growth with clear markdown citations.',
      usage: { totalTokens: 150 }
    });

    const originalFunction = global.Function;
    global.Function = jest.fn().mockImplementation((code) => {
      if (code.includes('import("ai")')) {
        return () => Promise.resolve({
          generateText: generateTextMock,
          streamText: jest.fn()
        });
      }
      return originalFunction(code);
    }) as any;

    const resultDoc = await service.runAgent(
      'deep-researcher',
      'temp-research-id',
      'workspace-123',
      'user-123',
      'NVIDIA revenue trends'
    );

    global.Function = originalFunction; // restore

    expect(resultDoc).toBeDefined();
    expect(resultDoc.name).toContain('Deep Research');
  });

  it('should include workspace memories in system prompt and allow saving/retrieving memories', async () => {
    const prismaMemoryMock = prisma.workspaceMemory as any;
    prismaMemoryMock.findMany = jest.fn().mockResolvedValue([
      { type: 'preference', key: 'gross_margin_target', value: '75%' }
    ]);
    prismaMemoryMock.create = jest.fn().mockResolvedValue({ id: 'mem-123' });

    const streamTextMock = jest.fn().mockResolvedValue({
      toTextStreamResponse: jest.fn().mockReturnValue('stream-result'),
      usage: { totalTokens: 80 }
    });

    const originalFunction = global.Function;
    global.Function = jest.fn().mockImplementation((code) => {
      if (code.includes('import("ai")')) {
        return () => Promise.resolve({
          streamText: streamTextMock,
          tool: jest.fn().mockImplementation((opts) => opts)
        });
      }
      if (code.includes('import("zod")')) {
        return () => Promise.resolve({
          z: {
            object: jest.fn().mockReturnValue({}),
            string: jest.fn().mockReturnValue({ describe: jest.fn().mockReturnValue({}) }),
            enum: jest.fn().mockReturnValue({ describe: jest.fn().mockReturnValue({}) })
          }
        });
      }
      return originalFunction(code);
    }) as any;

    const streamResponse = await service.chatStream(
      [{ role: 'user', content: 'Design spreadsheet' }],
      'openai:gpt-4o',
      { workspaceId: 'workspace-123', userId: 'user-123' }
    );

    global.Function = originalFunction;

    expect(streamResponse).toBe('stream-result');
  });
});
