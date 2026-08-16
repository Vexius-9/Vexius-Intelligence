import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageClient } from '@vexius/storage';
import { ConfigService } from '@nestjs/config';

export interface IndexDocumentJob {
  documentId: string;
  workspaceId: string;
}

@Processor('document-index')
export class DocumentIndexerProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentIndexerProcessor.name);
  private storageClient: StorageClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    super();
    this.storageClient = new StorageClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async process(job: Job<IndexDocumentJob, any, string>): Promise<any> {
    this.logger.log(`Processing indexing job for document ${job.data.documentId}`);
    
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: job.data.documentId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // In a real scenario, we'd download the file and parse it.
      // For now, we will mock the text extraction.
      const extractedText = `This is the mock content for document ${document.name}. It contains important information about Vexius.`;
      
      // Simple chunking strategy (split by sentences or fixed length)
      const chunks = [extractedText]; // Just 1 chunk for demonstration

      if (chunks.length > 0) {
        // @ts-ignore
        const { createOpenAI } = await Function('return import("@ai-sdk/openai")')();
        // @ts-ignore
        const { embedMany } = await Function('return import("ai")')();

        const openai = createOpenAI({ apiKey: this.configService.get('OPENAI_API_KEY') });
        const { embeddings } = await embedMany({
          model: openai.embedding('text-embedding-3-small'),
          values: chunks,
        });

        // Save to DB using raw query since Prisma doesn't natively support creating vectors via Prisma Client functions easily
        // (Usually, we use Prisma's raw query for pgvector insertions)
        
        // First delete old chunks
        await this.prisma.documentChunk.deleteMany({
          where: { documentId: document.id }
        });

        for (let i = 0; i < chunks.length; i++) {
          const content = chunks[i];
          const embeddingArray = embeddings[i]; // numeric array
          const embeddingVector = `[${embeddingArray.join(',')}]`;

          await this.prisma.$executeRaw`
            INSERT INTO "document_chunks" ("id", "document_id", "content", "embedding", "created_at")
            VALUES (gen_random_uuid(), ${document.id}, ${content}, ${embeddingVector}::vector, NOW())
          `;
        }
      }

      this.logger.log(`Successfully indexed document ${document.id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to index document ${job.data.documentId}`, error);
      throw error;
    }
  }
}
