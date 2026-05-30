import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, StatCard, TabBar } from "../components/Shared.jsx";
import { DRIVERS_BY_DC, genId } from "../data/masterData.js";

export default function Fuel({ user, fuelLogs, setFuelLogs, vehicles, setVehicles }) {
  const [tab, setTab]     = useState("logs");
  const [showForm, setShowForm] = useState(false);
  const [done, setDone]   = useState("");
  const [form, setForm]   = useState({ date:new Date().toISOString().split("T")[0], vehicle:"", driver:"", liters:"", sar:"", tripKM:"" });

  const dc = user.dc||"Riyadh";
  const myLogs     = user.role==="admin" ? fuelLogs : fuelLogs.filter(l=>l.dc===dc);
  const myVehicles = user.role==="admin" ? vehicles : vehicles.filter(v=>v.dc===dc);

  const totLiters = myLogs.reduce((s,l)=>s+l.liters,0);
  const totSAR    = myLogs.reduce((s,l)=>s+l.sar,0);
  const totKM     = myLogs.reduce((s,l)=>s+l.tripKM,0);

  const tabs = [["logs","📋","Fuel Logs"],["efficiency","📊","Efficiency"],["trips","🛣️","Trip Records"]];

  function addLog() {
    if(!form.vehicle||!form.liters) return;
    const id = genId("FUEL");
    const newLog = { id, ...form, liters:Number(form.liters), sar:Number(form.sar), tripKM:Number(form.tripKM), dc };
    setFuelLogs(prev=>[...prev,newLog]);
    // Update vehicle fuel level
    setVehicles(prev=>prev.map(v=>v.plate===form.vehicle?{
      ...v,
      fuelLevel:Math.min((v.fuelLevel||0)+Number(form.liters), v.fuelCapacity||80),
      totalKM:(v.totalKM||0)+Number(form.tripKM)
    }:v));
    setDone(`Fuel log ${id} added!`);
    setShowForm(false); setForm({date:new Date().toISOString().split("T")[0],vehicle:"",driver:"",liters:"",sar:"",tripKM:""});
    setTimeout(()=>setDone(""),3000);
  }

  // Per vehicle efficiency
  const vEfficiency = myVehicles.map(v=>{
    const logs = myLogs.filter(l=>l.vehicle===v.plate);
    const tL   = logs.reduce((s,l)=>s+l.liters,0);
    const tKM  = logs.reduce((s,l)=>s+l.tripKM,0);
    const tSAR = logs.reduce((s,l)=>s+l.sar,0);
    const expectedFuel = tKM>0&&v.mileage ? (tKM/v.mileage).toFixed(1) : "-";
    const deviation    = tL>0&&expectedFuel!=="-" ? (tL-Number(expectedFuel)).toFixed(1) : null;
    return { plate:v.plate, type:v.type, dc:v.dc, tL, tKM, tSAR, efficiency:tL>0?(tKM/tL).toFixed(1):"-", expectedFuel, deviation };
  }).filter(v=>v.tL>0||v.tKM>0);

  return (
    <div>
      {done && <SuccessMsg msg={done} />}

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:16}}>
        <StatCard icon="⛽" label="Total Liters" value={totLiters+"L"}      color="#f59e0b" />
        <StatCard icon="💰" label="Total Cost"   value={"SAR "+totSAR}      color="#ef4444" />
        <StatCard icon="🛣️" label="Total KM"     value={totKM+" km"}        color="#6366f1" />
        <StatCard icon="📊" label="Avg Eff."     value={totKM&&totLiters?(totKM/totLiters).toFixed(1)+" km/L":"-"} color="#10b981" />
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        <Btn small onClick={()=>setShowForm(!showForm)}>⛽ Add Fuel Log</Btn>
      </div>

      {showForm && (
        <Card>
          <CardTitle>Add Fuel Fill Record</CardTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Input label="📅 Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date" />
            <Select label="🚗 Vehicle" value={form.vehicle} onChange={v=>setForm({...form,vehicle:v})} options={myVehicles.map(v=>v.plate)} required />
            <Select label="👤 Driver" value={form.driver} onChange={v=>setForm({...form,driver:v})} options={DRIVERS_BY_DC[dc]||[]} />
            <Input label="⛽ Liters Added" value={form.liters} onChange={v=>setForm({...form,liters:v})} type="number" placeholder="45" required />
            <Input label="💰 Cost (SAR)" value={form.sar} onChange={v=>setForm({...form,sar:v})} type="number" placeholder="90" />
            <Input label="🛣️ Trip KM" value={form.tripKM} onChange={v=>setForm({...form,tripKM:v})} type="number" placeholder="350" />
          </div>
          {form.liters&&form.tripKM&&<div style={{background:"#f0fdf4",padding:"8px 14px",borderRadius:8,fontSize:13,marginBottom:12}}>
            📊 Calculated efficiency: <b>{(Number(form.tripKM)/Number(form.liters)).toFixed(1)} km/L</b>
          </div>}
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={addLog} color="#10b981" disabled={!form.vehicle||!form.liters}>✅ Save</Btn>
            <Btn onClick={()=>setShowForm(false)} color="#64748b">Cancel</Btn>
          </div>
        </Card>
      )}

      {/* LOGS */}
      {tab==="logs" && (
        <Card>
          <CardTitle>📋 Fuel Fill Logs ({myLogs.length})</CardTitle>
          {myLogs.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No fuel logs yet</div>}
          {[...myLogs].reverse().map(log=>(
            <div key={log.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:"#6366f1",minWidth:90}}>{log.vehicle}</span>
              <span style={{fontSize:13,flex:1,minWidth:120}}>{log.driver||"—"}</span>
              <span style={{fontSize:13}}>⛽ {log.liters}L</span>
              <span style={{fontSize:13}}>💰 SAR {log.sar}</span>
              <span style={{fontSize:13}}>🛣️ {log.tripKM}km</span>
              <span style={{fontSize:13,fontWeight:700,color:"#10b981"}}>{log.liters>0?(log.tripKM/log.liters).toFixed(1):"-"} km/L</span>
              <span style={{fontSize:12,color:"#94a3b8"}}>📅 {log.date}</span>
            </div>
          ))}
        </Card>
      )}

      {/* EFFICIENCY */}
      {tab==="efficiency" && (
        <Card>
          <CardTitle>📊 Vehicle Fuel Efficiency & Fraud Detection</CardTitle>
          {vEfficiency.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No data yet</div>}
          {vEfficiency.map((v,i)=>(
            <div key={v.plate} style={{padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:6}}>
                <span style={{fontWeight:700,fontSize:14}}>{v.plate} <span style={{fontSize:12,color:"#64748b"}}>({v.type}) {v.dc} DC</span></span>
                <span style={{fontWeight:800,fontSize:16,color:Number(v.efficiency)>=10?"#10b981":Number(v.efficiency)>=7?"#f59e0b":"#ef4444"}}>{v.efficiency} km/L</span>
              </div>
              <div style={{display:"flex",gap:16,fontSize:13,color:"#64748b",flexWrap:"wrap",marginBottom:4}}>
                <span>⛽ Used: {v.tL}L</span>
                <span>🛣️ KM: {v.tKM}</span>
                <span>💰 Cost: SAR {v.tSAR}</span>
                <span>📊 Expected: {v.expectedFuel}L</span>
              </div>
              {v.deviation!==null && (
                <div style={{fontSize:12,fontWeight:600,color:Math.abs(Number(v.deviation))>5?"#ef4444":"#10b981"}}>
                  {Math.abs(Number(v.deviation))>5
                    ? `⚠️ Fuel discrepancy: ${v.deviation}L difference — REVIEW NEEDED`
                    : `✅ Fuel consumption within normal range (${v.deviation}L variance)`}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* TRIP RECORDS */}
      {tab==="trips" && (
        <Card>
          <CardTitle>🛣️ Trip Fuel Records by Vehicle</CardTitle>
          {myVehicles.map(v=>{
            const vLogs = myLogs.filter(l=>l.vehicle===v.plate);
            if(!vLogs.length) return null;
            return (
              <div key={v.plate} style={{marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:"#6366f1"}}>{v.plate} — Fuel: {v.fuelLevel||0}L / {v.fuelCapacity||80}L</div>
                {vLogs.map(log=>(
                  <div key={log.id} style={{fontSize:13,padding:"6px 0",borderBottom:"1px solid #f1f5f9",display:"flex",gap:12,flexWrap:"wrap"}}>
                    <span>📅 {log.date}</span>
                    <span>👤 {log.driver||"—"}</span>
                    <span>⛽ +{log.liters}L</span>
                    <span>🛣️ {log.tripKM}km</span>
                    <span style={{fontWeight:600,color:"#10b981"}}>{log.liters>0?(log.tripKM/log.liters).toFixed(1):"—"} km/L</span>
                  </div>
                ))}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
