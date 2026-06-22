// src/App.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./components/Login.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import Shell from "./components/Shell.jsx";
import Dashboard        from "./pages/Dashboard.jsx";
import Invoices         from "./pages/Invoices.jsx";
import Upload           from "./pages/Upload.jsx";
import Assign           from "./pages/Assign.jsx";
import Trips            from "./pages/Trips.jsx";
import DispatchCalendar from "./pages/DispatchCalendar.jsx";
import Users            from "./pages/Users.jsx";
import MasterData       from "./pages/MasterData.jsx";
import Fleet            from "./pages/Fleet.jsx";
import Fuel             from "./pages/Fuel.jsx";
import Reports          from "./pages/Reports.jsx";
import Driver           from "./pages/Driver.jsx";
import Odometer         from "./pages/Odometer.jsx";
import Search           from "./pages/Search.jsx";
import Download         from "./pages/Download.jsx";
import {
  INITIAL_INVOICES, INITIAL_VEHICLES,
  INITIAL_TRIPS, INITIAL_FUEL_LOGS, INITIAL_UPLOADS,
  INITIAL_USER_REQUESTS, INITIAL_ALERTS, DEMO_USERS
} from "./data/masterData.js";

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
          const docRef  = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() });
          } else {
            setUser({
              uid: firebaseUser.uid, email: firebaseUser.email,
              name: firebaseUser.email === ADMIN_EMAIL ? "Sohail Aslam" : firebaseUser.email,
              role: firebaseUser.email === ADMIN_EMAIL ? "admin" : "viewonly",
              dc:   firebaseUser.email === ADMIN_EMAIL ? "Head Office" : "All",
              department: "Management", status: "active"
            });
          }
        } catch (e) {
          setUser({
            uid: firebaseUser.uid, email: firebaseUser.email,
            name: firebaseUser.email === ADMIN_EMAIL ? "Sohail Aslam" : firebaseUser.email,
            role: firebaseUser.email === ADMIN_EMAIL ? "admin" : "viewonly",
            dc:   firebaseUser.email === ADMIN_EMAIL ? "Head Office" : "All",
            department: "Management", status: "active"
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load all users from Firestore
  useEffect(() => {
    async function loadUsers() {
      try {
        const snap    = await getDocs(collection(db, "users"));
        const fsUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        if (fsUsers.length > 0) setUsers(fsUsers);
      } catch(e) { console.error("Users load error:", e); }
    }
    loadUsers();
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
      onLogin={u => { setUser(u); setPage("dashboard"); }}
      lang={lang}
      setLang={setLang}
    />
  );

  const props = {
    user, lang, invoices, setInvoices, vehicles, setVehicles,
    trips, setTrips, fuelLogs, setFuelLogs, uploads, setUploads,
    users, setUsers, requests, setRequests, alerts, setAlerts, setPage
  };

  // Role-based page guard
  function guardPage(role, allowedRoles, component, fallback = null) {
    return allowedRoles.includes(role)
      ? component
      : (fallback || <div style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>⛔ Access not permitted for your role.</div>);
  }

  const pages = {
    // Dashboard — not for drivers (their home is mydeliveries) or viewonly
    dashboard: guardPage(user.role,
      ["admin","manager","logistic","planning","management"],
      <Dashboard {...props} users={users} />,
      user.role === "driver" ? <Driver {...props} /> : null
    ),

    // Dispatch Management — admin, manager, planning
    assign: guardPage(user.role,
      ["admin","manager","planning"],
      <Assign {...props} users={users} />
    ),

    upload: guardPage(user.role,
      ["admin","planning"],
      <Upload {...props} />
    ),

    trips: guardPage(user.role,
      ["admin","manager"],
      <Trips {...props} vehicles={vehicles} users={users} />
    ),

    // Dispatch Calendar — admin + manager
    calendar: guardPage(user.role,
      ["admin","manager"],
      <DispatchCalendar {...props} users={users} vehicles={vehicles} />
    ),

    // Users — planning sees all DCs (uploads for all); manager/logistic see own
    users: guardPage(user.role,
      ["admin","manager","logistic","planning"],
      <Users {...props} />
    ),

    masterdata: guardPage(user.role,
      ["admin","manager","driver"],
      <MasterData {...props} />
    ),

    fleet: guardPage(user.role,
      ["admin","manager","logistic","management"],
      <Fleet {...props} setUsers={setUsers} />
    ),

    fuel: guardPage(user.role,
      ["admin","manager","logistic","management"],
      <Fuel {...props} />
    ),

    reports: guardPage(user.role,
      ["admin","manager","logistic","management"],
      <Reports {...props} users={users} />
    ),

    mydeliveries: guardPage(user.role,
      ["driver"],
      <Driver {...props} />
    ),

    odometer: guardPage(user.role,
      ["driver"],
      <Odometer {...props} />
    ),

    // Search — driver cannot search all invoices
    search: guardPage(user.role,
      ["admin","manager","logistic","planning","viewonly","management"],
      <Search {...props} />
    ),

    // Download/POD — planning included (uploads for all DCs, needs POD access)
    download: guardPage(user.role,
      ["admin","manager","logistic","planning","viewonly","management"],
      <Download {...props} />
    ),
  };

  return (
    <SettingsProvider>
      <Shell
        user={user}
        lang={lang}
        setLang={setLang}
        page={page}
        setPage={setPage}
        onLogout={() => { signOut(auth); setUser(null); setPage("dashboard"); }}
        alerts={alerts}
      >
        {pages[page] || pages.dashboard}
      </Shell>
    </SettingsProvider>
  );
}
