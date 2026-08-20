import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
}
