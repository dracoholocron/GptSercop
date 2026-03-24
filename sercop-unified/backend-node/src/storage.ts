/**
 * Fase 4: Almacenamiento de documentos (MinIO/S3 compatible).
 * Si S3_ENDPOINT no está definido, las operaciones de upload/download no están disponibles.
 */
import type { Readable } from 'node:stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.S3_ENDPOINT;
const accessKey = process.env.S3_ACCESS_KEY;
const secretKey = process.env.S3_SECRET_KEY;
const bucket = process.env.S3_BUCKET || 'sercop-docs';

export function isStorageConfigured(): boolean {
  return !!(endpoint && accessKey && secretKey);
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    if (!isStorageConfigured()) throw new Error('S3/MinIO no configurado');
    client = new S3Client({
      endpoint: endpoint,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: { accessKeyId: accessKey!, secretAccessKey: secretKey! },
      forcePathStyle: true,
    });
  }
  return client;
}

export async function ensureBucket(): Promise<void> {
  if (!isStorageConfigured()) return;
  const c = getClient();
  try {
    await c.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await c.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

export async function uploadStream(
  key: string,
  body: Readable | NodeJS.ReadableStream,
  contentType: string,
  contentLength?: number
): Promise<void> {
  const c = getClient();
  await c.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body as Readable,
      ContentType: contentType,
      ...(contentLength != null && { ContentLength: contentLength }),
    })
  );
}

export async function getDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const c = getClient();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(c, cmd, { expiresIn: expiresInSeconds });
}

export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600
): Promise<string> {
  const c = getClient();
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(c, cmd, { expiresIn: expiresInSeconds });
}

export function getBucket(): string {
  return bucket;
}
