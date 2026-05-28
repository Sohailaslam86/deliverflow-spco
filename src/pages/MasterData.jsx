import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, CITIES, DCS, DC_GPS } from "../data/masterData.js";

export default function MasterData({ vehicles, setVehicles }) {
  const [tab, setTab]   = useState("vehicles");
  const [done, setDone] = useState("");
  const tabs = [["vehicles","🚗","Vehicles"],["dcs","📍","DC Locations"],["storage","🌡️","Storage Conditions"],["cities","🌆","Cities"]];

  return (
    <div>
      {done&&<SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab==="vehicles"&&<VehiclesTab vehicles={vehicles} setVehicles={setVehicles} setDone={setDone} />}
      {tab==="dcs"&&<DCsTab />}
      {tab==="storage"&&<StorageTab />}
      {tab==="cities"&&<CitiesTab />}
    </div>
  );
}

function VehiclesTab({ vehicles, setVehicles, setDone }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState({plate:"",type:"Dyna",dc:"Riyadh",brand:"",model:"",chassis:"",year:"",fahas:"",istimara:"",insurance:"",fuelCapacity:80,mileage:12,nextOilKM:"",nextOilDate:""});

  function add() {
    if(!f.plate) return;
    setVehicles(prev=>[...prev,{...f,status:"Active",fuelLevel:f.fuelCapacity,totalKM:0,maintHistory:[]}]);
    setDone(`Vehicle ${f.plate} added!`); setShowAdd(false);
    setF({plate:"",type:"Dyna",dc:"Riyadh",brand:"",model:"",chassis:"",year:"",fahas:"",istimara:"",insurance:"",fuelCapacity:80,mileage:12,nextOilKM:"",nextOilDate:""});
    setTimeout(()=>setDone(""),3000);
  }

  function toggleDC(plate, dc) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,dc}:v));
    setDone(`${plate} transferred to ${dc} DC`);
    setTimeout(()=>setDone(""),3000);
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,color:"#64748b"}}>{vehicles.length} vehicles registered</div>
        <Btn small onClick={()=>setShowAdd(!showAdd)}>🚗 Add Vehicle</Btn>
      </div>
      {showAdd&&(
        <Card>
          <CardTitle>Add New Vehicle</CardTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Input label="Plate Number *" value={f.plate} onChange={v=>setF({...f,plate:v})} required />
            <Select label="Type *" value={f.type} onChange={v=>setF({...f,type:v})} options={["Dyna","Bus"]} required />
            <Select label="Home DC *" value={f.dc} onChange={v=>setF({...f,dc:v})} options={DCS} required />
            <Input label="Brand" value={f.brand} onChange={v=>setF({...f,brand:v})} placeholder="Toyota" />
            <Input label="Model" value={f.model} onChange={v=>setF({...f,model:v})} placeholder="Dyna 300" />
            <Input label="Chassis" value={f.chassis} onChange={v=>setF({...f,chassis:v})} />
            <Input label="Year" value={f.year} onChange={v=>setF({...f,year:v})} type="number" />
            <Input label="Fuel Capacity (L)" value={f.fuelCapacity} onChange={v=>setF({...f,fuelCapacity:Number(v)})} type="number" />
            <Input label="Mileage (km/L)" value={f.mileage} onChange={v=>setF({...f,mileage:Number(v)})} type="number" />
            <Input label="Fahas Expiry" value={f.fahas} onChange={v=>setF({...f,fahas:v})} type="date" />
            <Input label="Istimara Expiry" value={f.istimara} onChange={v=>setF({...f,istimara:v})} type="date" />
            <Input label="Insurance Expiry" value={f.insurance} onChange={v=>setF({...f,insurance:v})} type="date" />
            <Input label="Next Oil KM" value={f.nextOilKM} onChange={v=>setF({...f,nextOilKM:v})} type="number" />
            <Input label="Next Oil Date" value={f.nextOilDate} onChange={v=>setF({...f,nextOilDate:v})} type="date" />
          </div>
          <Btn onClick={add} color="#10b981" style={{width:"100%",marginTop:8}}>✅ Add Vehicle</Btn>
        </Card>
      )}
      {DCS.map(dc=>{
        const dv=vehicles.filter(v=>v.dc===dc);
        if(!dv.length) return null;
        return (
          <Card key={dc}>
            <CardTitle>📍 {dc} DC — {dv.length} Vehicles</CardTitle>
            {dv.map(v=>(
              <div key={v.plate} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{v.plate} <span style={{fontSize:12,color:"#64748b"}}>({v.type}) {v.brand} {v.model}</span></div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>Fahas:{v.fahas||"—"} | Istimara:{v.istimara||"—"} | Insurance:{v.insurance||"—"}</div>
                </div>
                <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:v.status==="Maintenance"?"#fef3c7":"#d1fae5",color:v.status==="Maintenance"?"#92400e":"#065f46"}}>{v.status}</span>
                <select value={v.dc} onChange={e=>toggleDC(v.plate,e.target.value)}
                  style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 8px",fontSize:12,cursor:"pointer"}}>
                  {DCS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

function DCsTab() {
  const dcs = [
    {dc:"Riyadh DC",city:"Riyadh",lat:"24.7136",lng:"46.6753",manager:"AlWaleed Qahtani"},
    {dc:"Jeddah DC",city:"Jeddah",lat:"21.4858",lng:"39.1925",manager:"Muhammad Anas"},
    {dc:"Dammam DC",city:"Dammam",lat:"26.4207",lng:"50.0888",manager:"Muhammad Saleh"},
  ];
  return (
    <Card>
      <CardTitle>📍 Distribution Center Locations</CardTitle>
      {dcs.map(d=>(
        <div key={d.dc} style={{border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>📍 {d.dc}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:6,fontSize:13,color:"#374151"}}>
            <div><b>City:</b> {d.city}</div>
            <div><b>Manager:</b> {d.manager}</div>
            <div><b>GPS Lat:</b> {d.lat}</div>
            <div><b>GPS Lng:</b> {d.lng}</div>
          </div>
          <a href={`https://maps.google.com/?q=${d.lat},${d.lng}`} target="_blank" rel="noreferrer"
            style={{display:"inline-block",marginTop:8,fontSize:12,color:"#6366f1",fontWeight:600}}>📍 View on Map →</a>
        </div>
      ))}
    </Card>
  );
}

function StorageTab() {
  return (
    <Card>
      <CardTitle>🌡️ Storage Conditions</CardTitle>
      {STORAGE_CONDITIONS.map(s=>(
        <div key={s.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:s.color,flexShrink:0}} />
          <div>
            <div style={{fontWeight:600,fontSize:14}}>{s.name} <span style={{fontSize:13,color:"#64748b",fontWeight:400}}>({s.range})</span></div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function CitiesTab() {
  return (
    <Card>
      <CardTitle>🌆 Delivery Cities</CardTitle>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {CITIES.map(c=><span key={c} style={{background:"#f1f5f9",borderRadius:8,padding:"8px 16px",fontSize:14,fontWeight:600,color:"#374151"}}>📍 {c}</span>)}
      </div>
      <p style={{fontSize:13,color:"#94a3b8",marginTop:12}}>Contact admin to add new delivery cities.</p>
    </Card>
  );
}
