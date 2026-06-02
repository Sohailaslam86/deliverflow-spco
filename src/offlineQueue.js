// src/offlineQueue.js
// Offline POD Upload Queue — LocalStorage based

const QUEUE_KEY = "deliverflow_pod_queue";

// Queue mein add karo
export function addToQueue(item) {
  const queue = getQueue();
  queue.push({
    ...item,
    id: Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    queuedAt: new Date().toISOString(),
    status: "pending"
  });
  saveQueue(queue);
  console.log("Added to offline queue:", item.invoiceId);

  // Background sync register karo
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then(reg => {
      reg.sync.register("pod-upload-sync");
    });
  }
}

// Queue se sab pending items lo
export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch { return []; }
}

// Queue save karo
function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Item complete mark karo
export function markComplete(id) {
  const queue = getQueue().map(i => i.id === id ? {...i, status:"completed"} : i);
  saveQueue(queue);
}

// Item fail mark karo
export function markFailed(id, error) {
  const queue = getQueue().map(i => i.id === id ? {...i, status:"failed", error} : i);
  saveQueue(queue);
}

// Pending items count
export function getPendingCount() {
  return getQueue().filter(i => i.status === "pending").length;
}

// Queue clear karo (completed wale)
export function clearCompleted() {
  const queue = getQueue().filter(i => i.status !== "completed");
  saveQueue(queue);
}

// Upload pending PODs — internet aane par call karo
export async function uploadPendingPODs(uploadImageFn, updateInvoiceFn) {
  const queue = getQueue();
  const pending = queue.filter(i => i.status === "pending");

  if (pending.length === 0) return { uploaded: 0, failed: 0 };

  let uploaded = 0, failed = 0;

  for (const item of pending) {
    try {
      // Base64 se file banao
      const blob = await base64ToBlob(item.photoBase64, "image/jpeg");
      const file = new File([blob], `pod_${item.invoiceId}.jpg`, { type: "image/jpeg" });

      // Cloudinary upload
      const url = await uploadImageFn(file, "pod");

      // Invoice Firestore mein update
      await updateInvoiceFn(item.invoiceId, item.firestoreId, {
        status: "delivered",
        podImage: url,
        gps: item.gps,
        deliveredAt: item.deliveredAt
      });

      markComplete(item.id);
      uploaded++;
      console.log("✅ POD uploaded:", item.invoiceId);
    } catch (e) {
      markFailed(item.id, e.message);
      failed++;
      console.error("❌ POD upload failed:", item.invoiceId, e);
    }
  }

  clearCompleted();
  return { uploaded, failed };
}

// Photo ko base64 mein convert karo (offline save ke liye)
export function photoToBase64(photoUrl) {
  return new Promise((resolve, reject) => {
    if (photoUrl.startsWith("data:")) {
      resolve(photoUrl.split(",")[1]);
      return;
    }
    fetch(photoUrl)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

// Base64 se blob banao
export function base64ToBlob(base64, mimeType) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}
