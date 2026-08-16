import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class StorageClient {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Uploads a file to a specific path in a bucket.
   */
  async uploadFile(bucketName: string, path: string, fileBuffer: Buffer, mimeType: string) {
    const { data, error } = await this.client.storage
      .from(bucketName)
      .upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) throw error;
    return data;
  }

  /**
   * Generates a signed URL for a private file.
   */
  async getSignedUrl(bucketName: string, path: string, expiresInSeconds: number = 3600) {
    const { data, error } = await this.client.storage
      .from(bucketName)
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * Deletes a file.
   */
  async deleteFile(bucketName: string, path: string) {
    const { error } = await this.client.storage
      .from(bucketName)
      .remove([path]);

    if (error) throw error;
  }
}
