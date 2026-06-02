import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBg1IKFOcpRKJBOwIqiUh2oevdT6oqpYpU",
  authDomain: "deliverflow-spco.firebaseapp.com",
  projectId: "deliverflow-spco",
  storageBucket: "deliverflow-spco.firebasestorage.app",
  messagingSenderId: "475814945735",
  appId: "1:475814945735:web:1679dfd1b7aae5c5532fe2"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Secondary Firebase App — Admin logout bug fix (Issue #1)
// Jab Admin naya user approve karta hai, to uska session safe rahe
const secondaryApp = getApps().find(a => a.name === 'secondary') || initializeApp(firebaseConfig, 'secondary')
export const secondaryAuth = getAuth(secondaryApp)

export default app
