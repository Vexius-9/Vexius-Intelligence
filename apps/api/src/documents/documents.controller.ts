import { 
  Controller, Post, Get, Param, UseGuards, 
  Req, BadRequestException, Body 
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  async uploadFile(@Req() req: FastifyRequest, @CurrentUser() user: any) {
    if (!(req as any).isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const data = await (req as any).file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    // In @fastify/multipart, fields are extracted differently if not using attachFieldsToBody
    // For simplicity, we can get workspaceId from a header or query, or from parts
    // Let's assume workspaceId is passed as a query parameter for the file upload
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

  @Get('workspace/:workspaceId')
  @UseGuards(JwtAuthGuard)
  async getWorkspaceDocuments(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.getDocumentsByWorkspace(workspaceId, user.id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.getDocumentDownloadUrl(id, user.id);
  }

  @Get(':id/editor-config')
  @UseGuards(JwtAuthGuard)
  async getEditorConfig(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.getEditorConfig(id, user.id);
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
