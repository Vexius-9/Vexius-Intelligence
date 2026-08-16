import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async getWorkspaces(@CurrentUser() user: any) {
    // Ensure user is synced before fetching workspaces
    await this.usersService.findOrCreateUser(user);
    
    let workspaces = await this.workspacesService.getWorkspacesForUser(user.id);
    
    // Auto-create default workspace if none exists
    if (workspaces.length === 0) {
      const defaultWorkspace = await this.workspacesService.createWorkspace(
        user.id,
        'My Workspace',
      );
      workspaces = [defaultWorkspace];
    }
    
    return workspaces;
  }

  @Post()
  async createWorkspace(
    @CurrentUser() user: any,
    @Body('name') name: string,
  ) {
    // Ensure user is synced
    await this.usersService.findOrCreateUser(user);
    return this.workspacesService.createWorkspace(user.id, name);
  }

  @Get(':id')
  async getWorkspace(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.workspacesService.getWorkspaceById(id, user.id);
  }
}
