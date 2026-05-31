import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export default function App() {
  const [status, setStatus] = useState("Loading...");
  const [data, setData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setStatus("Firebase Auth OK! UID: " + firebaseUser.uid);
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setData(docSnap.data());
            setStatus("✅ Firestore OK! Role: " + docSnap.data().role);
          } else {
            setStatus("❌ Firestore: No document found for UID: " + firebaseUser.uid);
          }
        } catch(e) {
          setStatus("❌ Firestore Error: " + e.message);
        }
      } else {
        setStatus("Not logged in");
      }
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h2>DeliverFlow Debug</h2>
      <p style={{ background: "#f0f9ff", padding: 16, borderRadius: 8 }}>{status}</p>
      {data && <pre style={{ background: "#f1f5f9", padding: 16, borderRadius: 8 }}>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
