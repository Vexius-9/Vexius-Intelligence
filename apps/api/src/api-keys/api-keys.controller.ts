import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get('workspace/:workspaceId')
  async getWorkspaceApiKeys(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any
  ) {
    return this.apiKeysService.getWorkspaceApiKeys(workspaceId, user.id);
  }

  @Post()
  async createApiKey(
    @Body('workspaceId') workspaceId: string,
    @Body('name') name: string,
    @CurrentUser() user: any
  ) {
    return this.apiKeysService.createApiKey(workspaceId, user.id, name);
  }

  @Delete(':id/workspace/:workspaceId')
  async revokeApiKey(
    @Param('id') id: string,
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any
  ) {
    return this.apiKeysService.revokeApiKey(id, workspaceId, user.id);
  }
}
