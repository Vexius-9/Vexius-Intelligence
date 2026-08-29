import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ModelRouteOptions {
  taskType: 'rewrite' | 'summarization' | 'research' | 'spreadsheet-reasoning' | 'financial-modelling' | 'code' | 'general-chat';
  contextSize?: number;
  latencyTarget?: 'low' | 'medium' | 'high';
}

@Injectable()
export class ModelRouterService {
  private readonly logger = new Logger(ModelRouterService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Automatically select the best model string identifier based on task type, latency target, and context length requirements
   */
  async selectModel(options: ModelRouteOptions): Promise<string> {
    const { taskType, contextSize = 1000, latencyTarget = 'medium' } = options;
    this.logger.log(`Selecting optimal model routing for task: ${taskType} (Context size: ${contextSize})`);

    // Rule 1: Large context size needs high-capacity model
    if (contextSize > 100000) {
      this.logger.log('Large context size detected. Routing to Vexius General (gpt-4o)');
      return 'openai:gpt-4o';
    }

    // Rule 2: Financial modelling or spreadsheet reasoning requires Reasoning model (DeepSeek)
    if (taskType === 'financial-modelling' || taskType === 'spreadsheet-reasoning') {
      this.logger.log('Complex reasoning task detected. Routing to Vexius Reasoning (deepseek-chat)');
      return 'deepseek:deepseek-chat';
    }

    // Rule 3: Fast rewrites or grammar checking goes to fast model (Grok or low latency fallback)
    if (taskType === 'rewrite' && latencyTarget === 'low') {
      this.logger.log('Low latency rewrite requested. Routing to Vexius Creative (grok-beta)');
      return 'xai:grok-beta';
    }

    // Default Fallback: OpenAI GPT-4o
    this.logger.log('Applying default model routing to Vexius General');
    return 'openai:gpt-4o';
  }
}
