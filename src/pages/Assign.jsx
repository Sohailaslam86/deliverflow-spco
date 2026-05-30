import { useState } from "react";
import { Card, CardTitle, Btn, Select, SuccessMsg } from "../components/Shared.jsx";
import { DRIVERS_BY_DC, STORAGE_CONDITIONS, CITIES } from "../data/masterData.js";

const VEHICLES_BY_DC = {
  Riyadh:["Dyna 5784","BUS 2632","BUS 2630","BUS 2629","BUS 4295","Bus 4294","BUS 2631","Bus 2633","Dyna 5789","Dyna 5788"],
  Jeddah:["BUS 2631","Dyna 1217","Dyna 5787","Dyna 5786","BUS 2629","Dyna 5784","BUS 4472","BUS 2633","Dyna 5789"],
  Dammam:["BUS 4472","Dyna 5789","Dyna 5787"],
};

const T = {
  en: {
    selectInv:"Select Invoices", selected:"selected", assignDetails:"Assignment Details",
    driver:"Driver", vehicle:"Vehicle", city:"Delivery City",
    storage:"Storage Condition", deliveryType:"Delivery Type",
    inCity:"In-City", outCity:"Out-City", assignBtn:"Assign to",
    noInvoices:"No pending invoices", lowFuel:"LOW FUEL",
    done:"invoice(s) assigned to"
  },
  ar: {
    selectInv:"\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631",
    selected:"\u0645\u062d\u062f\u062f\u0629",
    assignDetails:"\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062a\u062e\u0635\u064a\u0635",
    driver:"\u0627\u0644\u0633\u0627\u0626\u0642", vehicle:"\u0627\u0644\u0645\u0631\u0643\u0628\u0629",
    city:"\u0645\u062f\u064a\u0646\u0629 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    storage:"\u0638\u0631\u0648\u0641 \u0627\u0644\u062a\u062e\u0632\u064a\u0646",
    deliveryType:"\u0646\u0648\u0639 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    inCity:"\u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    outCity:"\u062e\u0627\u0631\u062c \u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    assignBtn:"\u062a\u062e\u0635\u064a\u0635 \u0625\u0644\u0649",
    noInvoices:"\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0648\u0627\u062a\u064a\u0631 \u0645\u0639\u0644\u0642\u0629",
    lowFuel:"\u0648\u0642\u0648\u062f \u0645\u0646\u062e\u0641\u0636",
    done:"\u062a\u0645 \u062a\u062e\u0635\u064a\u0635 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631"
  }
};

