import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, DRIVERS_BY_DC, TRIP_DESTINATIONS } from "../data/masterData.js";

const VEHICLES_BY_DC = {
  Riyadh:["Dyna 5784","BUS 2632","BUS 2630","BUS 2629","BUS 4295","Bus 4294","BUS 2631","Bus 2633","Dyna 5789","Dyna 5788"],
  Jeddah:["BUS 2631","Dyna 1217","Dyna 5787","Dyna 5786","BUS 2629","Dyna 5784","BUS 4472","BUS 2633","Dyna 5789"],
  Dammam:["BUS 4472","Dyna 5789","Dyna 5787"],
};

const T = {
  en: {
    newTrip:"New Trip", cancel:"Cancel", allTrips:"All Trips",
    tripNo:"Trip Number", tripDate:"Trip Date", destination:"Destination",
    driver:"Driver", vehicle:"Vehicle", storage:"Storage Condition",
    notes:"Notes", attachInv:"Attach Transit Invoices (Optional)",
    createBtn:"Create & Dispatch Trip", noTrips:"No trips yet",
    from:"From:", to:"To:", confirmReceipt:"Confirm Receipt",
    dispatched:"Dispatched", received:"Received",
    pendingShipInv:"Pending Shipment Invoices for this route",
    selectAll:"Select All", clearAll:"Clear",
    tripCreated:"Trip created and dispatched!",
    tripReceived:"Trip received! Invoices added to your queue.",
    dcRiyadh:"Distribution Center - Riyadh",
    dcJeddah:"Distribution Center - Jeddah",
    dcDammam:"Distribution Center - Dammam",
    distCenters:"Distribution Centers", delivCities:"Delivery Cities",
    printTrip:"Print Trip Report"
  },
  ar: {
    newTrip:"رحلة جديدة", cancel:"إلغاء", allTrips:"جميع الرحلات",
    tripNo:"رقم الرحلة", tripDate:"تاريخ الرحلة", destination:"الوجهة",
    driver:"السائق", vehicle:"المركبة", storage:"ظروف التخزين",
    notes:"ملاحظات", attachInv:"إرفاق فواتير العبور (اختياري)",
    createBtn:"إنشاء وإرسال الرحلة", noTrips:"لا توجد رحلات",
    from:"من:", to:"إلى:", confirmReceipt:"تأكيد الاستلام",
    dispatched:"تم الإرسال", received:"تم الاستلام",
    pendingShipInv:"فواتير معلقة للشحن",
    selectAll:"تحديد الكل", clearAll:"إلغاء",
    tripCreated:"تم إنشاء وإرسال الرحلة!",
    tripReceived:"تم استلام الرحلة!",
    dcRiyadh:"مركز توزيع الرياض",
    dcJeddah:"مركز توزيع جدة",
    dcDammam:"مركز توزيع الدمام",
    distCenters:"مراكز التوزيع", delivCities:"مدن التسليم",
    printTrip:"طباعة تقرير الرحلة"
  }
};

