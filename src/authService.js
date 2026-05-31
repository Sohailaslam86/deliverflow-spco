import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, collection,
  getDocs, updateDoc, deleteDoc, query, where
} from 'firebase/firestore';

// LOGIN
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  if (!userDoc.exists()) throw new Error('User profile not found');
  return { uid: userCredential.user.uid, ...userDoc.data() };
};

// LOGOUT
export const logoutUser = () => signOut(auth);

// GET USER PROFILE
export const getUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { uid, ...userDoc.data() };
};

// CHANGE PASSWORD
export const changeUserPassword = async (newPassword) => {
  await updatePassword(auth.currentUser, newPassword);
};

// RESET PASSWORD (Admin)
export const resetUserPassword = async (uid, newPassword) => {
  await updateDoc(doc(db, 'users', uid), { tempPassword: newPassword });
};

// GET ALL USERS
export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
};

// UPDATE USER
export const updateUser = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), data);
};
