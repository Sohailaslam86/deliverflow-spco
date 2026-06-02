import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, Select, SuccessMsg } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, CITIES } from "../data/masterData.js";

const T = {
  en: {
    selectInv:"Select Invoices", selected:"selected",
    assignDetails:"Assignment Details", driver:"Driver", vehicle:"Vehicle",
    city:"Delivery City", storage:"Storage Condition", deliveryType:"Delivery Type",
    inCity:"In-City", outCity:"Out-City", assignBtn:"Assign to",
    noInvoices:"No pending invoices",
    fuelAvailable:"Fuel Available", odometer:"Current Odometer",
    estDistance:"Estimated Coverage", efficiency:"Efficiency",
    vehAlert:"Vehicle Alert", drvAlert:"Driver Alert",
    onLeave:"Driver is on leave — cannot assign",
    inMaint:"Vehicle is under maintenance — cannot assign",
    done:"invoice(s) assigned to", lowFuel:"Low Fuel Warning",
    driverLoad:"assigned", driverFree:"free",
    loading:"Loading data...", noDrivers:"No drivers found for this DC",
    noVehicles:"No vehicles found for this DC"
  },
  ar: {
    selectInv:"اختر الفواتير", selected:"محددة",
    assignDetails:"تفاصيل التخصيص", driver:"السائق", vehicle:"المركبة",
    city:"مدينة التسليم", storage:"ظروف التخزين", deliveryType:"نوع التسليم",
    inCity:"داخل المدينة", outCity:"خارج المدينة", assignBtn:"تخصيص إلى",
    noInvoices:"لا توجد فواتير معلقة",
    fuelAvailable:"الوقود المتاح", odometer:"عداد المسافة الحالي",
    estDistance:"التغطية المقدرة", efficiency:"الكفاءة",
    vehAlert:"تنبيه المركبة", drvAlert:"تنبيه السائق",
    onLeave:"السائق في إجازة — لا يمكن التخصيص",
    inMaint:"المركبة تحت الصيانة — لا يمكن التخصيص",
    done:"تم تخصيص الفواتير", lowFuel:"تحذير: وقود منخفض",
    driverLoad:"مخصص", driverFree:"متاح",
    loading:"جاري التحميل...", noDrivers:"لا يوجد سائقون",
    noVehicles:"لا توجد مركبات"
  }
};

function FuelBar({ level, capacity }) {
  const pct = Math.round((level||0)/(capacity||80)*100);
  const color = pct < 25 ? "#ef4444" : pct < 50 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ background:"#e0f2fe", borderRadius:99, height:8, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.3s" }} />
    </div>
  );
}