export default function Assign({ user, invoices, setInvoices, vehicles, lang }) {
  const [selected, setSelected] = useState([]);
  const [driver,   setDriver]   = useState("");
  const [vehicle,  setVehicle]  = useState("");
  const [city,     setCity]     = useState("");
  const [dtype,    setDtype]    = useState("");
  const [storage,  setStorage]  = useState("");
  const [done,     setDone]     = useState("");

  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const dc = user.dc || "Riyadh";

  const myInvoices = invoices.filter(i =>
    i.dc === dc && ["pending","outstanding"].includes(i.status)
  );
  const activeVehicles = vehicles
    .filter(v => v.dc === dc && v.status === "Active")
    .map(v => v.plate);

  const driverLoad = {};
  invoices.filter(i => i.dc === dc && i.status === "assigned").forEach(i => {
    if (i.driverId) driverLoad[i.driverId] = (driverLoad[i.driverId]||0)+1;
  });

  const selVehicle = vehicles.find(v => v.plate === vehicle);
  const storageOptions = STORAGE_CONDITIONS.map(s => s.name+" ("+s.range+")");

  function assign() {
    if (!driver||!vehicle||!city||!dtype||!storage||!selected.length) return;
    const driverUser = (DRIVERS_BY_DC[dc]||[]).find(d => d === driver);
    setInvoices(prev => prev.map(i => selected.includes(i.id) ? {
      ...i, status:"assigned",
      driverId: user.uid,
      driverName: driver,
      vehicle, city, dtype, storage,
      assignedAt: new Date().toLocaleString(),
      attempts: i.attempts||0
    } : i));
    setDone(selected.length+" "+t.done+" "+driver+"!");
    setSelected([]); setDriver(""); setVehicle(""); setCity(""); setDtype(""); setStorage("");
    setTimeout(()=>setDone(""),3000);
  }

  const canAssign = driver&&vehicle&&city&&dtype&&storage&&selected.length>0;
  const days = inv => Math.floor((new Date()-new Date(inv.date))/(1000*60*60*24));

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done && <SuccessMsg msg={done} />}

      <Card>
        <CardTitle>
          \ud83d\udccb {t.selectInv}
          {selected.length>0&&<span style={{ background:"#6366f1", color:"white", fontSize:12, borderRadius:99, padding:"2px 10px", marginLeft:8 }}>{selected.length} {t.selected}</span>}
        </CardTitle>
        {myInvoices.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noInvoices} — {dc} DC</div>}
        {myInvoices.map(inv => {
          const d = days(inv);
          return (
            <div key={inv.id}
              onClick={()=>setSelected(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])}
              style={{ display:"flex", alignItems:"center", gap:10, padding:12, border:`1px solid ${selected.includes(inv.id)?"#a5b4fc":"#f1f5f9"}`, background:selected.includes(inv.id)?"#eef2ff":"white", borderRadius:8, marginBottom:6, cursor:"pointer" }}>
              <span style={{ fontSize:20, color:"#6366f1" }}>{selected.includes(inv.id)?"\u2611":"\u2610"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</div>
                <div style={{ fontSize:13, color:"#0f172a" }}>{inv.customer}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{inv.date} | {inv.inst}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:d<=1?"#d1fae5":d<=3?"#fef3c7":"#fee2e2", color:d<=1?"#065f46":d<=3?"#92400e":"#991b1b" }}>{d}d</span>
                {inv.status==="outstanding"&&<div style={{ fontSize:11, color:"#f97316", fontWeight:600 }}>\u26a0\ufe0f {inv.attempts} attempt(s)</div>}
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <CardTitle>\u2699\ufe0f {t.assignDetails}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"0 12px" }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>\ud83d\udc64 {t.driver}</label>
            <select value={driver} onChange={e=>setDriver(e.target.value)}
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
              <option value="">Select driver...</option>
              {(DRIVERS_BY_DC[dc]||[]).map(d=>(
                <option key={d} value={d}>{d} {driverLoad[d]?"("+driverLoad[d]+" assigned)":"(free)"}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>\ud83d\ude97 {t.vehicle}</label>
            <select value={vehicle} onChange={e=>setVehicle(e.target.value)}
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
              <option value="">Select vehicle...</option>
              {activeVehicles.map(v=>{
                const vd=vehicles.find(x=>x.plate===v);
                const pct=vd?Math.round((vd.fuelLevel||0)/(vd.fuelCapacity||80)*100):0;
                return <option key={v} value={v}>{v} — {vd?.fuelLevel||0}L/{vd?.fuelCapacity||80}L ({pct}%)</option>;
              })}
            </select>
          </div>
          <Select label={"\ud83d\udccd "+t.city} value={city} onChange={setCity} options={CITIES} />
          <Select label={"\ud83c\udf21\ufe0f "+t.storage} value={storage} onChange={setStorage} options={storageOptions} />
        </div>

        {selVehicle && (
          <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:12 }}>
            \ud83d\ude97 <b>{selVehicle.plate}</b> — \u26fd Fuel: <b>{selVehicle.fuelLevel||0}L</b>/{selVehicle.fuelCapacity||80}L
            {(selVehicle.fuelLevel||0)<20&&<span style={{ color:"#ef4444", fontWeight:600 }}> \u26a0\ufe0f {t.lowFuel}</span>}
            {selVehicle.nextOilKM&&<span style={{ color:"#f59e0b", marginLeft:8 }}> | Next Oil: {selVehicle.nextOilKM} KM</span>}
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>{t.deliveryType}</label>
          <div style={{ display:"flex", gap:8 }}>
            {[["incity","\ud83c\udfd9\ufe0f "+t.inCity],["outcity","\ud83d\udee3\ufe0f "+t.outCity]].map(([v,l])=>(
              <button key={v} onClick={()=>setDtype(v)}
                style={{ flex:1, border:`2px solid ${dtype===v?"#6366f1":"#e2e8f0"}`, background:dtype===v?"#eef2ff":"white", borderRadius:8, padding:10, cursor:"pointer", fontSize:13, fontWeight:600, color:dtype===v?"#4338ca":"#64748b" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <Btn onClick={assign} disabled={!canAssign} style={{ width:"100%", padding:12, fontSize:14 }}>
          \ud83d\ude9a {t.assignBtn} {driver||"Driver"} ({selected.length})
        </Btn>
      </Card>
    </div>
  );
}
