import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BrowserService } from '../browser/browser.service';
import { ModelRouterService } from './model-router.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private auditService: AuditService,
    private browserService: BrowserService,
    private modelRouterService: ModelRouterService,
  ) {}

  /**
   * Resolve model provider dynamically using dynamic imports for ESM compatibility.
   */
  private async getModel(providerModelId: string) {
    // Split only on the FIRST colon to allow model IDs with dots (e.g. 'xai:grok-4.3')
    const colonIdx = providerModelId.indexOf(':');
    const provider = colonIdx !== -1 ? providerModelId.slice(0, colonIdx) : providerModelId;
    const modelId = colonIdx !== -1 ? providerModelId.slice(colonIdx + 1) : '';
    
    this.logger.log(`[ModelResolver] Provider: "${provider}", ModelId: "${modelId}"`);
    
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
      const resolvedModelId = modelId || this.configService.get('LLM_T2_MODEL') || 'grok-4.3';
      // grok-4.3 is a reasoning model — pass sendReasoningTokens so the AI SDK
      // properly streams the final 'content' field (not just reasoning_content).
      return xai(resolvedModelId, { sendReasoningTokens: true });
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
    prompt += `The official website of Vexius is https://vexiusintelligence.tech/.\n`;

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

    if (context?.documentType === 'presentation' || context?.documentType === 'pptx') {
      prompt += `5. PRESENTATION MODE: When generating HTML templates for slides, ALWAYS use 'height: 100%;' instead of 'height: 100vh;' for the main container. NEVER use 'min-height' that exceeds 500px (the canvas is 540px tall). Ensure your layout fits perfectly inside a 16:9 ratio without causing scrollbars.\n`;
    }

    if (context?.workspaceMemories) {
      prompt += `\n\n--- WORKSPACE PERSISTENT MEMORIES & PREFERENCES ---\nThese are facts, preferences, decisions, or target configurations stored previously by the user. You MUST adhere to these targets (e.g. margin targets, corporate terms, slide styles):\n${context.workspaceMemories}\n-------------------------------------------------\n\n`;
    }

    prompt += `\n6. REAL-TIME SEARCH: You have access to tools 'webSearch' and 'webScrape'. Whenever the user asks about current events, news, recent pricing, stock metrics, financial reports of specific dates, or any information you do not have in your static training data, you MUST use 'webSearch' to find results, and then 'webScrape' on relevant URLs to extract the exact figures before formulating your response. Always cite the URLs you retrieved data from at the bottom of your response.\n`;

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
    
    // Fetch all workspace memories for the current workspace and inject as context
    let enrichedContext = { ...context };
    if (context?.workspaceId) {
      try {
        const memories = await this.prisma.workspaceMemory.findMany({
          where: { workspaceId: context.workspaceId },
          orderBy: { updatedAt: 'desc' }
        });
        if (memories && memories.length > 0) {
          const memoryStr = memories.map(m => `[Memory: ${m.type}] key="${m.key}" value="${m.value}"`).join('\n');
          enrichedContext.workspaceMemories = memoryStr;
        }
      } catch (e) {
        this.logger.error('Failed to fetch workspace memories for context', e);
      }
    }

    // @ts-ignore
    const { streamText, tool } = await Function('return import("ai")')();
    // @ts-ignore
    const { z } = await Function('return import("zod")')();
    
    const result = await streamText({
      model,
      system: this.buildSystemPrompt(enrichedContext),
      messages,
      maxSteps: 5, // Allow multi-step tool execution for search + scrape
      tools: {
        webSearch: tool({
          description: 'Search the web using DuckDuckGo/Wikipedia for real-time information.',
          parameters: z.object({
            query: z.string().describe('The search query to look up on the web.'),
          }),
          execute: async ({ query }: { query: string }) => {
            this.logger.log(`Tool Execute: webSearch for "${query}"`);
            const results = await this.browserService.search(query);
            return { results };
          },
        }),
        webScrape: tool({
          description: 'Scrape and extract the text content of a specific web URL.',
          parameters: z.object({
            url: z.string().describe('The URL of the webpage to scrape.'),
          }),
          execute: async ({ url }: { url: string }) => {
            this.logger.log(`Tool Execute: webScrape for "${url}"`);
            const pageData = await this.browserService.scrapePage(url);
            return { pageData };
          },
        }),
        saveWorkspaceMemory: tool({
          description: 'Save a specific workspace preference, fact, or recurring entity dynamically into memory.',
          parameters: z.object({
            type: z.enum(['preference', 'fact', 'entity', 'assumption', 'decision', 'template']).describe('Type of memory classification.'),
            key: z.string().describe('The key mapping of the memory item (e.g. gross_margin_target, target_slide_count).'),
            value: z.string().describe('The value content of the memory.'),
          }),
          execute: async ({ type, key, value }: { type: string, key: string, value: string }) => {
            if (!context?.workspaceId) return { success: false, error: 'No active workspace context' };
            this.logger.log(`Tool Execute: saveWorkspaceMemory [${type}] ${key} => ${value}`);
            const memory = await this.prisma.workspaceMemory.create({
              data: {
                workspaceId: context.workspaceId,
                type,
                key,
                value,
                confidence: 1.0,
              }
            });
            return { success: true, memoryId: memory.id };
          },
        }),
        getWorkspaceMemory: tool({
          description: 'Retrieve stored facts, preferences, or decisions from workspace memory using a key.',
          parameters: z.object({
            key: z.string().describe('The key of the memory to fetch.'),
          }),
          execute: async ({ key }: { key: string }) => {
            if (!context?.workspaceId) return { results: [] };
            this.logger.log(`Tool Execute: getWorkspaceMemory for key "${key}"`);
            const memories = await this.prisma.workspaceMemory.findMany({
              where: { workspaceId: context.workspaceId, key },
              orderBy: { createdAt: 'desc' }
            });
            return { results: memories };
          },
        }),
      },
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

  async executeInlineAction(action: 'rewrite' | 'summarize' | 'grammar' | 'generate_formula' | 'generate_table' | 'explain_formula' | 'slide_structure' | 'summarize_pdf' | 'text_to_bullets' | 'speaker_notes' | 'generate_slide' | 'browser_search' | 'browser_extract', text: string, workspaceId?: string, userId?: string, documentId?: string) {
    // Check browser actions directly to skip document loading if irrelevant
    if (action === 'browser_search') {
      // Auto-detect: if the input looks like a URL, scrape it instead of searching
      const isUrl = /^https?:\/\/.+/i.test(text.trim());
      if (isUrl) {
        this.logger.log(`[browser_search] Input detected as URL — routing to scrapePage: ${text}`);
        const pageData = await this.browserService.scrapePage(text.trim());
        return { result: JSON.stringify(pageData, null, 2) };
      }
      const results = await this.browserService.search(text);
      return { result: JSON.stringify(results, null, 2) };
    }
    if (action === 'browser_extract') {
      const pageData = await this.browserService.scrapePage(text);
      return { result: JSON.stringify(pageData, null, 2) };
    }

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
              // pdf-parse v2.4.5 uses PDFParse class
              const pdfParseModule = await Function('return import("pdf-parse")')();
              const PDFParseClass = pdfParseModule.PDFParse || pdfParseModule.default?.PDFParse;
              if (PDFParseClass) {
                const parser = new PDFParseClass({ data: fileBuffer });
                const pdfData = await parser.getText();
                text = pdfData.text;
                await parser.destroy();
              } else {
                throw new Error("PDFParse class not found in module");
              }
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

    // Map inline actions to Model Router task classes
    let taskType: 'rewrite' | 'summarization' | 'spreadsheet-reasoning' | 'general-chat' = 'general-chat';
    if (action === 'rewrite' || action === 'grammar') taskType = 'rewrite';
    if (action === 'summarize' || action === 'summarize_pdf') taskType = 'summarization';
    if (action === 'generate_formula' || action === 'generate_table') taskType = 'spreadsheet-reasoning';

    const routedModelId = await this.modelRouterService.selectModel({
      taskType,
      contextSize: text.length
    });

    const model = await this.getModel(routedModelId);

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
    } else if (action === 'text_to_bullets') {
      prompt = `You are an expert presentation designer. Convert the following text into concise, professional bullet points suitable for a presentation slide. Return only the bullet points.\n\nText: ${text}`;
    } else if (action === 'speaker_notes') {
      prompt = `You are an expert public speaker. Generate clear and engaging speaker notes for a presentation based on the following slide content. The notes should help the presenter elaborate on the points naturally.\n\nSlide Content: ${text}`;
    } else if (action === 'generate_slide') {
      prompt = `You are an expert presentation designer. Generate a complete slide (or multiple slides if needed) in HTML structure based on the following topic or text. Use standard HTML tags like <h1>, <h2>, <ul>, <li>, <p>. If generating multiple slides, you MUST separate each slide with exactly "---SLIDE_SEPARATOR---" on a new line. Do NOT write "Slide 1:" or "Slide 2:". If the user specifies any visual style, theme, or design preferences in the text, you MUST apply inline CSS styles (e.g. style="color: blue; text-align: center;") to the elements to match their request. Return only the HTML content, no markdown code blocks.\n\nTopic/Text/Style Request: ${text}`;
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
    /**
   * Vexius Agents
   */
  async runAgent(agentType: 'financial-analyst' | 'legal-reviewer' | 'deep-researcher', documentId: string, workspaceId: string, userId: string, documentContent?: string) {
    let text = documentContent || "";
    
    // For deep-researcher, documentId might be temp, but we can bypass DB document check
    let docName = "Web Query";
    if (agentType !== 'deep-researcher') {
      if (!text || text.trim() === "") {
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
      docName = doc.name;
    }

    let prompt = "";
    let resultFileName = "";
    let systemPrompt = "";
    let scrapedSources: { title: string; url: string; snippet: string }[] = [];

    if (agentType === 'financial-analyst') {
      systemPrompt = `You are a world-class Financial Analyst Agent.
Your objective is to review the provided financial model or spreadsheet data (often in CSV or JSON 2D array format) and perform calculations:
1. Verify formulas and check for standard errors like '#REF!', '#VALUE!', '#DIV/0!', '#NAME?', '#CYCLE!'. If found, write a validation alert.
2. Build sensitivity analysis models (e.g. comparing growth rates, calculating margins, scenario comparison).
3. If you find errors or decide to update the financial projections based on user assumptions, suggest updates to the model cells.
4. IMPORTANT: For any cell containing formula errors, you MUST generate a fix recommendation. Propose corrected formulas or values to fix the errors by outputting JSON cell updates.

LANGUAGE & EXPLANATION RULE:
- You MUST write the explanation report in clear, polite, and simple ENGLISH.
- Avoid overly academic, financial, or complex spreadsheet jargon. Make the recommendations extremely easy to understand for laymen/ordinary people.
- Clearly explain *why* the error occurred (e.g., "there is a typo where the minus sign (-) is missing in your formula" instead of "syntax syntax error typo in arithmetic operand") and *what* it is calculating (e.g., "calculating the difference between Actual Spent and Budget").

To update a cell in the model (e.g., cell B2 or C3), output a JSON block like:
\`\`\`json
{ "action": "update_cell", "row": 1, "col": 1, "value": "=SUM(B2:B5)" }
\`\`\`
Note: Row and Col are 0-indexed. Do not output JSON unless you want to update the grid. Always summarize the final Net Profit, EBITDA, and Revenue trends in simple terms.`;
      const errorsFound: string[] = [];
      const dataLines = text.split('\n');
      dataLines.forEach((line, rIndex) => {
        // Parse CSV fields by splitting commas
        const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
        cells.forEach((cellVal, cIndex) => {
          const cleanVal = cellVal.replace(/^"|"$/g, '').trim();
          const colLetter = String.fromCharCode(65 + cIndex);
          const cellCoord = `${colLetter}${rIndex + 1}`;
          
          if (cleanVal.includes('#REF!')) errorsFound.push(`Cell ${cellCoord}: Formula references invalid cell (#REF!)`);
          if (cleanVal.includes('#VALUE!')) errorsFound.push(`Cell ${cellCoord}: Value type mismatch (#VALUE!)`);
          if (cleanVal.includes('#DIV/0!')) errorsFound.push(`Cell ${cellCoord}: Division by zero (#DIV/0!)`);
          if (cleanVal.includes('#NAME?')) errorsFound.push(`Cell ${cellCoord}: Invalid function name (#NAME?)`);
          if (cleanVal.includes('#CYCLE!') || cleanVal.toLowerCase().includes('cycle') || cleanVal.toLowerCase().includes('circular')) {
            errorsFound.push(`Cell ${cellCoord}: Circular reference dependency loop detected (#CYCLE!)`);
          }
          if (cleanVal.includes('#N/A')) errorsFound.push(`Cell ${cellCoord}: Value not available (#N/A)`);
          if (cleanVal.includes('#NUM!')) errorsFound.push(`Cell ${cellCoord}: Numeric error (#NUM!)`);
          if (cleanVal.includes('#NULL!')) errorsFound.push(`Cell ${cellCoord}: Null reference error (#NULL!)`);
        });
      });

      prompt = `Analyze the following sheet data. 
${errorsFound.length > 0 ? `[VALIDATION ALERT] Found the following spreadsheet errors:\n${errorsFound.join('\n')}\n` : 'No obvious formula crashes detected. Validate all cell equations.'}

Spreadsheet Data:
${text.substring(0, 50000)}
`;
      resultFileName = `Financial Analysis - ${docName}.md`;
    } else if (agentType === 'legal-reviewer') {
      prompt = `You are an expert Legal Counsel. Review the following contract/document text.
Identify any potential conflicts of interest, liabilities, missing standard clauses, or ambiguous terms.
Format the output as a professional Markdown document with clear headings and bullet points.

Text:
${text.substring(0, 50000)}
`;
      resultFileName = `Legal Review - ${docName}.md`;
    } else if (agentType === 'deep-researcher') {
      this.logger.log(`Deep Researcher Agent started. Plan: Search web for "${text}"`);
      // Step 1: Sequential Planning & Web Search
      const searchResults = await this.browserService.search(text);
      const topSources = searchResults.slice(0, 5);
      
      // Step 2: Source collection & extraction — track scraped metadata
      const pageContents: string[] = [];

      for (const source of topSources) {
        try {
          const scraped = await this.browserService.scrapePage(source.link);
          pageContents.push(`SOURCE: ${source.link}\nTITLE: ${scraped.title || source.title}\nCONTENT EXCERPT: ${scraped.content.slice(0, 5000)}`);
          scrapedSources.push({
            title: scraped.title || source.title,
            url: source.link,
            snippet: source.snippet || scraped.content.slice(0, 180),
          });
        } catch (e) {
          this.logger.warn(`Failed to scrape source during Deep Research: ${source.link}`);
          scrapedSources.push({
            title: source.title,
            url: source.link,
            snippet: source.snippet || '',
          });
        }
      }

      systemPrompt = `You are the Vexius Deep Researcher Agent — an elite research analyst producing professional, publication-ready reports.

Your mandate is to write a COMPREHENSIVE, LONG-FORM research report of at least 2000 words. The report must be exhaustive, authoritative, and richly detailed.

STRUCTURE REQUIREMENTS (follow this exactly):
1. **Executive Summary** (150-200 words) — key findings and conclusions
2. **Introduction & Background** — context, why this topic matters, scope of research
3. **Methodology** — how data was gathered and evaluated
4. **Main Analysis Sections** (minimum 4 distinct sections with H3 headers) — deep-dive into each major dimension of the topic with data points, statistics, and examples
5. **Comparative Analysis Table** — a markdown table comparing key metrics side-by-side where applicable
6. **Expert Insights & Market Trends** — synthesize forward-looking perspectives
7. **Risks, Challenges & Limitations** — balanced critique
8. **Recommendations & Conclusion** — actionable takeaways

CRITICAL CITATION RULES:
- You are provided with numbered sources [Source 1], [Source 2], etc.
- When citing a fact, use the format [Source N] inline (e.g. "Solana processes 50,000 TPS [Source 1]")
- ONLY cite sources that are provided below. Do NOT invent, fabricate, or hallucinate any URLs or source titles.
- Do NOT create a References/Bibliography/Footnotes section at the end — it will be auto-generated from verified sources.

STYLE RULES:
- Use professional academic/analyst tone throughout
- Include specific numbers, percentages, and dates wherever possible
- Use markdown headers (##, ###, ####), bullet lists, numbered lists, and tables liberally
- Do NOT use conversational filler or phrases like "In this report, we will..."
- Minimum output: 2000 words. Aim for 3000+ words.`;

      // Build numbered source blocks so AI can cite them properly
      const numberedSources = pageContents.map((content, idx) => {
        return `=== [Source ${idx + 1}] ===\n${content}`;
      });

      prompt = `User Query: ${text}

Here are the verified web sources to base your analysis on. Cite them as [Source N]:

${numberedSources.join('\n\n')}
`;
      resultFileName = `Deep Research - ${text.slice(0, 20)}.md`;
    }

    const model = await this.getModel('openai:gpt-4o');
    // @ts-ignore
    const { generateText } = await Function('return import("ai")')();

    const result = await generateText({
      model,
      system: systemPrompt ? systemPrompt : undefined,
      prompt,
      maxTokens: agentType === 'deep-researcher' ? 8000 : 4000,
    });

    let markdownContent = result.text;

    // Post-process deep-researcher: strip any AI-fabricated references section and append real ones
    if (agentType === 'deep-researcher' && scrapedSources.length > 0) {
      // Remove any AI-generated References/Bibliography/Footnotes section at the end
      markdownContent = markdownContent.replace(/\n+(?:#{1,4}\s*)?(?:References|Bibliography|Sources|Footnotes|Works Cited|Citations)[\s\S]*$/i, '');
      // Remove any [^n]: footnote definitions the AI might have added
      markdownContent = markdownContent.replace(/^\[\^\d+\]:.*$/gm, '');
      // Clean up trailing whitespace
      markdownContent = markdownContent.trimEnd();

      // Append verified references
      const refsBlock = scrapedSources.map((s, i) =>
        `${i + 1}. [${s.title || 'Source'}](${s.url})${s.snippet ? ' — ' + s.snippet.slice(0, 120) : ''}`
      ).join('\n');

      markdownContent += `\n\n---\n\n## References\n\n${refsBlock}\n`;
    }

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

    // Write structural ProvenanceRecord to AuditLog database
    try {
      await this.auditService.logAction(
        workspaceId,
        userId,
        `AI_AGENT_EXECUTION_${agentType.toUpperCase().replace(/-/g, '_')}`,
        createdDoc.id,
        {
          modelUsed: 'openai:gpt-4o',
          tokensUsed: result.usage?.totalTokens || 0,
          documentName: resultFileName,
          verifiableSources: agentType === 'deep-researcher' ? 'Dynamic Scraper Hybrid Sources' : 'Context-Injected DB Reference',
          systemPromptCitations: systemPrompt,
          isAgentExecution: true
        }
      );
    } catch (auditErr) {
      this.logger.error('Failed to log provenance audit record', auditErr);
    }

    return {
      ...createdDoc,
      result: markdownContent,
      sources: scrapedSources,
    };
  }
}
