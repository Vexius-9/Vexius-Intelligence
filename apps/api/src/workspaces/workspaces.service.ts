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

  async inviteToWorkspace(workspaceId: string, inviterId: string, targetEmail: string, role: string) {
    // 1. Check if inviter is owner
    const inviterMembership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: inviterId } }
    });

    if (!inviterMembership || inviterMembership.role !== 'owner') {
      throw new Error('Only owners can invite members');
    }

    // 2. Find target user
    const targetUser = await this.prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // 3. Create or update membership
    const membership = await this.prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
      update: { role },
      create: {
        workspaceId,
        userId: targetUser.id,
        role
      }
    });

    return membership;
  }
}