export default function Assign({ user, invoices, setInvoices, lang }) {
  const [selected, setSelected] = useState([]);
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [city, setCity] = useState("");
  const [dtype, setDtype] = useState("");
  const [storage, setStorage] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [fsDrivers, setFsDrivers] = useState([]);
  const [fsVehicles, setFsVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const rtl = lang==="ar";
  const t = T[lang]||T.en;

  // DC filter
  const userDC = (user.dc && user.dc !== "Head Office") ? user.dc : "Riyadh";

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Firestore se drivers load karo
      const uSnap = await getDocs(collection(db, "users"));
      const allUsers = uSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setFsDrivers(allUsers.filter(u => u.role === "driver" && u.dc === userDC && (u.status === "active" || u.status === "Active")));

      // Firestore se vehicles load karo
      const vSnap = await getDocs(collection(db, "vehicles"));
      const allVehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFsVehicles(allVehicles.filter(v => v.dc === userDC));
    } catch(e) { console.error("Assign load error:", e); }
    setLoading(false);
  }

  // Only pending/outstanding invoices for this DC (NOT hold_ship)
  const myInvoices = invoices.filter(i =>
    i.dc === userDC &&
    ["pending","outstanding"].includes(i.status)
  );

  const driverLoad = {};
  invoices.filter(i => i.dc === userDC && i.status === "assigned").forEach(i => {
    if (i.driverId) driverLoad[i.driverId] = (driverLoad[i.driverId]||0) + 1;
  });

  const selVehicle = fsVehicles.find(v => v.plate === vehicle);
  const selDriverUser = fsDrivers.find(d => d.name === driver);
  const storageOptions = STORAGE_CONDITIONS.map(s => s.name+" ("+s.range+")");

  const fuelLevel = selVehicle ? (selVehicle.fuelLevel||0) : 0;
  const fuelCap = selVehicle ? (selVehicle.fuelCapacity||80) : 80;
  const fuelPct = Math.round(fuelLevel/fuelCap*100);
  const efficiency = selVehicle ? (selVehicle.mileage||12) : 12;
  const estDist = Math.round(fuelLevel * efficiency);
  const odometer = selVehicle ? (selVehicle.totalKM||0) : 0;

  const vehAlerts = selVehicle ? [
    selVehicle.status==="Maintenance" && t.inMaint,
    fuelLevel<20 && t.lowFuel+": "+fuelLevel+"L ("+fuelPct+"%)",
    selVehicle.fahas && Math.ceil((new Date(selVehicle.fahas)-new Date())/(1000*60*60*24))<=30 && "Fahas expiring: "+selVehicle.fahas,
    selVehicle.insurance && Math.ceil((new Date(selVehicle.insurance)-new Date())/(1000*60*60*24))<=30 && "Insurance expiring: "+selVehicle.insurance,
  ].filter(Boolean) : [];

  const drvAlerts = selDriverUser ? [
    selDriverUser.status==="On Leave" && t.onLeave,
    selDriverUser.licExp && Math.ceil((new Date(selDriverUser.licExp)-new Date())/(1000*60*60*24))<=30 && "License expiring: "+selDriverUser.licExp,
    selDriverUser.driverCardExp && Math.ceil((new Date(selDriverUser.driverCardExp)-new Date())/(1000*60*60*24))<=30 && "Driver card expiring: "+selDriverUser.driverCardExp,
  ].filter(Boolean) : [];

  async function assign() {
    setError("");
    if (selVehicle?.status==="Maintenance") { setError(t.inMaint); return; }
    if (selDriverUser?.status==="On Leave") { setError(t.onLeave); return; }
    if (!driver||!vehicle||!city||!dtype||!storage||!selected.length) return;

    const updateData = {
      status:"assigned",
      driverId: selDriverUser?.uid || driver,
      driverName: driver,
      vehicle, city, dtype, storage,
      assignedAt: new Date().toLocaleString(),
    };

    // Firestore update
    for (const invId of selected) {
      const inv = invoices.find(i => i.id === invId || i.firestoreId === invId);
      if (inv?.firestoreId) {
        try { await updateDoc(doc(db, "invoices", inv.firestoreId), updateData); } catch(e) { console.error(e); }
      }
    }

    setInvoices(prev => prev.map(i =>
      selected.includes(i.id) || selected.includes(i.firestoreId)
        ? {...i, ...updateData}
        : i
    ));

    setDone(selected.length+" "+t.done+" "+driver+"!");
    setSelected([]); setDriver(""); setVehicle(""); setCity(""); setDtype(""); setStorage("");
    setTimeout(() => setDone(""), 3000);
  }

  const canAssign = driver && vehicle && city && dtype && storage && selected.length > 0;
  const days = inv => Math.floor((new Date()-new Date(inv.date))/(1000*60*60*24));

  if (loading) return (
    <div style={{ textAlign:"center", padding:40, fontSize:16, color:"#64748b" }}>
      ⏳ {t.loading}
    </div>
  );

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      {error&&<div style={{ background:"#fee2e2",color:"#991b1b",borderRadius:8,padding:"12px 16px",fontSize:14,marginBottom:12,fontWeight:600 }}>⛔ {error}</div>}

      {/* Invoice Selection */}
      <Card>
        <CardTitle>
          📋 {t.selectInv} — {userDC} Distribution Center
          {selected.length>0&&<span style={{ background:"#6366f1",color:"white",fontSize:13,borderRadius:99,padding:"3px 12px",marginLeft:8 }}>{selected.length} {t.selected}</span>}
        </CardTitle>
        {myInvoices.length===0&&(
          <div style={{ textAlign:"center",padding:24,color:"#94a3b8",fontSize:15 }}>
            📋 {t.noInvoices} — {userDC} Distribution Center
          </div>
        )}
        {myInvoices.map(inv=>{
          const d = days(inv);
          const isSelected = selected.includes(inv.id) || selected.includes(inv.firestoreId);
          const invId = inv.id || inv.firestoreId;
          return (
            <div key={invId} onClick={()=>setSelected(p=>p.includes(invId)?p.filter(x=>x!==invId):[...p,invId])}
              style={{ display:"flex",alignItems:"center",gap:10,padding:14,border:`1.5px solid ${isSelected?"#a5b4fc":"#f1f5f9"}`,background:isSelected?"#eef2ff":"white",borderRadius:8,marginBottom:6,cursor:"pointer" }}>
              <span style={{ fontSize:20,color:"#6366f1" }}>{isSelected?"☑":"☐"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14,color:"#6366f1" }}>{inv.id}</div>
                <div style={{ fontSize:15,color:"#0f172a",fontWeight:500 }}>{inv.customer}</div>
                <div style={{ fontSize:13,color:"#94a3b8" }}>{inv.date} | {inv.inst}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:d<=1?"#d1fae5":d<=3?"#fef3c7":"#fee2e2",color:d<=1?"#065f46":d<=3?"#92400e":"#991b1b" }}>{d}d</span>
                {inv.status==="outstanding"&&<div style={{ fontSize:12,color:"#f97316",fontWeight:600,marginTop:4 }}>⚠️ {inv.attempts} attempt(s)</div>}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Assignment Details */}
      <Card>
        <CardTitle>⚙️ {t.assignDetails}</CardTitle>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0 12px" }}>

          {/* Driver */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6 }}>👤 {t.driver}</label>
            {fsDrivers.length===0?(
              <div style={{ padding:"11px 14px",fontSize:14,color:"#ef4444",background:"#fee2e2",borderRadius:8 }}>
                ⚠️ {t.noDrivers} — {userDC} DC
              </div>
            ):(
              <select value={driver} onChange={e=>setDriver(e.target.value)}
                style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",background:"white",boxSizing:"border-box" }}>
                <option value="">Select driver...</option>
                {fsDrivers.map(d=>(
                  <option key={d.uid} value={d.name} disabled={d.status==="On Leave"}>
                    {d.name} — {d.status==="On Leave"?"(On Leave)":driverLoad[d.uid]?driverLoad[d.uid]+" "+t.driverLoad:t.driverFree}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Vehicle */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6 }}>🚗 {t.vehicle}</label>
            {fsVehicles.length===0?(
              <div style={{ padding:"11px 14px",fontSize:14,color:"#ef4444",background:"#fee2e2",borderRadius:8 }}>
                ⚠️ {t.noVehicles} — {userDC} DC
              </div>
            ):(
              <select value={vehicle} onChange={e=>setVehicle(e.target.value)}
                style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",background:"white",boxSizing:"border-box" }}>
                <option value="">Select vehicle...</option>
                {fsVehicles.map(v=>{
                  const pct = Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100);
                  return (
                    <option key={v.plate||v.id} value={v.plate} disabled={v.status==="Maintenance"}>
                      {v.plate} — {v.fuelLevel||0}L ({pct}%) {v.status==="Maintenance"?"[MAINTENANCE]":""}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <Select label={"📍 "+t.city} value={city} onChange={setCity} options={CITIES} />
          <Select label={"🌡️ "+t.storage} value={storage} onChange={setStorage} options={storageOptions} />
        </div>

        {/* Vehicle Detail Panel */}
        {selVehicle&&(
          <div style={{ background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:"14px 16px",marginBottom:14 }}>
            <div style={{ fontWeight:700,fontSize:15,color:"#0369a1",marginBottom:12 }}>🚗 {selVehicle.plate} — {selVehicle.type} {selVehicle.brand}</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:12 }}>
              <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:12,color:"#64748b",fontWeight:600,marginBottom:4 }}>⛽ {t.fuelAvailable}</div>
                <div style={{ fontWeight:800,fontSize:20,color:fuelPct<25?"#ef4444":fuelPct<50?"#f59e0b":"#10b981" }}>{fuelLevel}L</div>
                <div style={{ fontSize:12,color:"#64748b",marginBottom:6 }}>{fuelLevel}/{fuelCap}L ({fuelPct}%)</div>
                <FuelBar level={fuelLevel} capacity={fuelCap} />
              </div>
              <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:12,color:"#64748b",fontWeight:600,marginBottom:4 }}>🛣️ {t.odometer}</div>
                <div style={{ fontWeight:800,fontSize:20,color:"#6366f1" }}>{odometer.toLocaleString()}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>km total</div>
              </div>
              <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:12,color:"#64748b",fontWeight:600,marginBottom:4 }}>📍 {t.estDistance}</div>
                <div style={{ fontWeight:800,fontSize:20,color:"#0891b2" }}>~{estDist}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>km on current fuel</div>
              </div>
              <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:12,color:"#64748b",fontWeight:600,marginBottom:4 }}>📊 {t.efficiency}</div>
                <div style={{ fontWeight:800,fontSize:20,color:"#7c3aed" }}>{efficiency}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>km / L</div>
              </div>
            </div>
            {vehAlerts.length>0&&(
              <div>
                <div style={{ fontWeight:600,fontSize:13,color:"#991b1b",marginBottom:6 }}>⚠️ {t.vehAlert}:</div>
                {vehAlerts.map((a,i)=>(
                  <div key={i} style={{ fontSize:13,color:"#991b1b",background:"#fee2e2",borderRadius:6,padding:"6px 12px",marginBottom:4,fontWeight:600 }}>🔴 {a}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Driver Alert */}
        {selDriverUser&&drvAlerts.length>0&&(
          <div style={{ background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:8,padding:"12px 16px",marginBottom:14 }}>
            <div style={{ fontWeight:600,fontSize:14,color:"#92400e",marginBottom:6 }}>⚠️ {t.drvAlert}: {selDriverUser.name}</div>
            {drvAlerts.map((a,i)=>(
              <div key={i} style={{ fontSize:13,color:"#92400e",fontWeight:600,marginBottom:4 }}>🟡 {a}</div>
            ))}
          </div>
        )}

        {/* Delivery Type */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:8 }}>{t.deliveryType}</label>
          <div style={{ display:"flex",gap:8 }}>
            {[["incity","🏙️ "+t.inCity],["outcity","🛣️ "+t.outCity]].map(([v,l])=>(
              <button key={v} onClick={()=>setDtype(v)}
                style={{ flex:1,border:`2px solid ${dtype===v?"#6366f1":"#e2e8f0"}`,background:dtype===v?"#eef2ff":"white",borderRadius:8,padding:12,cursor:"pointer",fontSize:14,fontWeight:600,color:dtype===v?"#4338ca":"#64748b" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <Btn onClick={assign} disabled={!canAssign} style={{ width:"100%",padding:14,fontSize:15 }}>
          🚚 {t.assignBtn} {driver||"Driver"} ({selected.length})
        </Btn>
      </Card>
    </div>
  );
}
