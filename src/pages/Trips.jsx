import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, TRIP_DESTINATIONS } from "../data/masterData.js";

const T = {
  en: {
    newTrip:"New Trip", cancel:"Cancel", allTrips:"All Trips",
    tripNo:"Trip Number", tripDate:"Trip Date", destination:"Destination *",
    driver:"Driver * *", vehicle:"Vehicle * *", storage:"Storage Condition",
    notes:"Notes", attachInv:"Attach Transit Invoices (Optional)",
    createBtn:"Create & Dispatch Trip", noTrips:"No trips yet",
    from:"From:", to:"To:", confirmReceipt:"Confirm Receipt",
    dispatched:"Dispatched", received:"Received",
    pendingShipInv:"Pending Shipment Invoices for this route",
    selectAll:"Select All", clearAll:"Clear",
    tripCreated:"Trip created and dispatched!",
    tripReceived:"Trip received! Invoices added to your queue.",
    printTrip:"Print Trip Report", loadingDrivers:"Loading drivers...",
    loadingVehicles:"Loading vehicles..."
  },
  ar: {
    newTrip:"رحلة جديدة", cancel:"إلغاء", allTrips:"جميع الرحلات",
    tripNo:"رقم الرحلة", tripDate:"تاريخ الرحلة", destination:"الوجهة *",
    driver:"السائق * *", vehicle:"المركبة * *", storage:"ظروف التخزين",
    notes:"ملاحظات", attachInv:"إرفاق فواتير العبور (اختياري)",
    createBtn:"إنشاء وإرسال الرحلة", noTrips:"لا توجد رحلات",
    from:"من:", to:"إلى:", confirmReceipt:"تأكيد الاستلام",
    dispatched:"تم الإرسال", received:"تم الاستلام",
    pendingShipInv:"فواتير معلقة للشحن",
    selectAll:"تحديد الكل", clearAll:"إلغاء",
    tripCreated:"تم إنشاء وإرسال الرحلة!",
    tripReceived:"تم استلام الرحلة!",
    printTrip:"طباعة تقرير الرحلة",
    loadingDrivers:"جاري تحميل السائقين...",
    loadingVehicles:"جاري تحميل المركبات..."
  }
};

function FuelBar({ level, capacity }) {
  const pct = Math.round((level||0)/(capacity||80)*100);
  const color = pct < 25 ? "#ef4444" : pct < 50 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ background:"#e0f2fe", borderRadius:99, height:8, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99 }} />
    </div>
  );
}

function printTripReport(trip) {
  const content = `<html><head><style>
    body{font-family:Arial,sans-serif;padding:30px;}
    h1{color:#1A3A5C;border-bottom:3px solid #1A3A5C;padding-bottom:10px;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;}
    .label{font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:4px;}
    .value{font-size:14px;color:#1a1a1a;}
    table{width:100%;border-collapse:collapse;}
    th{background:#1A3A5C;color:white;padding:8px 12px;text-align:left;}
    td{padding:8px 12px;border-bottom:1px solid #e2e8f0;}
    .sig{border:1px solid #e2e8f0;border-radius:8px;padding:20px;min-height:80px;margin-top:8px;}
    .footer{margin-top:30px;text-align:center;font-size:11px;color:#94a3b8;}
  </style></head><body>
  <h1>🚚 DeliverFlow — Trip Report</h1>
  <div class="grid">
    <div><div class="label">Trip #</div><div class="value">${trip.tripNumber||trip.id}</div></div>
    <div><div class="label">Status</div><div class="value">${(trip.status||"").toUpperCase()}</div></div>
    <div><div class="label">From</div><div class="value">${trip.fromDC} DC</div></div>
    <div><div class="label">To</div><div class="value">${trip.toCityLabel||trip.toCity}</div></div>
    <div><div class="label">Date</div><div class="value">${trip.date}</div></div>
    <div><div class="label">Driver</div><div class="value">${trip.driver}</div></div>
    <div><div class="label">Vehicle</div><div class="value">${trip.vehicle}</div></div>
    <div><div class="label">Storage</div><div class="value">${trip.storage||"-"}</div></div>
  </div>
  ${trip.notes?`<div><div class="label">Notes</div><div class="value">${trip.notes}</div></div>`:""}
  <div style="margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:30px;">
    <div><div class="label">Dispatched By</div><div class="sig"></div><div style="font-size:12px;margin-top:6px;">${trip.createdBy} | ${trip.date}</div></div>
    <div><div class="label">Received By</div><div class="sig"></div><div style="font-size:12px;margin-top:6px;">${trip.receivedBy||"___________"}</div></div>
  </div>
  <div class="footer">Saudi Pharmaceutical Co. (SPCO) — DeliverFlow</div>
  </body></html>`;
  const w = window.open("","_blank");
  w.document.write(content); w.document.close();
  setTimeout(()=>w.print(), 500);
}

