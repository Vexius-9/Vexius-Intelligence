import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async logAction(
    workspaceId: string,
    userId: string,
    action: string,
    resource?: string,
    details?: any
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId,
          userId,
          action,
          resource,
          details: details ? details : undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log for action ${action}`, error);
    }
  }
}
