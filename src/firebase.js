import { initializeApp } from 'firebase/app'
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
export default app
