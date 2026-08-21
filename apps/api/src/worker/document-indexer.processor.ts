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

      // Download the file from Supabase Storage
      const fileBuffer = await this.storageClient.downloadFile('vexius-documents', document.storageKey);

      // Parse text based on document type
      let extractedText = '';
      if (document.type === 'document' || document.type === 'spreadsheet' || document.type === 'presentation') {
        // @ts-ignore
        const officeParser = await Function('return import("officeparser")')();
        try {
          extractedText = await officeParser.parseOfficeAsync(fileBuffer);
        } catch (e) {
          this.logger.error(`officeparser failed for ${document.name}`, e);
          extractedText = `(Error parsing document: ${e.message})`;
        }
      } else if (document.type === 'pdf') {
        // @ts-ignore
        const pdfParse = await Function('return import("pdf-parse")')();
        try {
          const pdfData = await pdfParse(fileBuffer);
          extractedText = pdfData.text;
        } catch (e) {
          this.logger.error(`pdf-parse failed for ${document.name}`, e);
          extractedText = `(Error parsing PDF: ${e.message})`;
        }
      }

      if (!extractedText.trim()) {
         extractedText = "(Document is empty or could not be parsed)";
      }
      
      // Simple chunking strategy (split by sentences or fixed length, for now just 1 chunk for MVP)
      const chunks = [extractedText.substring(0, 10000)]; // Limit to avoid massive embeddings for now

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
