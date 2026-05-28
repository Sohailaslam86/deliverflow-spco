import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg } from "../components/Shared.jsx";
import { DRIVERS_BY_DC, VEHICLES_BY_DC, STORAGE_CONDITIONS, CITIES, genId } from "../data/masterData.js";

const VEHICLES_BY_DC = {
  Riyadh:["Dyna 5784","BUS 2632","BUS 2630","BUS 2629","BUS 4295","Bus 4294","BUS 2631","Bus 2633","Dyna 5789","Dyna 5788"],
  Jeddah:["BUS 2631","Dyna 1217","Dyna 5787","Dyna 5786","BUS 2629","Dyna 5784","BUS 4472","BUS 2633","Dyna 5789"],
  Dammam:["BUS 4472","Dyna 5789","Dyna 5787"],
};

export default function Trips({ user, trips, setTrips, invoices, setInvoices }) {
  const [showForm, setShowForm] = useState(false);
  const [done, setDone]         = useState("");
  const [selInv, setSelInv]     = useState([]);
  const [form, setForm]         = useState({ date:new Date().toISOString().split("T")[0], toCity:"", driver:"", vehicle:"", storage:"Ambient (15-25°C)", notes:"" });

  const dc = user.dc||"Riyadh";
  const myTrips = user.role==="admin" ? trips : trips.filter(t=>t.fromDC===dc||t.toCity===dc);
  const availInv = invoices.filter(i=>i.dc===dc&&i.status==="pending");

  function createTrip() {
    if(!form.toCity||!form.driver||!form.vehicle) return;
    const id = genId("TRIP");
    const newTrip = { id, date:form.date, fromDC:dc, toCity:form.toCity, driver:form.driver, vehicle:form.vehicle, storage:form.storage, status:"dispatched", invoiceIds:selInv, notes:form.notes, createdBy:user.name, createdAt:new Date().toLocaleString(), startKM:null, endKM:null };
    setTrips(prev=>[...prev,newTrip]);
    if(selInv.length>0) setInvoices(prev=>prev.map(i=>selInv.includes(i.id)?{...i,status:"intransit",assignedAt:new Date().toLocaleString()}:i));
    setDone(`Trip ${id} created and dispatched!`);
    setShowForm(false); setSelInv([]); setForm({date:new Date().toISOString().split("T")[0],toCity:"",driver:"",vehicle:"",storage:"Ambient (15-25°C)",notes:""});
    setTimeout(()=>setDone(""),4000);
  }

  function receiveTrip(tripId) {
    setTrips(prev=>prev.map(t=>t.id===tripId?{...t,status:"received",receivedBy:user.name,receivedAt:new Date().toLocaleString()}:t));
    const trip = trips.find(t=>t.id===tripId);
    if(trip?.invoiceIds?.length>0) setInvoices(prev=>prev.map(i=>trip.invoiceIds.includes(i.id)?{...i,status:"pending",dc:trip.toCity}:i));
    setDone("Trip received! Transit invoices added to your queue.");
    setTimeout(()=>setDone(""),3000);
  }

  const statusColor = { dispatched:"#8b5cf6", received:"#10b981", closed:"#64748b" };

  return (
    <div>
      {done && <SuccessMsg msg={done} />}
      {(user.role==="manager"||user.role==="admin") && (
        <Btn onClick={()=>setShowForm(!showForm)} style={{marginBottom:16}}>🔄 {showForm?"Cancel":"New Trip"}</Btn>
      )}

      {showForm && (
        <Card>
          <CardTitle>Create New Trip from {dc} DC</CardTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Input label="📅 Trip Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date" />
            <Select label="📍 Destination City" value={form.toCity} onChange={v=>setForm({...form,toCity:v})} options={CITIES.filter(c=>c!==dc)} required />
            <Select label="👤 Driver" value={form.driver} onChange={v=>setForm({...form,driver:v})} options={DRIVERS_BY_DC[dc]||[]} required />
            <Select label="🚗 Vehicle" value={form.vehicle} onChange={v=>setForm({...form,vehicle:v})} options={VEHICLES_BY_DC[dc]||[]} required />
            <Select label="🌡️ Storage" value={form.storage} onChange={v=>setForm({...form,storage:v})} options={STORAGE_CONDITIONS.map(s=>s.name+" ("+s.range+")")} />
            <Input label="📝 Notes" value={form.notes} onChange={v=>setForm({...form,notes:v})} />
          </div>
          {availInv.length>0 && (
            <div style={{marginTop:12}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:8}}>📋 Attach Transit Invoices (Optional)</div>
              {availInv.map(inv=>(
                <div key={inv.id} onClick={()=>setSelInv(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:`1px solid ${selInv.includes(inv.id)?"#a5b4fc":"#f1f5f9"}`,background:selInv.includes(inv.id)?"#eef2ff":"white",borderRadius:8,marginBottom:4,cursor:"pointer"}}>
                  <span style={{fontSize:18,color:"#6366f1"}}>{selInv.includes(inv.id)?"☑":"☐"}</span>
                  <span style={{fontWeight:700,fontSize:13,color:"#6366f1"}}>{inv.id}</span>
                  <span style={{fontSize:13}}>{inv.customer}</span>
                  <span style={{fontSize:12,color:"#64748b",marginLeft:"auto"}}>{inv.city}</span>
                </div>
              ))}
            </div>
          )}
          <Btn onClick={createTrip} color="#10b981" style={{marginTop:14,width:"100%"}}
            disabled={!form.toCity||!form.driver||!form.vehicle}>
            🚀 Create & Dispatch Trip {selInv.length>0&&`(${selInv.length} invoices attached)`}
          </Btn>
        </Card>
      )}

      <Card>
        <CardTitle>📋 All Trips ({myTrips.length})</CardTitle>
        {myTrips.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No trips yet</div>}
        {[...myTrips].reverse().map(trip=>(
          <div key={trip.id} style={{border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14,color:"#6366f1"}}>{trip.id}</span>
              <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:statusColor[trip.status]+"22",color:statusColor[trip.status]}}>{trip.status.toUpperCase()}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:6,fontSize:13,color:"#374151",marginBottom:8}}>
              <div>📦 <b>From:</b> {trip.fromDC} DC</div>
              <div>📍 <b>To:</b> {trip.toCity}</div>
              <div>👤 <b>Driver:</b> {trip.driver}</div>
              <div>🚗 <b>Vehicle:</b> {trip.vehicle}</div>
              <div>📅 <b>Date:</b> {trip.date}</div>
              <div>🌡️ <b>Storage:</b> {trip.storage}</div>
              {trip.invoiceIds?.length>0&&<div>📋 <b>Invoices:</b> {trip.invoiceIds.length}</div>}
              {trip.createdBy&&<div>👤 <b>Created by:</b> {trip.createdBy}</div>}
              {trip.receivedBy&&<div>✅ <b>Received by:</b> {trip.receivedBy}</div>}
              {trip.notes&&<div>📝 {trip.notes}</div>}
            </div>
            {/* Receive button for destination DC */}
            {trip.status==="dispatched" && user.dc && trip.toCity===user.dc && (
              <Btn small onClick={()=>receiveTrip(trip.id)} color="#10b981">✅ Confirm Receipt</Btn>
            )}
            {trip.status==="dispatched" && user.role==="admin" && (
              <Btn small onClick={()=>receiveTrip(trip.id)} color="#6366f1">✅ Mark as Received</Btn>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
