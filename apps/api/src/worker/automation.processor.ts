import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Processor('automation-queue')
@Injectable()
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { automationId } = job.data;
    this.logger.log(`Starting scheduled automation task for ID: ${automationId}`);

    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation || automation.status !== 'active') {
      this.logger.warn(`Automation ${automationId} not found or paused. Skipping.`);
      return;
    }

    // 1. Create a running log record
    const run = await this.prisma.automationRun.create({
      data: {
        automationId,
        status: 'running',
      },
    });

    try {
      // 2. Perform deep research based on the scheduled prompt
      this.logger.log(`Running Deep Research Agent for automation: ${automation.name}`);
      const document = await this.aiService.runAgent(
        'deep-researcher',
        'temp-research-id',
        automation.workspaceId,
        automation.userId,
        automation.prompt
      );

      // 3. Complete automation run
      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          result: `Successfully generated report: ${document.name} (ID: ${document.id})`,
          completedAt: new Date(),
        },
      });

      // 4. Update automation tracker timestamp
      await this.prisma.automation.update({
        where: { id: automationId },
        data: {
          lastRunAt: new Date(),
        },
      });

      this.logger.log(`Successfully completed automation task for ID: ${automationId}`);
    } catch (error) {
      this.logger.error(`Automation task failed for ID: ${automationId}`, error);
      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          result: error.message,
          completedAt: new Date(),
        },
      });
    }
  }
}