function printTripReport(trip, t) {
  const content = `<html><head><style>
    body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a;}
    .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1A3A5C;padding-bottom:15px;margin-bottom:20px;}
    h1{color:#1A3A5C;margin:0;font-size:22px;}
    .logo{font-size:28px;}
    .section{margin-bottom:20px;}
    .label{font-weight:700;color:#64748b;font-size:12px;text-transform:uppercase;margin-bottom:4px;}
    .value{font-size:14px;color:#1a1a1a;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
    table{width:100%;border-collapse:collapse;margin-top:10px;}
    th{background:#1A3A5C;color:white;padding:8px 12px;text-align:left;font-size:12px;}
    td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;}
    .status{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;}
    .dispatched{background:#ede9fe;color:#6d28d9;}
    .received{background:#d1fae5;color:#065f46;}
    .footer{margin-top:30px;border-top:1px solid #e2e8f0;padding-top:15px;font-size:11px;color:#94a3b8;text-align:center;}
    .sig-box{border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-top:20px;min-height:80px;}
  </style></head><body>
  <div class="header">
    <div>
      <h1>🚚 DeliverFlow — Trip Report</h1>
      <div style="font-size:13px;color:#64748b;margin-top:4px;">Saudi Pharmaceutical Co. (SPCO)</div>
    </div>
    <div style="text-align:right;font-size:13px;color:#64748b;">
      <div>Generated: ${new Date().toLocaleString()}</div>
      <div>Trip #: <b>${trip.tripNumber||trip.id}</b></div>
    </div>
  </div>

  <div class="grid">
    <div><div class="label">Trip Number</div><div class="value">${trip.tripNumber||trip.id}</div></div>
    <div><div class="label">Status</div><div class="value"><span class="status ${trip.status}">${trip.status.toUpperCase()}</span></div></div>
    <div><div class="label">From</div><div class="value">📍 ${trip.fromDC} Distribution Center</div></div>
    <div><div class="label">To</div><div class="value">📍 ${trip.toCityLabel||trip.toCity}</div></div>
    <div><div class="label">Trip Date</div><div class="value">📅 ${trip.date}</div></div>
    <div><div class="label">Driver</div><div class="value">👤 ${trip.driver}</div></div>
    <div><div class="label">Vehicle</div><div class="value">🚗 ${trip.vehicle}</div></div>
    <div><div class="label">Storage</div><div class="value">🌡️ ${trip.storage||"-"}</div></div>
    <div><div class="label">Created By</div><div class="value">${trip.createdBy}</div></div>
    <div><div class="label">Created At</div><div class="value">${trip.createdAt}</div></div>
    ${trip.receivedBy?`<div><div class="label">Received By</div><div class="value">${trip.receivedBy}</div></div>`:""}
    ${trip.receivedAt?`<div><div class="label">Received At</div><div class="value">${trip.receivedAt}</div></div>`:""}
  </div>

  ${trip.notes?`<div class="section"><div class="label">Notes</div><div class="value">${trip.notes}</div></div>`:""}

  ${trip.invoiceIds&&trip.invoiceIds.length>0?`
  <div class="section">
    <div class="label">Transit Invoices (${trip.invoiceIds.length})</div>
    <table>
      <thead><tr><th>#</th><th>Invoice ID</th></tr></thead>
      <tbody>${trip.invoiceIds.map((id,i)=>`<tr><td>${i+1}</td><td>${id}</td></tr>`).join("")}</tbody>
    </table>
  </div>`:""}

  <div style="margin-top:30px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;">
      <div>
        <div class="label">Dispatched By (Signature)</div>
        <div class="sig-box"></div>
        <div style="font-size:12px;margin-top:8px;color:#64748b;">Name: ${trip.createdBy} | Date: ${trip.date}</div>
      </div>
      <div>
        <div class="label">Received By (Signature)</div>
        <div class="sig-box"></div>
        <div style="font-size:12px;margin-top:8px;color:#64748b;">Name: ${trip.receivedBy||"_____________"} | Date: ${trip.receivedAt||"_____________"}</div>
      </div>
    </div>
  </div>

  <div class="footer">DeliverFlow — Logistics & Delivery Management System | Saudi Pharmaceutical Co. (SPCO) | Internal Use Only</div>
  </body></html>`;
  const w = window.open("","_blank");
  w.document.write(content); w.document.close();
  setTimeout(()=>w.print(),500);
}

