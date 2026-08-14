import pino from 'pino';
import { env } from '../../config/env.js';

const developmentConfig: pino.LoggerOptions = {
  level: env.LOG_LEVEL || 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  },
};

const productionConfig: pino.LoggerOptions = {
  level: env.LOG_LEVEL || 'info',
  formatters: {
    level(label: string) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.currentPassword',
      'body.newPassword',
      'body.token',
      'body.secret',
    ],
    censor: '[REDACTED]',
  },
};

export const logger = pino(env.isProduction ? productionConfig : developmentConfig);

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}