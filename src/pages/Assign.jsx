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
    driverLoad:"assigned", driverFree:"free"
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
    driverLoad:"مخصص", driverFree:"متاح"
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

export default function Assign({ user, invoices, setInvoices, vehicles, lang }) {
  const [selected, setSelected] = useState([]);
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [city, setCity] = useState("");
  const [dtype, setDtype] = useState("");
  const [storage, setStorage] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [dcDrivers, setDcDrivers] = useState([]);
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const dc = user.dc==="Head Office" ? "Riyadh" : (user.dc||"Riyadh");

  // Firestore se drivers load karo
  useEffect(() => {
    loadDrivers();
    loadInvoices();
  }, []);

  async function loadDrivers() {
    try {
      const snap = await getDocs(collection(db, "users"));
      const all = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setDcDrivers(all.filter(u => u.role === "driver" && u.dc === dc));
    } catch(e) { console.error("Drivers load error:", e); }
  }

  async function loadInvoices() {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      setInvoices(data);
    } catch(e) { console.error("Invoices load error:", e); }
  }

  const myInvoices = invoices.filter(i=>i.dc===dc&&["pending","outstanding"].includes(i.status));
  const allVehicles = vehicles.filter(v=>v.dc===dc);

  const driverLoad = {};
  invoices.filter(i=>i.dc===dc&&i.status==="assigned").forEach(i=>{
    if(i.driverId) driverLoad[i.driverId]=(driverLoad[i.driverId]||0)+1;
  });

  const selVehicle = vehicles.find(v=>v.plate===vehicle);
  const selDriverUser = dcDrivers.find(d=>d.name===driver);
  const storageOptions = STORAGE_CONDITIONS.map(s=>s.name+" ("+s.range+")");

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
  ].filter(Boolean) : [];

  async function assign() {
    setError("");
    if (selVehicle?.status==="Maintenance") { setError(t.inMaint); return; }
    if (selDriverUser?.status==="On Leave") { setError(t.onLeave); return; }
    if (!driver||!vehicle||!city||!dtype||!storage||!selected.length) return;

    const updateData = {
      status:"assigned", driverId: selDriverUser?.uid||user.uid,
      driverName: driver, vehicle, city, dtype, storage,
      assignedAt: new Date().toLocaleString(), attempts: 0
    };

    // Firestore update — har selected invoice
    for (const invId of selected) {
      const inv = invoices.find(i=>i.id===invId);
      if (inv?.firestoreId) {
        try { await updateDoc(doc(db, "invoices", inv.firestoreId), updateData); } catch(e) { console.error(e); }
      }
    }

    setInvoices(prev=>prev.map(i=>selected.includes(i.id)?{...i,...updateData}:i));
    setDone(selected.length+" "+t.done+" "+driver+"!");
    setSelected([]); setDriver(""); setVehicle(""); setCity(""); setDtype(""); setStorage("");
    setTimeout(()=>setDone(""),3000);
  }

  const canAssign = driver&&vehicle&&city&&dtype&&storage&&selected.length>0;
  const days = inv => Math.floor((new Date()-new Date(inv.date))/(1000*60*60*24));

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      {error&&<div style={{ background:"#fee2e2",color:"#991b1b",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:12,fontWeight:600 }}>⛔ {error}</div>}

      <Card>
        <CardTitle>
          📋 {t.selectInv}
          {selected.length>0&&<span style={{ background:"#6366f1",color:"white",fontSize:12,borderRadius:99,padding:"2px 10px",marginLeft:8 }}>{selected.length} {t.selected}</span>}
        </CardTitle>
        {myInvoices.length===0&&<div style={{ textAlign:"center",padding:20,color:"#94a3b8" }}>{t.noInvoices} — {dc} DC</div>}
        {myInvoices.map(inv=>{
          const d=days(inv);
          return (
            <div key={inv.id||inv.firestoreId} onClick={()=>setSelected(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])}
              style={{ display:"flex",alignItems:"center",gap:10,padding:12,border:`1px solid ${selected.includes(inv.id)?"#a5b4fc":"#f1f5f9"}`,background:selected.includes(inv.id)?"#eef2ff":"white",borderRadius:8,marginBottom:6,cursor:"pointer" }}>
              <span style={{ fontSize:20,color:"#6366f1" }}>{selected.includes(inv.id)?"☑":"☐"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:13,color:"#6366f1" }}>{inv.id}</div>
                <div style={{ fontSize:13,color:"#0f172a" }}>{inv.customer}</div>
                <div style={{ fontSize:11,color:"#94a3b8" }}>{inv.date} | {inv.inst}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:d<=1?"#d1fae5":d<=3?"#fef3c7":"#fee2e2",color:d<=1?"#065f46":d<=3?"#92400e":"#991b1b" }}>{d}d</span>
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <CardTitle>⚙️ {t.assignDetails}</CardTitle>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0 12px" }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:5 }}>👤 {t.driver}</label>
            <select value={driver} onChange={e=>setDriver(e.target.value)}
              style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
              <option value="">Select driver...</option>
              {dcDrivers.map(d=>(
                <option key={d.uid} value={d.name} disabled={d.status==="On Leave"}>
                  {d.name} — {d.status==="On Leave"?"(On Leave)":driverLoad[d.uid]?driverLoad[d.uid]+" "+t.driverLoad:t.driverFree}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:5 }}>🚗 {t.vehicle}</label>
            <select value={vehicle} onChange={e=>setVehicle(e.target.value)}
              style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
              <option value="">Select vehicle...</option>
              {allVehicles.map(v=>{
                const pct=Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100);
                return (
                  <option key={v.plate} value={v.plate} disabled={v.status==="Maintenance"}>
                    {v.plate} — {v.fuelLevel||0}L ({pct}%) {v.status==="Maintenance"?"[MAINTENANCE]":""}
                  </option>
                );
              })}
            </select>
          </div>
          <Select label={"📍 "+t.city} value={city} onChange={setCity} options={CITIES} />
          <Select label={"🌡️ "+t.storage} value={storage} onChange={setStorage} options={storageOptions} />
        </div>

        {selVehicle&&(
          <div style={{ background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:"14px 16px",marginBottom:12 }}>
            <div style={{ fontWeight:700,fontSize:13,color:"#0369a1",marginBottom:12 }}>🚗 {selVehicle.plate} — {selVehicle.type} {selVehicle.brand}</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:12 }}>
              <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4 }}>⛽ {t.fuelAvailable}</div>
                <div style={{ fontWeight:800,fontSize:18,color:fuelPct<25?"#ef4444":fuelPct<50?"#f59e0b":"#10b981" }}>{fuelLevel}L</div>
                <div style={{ fontSize:12,color:"#64748b",marginBottom:6 }}>{fuelLevel}/{fuelCap}L ({fuelPct}%)</div>
                <FuelBar level={fuelLevel} capacity={fuelCap} />
              </div>
              <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4 }}>🛣️ {t.odometer}</div>
                <div style={{ fontWeight:800,fontSize:18,color:"#6366f1" }}>{odometer.toLocaleString()}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>km total</div>
              </div>
              <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4 }}>📍 {t.estDistance}</div>
                <div style={{ fontWeight:800,fontSize:18,color:"#0891b2" }}>~{estDist}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>km on current fuel</div>
              </div>
              <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4 }}>📊 {t.efficiency}</div>
                <div style={{ fontWeight:800,fontSize:18,color:"#7c3aed" }}>{efficiency}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>km / L</div>
              </div>
            </div>
            {vehAlerts.length>0&&(
              <div>
                <div style={{ fontWeight:600,fontSize:12,color:"#991b1b",marginBottom:4 }}>⚠️ {t.vehAlert}:</div>
                {vehAlerts.map((a,i)=>(
                  <div key={i} style={{ fontSize:12,color:"#991b1b",background:"#fee2e2",borderRadius:6,padding:"5px 10px",marginBottom:3,fontWeight:600 }}>🔴 {a}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {selDriverUser&&drvAlerts.length>0&&(
          <div style={{ background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:8,padding:"12px 14px",marginBottom:12 }}>
            <div style={{ fontWeight:600,fontSize:13,color:"#92400e",marginBottom:6 }}>⚠️ {t.drvAlert}: {selDriverUser.name}</div>
            {drvAlerts.map((a,i)=>(
              <div key={i} style={{ fontSize:12,color:"#92400e",fontWeight:600,marginBottom:3 }}>🟡 {a}</div>
            ))}
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6 }}>{t.deliveryType}</label>
          <div style={{ display:"flex",gap:8 }}>
            {[["incity","🏙️ "+t.inCity],["outcity","🛣️ "+t.outCity]].map(([v,l])=>(
              <button key={v} onClick={()=>setDtype(v)}
                style={{ flex:1,border:`2px solid ${dtype===v?"#6366f1":"#e2e8f0"}`,background:dtype===v?"#eef2ff":"white",borderRadius:8,padding:10,cursor:"pointer",fontSize:13,fontWeight:600,color:dtype===v?"#4338ca":"#64748b" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <Btn onClick={assign} disabled={!canAssign} style={{ width:"100%",padding:12,fontSize:14 }}>
          🚚 {t.assignBtn} {driver||"Driver"} ({selected.length})
        </Btn>
      </Card>
    </div>
  );
}
