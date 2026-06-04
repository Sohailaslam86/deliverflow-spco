// src/notificationService.js
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

// Send notification to Firestore
export async function sendNotification({ toUserId, toRole, toDC, type, title, message, link }) {
  try {
    await addDoc(collection(db, "notifications"), {
      toUserId: toUserId || null,
      toRole:   toRole   || null,
      toDC:     toDC     || null,
      type,
      title,
      message,
      link:     link || null,
      read:     false,
      createdAt: new Date().toISOString()
    });
  } catch(e) { console.error("Notification error:", e); }
}

// Load notifications for current user
// Supports: admin, planning, manager, logistic, driver, viewonly, management
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
          if (n.toDC) return n.toDC === user.dc;
          return true;
        }
        // Logistic gets manager-type notifications for their DC
        if (user.role === "logistic" && n.toRole === "logistic") {
          if (n.toDC) return n.toDC === user.dc;
          return true;
        }
        return false;
      })
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  } catch(e) { console.error("Load notifications error:", e); return []; }
}

// Mark notification as read
export async function markRead(notifId) {
  try {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  } catch(e) { console.error("Mark read error:", e); }
}

// Mark all as read
export async function markAllRead(user) {
  try {
    const notifs = await loadNotifications(user);
    const unread = notifs.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, "notifications", n.id), { read: true });
    }
  } catch(e) { console.error("Mark all read error:", e); }
}
