import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Resolve model provider dynamically using dynamic imports for ESM compatibility.
   */
  private async getModel(providerModelId: string) {
    const [provider, modelId] = providerModelId.split(':');
    
    // @ts-ignore
    const { createOpenAI } = await Function('return import("@ai-sdk/openai")')();

    if (provider === 'xai' || provider === 't2') {
      const xai = createOpenAI({
        baseURL: this.configService.get('LLM_T2_BASE_URL') || 'https://api.x.ai/v1',
        apiKey: this.configService.get('LLM_T2_API_KEY'),
      });
      return xai(modelId || this.configService.get('LLM_T2_MODEL') || 'grok-4.3');
    } 
    
    if (provider === 'deepseek' || provider === 't1') {
      const deepseek = createOpenAI({
        baseURL: this.configService.get('LLM_T1_BASE_URL') || 'https://api.deepseek.com/v1',
        apiKey: this.configService.get('LLM_T1_API_KEY'),
      });
      return deepseek(modelId || this.configService.get('LLM_T1_MODEL') || 'deepseek-chat');
    }

    throw new BadRequestException(`Unsupported provider: ${provider}. Gunakan 'xai' (T2) atau 'deepseek' (T1).`);
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
      onFinish: async ({ usage }) => {
        if (context?.workspaceId) {
          try {
            await this.prisma.workspace.update({
              where: { id: context.workspaceId },
              data: { aiTokensUsed: { increment: usage.totalTokens } }
            });
            await this.auditService.logAction(
              context.workspaceId,
              context.userId || 'SYSTEM',
              'AI_CHAT_STREAM',
              'WORKSPACE',
              { tokensUsed: usage.totalTokens, model: providerModelId }
            );
          } catch (e) {
            this.logger.error('Failed to update token usage', e);
          }
        }
      }
    });

    return result.toTextStreamResponse();
  }

  async executeInlineAction(action: 'rewrite' | 'summarize' | 'grammar' | 'generate_formula' | 'explain_formula' | 'slide_structure' | 'summarize_pdf', text: string, workspaceId?: string, userId?: string) {
    const model = await this.getModel('openai:gpt-4o'); // Use default model for inline actions or extract from config

    // @ts-ignore
    const { generateText } = await Function('return import("ai")')();

    let prompt = "";
    if (action === 'rewrite') {
      prompt = `You are a professional editor. Please rewrite the following text to improve its flow, clarity, and tone. Return ONLY the rewritten text without any quotes or explanations.\n\nText: ${text}`;
    } else if (action === 'summarize') {
      prompt = `You are an expert summarizer. Please summarize the following text concisely. Return ONLY the summarized text without any quotes or explanations.\n\nText: ${text}`;
    } else if (action === 'grammar') {
      prompt = `You are a strict grammar checker. Please fix any spelling, punctuation, or grammatical errors in the following text. Preserve the original meaning and tone as much as possible. Return ONLY the corrected text without any quotes or explanations.\n\nText: ${text}`;
    } else if (action === 'generate_formula') {
      prompt = `You are an Excel/Spreadsheet expert. Based on the user's description, generate ONLY the exact Excel formula starting with '='. Do not include any explanations, markdown code blocks, or quotes.\n\nDescription: ${text}`;
    } else if (action === 'explain_formula') {
      prompt = `You are an Excel/Spreadsheet expert. Please explain the following Excel formula in simple, easy-to-understand terms. Keep it concise.\n\nFormula: ${text}`;
    } else if (action === 'slide_structure') {
      prompt = `You are an expert presentation designer. Create a clear, professional slide outline based on the following text. Use bullet points. Do not include extra conversational filler.\n\nText: ${text}`;
    } else if (action === 'summarize_pdf') {
      prompt = `You are an expert document summarizer. Please provide a concise, high-level summary of the following PDF text. Highlight the main ideas.\n\nPDF Text: ${text}`;
    } else {
      throw new BadRequestException('Invalid action');
    }

    const result = await generateText({
      model,
      prompt,
    });

    if (workspaceId && userId) {
      try {
        await this.prisma.workspace.update({
          where: { id: workspaceId },
          data: { aiTokensUsed: { increment: result.usage?.totalTokens || 0 } }
        });
      } catch (e) {
        this.logger.error('Failed to update token usage for inline action', e);
      }
    }

    return { result: result.text };
  }
}
