import { Test, TestingModule } from '@nestjs/testing';
import { ModelRouterService } from './model-router.service';
import { ConfigService } from '@nestjs/config';

describe('ModelRouterService', () => {
  let service: ModelRouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelRouterService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ModelRouterService>(ModelRouterService);
  });

  it('should route rewrite tasks with low latency to grok-beta model', async () => {
    const model = await service.selectModel({
      taskType: 'rewrite',
      latencyTarget: 'low',
    });
    expect(model).toBe('xai:grok-beta');
  });

  it('should route financial-modelling tasks to deepseek-chat model', async () => {
    const model = await service.selectModel({
      taskType: 'financial-modelling',
    });
    expect(model).toBe('deepseek:deepseek-chat');
  });

  it('should fallback large context sizes above 100k characters to openai:gpt-4o', async () => {
    const model = await service.selectModel({
      taskType: 'rewrite',
      contextSize: 150000,
    });
    expect(model).toBe('openai:gpt-4o');
  });
});
