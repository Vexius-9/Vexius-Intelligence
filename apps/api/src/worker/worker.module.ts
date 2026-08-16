import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentIndexerProcessor } from './document-indexer.processor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'document-index',
    }),
  ],
  providers: [DocumentIndexerProcessor],
  exports: [BullModule],
})
export class WorkerModule {}
