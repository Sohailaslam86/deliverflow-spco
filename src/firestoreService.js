import { db } from './firebase';
import {
  collection, doc, addDoc, getDocs, getDoc,
  updateDoc, deleteDoc, query, where,
  orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';

// ===== INVOICES =====
export const getInvoices = async (dc = null) => {
  let q = dc
    ? query(collection(db, 'invoices'), where('dc', '==', dc))
    : collection(db, 'invoices');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addInvoice = async (data) => {
  return await addDoc(collection(db, 'invoices'), {
    ...data, createdAt: serverTimestamp()
  });
};

export const updateInvoice = async (id, data) => {
  await updateDoc(doc(db, 'invoices', id), data);
};

export const deleteInvoice = async (id) => {
  await deleteDoc(doc(db, 'invoices', id));
};

// ===== TRIPS =====
export const getTrips = async (dc = null) => {
  let q = dc
    ? query(collection(db, 'trips'), where('fromDC', '==', dc))
    : collection(db, 'trips');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addTrip = async (data) => {
  return await addDoc(collection(db, 'trips'), {
    ...data, createdAt: serverTimestamp()
  });
};

export const updateTrip = async (id, data) => {
  await updateDoc(doc(db, 'trips', id), data);
};

// ===== VEHICLES =====
export const getVehicles = async (dc = null) => {
  let q = dc
    ? query(collection(db, 'vehicles'), where('dc', '==', dc))
    : collection(db, 'vehicles');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateVehicle = async (id, data) => {
  await updateDoc(doc(db, 'vehicles', id), data);
};

// ===== FUEL LOGS =====
export const getFuelLogs = async (dc = null) => {
  let q = dc
    ? query(collection(db, 'fuelLogs'), where('dc', '==', dc))
    : collection(db, 'fuelLogs');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addFuelLog = async (data) => {
  return await addDoc(collection(db, 'fuelLogs'), {
    ...data, createdAt: serverTimestamp()
  });
};

// ===== UPLOADS =====
export const getUploads = async () => {
  const snap = await getDocs(collection(db, 'uploads'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addUpload = async (data) => {
  return await addDoc(collection(db, 'uploads'), {
    ...data, createdAt: serverTimestamp()
  });
};

// ===== ALERTS =====
export const getAlerts = async (dc = null) => {
  let q = dc
    ? query(collection(db, 'alerts'), where('dc', '==', dc))
    : collection(db, 'alerts');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addAlert = async (data) => {
  return await addDoc(collection(db, 'alerts'), {
    ...data, createdAt: serverTimestamp()
  });
};

// ===== CLEAR TEST DATA (Admin) =====
export const clearTestData = async () => {
  const collections = ['invoices', 'trips', 'uploads', 'fuelLogs', 'alerts'];
  for (const col of collections) {
    const snap = await getDocs(collection(db, col));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
};
