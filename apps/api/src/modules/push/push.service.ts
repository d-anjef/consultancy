import webpush from 'web-push';
import { Types } from 'mongoose';
import { PushSubscriptionModel, type PushSubscriptionDocument } from './push-subscription.model.js';
import { env } from '../../../config/env.js';
import { logger } from '../../lib/logger.js';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string; // If two notifications have same tag, second replaces first
  data?: {
    url?: string; // Click deep link
    entityType?: string;
    entityId?: string;
    [key: string]: unknown;
  };
  requireInteraction?: boolean; // If true, notification stays until user clicks
}

interface SubscribeInput {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

class PushService {
  private configured = false;

  constructor() {
    this.setup();
  }

  private setup(): void {
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
      logger.warn('VAPID keys not configured — push notifications disabled');
      return;
    }

    const contact = env.VAPID_CONTACT_EMAIL
      ? `mailto:${env.VAPID_CONTACT_EMAIL}`
      : 'mailto:admin@chibaeducation.com';

    webpush.setVapidDetails(
      contact,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );

    this.configured = true;
    logger.info('Push notification service configured');
  }

  /**
   * Detect device type from user agent (simple heuristic)
   */
  private detectDevice(userAgent?: string): 'desktop' | 'mobile' | 'tablet' {
    if (!userAgent) return 'desktop';
    const ua = userAgent.toLowerCase();
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    if (/edg/i.test(userAgent)) return 'Edge';
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    return 'unknown';
  }

  /**
   * Subscribe a user's browser for push notifications
   */
  async subscribe(input: SubscribeInput): Promise<PushSubscriptionDocument> {
    // Upsert — if this endpoint already exists, update it (reactivate)
    const existing = await PushSubscriptionModel.findOne({ endpoint: input.endpoint });

    if (existing) {
      existing.user = new Types.ObjectId(input.userId);
      existing.keys = input.keys;
      existing.userAgent = input.userAgent;
      existing.deviceType = this.detectDevice(input.userAgent);
      existing.browser = this.detectBrowser(input.userAgent);
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      await existing.save();
      logger.info({ userId: input.userId, endpoint: input.endpoint.slice(0, 50) }, 'Push subscription updated');
      return existing;
    }

    const created = await PushSubscriptionModel.create({
      user: new Types.ObjectId(input.userId),
      endpoint: input.endpoint,
      keys: input.keys,
      userAgent: input.userAgent,
      deviceType: this.detectDevice(input.userAgent),
      browser: this.detectBrowser(input.userAgent),
      isActive: true,
      lastUsedAt: new Date(),
    });

    logger.info({ userId: input.userId, endpoint: input.endpoint.slice(0, 50) }, 'Push subscription created');
    return created;
  }

  /**
   * Unsubscribe by endpoint
   */
  async unsubscribe(endpoint: string): Promise<void> {
    await PushSubscriptionModel.updateOne({ endpoint }, { $set: { isActive: false } });
    logger.info({ endpoint: endpoint.slice(0, 50) }, 'Push subscription deactivated');
  }

  /**
   * Send push notification to a specific user (all their active devices)
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.configured) return;

    const subscriptions = await PushSubscriptionModel.find({
      user: new Types.ObjectId(userId),
      isActive: true,
    });

    if (subscriptions.length === 0) {
      logger.debug({ userId }, 'No active push subscriptions for user');
      return;
    }

    await Promise.all(
      subscriptions.map((sub) => this.sendToSubscription(sub, payload)),
    );
  }

  /**
   * Send push notification to many users
   */
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (!this.configured || userIds.length === 0) return;

    const subscriptions = await PushSubscriptionModel.find({
      user: { $in: userIds.map((id) => new Types.ObjectId(id)) },
      isActive: true,
    });

    if (subscriptions.length === 0) return;

    logger.info(
      { userCount: userIds.length, subscriptionCount: subscriptions.length },
      'Sending bulk push notifications',
    );

    // Send in parallel, but don't await failures
    await Promise.allSettled(
      subscriptions.map((sub) => this.sendToSubscription(sub, payload)),
    );
  }

  /**
   * Send to a single subscription (with cleanup on 410 Gone)
   */
  private async sendToSubscription(
    subscription: PushSubscriptionDocument,
    payload: PushPayload,
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? '/icon-192.png',
        badge: payload.badge ?? '/icon-192.png',
        tag: payload.tag,
        data: payload.data ?? {},
        requireInteraction: payload.requireInteraction ?? false,
      });

      await webpush.sendNotification(pushSubscription, notificationPayload);

      // Update last used
      await PushSubscriptionModel.updateOne(
        { _id: subscription._id },
        { $set: { lastUsedAt: new Date() } },
      );
    } catch (err: unknown) {
      const error = err as { statusCode?: number; body?: string };

      // 410 Gone or 404 = subscription expired, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        await PushSubscriptionModel.deleteOne({ _id: subscription._id });
        logger.info(
          { subscriptionId: subscription._id, statusCode: error.statusCode },
          'Removed expired push subscription',
        );
      } else {
        logger.warn(
          { err, subscriptionId: subscription._id },
          'Failed to send push notification',
        );
      }
    }
  }

  /**
   * Send a test notification (for debugging)
   */
  async sendTest(userId: string): Promise<void> {
    await this.sendToUser(userId, {
      title: '🎉 Test Notification',
      body: 'Push notifications are working! You will now receive updates on your device.',
      tag: 'test',
      data: { url: '/notifications' },
    });
  }

  /**
   * Get all subscriptions for a user (for settings page)
   */
  async listUserSubscriptions(userId: string) {
    return PushSubscriptionModel.find({
      user: new Types.ObjectId(userId),
      isActive: true,
    })
      .select('deviceType browser userAgent createdAt lastUsedAt')
      .sort({ lastUsedAt: -1 })
      .lean();
  }
}

export const pushService = new PushService();