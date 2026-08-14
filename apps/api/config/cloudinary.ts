import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from '../src/lib/logger.js';

let isConfigured = false;

export function configureCloudinary(): void {
  if (isConfigured) return;

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    logger.warn('Cloudinary credentials not configured. Profile photo uploads will fail.');
    return;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  isConfigured = true;
  logger.info('Cloudinary configured');
}

export function getCloudinary() {
  if (!isConfigured) {
    configureCloudinary();
  }
  return cloudinary;
}

export function getCloudinaryConfig() {
  return {
    folder: env.CLOUDINARY_UPLOAD_FOLDER,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  };
}