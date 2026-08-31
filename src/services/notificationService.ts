import {
  collection, doc, setDoc, getDocs, updateDoc,
  query, where, onSnapshot, writeBatch,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification, Application } from '@/types';

const COLLECTION = 'notifications';

function toNotification(id: string, data: Record<string, unknown>): Notification {
  return {
    id,
    userId: data.userId as string ?? '',
    title: data.title as string ?? '',
    message: data.message as string ?? '',
    type: (data.type as Notification['type']) ?? 'info',
    read: data.read as boolean ?? false,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    link: data.link as string ?? undefined,
    relatedId: data.relatedId as string ?? undefined,
    relatedType: (data.relatedType as 'application' | 'certificate') ?? undefined,
  };
}

// Subscribe to real-time notifications — sorted client-side (avoids composite index)
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  // Query only by userId — no orderBy, so no composite index needed
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const notifs = snap.docs
        .map(d => toNotification(d.id, d.data() as Record<string, unknown>))
        // Sort client-side: newest first
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(notifs);
    },
    (error) => {
      // Error handler — ensures loading always resolves
      console.error('[NotificationService] onSnapshot error:', error.message);
      callback([]);
    }
  );

  return unsub;
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  try {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => toNotification(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error('[NotificationService] getNotificationsForUser error:', e);
    return [];
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, notificationId), { read: true });
  } catch (e) {
    console.error('[NotificationService] markRead error:', e);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const unread = snap.docs.filter(d => d.data().read === false);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (e) {
    console.error('[NotificationService] markAllRead error:', e);
  }
}

// Uses setDoc with a predictable ID as the dedup key — no composite index needed.
// Writing the same notification twice simply overwrites it (idempotent).
export async function checkAndCreateExpiryNotifications(
  userId: string,
  applications: Application[]
): Promise<void> {
  try {
    const approvedApps = applications.filter(a => a.status === 'approved' && a.submittedAt);

    for (const app of approvedApps) {
      const expiry = new Date(
        app.submittedAt!.getFullYear() + 1,
        app.submittedAt!.getMonth(),
        app.submittedAt!.getDate()
      );
      const today = new Date();
      const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let threshold: string | null = null;
      let type: Notification['type'] = 'info';
      let title = '';
      let message = '';

      if (daysLeft < 0) {
        threshold = 'expired';
        type = 'critical';
        title = '🚨 Certificate Expired';
        message = `The verification certificate for ${app.instrumentName} (${app.serialNumber}) has expired. Immediate re-verification required.`;
      } else if (daysLeft <= 7) {
        threshold = '7d';
        type = 'error';
        title = '⚠️ Certificate Expiring in 7 Days';
        message = `Urgent: ${app.instrumentName} (${app.serialNumber}) certificate expires in ${daysLeft} day(s). Apply for re-verification now.`;
      } else if (daysLeft <= 15) {
        threshold = '15d';
        type = 'warning';
        title = '⏰ Certificate Expiring Soon';
        message = `${app.instrumentName} (${app.serialNumber}) certificate expires in ${daysLeft} days. Please initiate re-verification.`;
      } else if (daysLeft <= 30) {
        threshold = '30d';
        type = 'warning';
        title = '📅 Certificate Expiry Reminder';
        message = `${app.instrumentName} (${app.serialNumber}) certificate expires in ${daysLeft} days. Plan your re-verification.`;
      }

      if (!threshold) continue;

      // Document ID = dedup key → setDoc is idempotent, no composite index needed
      const docId = `${userId}_${app.id}_${threshold}`;
      await setDoc(
        doc(db, COLLECTION, docId),
        {
          userId,
          title,
          message,
          type,
          read: false,
          link: '/owner/certificates',
          relatedId: app.id,
          relatedType: 'certificate',
          createdAt: serverTimestamp(),
        },
        { merge: true } // keep read=true if user already read it
      );
    }
  } catch (e) {
    console.error('[NotificationService] checkAndCreateExpiryNotifications error:', e);
  }
}