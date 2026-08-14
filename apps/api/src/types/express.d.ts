import type { SessionUser } from '../middleware/authenticate.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      currentUser?: SessionUser;
    }
  }
}

export {};