import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, TabBar, StatCard } from "../components/Shared.jsx";
import { MAINTENANCE_TYPES, DCS } from "../data/masterData.js";

export default function Fleet({ user, vehicles, setVehicles }) {
  const [tab, setTab]     = useState("overview");
  const [done, setDone]   = useState("");
  const [showMaint, setShowMaint] = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [maintForm, setMaintForm] = useState({ type:"Scheduled Service", startDate:"", returnDate:"", cost:"", notes:"" });
  const [addForm, setAddForm]     = useState({ plate:"", type:"Dyna", dc:"Riyadh", brand:"", model:"", chassis:"", year:"", fahas:"", istimara:"", insurance:"", fuelCapacity:80, mileage:12, nextOilKM:"", nextOilDate:"" });

  const dc = user.dc;
  const myVehicles = dc ? vehicles.filter(v=>v.dc===dc) : vehicles;
  const tabs = [["overview","🚗","Overview"],["maintenance","🔧","Maintenance"],["add","➕","Add Vehicle"]];

  function sendMaint(plate) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{
      ...v, status:"Maintenance",
      maintHistory:[...(v.maintHistory||[]),{...maintForm, date:new Date().toLocaleDateString(), addedBy:user.name}]
    }:v));
    setShowMaint(null); setDone(`${plate} sent to maintenance`);
    setTimeout(()=>setDone(""),3000);
  }

  function reactivate(plate) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,status:"Active"}:v));
    setDone(`${plate} reactivated`);
    setTimeout(()=>setDone(""),3000);
  }

  function addVehicle() {
    if(!addForm.plate||!addForm.dc) return;
    setVehicles(prev=>[...prev,{...addForm,status:"Active",fuelLevel:addForm.fuelCapacity,totalKM:0,maintHistory:[]}]);
    setDone(`Vehicle ${addForm.plate} added!`);
    setShowAdd(false);
    setAddForm({plate:"",type:"Dyna",dc:"Riyadh",brand:"",model:"",chassis:"",year:"",fahas:"",istimara:"",insurance:"",fuelCapacity:80,mileage:12,nextOilKM:"",nextOilDate:""});
    setTimeout(()=>setDone(""),3000);
  }

  const alerts = myVehicles.filter(v=>{
    if(!v.fahas) return false;
    const days = Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24));
    return days<=60;
  });

  return (
    <div>
      {done && <SuccessMsg msg={done} />}

      {/* Expiry Alerts */}
      {alerts.length>0 && (
        <Card style={{border:"1px solid #fbbf24",marginBottom:16}}>
          <CardTitle>⚠️ Expiry Alerts</CardTitle>
          {alerts.map(v=>{
            const days = Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24));
            return <div key={v.plate} style={{padding:"6px 0",borderBottom:"1px solid #f1f5f9",fontSize:13,color:days<0?"#991b1b":"#92400e"}}>
              🔔 {v.plate} — Fahas: {v.fahas} ({days<0?`${Math.abs(days)} days EXPIRED`:`${days} days left`})
            </div>;
          })}
        </Card>
      )}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* OVERVIEW */}
      {tab==="overview" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:16}}>
            <StatCard icon="🚗" label="Total"       value={myVehicles.length}                              color="#6366f1" />
            <StatCard icon="✅" label="Active"      value={myVehicles.filter(v=>v.status==="Active").length}  color="#10b981" />
            <StatCard icon="🔧" label="Maintenance" value={myVehicles.filter(v=>v.status==="Maintenance").length} color="#f59e0b" />
            <StatCard icon="⛽" label="Avg Fuel"    value={Math.round(myVehicles.reduce((s,v)=>s+(v.fuelLevel||0),0)/Math.max(myVehicles.length,1))+"L"} color="#0891b2" />
          </div>
          {["Riyadh","Jeddah","Dammam"].filter(d=>!dc||d===dc).map(d=>{
            const dv = myVehicles.filter(v=>v.dc===d);
            if(!dv.length) return null;
            return (
              <Card key={d}>
                <CardTitle>📍 {d} DC — {dv.length} Vehicles</CardTitle>
                {dv.map(v=>(
                  <div key={v.plate} style={{border:`1px solid ${v.status==="Maintenance"?"#fbbf24":"#e2e8f0"}`,borderRadius:8,padding:14,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:8}}>
                      <div>
                        <span style={{fontWeight:700,fontSize:15}}>{v.plate}</span>
                        <span style={{fontSize:13,color:"#64748b",marginLeft:8}}>({v.type}) {v.brand} {v.model}</span>
                      </div>
                      <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:v.status==="Maintenance"?"#fef3c7":"#d1fae5",color:v.status==="Maintenance"?"#92400e":"#065f46"}}>{v.status}</span>
                    </div>
                    {/* Fuel Bar */}
                    <div style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginBottom:4}}>
                        <span>⛽ Fuel Level: {v.fuelLevel||0}L / {v.fuelCapacity||80}L</span>
                        <span>{Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%</span>
                      </div>
                      <div style={{background:"#f1f5f9",borderRadius:99,height:8,overflow:"hidden"}}>
                        <div style={{width:`${Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%`,height:"100%",background:(v.fuelLevel||0)/(v.fuelCapacity||80)<0.25?"#ef4444":"#10b981",borderRadius:99}} />
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:4,fontSize:12,color:"#64748b",marginBottom:8}}>
                      <span>🛣️ Total KM: {(v.totalKM||0).toLocaleString()}</span>
                      <span>📊 Mileage: {v.mileage||12} km/L</span>
                      {v.fahas&&<span>🔧 Fahas: {v.fahas}</span>}
                      {v.nextOilKM&&<span>🔩 Next Oil: {v.nextOilKM} KM</span>}
                      {v.insurance&&<span>🛡️ Insurance: {v.insurance}</span>}
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {v.status==="Active" ? (
                        <Btn small onClick={()=>{setShowMaint(v.plate);setMaintForm({type:"Scheduled Service",startDate:"",returnDate:"",cost:"",notes:""});}} color="#f59e0b">🔧 Send to Maintenance</Btn>
                      ) : (
                        <Btn small onClick={()=>reactivate(v.plate)} color="#10b981">✅ Reactivate</Btn>
                      )}
                    </div>
                    {showMaint===v.plate && (
                      <div style={{marginTop:12,padding:12,background:"#f8fafc",borderRadius:8}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                          <Select label="Type" value={maintForm.type} onChange={val=>setMaintForm({...maintForm,type:val})} options={MAINTENANCE_TYPES} />
                          <Input label="Cost (SAR)" value={maintForm.cost} onChange={val=>setMaintForm({...maintForm,cost:val})} type="number" />
                          <Input label="Start Date" value={maintForm.startDate} onChange={val=>setMaintForm({...maintForm,startDate:val})} type="date" />
                          <Input label="Expected Return" value={maintForm.returnDate} onChange={val=>setMaintForm({...maintForm,returnDate:val})} type="date" />
                          <div style={{gridColumn:"1/-1"}}><Input label="Notes" value={maintForm.notes} onChange={val=>setMaintForm({...maintForm,notes:val})} /></div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <Btn small onClick={()=>sendMaint(v.plate)} color="#f59e0b">✅ Confirm</Btn>
                          <Btn small onClick={()=>setShowMaint(null)} color="#64748b">Cancel</Btn>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {/* MAINTENANCE LOG */}
      {tab==="maintenance" && (
        <Card>
          <CardTitle>🔧 Maintenance History</CardTitle>
          {myVehicles.filter(v=>(v.maintHistory||[]).length>0).map(v=>(
            <div key={v.plate} style={{marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>🚗 {v.plate} ({v.type})</div>
              {(v.maintHistory||[]).map((m,i)=>(
                <div key={i} style={{background:"#f8fafc",borderRadius:8,padding:"10px 14px",marginBottom:6,fontSize:13}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                    <span style={{fontWeight:600}}>🔧 {m.type}</span>
                    <span style={{color:"#64748b"}}>📅 {m.date}</span>
                  </div>
                  <div style={{color:"#64748b",marginTop:2}}>
                    {m.startDate&&<span>Start: {m.startDate} </span>}
                    {m.returnDate&&<span>| Return: {m.returnDate} </span>}
                    {m.cost&&<span>| Cost: SAR {m.cost}</span>}
                  </div>
                  {m.notes&&<div style={{color:"#374151",marginTop:2}}>📝 {m.notes}</div>}
                  {m.addedBy&&<div style={{color:"#94a3b8",fontSize:11,marginTop:2}}>By: {m.addedBy}</div>}
                </div>
              ))}
            </div>
          ))}
          {myVehicles.filter(v=>(v.maintHistory||[]).length>0).length===0 && (
            <div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No maintenance history yet</div>
          )}
        </Card>
      )}

      {/* ADD VEHICLE */}
      {tab==="add" && (
        <Card>
          <CardTitle>➕ Add New Vehicle</CardTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Input label="Plate Number *" value={addForm.plate} onChange={v=>setAddForm({...addForm,plate:v})} placeholder="ABC-1234" required />
            <Select label="Type *" value={addForm.type} onChange={v=>setAddForm({...addForm,type:v})} options={["Dyna","Bus"]} required />
            <Select label="Home DC *" value={addForm.dc} onChange={v=>setAddForm({...addForm,dc:v})} options={DCS} required />
            <Input label="Brand" value={addForm.brand} onChange={v=>setAddForm({...addForm,brand:v})} placeholder="Toyota" />
            <Input label="Model" value={addForm.model} onChange={v=>setAddForm({...addForm,model:v})} placeholder="Dyna 300" />
            <Input label="Chassis Number" value={addForm.chassis} onChange={v=>setAddForm({...addForm,chassis:v})} />
            <Input label="Year" value={addForm.year} onChange={v=>setAddForm({...addForm,year:v})} type="number" />
            <Input label="Fuel Capacity (L)" value={addForm.fuelCapacity} onChange={v=>setAddForm({...addForm,fuelCapacity:Number(v)})} type="number" />
            <Input label="Mileage (km/L)" value={addForm.mileage} onChange={v=>setAddForm({...addForm,mileage:Number(v)})} type="number" />
            <Input label="Fahas Expiry" value={addForm.fahas} onChange={v=>setAddForm({...addForm,fahas:v})} type="date" />
            <Input label="Istimara Expiry" value={addForm.istimara} onChange={v=>setAddForm({...addForm,istimara:v})} type="date" />
            <Input label="Insurance Expiry" value={addForm.insurance} onChange={v=>setAddForm({...addForm,insurance:v})} type="date" />
            <Input label="Next Oil Change KM" value={addForm.nextOilKM} onChange={v=>setAddForm({...addForm,nextOilKM:v})} type="number" placeholder="5000" />
            <Input label="Next Oil Change Date" value={addForm.nextOilDate} onChange={v=>setAddForm({...addForm,nextOilDate:v})} type="date" />
          </div>
          <Btn onClick={addVehicle} color="#10b981" style={{width:"100%",marginTop:8}}>✅ Add Vehicle</Btn>
        </Card>
      )}
    </div>
  );
}
