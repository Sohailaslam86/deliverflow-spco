import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
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

// Admin email hardcoded fallback
const ADMIN_EMAIL = "sohail@spco.sa";

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
            // ✅ Firestore profile mili
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...docSnap.data()
            });
          } else {
            // ❌ Firestore document nahi mila — email se role decide karo
            console.warn("No Firestore doc for:", firebaseUser.uid, firebaseUser.email);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.email === ADMIN_EMAIL ? "Sohail Aslam" : firebaseUser.email,
              role: firebaseUser.email === ADMIN_EMAIL ? "admin" : "viewonly",
              dc: firebaseUser.email === ADMIN_EMAIL ? "Head Office" : "All",
              department: "Management",
              status: "active"
            });
          }
        } catch (e) {
          console.error("Firestore error:", e.message);
          // Error pe bhi login karo — admin fallback
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email === ADMIN_EMAIL ? "Sohail Aslam" : firebaseUser.email,
            role: firebaseUser.email === ADMIN_EMAIL ? "admin" : "viewonly",
            dc: firebaseUser.email === ADMIN_EMAIL ? "Head Office" : "All",
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
      onLogout={()=>{ signOut(auth); setUser(null); setPage("dashboard"); }}
      alerts={alerts}
    >
      {pages[page]||pages.dashboard}
    </Shell>
  );
}
