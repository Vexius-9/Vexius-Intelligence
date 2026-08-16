import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(userId: string, name: string) {
    try {
      const workspace = await this.prisma.workspace.create({
        data: {
          name,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'owner',
            },
          },
        },
      });
      return workspace;
    } catch (error) {
      this.logger.error('Failed to create workspace', error);
      throw error;
    }
  }

  async getWorkspacesForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    });
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    return this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
          },
        },
      },
    });
  }
}
