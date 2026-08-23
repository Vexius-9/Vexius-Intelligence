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
    
    if (provider === 'openai') {
      const openai = createOpenAI({
        apiKey: this.configService.get('OPENAI_API_KEY'),
      });
      return openai(modelId || 'gpt-4o');
    }

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

    throw new BadRequestException(`Unsupported provider: ${provider}. Use 'openai', 'xai', or 'deepseek'.`);
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
      if (context.documentContent) {
        prompt += `\n\n--- CURRENT DOCUMENT CONTENT ---\n${context.documentContent}\n--------------------------------\n\n`;
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

    prompt += `\n\nIMPORTANT RULES FOR YOUR RESPONSES:\n`;
    prompt += `1. When the user asks you to write, rewrite, or generate content for the document, output ONLY the content itself.\n`;
    prompt += `2. DO NOT include conversational filler like "Here is the story...", "I hope you like this...", or "Let me know if...".\n`;
    prompt += `3. DO NOT wrap your response in markdown code blocks or blockquotes unless specifically asked to write code.\n`;
    prompt += `4. DO NOT use horizontal rules ('---') to separate your response from filler, just don't write filler.\n`;

    if (context?.documentType === 'spreadsheet') {
      prompt += `5. SPREADSHEET MODE: When asked to generate templates (like financial plans, schedules, tables, etc.), you MUST format your response as a standard Markdown table (e.g., | Col1 | Col2 |\\n|---|---|\\n| Val1 | Val2 |). Do not use JSON or other formats for templates.\n`;
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

  async executeInlineAction(action: 'rewrite' | 'summarize' | 'grammar' | 'generate_formula' | 'generate_table' | 'explain_formula' | 'slide_structure' | 'summarize_pdf', text: string, workspaceId?: string, userId?: string, documentId?: string) {
    if ((!text || text.trim() === "") && documentId) {
      // Fetch document chunks if text is empty
      const chunks = await this.prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { createdAt: 'asc' }
      });
      if (chunks.length > 0) {
        text = chunks.map(c => c.content).join('\n\n');
      } else {
        // Fallback: If no chunks, fetch from storage and parse on the fly
        const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
        if (doc && doc.storageKey) {
          const { StorageClient } = await import('@vexius/storage');
          const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
          const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
          const storageClient = new StorageClient(supabaseUrl, supabaseKey);
          
          try {
            const fileBuffer = await storageClient.downloadFile('vexius-documents', doc.storageKey);
            if (doc.type === 'pdf') {
              // pdf-parse is CommonJS, so we need .default when dynamically imported
              const pdfParseModule = await Function('return import("pdf-parse")')();
              const pdfParse = pdfParseModule.default || pdfParseModule;
              const pdfData = await pdfParse(fileBuffer);
              text = pdfData.text;
            } else if (doc.type === 'document' || doc.type === 'spreadsheet' || doc.type === 'presentation') {
              const officeParser = await Function('return import("officeparser")')();
              text = await officeParser.parseOfficeAsync(fileBuffer);
            }
          } catch (e) {
            this.logger.error(`Failed to parse document on the fly: ${e.message}`, e);
          }
        }
      }

      if (text) {
        // Truncate to ~200,000 characters to prevent massive context overflow for standard inline models
        if (text.length > 200000) {
          text = text.substring(0, 200000) + '... [Document truncated due to length]';
        }
      }
    }

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
    } else if (action === 'generate_table') {
      prompt = `You are a Spreadsheet/Excel data generation assistant. Based on the user's description, create a complete table structure. You must return ONLY a raw JSON 2D Array of strings and numbers (e.g., [["Name", "Age"], ["John", 30]]). Do NOT include any markdown code blocks, formatting, or extra text. Description: ${text}`;
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

  /**
   * Vexius Agents
   */
  async runAgent(agentType: 'financial-analyst' | 'legal-reviewer', documentId: string, workspaceId: string, userId: string, documentContent?: string) {
    let text = documentContent || "";
    
    if (!text || text.trim() === "") {
      // 1. Fetch document chunks
      const chunks = await this.prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { id: 'asc' }
      });

      if (!chunks || chunks.length === 0) {
        throw new BadRequestException("Document has not been indexed yet or is empty.");
      }
      text = chunks.map(c => c.content).join('\n\n');
    }

    const doc = await this.prisma.document.findUnique({ where: { id: documentId }});
    if (!doc) throw new BadRequestException("Document not found");

    let prompt = "";
    let resultFileName = "";
    let systemPrompt = "";

    if (agentType === 'financial-analyst') {
      systemPrompt = `You are a world-class Financial Analyst Agent.
Your objective is to review the provided financial model or spreadsheet data (often in CSV format) and provide a concise, high-level financial analysis.
If you find actionable insights, you may suggest updates to the model. To update a cell in the model, output a JSON block like:
\`\`\`json
{ "action": "update_cell", "row": 0, "col": 1, "value": 5000 }
\`\`\`
Note: Row and Col are 0-indexed. Do not output JSON unless you want to update the grid.`;
      prompt = `Analyze the following data:
${text.substring(0, 50000)}
`;
      resultFileName = `Financial Analysis - ${doc.name}.md`;
    } else if (agentType === 'legal-reviewer') {
      prompt = `You are an expert Legal Counsel. Review the following contract/document text.
Identify any potential conflicts of interest, liabilities, missing standard clauses, or ambiguous terms.
Format the output as a professional Markdown document with clear headings and bullet points.

Text:
${text.substring(0, 50000)}
`;
      resultFileName = `Legal Review - ${doc.name}.md`;
    }

    const model = await this.getModel('openai:gpt-4o');
    // @ts-ignore
    const { generateText } = await Function('return import("ai")')();

    const result = await generateText({
      model,
      system: systemPrompt ? systemPrompt : undefined,
      prompt,
    });

    const markdownContent = result.text;
    const buffer = Buffer.from(markdownContent, 'utf-8');

    // 2. Save document to storage and DB
    const { StorageClient } = await import('@vexius/storage');
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
    const storageClient = new StorageClient(supabaseUrl, supabaseKey);

    const newDocId = crypto.randomUUID();
    const storagePath = `workspaces/${workspaceId}/documents/${newDocId}/versions/1-${resultFileName}`;

    await storageClient.uploadFile('vexius-documents', storagePath, buffer, 'text/markdown');

    const createdDoc = await this.prisma.document.create({
      data: {
        id: newDocId,
        workspaceId,
        ownerId: userId,
        name: resultFileName,
        type: 'document',
        mimeType: 'text/markdown',
        storageKey: storagePath,
        size: buffer.length,
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            storageKey: storagePath,
            createdBy: userId
          }
        }
      }
    });

    return createdDoc;
  }
}
