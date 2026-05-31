import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./components/Login.jsx";
import Shell from "./components/Shell.jsx";
import Dashboard  from "./pages/Dashboard.jsx";
import Invoices   from "./pages/Invoices.jsx";
import Upload     from "./pages/Upload.jsx";
import Assign     from "./pages/Assign.jsx";
import Trips      from "./pages/Trips.jsx";
import Users      from "./pages/Users.jsx";
import MasterData from "./pages/MasterData.jsx";
import Fleet      from "./pages/Fleet.jsx";
import Fuel       from "./pages/Fuel.jsx";
import Reports    from "./pages/Reports.jsx";
import Driver     from "./pages/Driver.jsx";
import Odometer   from "./pages/Odometer.jsx";
import Search     from "./pages/Search.jsx";
import Download   from "./pages/Download.jsx";
import {
  INITIAL_INVOICES, INITIAL_VEHICLES,
  INITIAL_TRIPS, INITIAL_FUEL_LOGS, INITIAL_UPLOADS,
  INITIAL_USER_REQUESTS, INITIAL_ALERTS, DEMO_USERS
} from "./data/masterData.js";

export default function App() {
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [lang,     setLang]     = useState("en");
  const [page,     setPage]     = useState("dashboard");
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [trips,    setTrips]    = useState(INITIAL_TRIPS);
  const [fuelLogs, setFuelLogs] = useState(INITIAL_FUEL_LOGS);
  const [uploads,  setUploads]  = useState(INITIAL_UPLOADS);
  const [users,    setUsers]    = useState(DEMO_USERS);
  const [requests, setRequests] = useState(INITIAL_USER_REQUESTS);
  const [alerts,   setAlerts]   = useState(INITIAL_ALERTS);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Firestore se profile load karo
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            // ✅ Firestore profile mili — use karo
            const profile = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...profile
            });
          } else {
            // ❌ Firestore profile nahi mili
            // Retry karo 2 seconds baad (kabhi kabhi delay hota hai)
            setTimeout(async () => {
              try {
                const retrySnap = await getDoc(docRef);
                if (retrySnap.exists()) {
                  setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    ...retrySnap.data()
                  });
                } else {
                  // Ab bhi nahi mili — email se match karo
                  setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.email,
                    role: firebaseUser.email === "sohail@spco.sa" ? "admin" : "viewonly",
                    dc: firebaseUser.email === "sohail@spco.sa" ? "Head Office" : "All",
                    department: "Management",
                    status: "active"
                  });
                }
              } catch(e) {
                console.error("Retry error:", e);
              }
              setLoading(false);
            }, 2000);
            return; // Loading band mat karo abhi
          }
        } catch (e) {
          console.error("Firestore error:", e);
          // Emergency fallback — sohail ke liye admin
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email,
            role: firebaseUser.email === "sohail@spco.sa" ? "admin" : "viewonly",
            dc: firebaseUser.email === "sohail@spco.sa" ? "Head Office" : "All",
            department: "Management",
            status: "active"
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div style={{
      display:"flex", flexDirection:"column",
      justifyContent:"center", alignItems:"center",
      height:"100vh", fontSize:"18px", color:"#666",
      fontFamily:"Segoe UI, sans-serif"
    }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🔄</div>
      <div>Loading DeliverFlow...</div>
      <div style={{ fontSize:13, color:"#94a3b8", marginTop:8 }}>
        Connecting to server...
      </div>
    </div>
  );

  if (!user) return (
    <Login
      onLogin={u=>{setUser(u); setPage("dashboard");}}
      lang={lang}
      setLang={setLang}
    />
  );

  const props = {
    user, lang, invoices, setInvoices, vehicles, setVehicles,
    trips, setTrips, fuelLogs, setFuelLogs, uploads, setUploads,
    users, setUsers, requests, setRequests, alerts, setAlerts, setPage
  };

  const pages = {
    dashboard:    <Dashboard  {...props} users={users} />,
    invoices:     <Invoices   {...props} />,
    upload:       <Upload     {...props} />,
    assign:       <Assign     {...props} users={users} />,
    trips:        <Trips      {...props} vehicles={vehicles} users={users} />,
    users:        <Users      {...props} />,
    masterdata:   <MasterData {...props} />,
    fleet:        <Fleet      {...props} setUsers={setUsers} />,
    fuel:         <Fuel       {...props} />,
    reports:      <Reports    {...props} users={users} />,
    mydeliveries: <Driver     {...props} />,
    odometer:     <Odometer   {...props} />,
    search:       <Search     {...props} />,
    download:     <Download   {...props} />,
  };

  return (
    <Shell
      user={user}
      lang={lang}
      setLang={setLang}
      page={page}
      setPage={setPage}
      onLogout={()=>{setUser(null); setPage("dashboard");}}
      alerts={alerts}
    >
      {pages[page]||pages.dashboard}
    </Shell>
  );
}
