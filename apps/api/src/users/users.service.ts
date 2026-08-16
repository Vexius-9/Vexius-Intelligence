import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Syncs a user from Supabase to our Prisma database.
   * If the user doesn't exist, it creates them.
   */
  async findOrCreateUser(payload: { id: string; email: string }) {
    try {
      const user = await this.prisma.user.upsert({
        where: { id: payload.id },
        update: { email: payload.email }, // Update email if it changed
        create: {
          id: payload.id,
          email: payload.email,
        },
      });
      return user;
    } catch (error) {
      this.logger.error('Failed to sync user from Supabase', error);
      throw error;
    }
  }
}
