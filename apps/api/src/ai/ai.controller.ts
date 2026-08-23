import { Controller, Post, Body, Req, Res, UseGuards, Get, Query, BadRequestException } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Readable } from 'stream';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(
    @Body() body: { messages: any[]; model?: string; context?: any },
    @Res() res: FastifyReply
  ) {
    // Inject semantic search results if workspaceId is provided
    let enrichedContext = body.context || {};
    
    if (body.context?.workspaceId && body.messages.length > 0) {
      const lastMessage = body.messages[body.messages.length - 1];
      if (lastMessage.role === 'user') {
        const searchResults: any = await this.aiService.semanticSearch(lastMessage.content, body.context.workspaceId);
        if (searchResults && searchResults.length > 0) {
          enrichedContext.semanticContext = searchResults.map((r: any) => `Document: ${r.documentName}\nExcerpt: ${r.content}`).join('\n\n');
        }
      }
    }

    // Default to OpenAI GPT-4o if not specified
    const providerModelId = body.model || 'openai:gpt-4o';
    
    let webResponse;
    try {
      webResponse = await this.aiService.chatStream(
        body.messages,
        providerModelId,
        enrichedContext
      );
    } catch (err: any) {
      console.error('AI chatStream error:', err);
      return res.status(500).send({ statusCode: 500, message: err.message || 'Internal server error', details: err.toString() });
    }

    // Delegate streaming to Fastify so it properly applies CORS hooks
    res.header('Content-Type', webResponse.headers.get('Content-Type') || 'text/event-stream');
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');

    if (webResponse.body) {
      const nodeStream = Readable.fromWeb(webResponse.body as any);
      return res.send(nodeStream);
    } else {
      return res.send('');
    }
  }

  @Post('inline-action')
  async inlineAction(
    @Body() body: { action: 'rewrite' | 'summarize' | 'grammar' | 'generate_formula' | 'generate_table' | 'explain_formula' | 'slide_structure' | 'summarize_pdf' | 'text_to_bullets' | 'speaker_notes' | 'generate_slide'; text?: string; workspaceId?: string; documentId?: string },
    @Req() req: FastifyRequest
  ) {
    if (!body.action) {
      throw new BadRequestException('Action is required');
    }
    if (!body.text && !body.documentId) {
      throw new BadRequestException('Either text or documentId is required');
    }
    const user = (req as any).user;
    return this.aiService.executeInlineAction(body.action, body.text || "", body.workspaceId, user?.id, body.documentId);
  }

  @Get('search')
  async workspaceSearch(
    @Query('q') query: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: any
  ) {
    if (!query || !workspaceId) {
      throw new BadRequestException('q and workspaceId are required');
    }
    return this.aiService.semanticSearch(query, workspaceId);
  }

  @Post('agents/financial-analyst')
  async runFinancialAnalyst(
    @Body() body: { documentId: string; workspaceId: string; documentContent?: string },
    @CurrentUser() user: any
  ) {
    if (!body.documentId || !body.workspaceId) {
      throw new BadRequestException('documentId and workspaceId are required');
    }
    return this.aiService.runAgent('financial-analyst', body.documentId, body.workspaceId, user.id, body.documentContent);
  }

  @Post('agents/legal-reviewer')
  async runLegalReviewer(
    @Body() body: { documentId: string; workspaceId: string },
    @CurrentUser() user: any
  ) {
    if (!body.documentId || !body.workspaceId) {
      throw new BadRequestException('documentId and workspaceId are required');
    }
    return this.aiService.runAgent('legal-reviewer', body.documentId, body.workspaceId, user.id);
  }
}
