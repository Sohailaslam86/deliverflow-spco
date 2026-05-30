import { useState } from "react";
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
  DEMO_USERS, INITIAL_INVOICES, INITIAL_VEHICLES,
  INITIAL_TRIPS, INITIAL_FUEL_LOGS, INITIAL_UPLOADS,
  INITIAL_USER_REQUESTS, INITIAL_ALERTS
} from "./data/masterData.js";

export default function App() {
  const [user,     setUser]     = useState(null);
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

  if (!user) return (
    <Login onLogin={u=>{setUser(u);setPage("dashboard");}} lang={lang} setLang={setLang} />
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
    trips:        <Trips      {...props} />,
    users:        <Users      {...props} />,
    masterdata:   <MasterData {...props} />,
    fleet:        <Fleet      {...props} />,
    fuel:         <Fuel       {...props} />,
    reports:      <Reports    {...props} />,
    mydeliveries: <Driver     {...props} />,
    odometer:     <Odometer   {...props} />,
    search:       <Search     {...props} />,
    download:     <Download   {...props} />,
  };

  return (
    <Shell user={user} lang={lang} setLang={setLang} page={page} setPage={setPage}
      onLogout={()=>{setUser(null);setPage("dashboard");}} alerts={alerts}>
      {pages[page]||pages.dashboard}
    </Shell>
  );
}
