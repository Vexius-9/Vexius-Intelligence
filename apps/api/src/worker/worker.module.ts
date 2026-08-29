import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentIndexerProcessor } from './document-indexer.processor';
import { AutomationProcessor } from './automation.processor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
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
    BullModule.registerQueue(
      { name: 'document-index' },
      { name: 'automation-queue' },
    ),
  ],
  providers: [DocumentIndexerProcessor, AutomationProcessor],
  exports: [BullModule],
})
export class WorkerModule {}
