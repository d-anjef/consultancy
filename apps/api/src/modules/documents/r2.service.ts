import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { getR2Client, getR2Config } from '../../../config/r2.js';
import { logger } from '../../lib/logger.js';

export interface UploadResult {
  key: string;
  bucket: string;
  size: number;
  checksum: string;
}

export class R2Service {
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    studentId: string,
    documentType: string,
  ): Promise<UploadResult> {
    const client = getR2Client();
    const { bucketName } = getR2Config();

    // Generate secure key: students/STU-2026-000001/PASSPORT/uuid-timestamp.ext
    const ext = fileName.split('.').pop() || 'bin';
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const key = `students/${studentId}/${documentType}/${uniqueId}-${timestamp}.${ext}`;

    // Compute checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          Metadata: {
            originalName: fileName,
            checksum,
            uploadedAt: new Date().toISOString(),
          },
        }),
      );

      logger.info({ key, size: buffer.length, checksum }, 'File uploaded to R2');

      return {
        key,
        bucket: bucketName,
        size: buffer.length,
        checksum,
      };
    } catch (error) {
      logger.error({ error, key }, 'Failed to upload file to R2');
      throw error;
    }
  }

  async getSignedDownloadUrl(key: string, expirySeconds?: number): Promise<string> {
    const client = getR2Client();
    const { bucketName, signedUrlExpiry } = getR2Config();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(client, command, {
      expiresIn: expirySeconds ?? signedUrlExpiry,
    });

    return url;
  }

  async deleteObject(key: string): Promise<void> {
    const client = getR2Client();
    const { bucketName } = getR2Config();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );

    logger.info({ key }, 'File deleted from R2');
  }
}

export const r2Service = new R2Service();