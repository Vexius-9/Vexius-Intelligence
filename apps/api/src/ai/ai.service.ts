import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  /**
   * Resolve model provider dynamically using dynamic imports for ESM compatibility.
   */
  private async getModel(providerModelId: string) {
    const [provider, modelId] = providerModelId.split(':');
    
    if (provider === 'openai') {
      // @ts-ignore
      const { createOpenAI } = await Function('return import("@ai-sdk/openai")')();
      const openai = createOpenAI({
        apiKey: this.configService.get('OPENAI_API_KEY'),
      });
      return openai(modelId || 'gpt-4o');
    } 
    
    if (provider === 'anthropic') {
      // @ts-ignore
      const { createAnthropic } = await Function('return import("@ai-sdk/anthropic")')();
      const anthropic = createAnthropic({
        apiKey: this.configService.get('ANTHROPIC_API_KEY'),
      });
      return anthropic(modelId || 'claude-3-5-sonnet-20240620');
    }

    if (provider === 'google') {
      // @ts-ignore
      const { createGoogleGenerativeAI } = await Function('return import("@ai-sdk/google")')();
      const google = createGoogleGenerativeAI({
        apiKey: this.configService.get('GEMINI_API_KEY'),
      });
      return google(modelId || 'gemini-1.5-pro-latest');
    }

    throw new BadRequestException(`Unsupported provider: ${provider}`);
  }

  /**
   * Inject document context into the system prompt.
   */
  private buildSystemPrompt(context?: any) {
    let prompt = `You are Vexius AI, an intelligent document collaboration assistant.\n`;
    prompt += `You help users write, edit, and analyze documents, spreadsheets, and presentations.\n`;

    if (context) {
      if (context.documentTitle) {
        prompt += `\nCurrent Document Title: ${context.documentTitle}`;
      }
      if (context.selectedText) {
        prompt += `\nThe user has currently selected the following text: "${context.selectedText}"`;
      }
      if (context.userRole) {
        prompt += `\nThe user's role is: ${context.userRole}. Make sure your suggestions respect their permission level.`;
      }
      if (context.semanticContext) {
        prompt += `\n\nHere is some context retrieved from the user's workspace documents that might be relevant to their query:\n${context.semanticContext}`;
      }
    }

    return prompt;
  }

  async semanticSearch(query: string, workspaceId: string) {
    
    // Check if ai-sdk has embed exported or use alternative.
    // Assuming `embed` is not used easily here without adding it to imports, let's just use raw fetch or add `embed` to imports.
    // Actually, I can just use `embed` from 'ai'.
    // Wait, let's use a simpler fetch since 'ai' might have different exports for embedding
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.configService.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small'
      })
    });
    
    const data = await response.json();
    const queryEmbedding = data.data[0].embedding;
    const embeddingVector = `[${queryEmbedding.join(',')}]`;

    // 2. Perform vector search in PostgreSQL using pgvector
    // <=> is cosine distance
    const results = await this.prisma.$queryRaw`
      SELECT c.id, c.content, d.name as "documentName", 1 - (c.embedding <=> ${embeddingVector}::vector) as similarity
      FROM "document_chunks" c
      JOIN "documents" d ON c.document_id = d.id
      WHERE d.workspace_id = ${workspaceId}
      ORDER BY c.embedding <=> ${embeddingVector}::vector
      LIMIT 5;
    `;

    return results;
  }

  async chatStream(messages: any[], providerModelId: string, context?: any) {
    const model = await this.getModel(providerModelId);
    
    // @ts-ignore
    const { streamText } = await Function('return import("ai")')();
    
    const result = await streamText({
      model,
      system: this.buildSystemPrompt(context),
      messages,
    });

    return result.toTextStreamResponse();
  }
}