export default function Trips({ user, invoices, setInvoices, trips, setTrips, lang }) {
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState("");
  const [selInv, setSelInv] = useState([]);
  const [firestoreDrivers, setFirestoreDrivers] = useState([]);
  const [firestoreVehicles, setFirestoreVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    toCity:"", driver:"", vehicle:"",
    storage:"Ambient (15-25°C)", notes:"",
    date: new Date().toISOString().split("T")[0]
  });

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const dc = user.dc==="Head Office" ? "Riyadh" : (user.dc||"Riyadh");
  const canManage = user.role==="admin"||user.role==="manager";
  const statusColor = { dispatched:"#6d28d9", received:"#065f46" };

  // Load drivers and vehicles from Firestore
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load drivers from Firestore
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setFirestoreDrivers(allUsers.filter(u => u.role === "driver" && u.dc === dc && u.status === "active"));

      // Load vehicles from Firestore
      const vehSnap = await getDocs(collection(db, "vehicles"));
      const allVehicles = vehSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFirestoreVehicles(allVehicles.filter(v => v.dc === dc && v.status !== "Maintenance"));

      // Load trips from Firestore
      const tripsSnap = await getDocs(collection(db, "trips"));
      const allTrips = tripsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTrips(allTrips);
    } catch(e) {
      console.error("Trips load error:", e);
    }
    setLoading(false);
  }

  const myTrips = dc ? trips.filter(tr => tr.fromDC === dc) : trips;
  const pendingForTrip = invoices.filter(i => i.dc === dc && i.status === "assigned");
  const pendingShipInv = invoices.filter(i => i.status === "hold_ship" && i.holdOrigin === dc);

  const selVehicleObj = firestoreVehicles.find(v => v.plate === form.vehicle);
  const selDriverObj = firestoreDrivers.find(d => d.name === form.driver);

  const storageOptions = STORAGE_CONDITIONS.map(s => s.name+" ("+s.range+")");
  const tripNum = `TRIP-${new Date().getFullYear()}-${String(myTrips.length+1).padStart(3,"0")}`;

  async function createTrip() {
    if (!form.toCity||!form.driver||!form.vehicle) return;
    const dest = TRIP_DESTINATIONS.find(d=>d.value===form.toCity);
    const newTrip = {
      tripNumber: tripNum, id: tripNum,
      date: form.date,
      fromDC: dc,
      toCity: form.toCity, toCityLabel: dest?.label||form.toCity,
      driver: form.driver, vehicle: form.vehicle,
      storage: form.storage, notes: form.notes,
      status: "dispatched",
      invoiceIds: selInv,
      createdBy: user.name,
      createdAt: new Date().toLocaleString(),
    };

    try {
      const docRef = await addDoc(collection(db, "trips"), newTrip);
      newTrip.firestoreId = docRef.id;

      // Update invoices to intransit
      if (selInv.length > 0) {
        setInvoices(prev => prev.map(i =>
          selInv.includes(i.id) ? {...i, status:"intransit", tripId:tripNum} : i
        ));
      }

      setTrips(prev => [...prev, newTrip]);
      setDone(t.tripCreated);
      setShowForm(false);
      setForm({ toCity:"", driver:"", vehicle:"", storage:"Ambient (15-25°C)", notes:"", date:new Date().toISOString().split("T")[0] });
      setSelInv([]);
    } catch(e) {
      setDone("❌ Error: " + e.message);
    }
  }

  async function receiveTrip(tripId) {
    const updateData = {
      status: "received",
      receivedBy: user.name,
      receivedAt: new Date().toLocaleString()
    };
    try {
      const trip = trips.find(tr => tr.id === tripId);
      if (trip?.firestoreId) {
        await updateDoc(doc(db, "trips", trip.firestoreId), updateData);
      }
      setTrips(prev => prev.map(tr => tr.id===tripId ? {...tr,...updateData} : tr));
      setDone(t.tripReceived);
    } catch(e) {
      setDone("❌ Error: " + e.message);
    }
  }

  function canReceive(trip) {
    if (trip.status !== "dispatched") return false;
    if (!trip.toCity) return false;
    if (trip.toCity.includes("DC-")) {
      const destDC = trip.toCity.replace("DC-","");
      return dc === destDC && canManage;
    }
    return dc === trip.fromDC && canManage;
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}

      {canManage&&!showForm&&(
        <Btn onClick={()=>setShowForm(true)} style={{ marginBottom:16, padding:"12px 24px" }}>
          🚀 {t.newTrip}
        </Btn>
      )}

      {showForm&&(
        <Card style={{ borderTop:"4px solid #10b981" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <CardTitle style={{ margin:0 }}>🚚 New Trip — {dc} DC</CardTitle>
            <Btn small onClick={()=>setShowForm(false)} color="#64748b">{t.cancel}</Btn>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"0 16px" }}>
            {/* Trip Number */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>{t.tripNo}</label>
              <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, color:"#64748b" }}>
                {tripNum}
              </div>
            </div>

            {/* Trip Date */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>{t.tripDate}</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
            </div>

            {/* Destination */}
            <div style={{ gridColumn:"1/-1", marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>{t.destination}</label>
              <select value={form.toCity} onChange={e=>setForm({...form,toCity:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", background:"white", boxSizing:"border-box" }}>
                <option value="">Select destination...</option>
                {TRIP_DESTINATIONS.filter(d => {
                  if (d.type==="dc") return !d.value.includes(dc);
                  return true;
                }).map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Driver */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>👤 {t.driver}</label>
              {loading ? (
                <div style={{ padding:"11px 14px", fontSize:14, color:"#94a3b8" }}>⏳ {t.loadingDrivers}</div>
              ) : firestoreDrivers.length === 0 ? (
                <div style={{ padding:"11px 14px", fontSize:14, color:"#ef4444", background:"#fee2e2", borderRadius:8 }}>
                  ⚠️ No drivers found for {dc} DC. Add drivers first.
                </div>
              ) : (
                <select value={form.driver} onChange={e=>setForm({...form,driver:e.target.value})}
                  style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", background:"white", boxSizing:"border-box" }}>
                  <option value="">Select driver...</option>
                  {firestoreDrivers.map(d=>(
                    <option key={d.uid} value={d.name}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Vehicle */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>🚗 {t.vehicle}</label>
              {loading ? (
                <div style={{ padding:"11px 14px", fontSize:14, color:"#94a3b8" }}>⏳ {t.loadingVehicles}</div>
              ) : firestoreVehicles.length === 0 ? (
                <div style={{ padding:"11px 14px", fontSize:14, color:"#ef4444", background:"#fee2e2", borderRadius:8 }}>
                  ⚠️ No vehicles found for {dc} DC. Add vehicles first.
                </div>
              ) : (
                <select value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})}
                  style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", background:"white", boxSizing:"border-box" }}>
                  <option value="">Select vehicle...</option>
                  {firestoreVehicles.map(v=>(
                    <option key={v.plate||v.id} value={v.plate}>
                      {v.plate} — {v.type} ({v.fuelLevel||0}L fuel)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Select label={"🌡️ "+t.storage} value={form.storage} onChange={v=>setForm({...form,storage:v})} options={storageOptions} />

            <div style={{ gridColumn:"1/-1", marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>📝 {t.notes}</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }} />
            </div>
          </div>

          {/* Vehicle Detail */}
          {selVehicleObj&&(
            <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#0369a1", marginBottom:10 }}>🚗 {selVehicleObj.plate} — {selVehicleObj.type}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
                <div style={{ background:"white", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>⛽ Fuel</div>
                  <div style={{ fontWeight:800, fontSize:18, color:(selVehicleObj.fuelLevel||0)<20?"#ef4444":"#10b981" }}>{selVehicleObj.fuelLevel||0}L</div>
                  <FuelBar level={selVehicleObj.fuelLevel||0} capacity={selVehicleObj.fuelCapacity||80} />
                </div>
                <div style={{ background:"white", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>🛣️ KM</div>
                  <div style={{ fontWeight:800, fontSize:18, color:"#6366f1" }}>{(selVehicleObj.totalKM||0).toLocaleString()}</div>
                </div>
                <div style={{ background:"white", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>📊 km/L</div>
                  <div style={{ fontWeight:800, fontSize:18, color:"#7c3aed" }}>{selVehicleObj.mileage||12}</div>
                </div>
              </div>
              {(selVehicleObj.fuelLevel||0)<20&&(
                <div style={{ background:"#fee2e2", borderRadius:6, padding:"8px 12px", fontSize:13, color:"#991b1b", fontWeight:600, marginTop:10 }}>⚠️ Low Fuel Warning!</div>
              )}
            </div>
          )}

          {/* Driver Detail */}
          {selDriverObj&&(
            <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10, padding:"12px 16px", marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#065f46" }}>👤 {selDriverObj.name}</div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>
                📱 {selDriverObj.mobile||"-"} | 📄 Lic exp: {selDriverObj.licExp||"-"}
              </div>
            </div>
          )}

          {/* Pending invoices */}
          {pendingForTrip.length>0&&(
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:14, color:"#374151", marginBottom:8 }}>📋 {t.attachInv}</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <Btn small onClick={()=>setSelInv(pendingForTrip.map(i=>i.id))} color="#6366f1">{t.selectAll}</Btn>
                <Btn small onClick={()=>setSelInv([])} color="#64748b">{t.clearAll}</Btn>
              </div>
              {pendingForTrip.map(inv=>(
                <div key={inv.id} onClick={()=>setSelInv(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", border:`1px solid ${selInv.includes(inv.id)?"#6366f1":"#e2e8f0"}`, background:selInv.includes(inv.id)?"#eef2ff":"white", borderRadius:8, cursor:"pointer", marginBottom:4 }}>
                  <span style={{ color:"#6366f1", fontSize:18 }}>{selInv.includes(inv.id)?"☑":"☐"}</span>
                  <span style={{ fontWeight:600, fontSize:14 }}>{inv.id}</span>
                  <span style={{ fontSize:13, color:"#64748b" }}>{inv.customer}</span>
                </div>
              ))}
            </div>
          )}

          <Btn onClick={createTrip} color="#10b981" style={{ width:"100%", padding:14, fontSize:15 }} disabled={!form.toCity||!form.driver||!form.vehicle}>
            🚀 {t.createBtn}
          </Btn>
        </Card>
      )}

      {/* Trips List */}
      <Card>
        <CardTitle>📋 {t.allTrips} ({myTrips.length})</CardTitle>
        {loading&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>⏳ Loading trips...</div>}
        {!loading&&myTrips.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noTrips}</div>}
        {[...myTrips].reverse().map(trip=>(
          <div key={trip.id||trip.tripNumber} style={{ border:"1px solid #e2e8f0", borderRadius:10, padding:16, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:6 }}>
              <span style={{ fontWeight:800, color:"#6366f1", fontSize:16 }}>{trip.tripNumber||trip.id}</span>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:600, padding:"4px 12px", borderRadius:99, background:(statusColor[trip.status]||"#64748b")+"22", color:statusColor[trip.status]||"#64748b" }}>
                  {trip.status==="dispatched"?t.dispatched:t.received}
                </span>
                <Btn small onClick={()=>printTripReport(trip)} color="#6366f1">🖨️ {t.printTrip}</Btn>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8, fontSize:14, color:"#374151", marginBottom:8 }}>
              <div>📦 <b>{t.from}</b> {trip.fromDC} DC</div>
              <div>📍 <b>{t.to}</b> {trip.toCityLabel||trip.toCity}</div>
              <div>👤 <b>{t.driver}:</b> {trip.driver}</div>
              <div>🚗 <b>{t.vehicle}:</b> {trip.vehicle}</div>
              <div>📅 {trip.date}</div>
              {trip.invoiceIds&&trip.invoiceIds.length>0&&<div>📋 {trip.invoiceIds.length} invoices</div>}
            </div>
            {trip.notes&&<div style={{ fontSize:13, color:"#64748b", marginBottom:8 }}>📝 {trip.notes}</div>}
            {trip.receivedBy&&<div style={{ fontSize:13, color:"#10b981", fontWeight:600 }}>✅ Received by: {trip.receivedBy} — {trip.receivedAt}</div>}
            {canReceive(trip)&&(
              <Btn small onClick={()=>receiveTrip(trip.id)} color="#10b981" style={{ marginTop:10 }}>✅ {t.confirmReceipt}</Btn>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
