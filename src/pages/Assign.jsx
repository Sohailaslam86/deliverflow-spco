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
    driver:"Driver", vehicle:"Vehicle", city:"Delivery City", storage:"Storage Condition",
    deliveryType:"Delivery Type", inCity:"In-City", outCity:"Out-City",
    assignBtn:"Assign to", noInvoices:"No pending invoices", lowFuel:"LOW FUEL",
    done:"invoice(s) assigned to"
  },
  ar: {
    selectInv:"اختر الفواتير", selected:"محددة", assignDetails:"تفاصيل التخصيص",
    driver:"السائق", vehicle:"المركبة", city:"مدينة التسليم", storage:"ظروف التخزين",
    deliveryType:"نوع التسليم", inCity:"داخل المدينة", outCity:"خارج المدينة",
    assignBtn:"تخصيص إلى", noInvoices:"لا توجد فواتير معلقة", lowFuel:"وقود منخفض",
    done:"تم تخصيص الفواتير"
  }
};

export default function Assign({ user, invoices, setInvoices, vehicles, lang }) {
  const [selected, setSelected] = useState([]);
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [city, setCity] = useState("");
  const [dtype, setDtype] = useState("");
  const [storage, setStorage] = useState("");
  const [done, setDone] = useState("");
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const dc = user.dc||"Riyadh";

  const myInvoices = invoices.filter(i=>i.dc===dc&&["pending","outstanding"].includes(i.status));
  const activeVehicles = vehicles.filter(v=>v.dc===dc&&v.status==="Active");
  const driverLoad = {};
  invoices.filter(i=>i.dc===dc&&i.status==="assigned").forEach(i=>{
    if(i.driverId) driverLoad[i.driverId]=(driverLoad[i.driverId]||0)+1;
  });
  const selVehicle = vehicles.find(v=>v.plate===vehicle);
  const storageOptions = STORAGE_CONDITIONS.map(s=>s.name+" ("+s.range+")");

  function assign() {
    if(!driver||!vehicle||!city||!dtype||!storage||!selected.length) return;
    setInvoices(prev=>prev.map(i=>selected.includes(i.id)?{...i,status:"assigned",driverId:user.uid,driverName:driver,vehicle,city,dtype,storage,assignedAt:new Date().toLocaleString(),attempts:i.attempts||0}:i));
    setDone(selected.length+" "+t.done+" "+driver+"!");
    setSelected([]); setDriver(""); setVehicle(""); setCity(""); setDtype(""); setStorage("");
    setTimeout(()=>setDone(""),3000);
  }

  const canAssign = driver&&vehicle&&city&&dtype&&storage&&selected.length>0;
  const days = inv => Math.floor((new Date()-new Date(inv.date))/(1000*60*60*24));

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <Card>
        <CardTitle>
          📋 {t.selectInv}
          {selected.length>0&&<span style={{ background:"#6366f1", color:"white", fontSize:12, borderRadius:99, padding:"2px 10px", marginLeft:8 }}>{selected.length} {t.selected}</span>}
        </CardTitle>
        {myInvoices.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noInvoices} — {dc} DC</div>}
        {myInvoices.map(inv=>{
          const d=days(inv);
          return (
            <div key={inv.id} onClick={()=>setSelected(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])}
              style={{ display:"flex", alignItems:"center", gap:10, padding:12, border:`1px solid ${selected.includes(inv.id)?"#a5b4fc":"#f1f5f9"}`, background:selected.includes(inv.id)?"#eef2ff":"white", borderRadius:8, marginBottom:6, cursor:"pointer" }}>
              <span style={{ fontSize:20, color:"#6366f1" }}>{selected.includes(inv.id)?"☑":"☐"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</div>
                <div style={{ fontSize:13, color:"#0f172a" }}>{inv.customer}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{inv.date} | {inv.inst}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:d<=1?"#d1fae5":d<=3?"#fef3c7":"#fee2e2", color:d<=1?"#065f46":d<=3?"#92400e":"#991b1b" }}>{d}d</span>
                {inv.status==="outstanding"&&<div style={{ fontSize:11, color:"#f97316", fontWeight:600 }}>⚠️ {inv.attempts} attempt(s)</div>}
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <CardTitle>⚙️ {t.assignDetails}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"0 12px" }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>👤 {t.driver}</label>
            <select value={driver} onChange={e=>setDriver(e.target.value)}
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
              <option value="">Select driver...</option>
              {(DRIVERS_BY_DC[dc]||[]).map(d=>(
                <option key={d} value={d}>{d} {driverLoad[d]?"("+driverLoad[d]+" assigned)":"(free)"}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>🚗 {t.vehicle}</label>
            <select value={vehicle} onChange={e=>setVehicle(e.target.value)}
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
              <option value="">Select vehicle...</option>
              {activeVehicles.map(v=>{
                const pct=Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100);
                return <option key={v.plate} value={v.plate}>{v.plate} — {v.fuelLevel||0}L/{v.fuelCapacity||80}L ({pct}%)</option>;
              })}
            </select>
          </div>
          <Select label={"📍 "+t.city} value={city} onChange={setCity} options={CITIES} />
          <Select label={"🌡️ "+t.storage} value={storage} onChange={setStorage} options={storageOptions} />
        </div>

        {selVehicle&&(
          <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:12 }}>
            🚗 <b>{selVehicle.plate}</b> — ⛽ Fuel: <b>{selVehicle.fuelLevel||0}L</b>/{selVehicle.fuelCapacity||80}L
            {(selVehicle.fuelLevel||0)<20&&<span style={{ color:"#ef4444", fontWeight:600 }}> ⚠️ {t.lowFuel}</span>}
            {selVehicle.nextOilKM&&<span style={{ color:"#f59e0b", marginLeft:8 }}>| Next Oil: {selVehicle.nextOilKM} KM</span>}
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>{t.deliveryType}</label>
          <div style={{ display:"flex", gap:8 }}>
            {[["incity","🏙️ "+t.inCity],["outcity","🛣️ "+t.outCity]].map(([v,l])=>(
              <button key={v} onClick={()=>setDtype(v)}
                style={{ flex:1, border:`2px solid ${dtype===v?"#6366f1":"#e2e8f0"}`, background:dtype===v?"#eef2ff":"white", borderRadius:8, padding:10, cursor:"pointer", fontSize:13, fontWeight:600, color:dtype===v?"#4338ca":"#64748b" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <Btn onClick={assign} disabled={!canAssign} style={{ width:"100%", padding:12, fontSize:14 }}>
          🚚 {t.assignBtn} {driver||"Driver"} ({selected.length})
        </Btn>
      </Card>
    </div>
  );
}
