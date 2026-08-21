import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageClient } from '@vexius/storage';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly storageClient: StorageClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private auditService: AuditService,
    @InjectQueue('document-index') private documentIndexingQueue: Queue,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // We instantiate the StorageClient from our shared package
    this.storageClient = new StorageClient(supabaseUrl, supabaseKey);
  }

  async uploadDocument(
    userId: string,
    workspaceId: string,
    file: { filename: string; mimetype: string; buffer: Buffer }
  ) {
    // 1. Verify workspace access
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        }
      }
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    try {
      // 2. Create database record
      const size = file.buffer.length;
      let type = 'document'; // default
      if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) type = 'spreadsheet';
      if (file.mimetype.includes('presentation') || file.mimetype.includes('powerpoint')) type = 'presentation';
      if (file.mimetype.includes('pdf')) type = 'pdf';

      // We start a transaction to ensure DB and initial record are consistent
      const document = await this.prisma.$transaction(async (tx) => {
        const doc = await tx.document.create({
          data: {
            workspaceId,
            ownerId: userId,
            name: file.filename,
            type,
            mimeType: file.mimetype,
            storageKey: '', // Will update shortly
            size,
            currentVersion: 1,
          },
        });

        // 3. Upload to Supabase Storage
        // Path: workspaces/{workspaceId}/documents/{documentId}/versions/1-{filename}
        const storagePath = `workspaces/${workspaceId}/documents/${doc.id}/versions/1-${file.filename}`;
        
        await this.storageClient.uploadFile('vexius-documents', storagePath, file.buffer, file.mimetype);

        // 4. Update the storageKey and create version record
        await tx.document.update({
          where: { id: doc.id },
          data: { storageKey: storagePath },
        });

        await tx.documentVersion.create({
          data: {
            documentId: doc.id,
            version: 1,
            storageKey: storagePath,
            createdBy: userId,
          }
        });

        // Audit Log
        await this.auditService.logAction(
          workspaceId,
          userId,
          'DOCUMENT_UPLOAD',
          doc.id,
          { filename: file.filename, size: file.buffer?.length, mimeType: file.mimetype }
        );

        return doc;
      });

      // Trigger background indexing for the newly uploaded document
      await this.documentIndexingQueue.add('index', {
        documentId: document.id,
        workspaceId,
      });

      return document;
    } catch (error) {
      this.logger.error('Failed to upload document', error);
      throw new InternalServerErrorException('Could not process document upload');
    }
  }

  async getDocumentsByWorkspace(workspaceId: string, userId: string, parentId?: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      throw new UnauthorizedException('User is not a member of this workspace');
    }

    return this.prisma.document.findMany({
      where: { 
        workspaceId,
        deletedAt: null,
        parentId: parentId || null
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        permissions: {
          where: { userId },
        },
      },
    });
  }

  async getDocumentDownloadUrl(documentId: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) throw new NotFoundException('Document not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: document.workspaceId, userId } }
    });

    if (!membership) throw new NotFoundException('Access denied');

    try {
      // Create a signed URL valid for 1 hour (3600 seconds)
      const url = await this.storageClient.getSignedUrl('vexius-documents', document.storageKey, 3600);
      
      // Audit Log
      await this.auditService.logAction(
        document.workspaceId,
        userId,
        'DOCUMENT_DOWNLOAD',
        document.id
      );

      return { url };
    } catch (error) {
      this.logger.error('Failed to generate signed url', error);
      throw new InternalServerErrorException('Storage access failed');
    }
  }

  async createBlankDocument(userId: string, workspaceId: string, name: string, docType: 'document' | 'spreadsheet' | 'presentation' | 'folder' = 'document', parentId?: string) {
    // 1. Verify membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership || membership.role === 'viewer') {
      throw new UnauthorizedException('Not authorized to create documents in this workspace');
    }

    if (docType === 'folder') {
      // Setup folder in DB
      const result = await this.prisma.document.create({
        data: {
          workspaceId,
          ownerId: userId,
          name: name || 'Untitled Folder',
          type: 'folder',
          mimeType: 'application/vnd.vexius.folder',
          storageKey: '', // Folders don't have a storage key
          size: 0,
          currentVersion: 1,
          parentId: parentId || null
        },
      });

      await this.auditService.logAction(
        workspaceId,
        userId,
        'FOLDER_CREATE',
        result.id
      );

      return result;
    }

    // 2. Load template buffer and metadata
    let fileBuffer: Buffer;
    let mimeType: string;
    let extension: string;
    
    if (docType === 'spreadsheet') {
      const { EMPTY_XLSX } = require('./templates');
      fileBuffer = Buffer.from(EMPTY_XLSX, 'base64');
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    } else if (docType === 'presentation') {
      const { EMPTY_PPTX } = require('./templates');
      fileBuffer = Buffer.from(EMPTY_PPTX, 'base64');
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      extension = 'pptx';
    } else {
      const { EMPTY_DOCX } = require('./templates');
      fileBuffer = Buffer.from(EMPTY_DOCX, 'base64');
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
    }

    // Ensure name has the correct extension if not provided
    let finalName = name || `Untitled ${docType}`;
    if (!finalName.endsWith(`.${extension}`)) {
        // If it has a different extension, let's just append or replace
        const extMatch = finalName.match(/\.([^.]+)$/);
        if (extMatch) {
            finalName = finalName.replace(extMatch[0], `.${extension}`);
        } else {
            finalName = `${finalName}.${extension}`;
        }
    }

    // 3. Setup document in DB
    const documentId = require('crypto').randomUUID();
    const storagePath = `workspaces/${workspaceId}/documents/${documentId}/versions/1-blank.${extension}`;

    // 4. Upload to storage
    await this.storageClient.uploadFile('vexius-documents', storagePath, fileBuffer, mimeType);

    // 5. Transaction to save document and version
    const result = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          id: documentId,
          workspaceId,
          ownerId: userId,
          name: finalName,
          type: docType,
          mimeType,
          storageKey: storagePath,
          size: fileBuffer.length,
          currentVersion: 1,
          parentId: parentId || null
        },
      });

      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          storageKey: storagePath,
          createdBy: userId,
        },
      });

      return doc;
    });

    // 6. Audit Log
    await this.auditService.logAction(
      workspaceId,
      userId,
      'DOCUMENT_CREATE',
      result.id
    );

    return result;
  }

  async saveContent(documentId: string, userId: string, content: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new NotFoundException('Document not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: document.workspaceId, userId } },
    });

    if (!membership || membership.role === 'viewer') {
      throw new UnauthorizedException('Not authorized to edit this document');
    }

    try {
      const fileBuffer = Buffer.from(content, 'utf-8');
      
      // Store in place (overwrite) or increment version. For autosave, overwriting is better to avoid spamming versions.
      // Let's overwrite the current storage key for autosave, or we can use the same path.
      // To keep it simple, we overwrite the current version.
      const storagePath = document.storageKey;
      
      await this.storageClient.uploadFile('vexius-documents', storagePath, fileBuffer, 'text/html');

      const updatedDoc = await this.prisma.document.update({
        where: { id: document.id },
        data: {
          size: fileBuffer.length,
        },
      });

      return { success: true, size: updatedDoc.size };
    } catch (error) {
      this.logger.error('Failed to save document content', error);
      throw new InternalServerErrorException('Failed to save document');
    }
  }

  async getEditorConfig(documentId: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new NotFoundException('Document not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: document.workspaceId, userId } },
      include: { user: true }
    });

    if (!membership) throw new NotFoundException('Access denied');

    // Generate download URL for ONLYOFFICE to fetch the document
    const { url } = await this.getDocumentDownloadUrl(documentId, userId);

    const baseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/documents/${document.id}/callback`;
    const documentType = document.type === 'document' ? 'word' : document.type === 'spreadsheet' ? 'cell' : 'slide';
    
    // Extracted document extension for fileType (e.g. 'docx' from filename)
    const extMatch = document.name.match(/\.([^.]+)$/);
    const fileType = extMatch ? extMatch[1] : 'docx';

    // The key uniquely identifies the document version
    const documentKey = `${document.id}_v${document.currentVersion}`;

    const config = {
      document: {
        fileType,
        key: documentKey,
        title: document.name,
        url,
      },
      documentType,
      editorConfig: {
        callbackUrl,
        user: {
          id: userId,
          name: membership.user.email, // using email as name for now
        },
        mode: membership.role === 'viewer' ? 'view' : 'edit',
        customization: {
          forcesave: true,
          comments: true
        }
      },
      permissions: {
        comment: true,
        edit: membership.role !== 'viewer',
        download: true,
        print: true
      }
    };

    // Sign the config
    const secret = this.configService.get<string>('ONLYOFFICE_JWT_SECRET') || 'secret';
    const token = jwt.sign(config, secret);

    return {
      ...config,
      token,
    };
  }

  async handleOnlyOfficeCallback(documentId: string, body: any) {
    const status = body.status;
    const downloadUri = body.url;

    // Status 2 means document is ready for saving
    // Status 3 means document saving error (we might still try to save it just in case, but let's focus on 2)
    if (status === 2 || status === 3) {
      if (!downloadUri) {
        throw new BadRequestException('No download URL provided by ONLYOFFICE');
      }

      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      try {
        // 1. Download the file from ONLYOFFICE
        const response = await axios.get(downloadUri, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(response.data);

        // 2. Increment version and determine new storage path
        const newVersion = document.currentVersion + 1;
        const storagePath = `workspaces/${document.workspaceId}/documents/${document.id}/versions/${newVersion}-${document.name}`;

        // 3. Upload to Supabase Storage
        await this.storageClient.uploadFile('vexius-documents', storagePath, fileBuffer, document.mimeType);

        // 4. Update DB transactionally
        await this.prisma.$transaction(async (tx) => {
          await tx.document.update({
            where: { id: document.id },
            data: {
              currentVersion: newVersion,
              storageKey: storagePath,
              size: fileBuffer.length,
            }
          });

          await tx.documentVersion.create({
            data: {
              documentId: document.id,
              version: newVersion,
              storageKey: storagePath,
              createdBy: 'ONLYOFFICE', // or we could extract user from body.users
            }
          });
        });

        // 5. Dispatch index job for AI search
        await this.documentIndexingQueue.add('index-document', {
          documentId: document.id,
          workspaceId: document.workspaceId
        });

        this.logger.log(`Document ${documentId} saved successfully from ONLYOFFICE (version ${newVersion})`);
      } catch (error) {
        this.logger.error('Failed to process ONLYOFFICE callback save', error);
        throw new InternalServerErrorException('Failed to save document');
      }
    }
  }

  async deleteDocument(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Verify membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: document.workspaceId, userId } },
    });

    if (!membership || membership.role === 'viewer') {
      throw new UnauthorizedException('Not authorized to delete documents in this workspace');
    }

    // Attempt to delete from storage. Ignore errors if file doesn't exist
    try {
      await this.storageClient.deleteFile('vexius-documents', document.storageKey);
    } catch (e) {
      this.logger.warn(`Could not delete storage file ${document.storageKey} for document ${id}`);
    }

    // Delete from DB (manually cascade versions/permissions/chunks since schema doesn't have onDelete: Cascade)
    await this.prisma.$transaction([
      this.prisma.documentVersion.deleteMany({ where: { documentId: id } }),
      this.prisma.documentPermission.deleteMany({ where: { documentId: id } }),
      this.prisma.documentChunk.deleteMany({ where: { documentId: id } }),
      this.prisma.document.delete({ where: { id } })
    ]);
    // Log action
    await this.auditService.logAction(
      document.workspaceId,
      userId,
      'DOCUMENT_DELETED',
      id
    );

    return { success: true };
  }

  async getDocument(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });
    if (!document) throw new NotFoundException('Document not found');
    
    // Verify membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: document.workspaceId, userId } }
    });
    if (!membership) throw new UnauthorizedException('Not authorized to view this document');
    
    return document;
  }

  async renameDocument(id: string, userId: string, newName: string) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });
    if (!document) throw new NotFoundException('Document not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: document.workspaceId, userId } }
    });

    if (!membership || membership.role === 'viewer') {
      throw new UnauthorizedException('Not authorized to edit this document');
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: { name: newName }
    });

    await this.auditService.logAction(
      document.workspaceId,
      userId,
      'DOCUMENT_UPDATE',
      document.id
    );

    return updated;
  }
}
