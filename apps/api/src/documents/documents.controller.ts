import { 
  Controller, Post, Get, Param, UseGuards, 
  Req, BadRequestException, Body, Delete, Patch, Query
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { DocumentsService } from './documents.service';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(HybridAuthGuard)
  async uploadFile(@Req() req: FastifyRequest, @CurrentUser() user: any) {
    if (!(req as any).isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const data = await (req as any).file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const workspaceId = (req.query as any).workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('workspaceId query parameter is required');
    }

    const buffer = await data.toBuffer();

    return this.documentsService.uploadDocument(
      user.id,
      workspaceId,
      {
        filename: data.filename,
        mimetype: data.mimetype,
        buffer,
      }
    );
  }

  @Post('create')
  @UseGuards(HybridAuthGuard)
  async createDocument(
    @Body('workspaceId') workspaceId: string,
    @Body('name') name: string,
    @Body('type') type: 'document' | 'spreadsheet' | 'presentation' | 'folder',
    @Body('parentId') parentId: string,
    @CurrentUser() user: any
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }
    return this.documentsService.createBlankDocument(user.id, workspaceId, name, type || 'document', parentId);
  }

  @Get('workspace/:workspaceId')
  @UseGuards(HybridAuthGuard)
  async getWorkspaceDocuments(
    @Param('workspaceId') workspaceId: string,
    @Query('parentId') parentId: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.getDocumentsByWorkspace(workspaceId, user.id, parentId);
  }

  @Get(':id/download')
  @UseGuards(HybridAuthGuard)
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.getDocumentDownloadUrl(id, user.id);
  }

  @Get(':id/json')
  @UseGuards(HybridAuthGuard)
  async getDocumentJson(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.getDocumentJson(id, user.id);
  }

  @Post(':id/content')
  @UseGuards(HybridAuthGuard)
  async saveDocumentContent(
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('mode') mode: 'append' | 'replace',
    @CurrentUser() user: any
  ) {
    if (typeof content !== 'string') {
      throw new BadRequestException('Content must be a string');
    }
    return this.documentsService.saveContent(id, user.id, content, mode || 'replace');
  }

  @Get(':id/editor-config')
  @UseGuards(HybridAuthGuard)
  async getEditorConfig(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.getEditorConfig(id, user.id);
  }

  @Get(':id')
  @UseGuards(HybridAuthGuard)
  async getDocument(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.getDocument(id, user.id);
  }

  @Patch(':id')
  @UseGuards(HybridAuthGuard)
  async renameDocument(
    @Param('id') id: string,
    @Body('name') name: string,
    @CurrentUser() user: any
  ) {
    if (!name) {
      throw new BadRequestException('name is required');
    }
    return this.documentsService.renameDocument(id, user.id, name);
  }

  @Delete(':id')
  @UseGuards(HybridAuthGuard)
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.deleteDocument(id, user.id);
  }

  // ONLYOFFICE Callback - public endpoint, no JwtAuthGuard
  // Ideally, validate ONLYOFFICE_JWT_SECRET token here, but we will accept the payload directly for simplicity right now
  @Post(':id/callback')
  async onlyOfficeCallback(
    @Param('id') id: string,
    @Body() body: any
  ) {
    await this.documentsService.handleOnlyOfficeCallback(id, body);
    return { error: 0 };
  }
}
