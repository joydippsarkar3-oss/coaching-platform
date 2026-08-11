import { Injectable, Logger, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Firebase Cloud Messaging (FCM) push notification provider.
 *
 * Required env vars (individual service-account fields):
 *   FIREBASE_PROJECT_ID      — GCP project ID
 *   FIREBASE_CLIENT_EMAIL    — service account email
 *   FIREBASE_PRIVATE_KEY     — PEM private key (escaped \n accepted)
 *
 * Obtaining credentials:
 *   1. Firebase Console → Project Settings → Service Accounts
 *   2. Generate new private key → download JSON
 *   3. Copy project_id, client_email, private_key into the env vars above.
 *      The private key may contain literal \n — this provider handles both
 *      escaped ("\\n") and real newline forms.
 *
 * Topic naming convention:
 *   Subscribe devices to   "center_<centerId>"  to broadcast to a whole centre.
 *   Any string is valid; keep it lowercase with underscores.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class FcmProvider {
  private readonly logger = new Logger(FcmProvider.name);
  private readonly configured: boolean;
  private readonly app: admin.app.App | null = null;

  constructor(private readonly config: ConfigService) {
    const projectId   = config.get<string>('FIREBASE_PROJECT_ID', '');
    const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL', '');
    const rawKey      = config.get<string>('FIREBASE_PRIVATE_KEY', '');

    this.configured = !!(projectId && clientEmail && rawKey);

    if (!this.configured) {
      this.logger.warn(
        '[FCM] Not configured — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, ' +
          'and FIREBASE_PRIVATE_KEY. Push notifications will be skipped.',
      );
      return;
    }

    // Accept both escaped ("\\n") and literal newline forms of the PEM key.
    const privateKey = rawKey.replace(/\\n/g, '\n');

    if (admin.apps.length === 0) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      this.app = admin.apps[0]!;
    }
  }

  /**
   * Send a push notification to a single device.
   *
   * @param fcmToken  Device registration token (stored in recipient field)
   * @param title     Notification title
   * @param body      Notification body text
   * @param data      Optional key-value payload delivered alongside the notification
   */
  async sendToDevice(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.configured || !this.app) {
      this.logger.warn(
        `[FCM] Not configured — would have sent to token ${fcmToken.slice(0, 12)}…`,
      );
      return;
    }

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: { title, body },
      ...(data ? { data } : {}),
    };

    const messageId = await admin.messaging(this.app).send(message);
    this.logger.log(`[FCM] Sent to device token ${fcmToken.slice(0, 12)}…, messageId=${messageId}`);
  }

  /**
   * Send a push notification to all devices subscribed to a topic.
   *
   * @param topic  Topic name, e.g. "center_<centerId>"
   * @param title  Notification title
   * @param body   Notification body text
   * @param data   Optional key-value payload
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.configured || !this.app) {
      this.logger.warn(
        `[FCM] Not configured — would have sent to topic "${topic}": ${title}`,
      );
      return;
    }

    const message: admin.messaging.Message = {
      topic,
      notification: { title, body },
      ...(data ? { data } : {}),
    };

    const messageId = await admin.messaging(this.app).send(message);
    this.logger.log(`[FCM] Sent to topic "${topic}", messageId=${messageId}`);
  }

  /**
   * Subscribe one or more device tokens to a topic.
   * Use this when a user logs in or installs the app to enrol their device.
   *
   * @param tokens  Array of FCM registration tokens
   * @param topic   Topic name, e.g. "center_<centerId>"
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.configured || !this.app) {
      this.logger.warn(
        `[FCM] Not configured — would have subscribed ${tokens.length} token(s) to "${topic}"`,
      );
      return;
    }

    const response = await admin.messaging(this.app).subscribeToTopic(tokens, topic);
    this.logger.log(
      `[FCM] Subscribed to topic "${topic}": ` +
        `${response.successCount} ok, ${response.failureCount} failed`,
    );

    if (response.failureCount > 0) {
      response.errors.forEach(({ index, error }) => {
        this.logger.warn(
          `[FCM] subscribeToTopic error for token[${index}]: ${error.message}`,
        );
      });
    }
  }
}