export default function Trips({ user, trips, setTrips, invoices, setInvoices, vehicles, users, lang }) {
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState("");
  const [selInv, setSelInv] = useState([]);
  const [form, setForm] = useState({
    tripNumber:"", date:new Date().toISOString().split("T")[0],
    toCity:"", driver:"", vehicle:"", storage:"Ambient (15-25°C)", notes:""
  });

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const dc = user.dc||"Riyadh";
  const isAdmin = user.role==="admin";

  const myTrips = isAdmin?trips:trips.filter(tr=>tr.fromDC===dc||tr.toCity==="DC-"+dc||tr.toCity===dc);

  const getPendingShipInvoices = (destDC) => {
    if (!destDC||!destDC.startsWith("DC-")) return [];
    const targetDC = destDC.replace("DC-","");
    return invoices.filter(i=>i.status==="hold_ship"&&i.dc===targetDC&&i.holdOrigin===dc);
  };

  const pendingShipInv = form.toCity?getPendingShipInvoices(form.toCity):[];
  const pendingForTrip = invoices.filter(i=>i.dc===dc&&i.status==="pending");

  function FuelBar({ level, capacity }) {
    const pct = Math.round((level||0)/(capacity||80)*100);
    const color = pct < 25 ? "#ef4444" : pct < 50 ? "#f59e0b" : "#10b981";
    return (
      <div style={{ background:"#e0f2fe", borderRadius:99, height:8, overflow:"hidden", flex:1 }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99 }} />
      </div>
    );
  }

  const selVehicleObj = vehicles ? vehicles.find(v=>v.plate===form.vehicle) : null;
  const selDriverObj = (users||[]).find(u=>u.name===form.driver&&u.role==="driver");

  function createTrip() {
    if (!form.toCity||!form.driver||!form.vehicle) return;
    const tripNum = form.tripNumber||"TRIP-"+new Date().getFullYear()+"-"+String(Math.floor(1000+Math.random()*9000));
    const dest = TRIP_DESTINATIONS.find(d=>d.value===form.toCity);
    const newTrip = {
      id:tripNum, tripNumber:tripNum, date:form.date, fromDC:dc,
      toCity:form.toCity, toCityLabel:dest?dest.label:form.toCity,
      driver:form.driver, vehicle:form.vehicle, storage:form.storage,
      status:"dispatched", invoiceIds:selInv, notes:form.notes,
      createdBy:user.name, createdAt:new Date().toLocaleString()
    };
    setTrips(prev=>[...prev,newTrip]);
    if (selInv.length>0) setInvoices(prev=>prev.map(i=>selInv.includes(i.id)?{...i,status:"intransit",tripId:tripNum}:i));
    setDone(t.tripCreated);
    setShowForm(false); setSelInv([]);
    setForm({tripNumber:"",date:new Date().toISOString().split("T")[0],toCity:"",driver:"",vehicle:"",storage:"Ambient (15-25°C)",notes:""});
    setTimeout(()=>setDone(""),4000);
  }

  function receiveTrip(tripId) {
    const trip = trips.find(tr=>tr.id===tripId);
    setTrips(prev=>prev.map(tr=>tr.id===tripId?{...tr,status:"received",receivedBy:user.name,receivedAt:new Date().toLocaleString()}:tr));
    if (trip&&trip.invoiceIds&&trip.invoiceIds.length>0) {
      setInvoices(prev=>prev.map(i=>trip.invoiceIds.includes(i.id)?{...i,status:"pending",holdType:null}:i));
    }
    setDone(t.tripReceived);
    setTimeout(()=>setDone(""),4000);
  }

  function canReceive(trip) {
    if (isAdmin) return false;
    if (trip.status!=="dispatched") return false;
    return trip.toCity==="DC-"+dc||trip.toCity===dc;
  }

  const statusColor = { dispatched:"#8b5cf6", received:"#10b981", closed:"#64748b" };
  const storageOptions = STORAGE_CONDITIONS.map(s=>s.name+" ("+s.range+")");
  const dcDestinations = [
    { label:t.dcRiyadh, value:"DC-Riyadh" },
    { label:t.dcJeddah, value:"DC-Jeddah" },
    { label:t.dcDammam, value:"DC-Dammam" },
  ].filter(d=>isAdmin||d.value!=="DC-"+dc);
  const cityDestinations = TRIP_DESTINATIONS.filter(d=>d.type==="city");

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      {(user.role==="manager"||isAdmin)&&(
        <Btn onClick={()=>setShowForm(!showForm)} style={{ marginBottom:16 }}>
          {showForm?t.cancel:"➕ "+t.newTrip}
        </Btn>
      )}

      {showForm&&(
        <Card>
          <CardTitle>🚚 {t.newTrip} — {dc} DC</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={t.tripNo} value={form.tripNumber} onChange={v=>setForm({...form,tripNumber:v})} placeholder="TRIP-2026-001 (manual)" />
            <Input label={t.tripDate} value={form.date} onChange={v=>setForm({...form,date:v})} type="date" />
            <div style={{ gridColumn:"1/-1", marginBottom:12 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>{t.destination} *</label>
              <select value={form.toCity} onChange={e=>setForm({...form,toCity:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
                <option value="">Select destination...</option>
                <optgroup label={t.distCenters}>
                  {dcDestinations.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
                <optgroup label={t.delivCities}>
                  {cityDestinations.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                </optgroup>
              </select>
            </div>
            <Select label={t.driver+" *"} value={form.driver} onChange={v=>setForm({...form,driver:v})} options={DRIVERS_BY_DC[dc]||[]} required />
            <Select label={t.vehicle+" *"} value={form.vehicle} onChange={v=>setForm({...form,vehicle:v})} options={VEHICLES_BY_DC[dc]||[]} required />
            <div style={{ gridColumn:"1/-1" }}>
              <Select label={t.storage} value={form.storage} onChange={v=>setForm({...form,storage:v})} options={storageOptions} />
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <Input label={t.notes} value={form.notes} onChange={v=>setForm({...form,notes:v})} />
            </div>
          </div>

          {/* Vehicle Detail Panel */}
          {selVehicleObj&&(
            <div style={{ background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:"14px 16px",marginBottom:12 }}>
              <div style={{ fontWeight:700,fontSize:13,color:"#0369a1",marginBottom:10 }}>🚗 {selVehicleObj.plate} — {selVehicleObj.type}</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:10 }}>
                <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4 }}>⛽ Fuel Available</div>
                  <div style={{ fontWeight:800,fontSize:18,color:(selVehicleObj.fuelLevel||0)/(selVehicleObj.fuelCapacity||80)<0.25?"#ef4444":"#10b981" }}>{selVehicleObj.fuelLevel||0}L</div>
                  <div style={{ fontSize:12,color:"#64748b",marginBottom:6 }}>{selVehicleObj.fuelLevel||0}/{selVehicleObj.fuelCapacity||80}L ({Math.round((selVehicleObj.fuelLevel||0)/(selVehicleObj.fuelCapacity||80)*100)}%)</div>
                  <FuelBar level={selVehicleObj.fuelLevel||0} capacity={selVehicleObj.fuelCapacity||80} />
                </div>
                <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4 }}>🛣️ Odometer</div>
                  <div style={{ fontWeight:800,fontSize:18,color:"#6366f1" }}>{(selVehicleObj.totalKM||0).toLocaleString()}</div>
                  <div style={{ fontSize:12,color:"#64748b" }}>km total</div>
                </div>
                <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4 }}>📍 Est. Coverage</div>
                  <div style={{ fontWeight:800,fontSize:18,color:"#0891b2" }}>~{Math.round((selVehicleObj.fuelLevel||0)*(selVehicleObj.mileage||12))}</div>
                  <div style={{ fontSize:12,color:"#64748b" }}>km on current fuel</div>
                </div>
                <div style={{ background:"white",borderRadius:8,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4 }}>📊 Efficiency</div>
                  <div style={{ fontWeight:800,fontSize:18,color:"#7c3aed" }}>{selVehicleObj.mileage||12}</div>
                  <div style={{ fontSize:12,color:"#64748b" }}>km / L</div>
                </div>
              </div>
              {selVehicleObj.status==="Maintenance"&&<div style={{ background:"#fee2e2",borderRadius:6,padding:"6px 10px",fontSize:12,color:"#991b1b",fontWeight:600 }}>🔴 Vehicle is under Maintenance</div>}
              {(selVehicleObj.fuelLevel||0)<20&&<div style={{ background:"#fee2e2",borderRadius:6,padding:"6px 10px",fontSize:12,color:"#991b1b",fontWeight:600,marginTop:4 }}>⚠️ Low Fuel Warning</div>}
            </div>
          )}

          {/* Driver Detail Panel */}
          {selDriverObj&&(
            <div style={{ background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"12px 16px",marginBottom:12 }}>
              <div style={{ fontWeight:700,fontSize:13,color:"#065f46",marginBottom:8 }}>👤 {selDriverObj.name} — {selDriverObj.dc} DC</div>
              <div style={{ display:"flex",gap:16,fontSize:13,flexWrap:"wrap" }}>
                <span style={{ color:"#065f46" }}>📱 {selDriverObj.phone||selDriverObj.mobile||"-"}</span>
                <span style={{ color:selDriverObj.status==="Active"?"#065f46":selDriverObj.status==="On Leave"?"#92400e":"#991b1b",fontWeight:600 }}>
                  {selDriverObj.status==="Active"?"✅ Active":selDriverObj.status==="On Leave"?"🏖️ On Leave":"❌ Inactive"}
                </span>
                {selDriverObj.licExp&&<span style={{ color:"#64748b" }}>📄 Lic Exp: {selDriverObj.licExp}</span>}
              </div>
              {selDriverObj.status==="On Leave"&&<div style={{ background:"#fef3c7",borderRadius:6,padding:"6px 10px",fontSize:12,color:"#92400e",fontWeight:600,marginTop:8 }}>⚠️ Driver is On Leave — consider another driver</div>}
              {selDriverObj.licExp&&Math.ceil((new Date(selDriverObj.licExp)-new Date())/(1000*60*60*24))<=30&&(
                <div style={{ background:"#fef3c7",borderRadius:6,padding:"6px 10px",fontSize:12,color:"#92400e",fontWeight:600,marginTop:4 }}>⚠️ License expiring: {selDriverObj.licExp}</div>
              )}
            </div>
          )}

          {pendingShipInv.length>0&&(
            <div style={{ marginBottom:12, background:"#f0f9ff", borderRadius:8, padding:12 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"#0369a1", marginBottom:8 }}>📦 {t.pendingShipInv} ({pendingShipInv.length})</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <Btn small onClick={()=>setSelInv(pendingShipInv.map(i=>i.id))} color="#0369a1">{t.selectAll}</Btn>
                <Btn small onClick={()=>setSelInv([])} color="#64748b">{t.clearAll}</Btn>
              </div>
              {pendingShipInv.map(inv=>(
                <div key={inv.id} onClick={()=>setSelInv(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", border:`1px solid ${selInv.includes(inv.id)?"#0369a1":"#e2e8f0"}`, background:selInv.includes(inv.id)?"#e0f2fe":"white", borderRadius:8, cursor:"pointer", marginBottom:4 }}>
                  <span style={{ color:"#0369a1" }}>{selInv.includes(inv.id)?"☑":"☐"}</span>
                  <span style={{ fontWeight:600, fontSize:13 }}>{inv.id}</span>
                  <span style={{ fontSize:12, color:"#64748b" }}>{inv.customer}</span>
                </div>
              ))}
            </div>
          )}

          {pendingForTrip.length>0&&(
            <div style={{ marginBottom:12 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"#374151", marginBottom:8 }}>📋 {t.attachInv}</div>
              {pendingForTrip.map(inv=>(
                <div key={inv.id} onClick={()=>setSelInv(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", border:`1px solid ${selInv.includes(inv.id)?"#6366f1":"#e2e8f0"}`, background:selInv.includes(inv.id)?"#eef2ff":"white", borderRadius:8, cursor:"pointer", marginBottom:4 }}>
                  <span style={{ color:"#6366f1" }}>{selInv.includes(inv.id)?"☑":"☐"}</span>
                  <span style={{ fontWeight:600, fontSize:13 }}>{inv.id}</span>
                  <span style={{ fontSize:12, color:"#64748b" }}>{inv.customer}</span>
                </div>
              ))}
            </div>
          )}

          <Btn onClick={createTrip} color="#10b981" style={{ width:"100%", padding:12 }} disabled={!form.toCity||!form.driver||!form.vehicle}>
            🚀 {t.createBtn}
          </Btn>
        </Card>
      )}

      <Card>
        <CardTitle>📋 {t.allTrips} ({myTrips.length})</CardTitle>
        {myTrips.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noTrips}</div>}
        {[...myTrips].reverse().map(trip=>(
          <div key={trip.id} style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:14, marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:6 }}>
              <span style={{ fontWeight:800, color:"#6366f1", fontSize:15 }}>{trip.tripNumber||trip.id}</span>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:(statusColor[trip.status]||"#64748b")+"22", color:statusColor[trip.status]||"#64748b" }}>
                  {trip.status==="dispatched"?t.dispatched:t.received}
                </span>
                <Btn small onClick={()=>printTripReport(trip,t)} color="#6366f1">🖨️ {t.printTrip}</Btn>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:6, fontSize:13, color:"#374151" }}>
              <div>📦 <b>{t.from}</b> {trip.fromDC} DC</div>
              <div>📍 <b>{t.to}</b> {trip.toCityLabel||trip.toCity}</div>
              <div>👤 <b>{t.driver}:</b> {trip.driver}</div>
              <div>🚗 <b>{t.vehicle}:</b> {trip.vehicle}</div>
              <div>📅 <b>{t.tripDate}:</b> {trip.date}</div>
              {trip.invoiceIds&&trip.invoiceIds.length>0&&<div>📋 Invoices: {trip.invoiceIds.length}</div>}
            </div>
            {trip.notes&&<div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>📝 {trip.notes}</div>}
            {trip.receivedBy&&<div style={{ fontSize:12, color:"#10b981", marginTop:4 }}>✅ Received by: {trip.receivedBy} — {trip.receivedAt}</div>}
            {canReceive(trip)&&(
              <Btn small onClick={()=>receiveTrip(trip.id)} color="#10b981" style={{ marginTop:8 }}>✅ {t.confirmReceipt}</Btn>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
