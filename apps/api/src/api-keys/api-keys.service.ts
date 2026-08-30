import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceApiKeys(workspaceId: string, userId: string) {
    // Only allow fetching if the user is a member of the workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    
    if (!member) throw new NotFoundException('Workspace not found or unauthorized');

    return this.prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        key: true,
        createdAt: true,
        expiresAt: true
      }
    });
  }

  async createApiKey(workspaceId: string, userId: string, name: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new NotFoundException('Only admins can create API Keys');
    }

    // Generate a secure API Key prefixed with vex_live_
    const rawKey = 'vex_live_' + crypto.randomBytes(32).toString('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        key: rawKey,
        workspaceId,
        userId,
        name,
      }
    });

    return apiKey;
  }

  async revokeApiKey(id: string, workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new NotFoundException('Only admins can revoke API Keys');
    }

    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, workspaceId }
    });

    if (!apiKey) throw new NotFoundException('API Key not found');

    await this.prisma.apiKey.delete({
      where: { id }
    });

    return { success: true };
  }
}
