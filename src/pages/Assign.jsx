import { useState } from "react";
import { Card, CardTitle, Btn, Select, SuccessMsg } from "../components/Shared.jsx";
import { DRIVERS_BY_DC, STORAGE_CONDITIONS, CITIES, STATUS_STYLES } from "../data/masterData.js";

const VEHICLES_BY_DC = {
  Riyadh:["Dyna 5784","BUS 2632","BUS 2630","BUS 2629","BUS 4295","Bus 4294","BUS 2631","Bus 2633","Dyna 5789","Dyna 5788"],
  Jeddah:["BUS 2631","Dyna 1217","Dyna 5787","Dyna 5786","BUS 2629","Dyna 5784","BUS 4472","BUS 2633","Dyna 5789"],
  Dammam:["BUS 4472","Dyna 5789","Dyna 5787"],
};

export default function Assign({ user, invoices, setInvoices, vehicles }) {
  const [selected, setSelected] = useState([]);
  const [driver,   setDriver]   = useState("");
  const [vehicle,  setVehicle]  = useState("");
  const [city,     setCity]     = useState("");
  const [dtype,    setDtype]    = useState("");
  const [storage,  setStorage]  = useState("");
  const [done,     setDone]     = useState("");

  const dc = user.dc||"Riyadh";
  const myInvoices = invoices.filter(i=>i.dc===dc&&["pending","outstanding"].includes(i.status));
  const activeVehicles = vehicles.filter(v=>v.dc===dc&&v.status==="Active").map(v=>v.plate);

  // Driver workload
  const driverLoad = {};
  invoices.filter(i=>i.dc===dc&&i.status==="assigned").forEach(i=>{
    if(i.driverId) driverLoad[i.driverId]=(driverLoad[i.driverId]||0)+1;
  });

  // Selected vehicle fuel
  const selVehicle = vehicles.find(v=>v.plate===vehicle);

  function assign() {
    if(!driver||!vehicle||!city||!dtype||!storage||!selected.length) return;
    setInvoices(prev=>prev.map(i=>selected.includes(i.id)?{
      ...i, status:"assigned", driverId:user.uid,
      vehicle, city, dtype, storage,
      assignedAt:new Date().toLocaleString(),
      attempts:(i.attempts||0)
    }:i));
    setDone(`${selected.length} invoice(s) assigned to ${driver}!`);
    setSelected([]); setDriver(""); setVehicle(""); setCity(""); setDtype(""); setStorage("");
    setTimeout(()=>setDone(""),3000);
  }

  const canAssign = driver&&vehicle&&city&&dtype&&storage&&selected.length>0;

  return (
    <div>
      {done && <SuccessMsg msg={done} />}

      {/* Invoice Selection */}
      <Card>
        <CardTitle>
          📋 Select Invoices
          {selected.length>0&&<span style={{background:"#6366f1",color:"white",fontSize:12,borderRadius:99,padding:"2px 10px",marginLeft:8}}>{selected.length} selected</span>}
        </CardTitle>
        {myInvoices.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No pending invoices for {dc} DC</div>}
        {myInvoices.map(inv=>{
          const days = Math.floor((new Date()-new Date(inv.date))/(1000*60*60*24));
          return (
            <div key={inv.id}
              onClick={()=>setSelected(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])}
              style={{display:"flex",alignItems:"center",gap:10,padding:12,border:`1px solid ${selected.includes(inv.id)?"#a5b4fc":"#f1f5f9"}`,background:selected.includes(inv.id)?"#eef2ff":"white",borderRadius:8,marginBottom:6,cursor:"pointer"}}>
              <span style={{fontSize:20,color:"#6366f1"}}>{selected.includes(inv.id)?"☑":"☐"}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:"#6366f1"}}>{inv.id}</div>
                <div style={{fontSize:13,color:"#0f172a"}}>{inv.customer}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{inv.date} | {inv.inst}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:days<=1?"#d1fae5":days<=3?"#fef3c7":"#fee2e2",color:days<=1?"#065f46":days<=3?"#92400e":"#991b1b"}}>{days}d</span>
                {inv.status==="outstanding"&&<div style={{fontSize:11,color:"#f97316",fontWeight:600}}>⚠️ {inv.attempts} attempt(s)</div>}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Assignment Details */}
      <Card>
        <CardTitle>⚙️ Assignment Details</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0 12px"}}>
          <div>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:5}}>👤 Driver</label>
            <select value={driver} onChange={e=>setDriver(e.target.value)}
              style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box",marginBottom:12}}>
              <option value="">Select driver...</option>
              {(DRIVERS_BY_DC[dc]||[]).map(d=>(
                <option key={d} value={d}>{d} {driverLoad[d]?`(${driverLoad[d]} assigned)`:"(free)"}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:5}}>🚗 Vehicle</label>
            <select value={vehicle} onChange={e=>setVehicle(e.target.value)}
              style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box",marginBottom:12}}>
              <option value="">Select vehicle...</option>
              {activeVehicles.map(v=>{
                const vd = vehicles.find(x=>x.plate===v);
                return <option key={v} value={v}>{v} — Fuel: {vd?.fuelLevel||0}L/{vd?.fuelCapacity||80}L</option>;
              })}
            </select>
          </div>
          <Select label="📍 Delivery City" value={city} onChange={setCity} options={CITIES} />
          <Select label="🌡️ Storage Condition" value={storage} onChange={setStorage}
            options={STORAGE_CONDITIONS.map(s=>`${s.name} (${s.range})`)} />
        </div>

        {/* Vehicle fuel status */}
        {selVehicle && (
          <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:12}}>
            🚗 <b>{selVehicle.plate}</b> — Fuel: <b>{selVehicle.fuelLevel||0}L</b> / {selVehicle.fuelCapacity||80}L
            {(selVehicle.fuelLevel||0)<20&&<span style={{color:"#ef4444",fontWeight:600}}> ⚠️ LOW FUEL</span>}
            {selVehicle.nextOilKM&&<span style={{color:"#f59e0b",marginLeft:8}}> | Next Oil: {selVehicle.nextOilKM} KM</span>}
          </div>
        )}

        {/* Delivery Type */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Delivery Type</label>
          <div style={{display:"flex",gap:8}}>
            {[["incity","🏙️ In-City"],["outcity","🛣️ Out-City"]].map(([v,l])=>(
              <button key={v} onClick={()=>setDtype(v)}
                style={{flex:1,border:`2px solid ${dtype===v?"#6366f1":"#e2e8f0"}`,background:dtype===v?"#eef2ff":"white",borderRadius:8,padding:10,cursor:"pointer",fontSize:13,fontWeight:600,color:dtype===v?"#4338ca":"#64748b"}}>{l}</button>
            ))}
          </div>
        </div>

        <Btn onClick={assign} disabled={!canAssign} style={{width:"100%",padding:12,fontSize:14}}>
          🚚 Assign {selected.length} Invoice(s) to {driver||"Driver"}
        </Btn>
      </Card>
    </div>
  );
}
