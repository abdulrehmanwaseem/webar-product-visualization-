import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export interface DirectUploadResult {
  publicUrl: string;
  key: string;
}

interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  private readonly MAX_GLB_SIZE = 15 * 1024 * 1024; // 15MB
  private readonly MAX_USDZ_SIZE = 15 * 1024 * 1024; // 15MB
  private readonly MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB

  private readonly ALLOWED_CONTENT_TYPES: Record<string, string[]> = {
    glb: ['model/gltf-binary', 'application/octet-stream'],
    usdz: ['model/vnd.usdz+zip', 'application/octet-stream'],
    thumbnail: ['image/webp', 'image/png', 'image/jpeg'],
  };

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );

    this.bucketName = this.configService.get<string>(
      'R2_BUCKET_NAME',
      'webar-assets',
    );

    // Use the public R2.dev URL for accessing files publicly
    // Falls back to S3 API endpoint (requires auth) if not configured
    const configuredPublicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    this.publicUrl = configuredPublicUrl
      ? configuredPublicUrl.replace(/\/$/, '') // Remove trailing slash if present
      : `https://${this.bucketName}.${accountId}.r2.cloudflarestorage.com`;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  private getContentType(
    fileType: 'glb' | 'usdz' | 'thumbnail',
    providedType?: string,
  ): string {
    if (
      providedType &&
      this.ALLOWED_CONTENT_TYPES[fileType].includes(providedType)
    ) {
      return providedType;
    }

    const defaults: Record<string, string> = {
      glb: 'model/gltf-binary',
      usdz: 'model/vnd.usdz+zip',
      thumbnail: 'image/webp',
    };

    return defaults[fileType];
  }

  private getMaxSize(fileType: 'glb' | 'usdz' | 'thumbnail'): number {
    const sizes: Record<string, number> = {
      glb: this.MAX_GLB_SIZE,
      usdz: this.MAX_USDZ_SIZE,
      thumbnail: this.MAX_THUMBNAIL_SIZE,
    };
    return sizes[fileType];
  }

  private generateKey(
    merchantId: string,
    fileType: 'glb' | 'usdz' | 'thumbnail',
    fileName: string,
  ): string {
    const uuid = randomUUID();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = fileType === 'thumbnail' ? 'thumbnails' : 'models';
    return `${merchantId}/${folder}/${uuid}-${sanitizedFileName}`;
  }

  async getPresignedUploadUrl(
    merchantId: string,
    fileName: string,
    fileType: 'glb' | 'usdz' | 'thumbnail',
    contentType?: string,
  ): Promise<PresignedUrlResult> {
    const key = this.generateKey(merchantId, fileType, fileName);
    const resolvedContentType = this.getContentType(fileType, contentType);
    const expiresIn = 3600; // 1 hour

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: resolvedContentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    const publicUrl = `${this.publicUrl}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
      expiresIn,
    };
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Failed to delete file ${key}:`, error);
      // Don't throw - deletion failure shouldn't break the app
    }
  }

  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.slice(1);
    } catch {
      return null;
    }
  }

  getFileSizeLimit(fileType: 'glb' | 'usdz' | 'thumbnail'): number {
    return this.getMaxSize(fileType);
  }

  /**
   * Direct upload through the server (bypasses CORS issues)
   */
  async uploadFile(
    merchantId: string,
    fileName: string,
    fileType: 'glb' | 'usdz' | 'thumbnail',
    buffer: Buffer,
    contentType?: string,
  ): Promise<DirectUploadResult> {
    const maxSize = this.getMaxSize(fileType);
    if (buffer.length > maxSize) {
      throw new BadRequestException(
        `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`,
      );
    }

    const key = this.generateKey(merchantId, fileType, fileName);
    const resolvedContentType = this.getContentType(fileType, contentType);

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: resolvedContentType,
      },
    });

    await upload.done();

    const publicUrl = `${this.publicUrl}/${key}`;

    return {
      publicUrl,
      key,
    };
  }
}
