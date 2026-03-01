import { Client } from 'minio';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const BUCKET = env.MINIO_BUCKET;

const minioClient = new Client({
  endPoint:        env.MINIO_ENDPOINT,
  port:            env.MINIO_PORT,
  useSSL:          env.MINIO_USE_SSL,
  accessKey:       env.MINIO_ACCESS_KEY,
  secretKey:       env.MINIO_SECRET_KEY,
});

/**
 * Ensure the bucket exists; create it if not.
 */
export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1');
    logger.info(`MinIO bucket created: ${BUCKET}`);
  } else {
    logger.info(`MinIO bucket exists: ${BUCKET}`);
  }
}

/**
 * Upload a file buffer to MinIO.
 * @param {string} key - Object key (path in bucket)
 * @param {Buffer|stream.Readable} data
 * @param {string} contentType
 * @returns {Promise<string>} Object key
 */
export async function uploadFile(key, data, contentType = 'application/octet-stream') {
  await minioClient.putObject(BUCKET, key, data, { 'Content-Type': contentType });
  logger.info(`MinIO upload: ${key}`);
  return key;
}

/**
 * Generate a pre-signed URL for reading an object.
 * @param {string} key
 * @param {number} expirySeconds
 */
export async function getSignedUrl(key, expirySeconds = 3600) {
  return minioClient.presignedGetObject(BUCKET, key, expirySeconds);
}

/**
 * Delete an object from MinIO.
 */
export async function deleteFile(key) {
  await minioClient.removeObject(BUCKET, key);
}

export default minioClient;
