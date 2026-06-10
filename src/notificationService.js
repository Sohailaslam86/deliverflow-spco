// src/notificationService.js
// Shared notification helper — sab files yeh import karein
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Notification types:
 *   upload | delivered | failed | staged | leave |
 *   leave_approved | leave_rejected | request |
 *   request_action | vehicle | vehicle_approved |
 *   vehicle_rejected | activity_request |
 *   activity_approved | activity_rejected
 *
 * data shape (all optional — use what applies):
 *   { dc, count, driverName, invoiceId, failReason,
 *     name, status, plate, purpose, destination }
 */

// Send notification to Firestore
export async function sendNotification({
  toUserId,
  toRole,
  toDC,
  type,
  data = {},
  // Legacy fields — kept for backward compat but not required
  title,
  message,
  link,
}) {
  try {
    await addDoc(collection(db, "notifications"), {
      toUserId:  toUserId || null,   // specific user uid
      toRole:    toRole   || null,   // role (admin/manager/driver/logistic)
      toDC:      toDC     || null,   // DC filter
      type,                          // notification type string
      data,                          // structured payload — used by Shell to build bilingual text
      // Legacy text fields — only written if explicitly provided (old callers)
      ...(title   ? { title }   : {}),
      ...(message ? { message } : {}),
      link:      link || null,
      schema_version: 1,  // v1 = type+data pattern. Legacy = no schema_version field.
      read:      false,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}

// Load notifications for current user
export async function loadNotifications(user) {
  try {
    const snap = await getDocs(collection(db, "notifications"));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(n => {
        // Specific user notification
        if (n.toUserId && n.toUserId === user.uid) return true;
        // Role-based notification
        if (n.toRole && n.toRole === user.role) {
          if (n.toDC) return n.toDC === user.dc; // DC specific
          return true;
        }
        return false;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (e) {
    console.error("Load notifications error:", e);
    return [];
  }
}

// Mark notification as read
export async function markRead(notifId) {
  try {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  } catch (e) {
    console.error("Mark read error:", e);
  }
}

// Mark all as read
export async function markAllRead(user) {
  try {
    const notifs = await loadNotifications(user);
    const unread = notifs.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, "notifications", n.id), { read: true });
    }
  } catch (e) {
    console.error("Mark all read error:", e);
  }
}
