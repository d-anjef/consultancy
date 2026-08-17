import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import pinoHttp from 'pino-http';

import { env } from '../config/env.js';
import { API_PREFIX, SESSION_CONFIG } from '../config/constants.js';
import { logger } from './lib/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './lib/response.js';
import { getDatabaseStatus } from '../config/database.js';
import { getRedisStatus } from '../config/redis.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { roleRoutes } from './modules/roles/role.routes.js';
import { branchRoutes } from './modules/branches/branch.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { permissionRoutes } from './modules/permissions/permission.routes.js';

import { studentRoutes } from './modules/students/student.routes.js';
import { programRoutes } from './modules/programs/program.routes.js';
import { visaCategoryRoutes } from './modules/visa-categories/visa-category.routes.js';
import { applicationRoutes } from './modules/applications/application.routes.js';

import { leadRoutes } from './modules/leads/lead.routes.js';
import { counselingRoutes } from './modules/counseling/counseling.routes.js';

import { documentRoutes } from './modules/documents/document.routes.js';
import { financeRoutes } from './modules/finance/finance.routes.js';

import { languageLevelRoutes } from './modules/language-levels/language-level.routes.js';
import { journeyRoutes } from './modules/journey/journey.routes.js';

import { teacherRoutes } from './modules/teachers/teacher.routes.js';
import { classRoutes } from './modules/classes/class.routes.js';
import { learningMaterialRoutes } from './modules/learning-materials/learning-material.routes.js';

import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { qrRoutes } from './modules/qr/qr.routes.js';

import { taskRoutes } from './modules/tasks/task.routes.js';
import { reportRoutes } from './modules/reports/report.routes.js';

import { notificationRoutes } from './modules/notifications/notification.routes.js';
import  { announcementRoutes } from './modules/announcements/announcement.routes.js';

import { pushRoutes } from './modules/push/push.routes.js';

export function createApp(): express.Application {
  const app = express();

  // ─── Trust proxy (for rate limiting behind reverse proxy) ─────
  app.set('trust proxy', 1);

  // ─── Request ID ─────
  app.use(requestIdMiddleware);

  // ─── HTTP Logger ─────
  if (!env.isTest) {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => {
            return (req.url || '').includes('/health');
          },
        },
        customProps: (req) => ({
          requestId: (req as express.Request).requestId,
        }),
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      }),
    );
  }

  // ─── Security Headers ─────
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ─── CORS ─────
  app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'https://webchiba.vercel.app',
        'http://localhost:3000',
      ];

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Also check env variable
      const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (envOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400,
  }),
);
      

  // ─── Compression ─────
  app.use(compression());

  // ─── Body Parsing ─────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Cookie Parser ─────
  app.use(cookieParser());

  // ─── Session ─────
  app.use(
    session({
      name: env.COOKIE_NAME,
      secret: env.SESSION_SECRET,
      resave: SESSION_CONFIG.RESAVE,
      saveUninitialized: SESSION_CONFIG.SAVE_UNINITIALIZED,
      rolling: SESSION_CONFIG.ROLLING,
      store: MongoStore.create({
        mongoUrl: env.MONGODB_URI,
        dbName: env.MONGODB_DB_NAME,
        collectionName: 'sessions',
        ttl: env.SESSION_MAX_AGE_MS / 1000,
        autoRemove: 'native',
        touchAfter: 24 * 3600,
      }),
      cookie: {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ('none' as const) : ('lax' as const),
  maxAge: env.SESSION_MAX_AGE_MS,
  path: '/',
},
    }),
  );

  // ─── Rate Limiting ─────
  app.use(globalRateLimiter);

  // ─── Health Check (before auth) ─────
  app.get('/api/health', (_req, res) => {
    sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: env.API_VERSION,
    });
  });

  app.get('/api/health/detailed', async (_req, res) => {
    const dbStatus = getDatabaseStatus();
    const redisStatus = await getRedisStatus();

    const allHealthy = dbStatus.connected && redisStatus.connected;

    sendSuccess(
      res,
      {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        version: env.API_VERSION,
        services: {
          database: {
            connected: dbStatus.connected,
            readyState: dbStatus.readyState,
          },
          redis: {
            connected: redisStatus.connected,
            latencyMs: redisStatus.latencyMs,
          },
        },
      },
      allHealthy ? 200 : 503,
    );
  });

  // ─── Authentication ─────
  app.use(authenticate);

  // ─── API Routes ─────
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/roles`, roleRoutes);
  app.use(`${API_PREFIX}/permissions`, permissionRoutes);
  app.use(`${API_PREFIX}/branches`, branchRoutes);
  app.use(`${API_PREFIX}/audit`, auditRoutes);
  app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/programs`, programRoutes);
app.use(`${API_PREFIX}/visa-categories`, visaCategoryRoutes);
app.use(`${API_PREFIX}/applications`, applicationRoutes);

app.use(`${API_PREFIX}/leads`, leadRoutes);
app.use(`${API_PREFIX}/counseling`, counselingRoutes);
app.use(`${API_PREFIX}/visa-categories`, visaCategoryRoutes);


app.use(`${API_PREFIX}/documents`, documentRoutes);
app.use(`${API_PREFIX}/finance`, financeRoutes);

app.use(`${API_PREFIX}/language-levels`, languageLevelRoutes);
app.use(`${API_PREFIX}`, journeyRoutes);


app.use(`${API_PREFIX}/teachers`, teacherRoutes);
app.use(`${API_PREFIX}/classes`, classRoutes);
app.use(`${API_PREFIX}/learning-materials`, learningMaterialRoutes);


app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/qr`, qrRoutes);


app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/announcements`,announcementRoutes);
app.use(`${API_PREFIX}/push`,pushRoutes);

  // ─── 404 Handler ─────
  app.use(notFoundHandler);

  // ─── Error Handler ─────
  app.use(errorHandler);

  return app;
}