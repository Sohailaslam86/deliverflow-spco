import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, TRIP_DESTINATIONS } from "../data/masterData.js";

const T = {
  en: {
    newTrip:"+ New Trip", cancel:"Cancel",
    outgoingTrips:"Outgoing Trips", incomingTrips:"📥 Incoming Trips",
    tripNo:"Trip Number", tripDate:"Trip Date", destination:"Destination *",
    driver:"Driver *", vehicle:"Vehicle *", storage:"Storage Condition",
    notes:"Notes", createBtn:"Create & Dispatch Trip",
    noTrips:"No trips yet", noIncoming:"No incoming trips",
    from:"From", to:"To", confirmReceipt:"✅ Confirm Receipt",
    dispatched:"Dispatched", received:"Received",
    pendingShipLabel:"Pending Shipment Invoices",
    selectAll:"Select All", clearAll:"Clear",
    tripCreated:"✅ Trip created and dispatched!",
    tripReceived:"✅ Trip received! Invoices moved to your queue.",
    printTrip:"🖨️ Print", loadingDrivers:"Loading drivers...",
    loadingVehicles:"Loading vehicles...", loading:"Loading...",
    assignedInv:"Assigned Invoices (Optional)",
    noHoldInv:"No pending shipment invoices for this route",
    invoiceCount:"invoices attached"
  },
  ar: {
    newTrip:"+ رحلة جديدة", cancel:"إلغاء",
    outgoingTrips:"الرحلات الصادرة", incomingTrips:"📥 الرحلات الواردة",
    tripNo:"رقم الرحلة", tripDate:"تاريخ الرحلة", destination:"الوجهة *",
    driver:"السائق *", vehicle:"المركبة *", storage:"ظروف التخزين",
    notes:"ملاحظات", createBtn:"إنشاء وإرسال الرحلة",
    noTrips:"لا توجد رحلات", noIncoming:"لا توجد رحلات واردة",
    from:"من", to:"إلى", confirmReceipt:"✅ تأكيد الاستلام",
    dispatched:"تم الإرسال", received:"تم الاستلام",
    pendingShipLabel:"فواتير الشحن المعلقة",
    selectAll:"تحديد الكل", clearAll:"إلغاء الكل",
    tripCreated:"✅ تم إنشاء وإرسال الرحلة!",
    tripReceived:"✅ تم استلام الرحلة!",
    printTrip:"🖨️ طباعة", loadingDrivers:"جاري تحميل السائقين...",
    loadingVehicles:"جاري تحميل المركبات...", loading:"جاري التحميل...",
    assignedInv:"الفواتير المخصصة (اختياري)",
    noHoldInv:"لا توجد فواتير شحن معلقة لهذا الطريق",
    invoiceCount:"فاتورة مرفقة"
  }
};

const STATUS_COLOR = { dispatched:"#7c3aed", received:"#065f46" };
const STATUS_BG = { dispatched:"#f5f3ff", received:"#d1fae5" };

function printTripReport(trip) {
  const content = `<html><head><style>
    body{font-family:Arial;padding:30px;}
    h1{color:#1A3A5C;border-bottom:3px solid #1A3A5C;padding-bottom:10px;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;}
    .label{font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:4px;}
    .value{font-size:15px;color:#1a1a1a;font-weight:600;}
    .sig{border:1px solid #e2e8f0;border-radius:8px;padding:20px;min-height:80px;margin-top:8px;}
    .footer{margin-top:30px;text-align:center;font-size:11px;color:#94a3b8;}
  </style></head><body>
  <h1>🚚 Trip Report — ${trip.tripNumber||trip.id}</h1>
  <div class="grid">
    <div><div class="label">Trip #</div><div class="value">${trip.tripNumber||trip.id}</div></div>
    <div><div class="label">Status</div><div class="value">${(trip.status||"").toUpperCase()}</div></div>
    <div><div class="label">From</div><div class="value">${trip.fromDC} Distribution Center</div></div>
    <div><div class="label">To</div><div class="value">${trip.toCityLabel||trip.toCity}</div></div>
    <div><div class="label">Date</div><div class="value">${trip.date}</div></div>
    <div><div class="label">Driver</div><div class="value">${trip.driver}</div></div>
    <div><div class="label">Vehicle</div><div class="value">${trip.vehicle}</div></div>
    <div><div class="label">Storage</div><div class="value">${trip.storage||"-"}</div></div>
    <div><div class="label">Invoices</div><div class="value">${(trip.invoiceIds||[]).length} attached</div></div>
  </div>
  ${trip.notes?`<div><div class="label">Notes</div><div class="value">${trip.notes}</div></div>`:""}
  <div style="margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:30px;">
    <div><div class="label">Dispatched By</div><div class="sig"></div><div style="font-size:12px;margin-top:6px;">${trip.createdBy||"-"} | ${trip.date}</div></div>
    <div><div class="label">Received By</div><div class="sig"></div><div style="font-size:12px;margin-top:6px;">${trip.receivedBy||"___________"}</div></div>
  </div>
  <div class="footer">Saudi Pharmaceutical Co. (SPCO) — DeliverFlow — ${new Date().getFullYear()}</div>
  </body></html>`;
  const w = window.open("","_blank");
  w.document.write(content); w.document.close();
  setTimeout(()=>w.print(), 500);
}

export default function Trips({ user, invoices, setInvoices, trips, setTrips, lang }) {
  const [tab, setTab] = useState("outgoing");
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState("");
  const [selInv, setSelInv] = useState([]);
  const [fsDrivers, setFsDrivers] = useState([]);
  const [fsVehicles, setFsVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    toCity:"", driver:"", vehicle:"",
    storage:"Ambient (15-25°C)", notes:"", tentativeDate:"",
    date: new Date().toISOString().split("T")[0]
  });

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const userDC = (user.dc && user.dc !== "Head Office") ? user.dc : "Riyadh";
  const canManage = user.role==="admin"||user.role==="manager";

  const tabs = [
    ["outgoing","🚚",t.outgoingTrips],
    ["incoming","📥",t.incomingTrips]
  ];

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Firestore se drivers load
      const uSnap = await getDocs(collection(db, "users"));
      const allUsers = uSnap.docs.map(d=>({uid:d.id,...d.data()}));
      setFsDrivers(allUsers.filter(u=>u.role==="driver"&&u.dc===userDC&&(u.status==="active"||u.status==="Active")));

      // Firestore se vehicles load
      const vSnap = await getDocs(collection(db, "vehicles"));
      const allVeh = vSnap.docs.map(d=>({id:d.id,...d.data()}));
      setFsVehicles(allVeh.filter(v=>v.dc===userDC&&v.status!=="Maintenance"));

      // Firestore se trips load
      const tSnap = await getDocs(collection(db, "trips"));
      setTrips(tSnap.docs.map(d=>({firestoreId:d.id,...d.data()})));
    } catch(e) { console.error("Trips load error:", e); }
    setLoading(false);
  }

  // Outgoing trips — is DC se bheje gaye
  const outgoingTrips = trips.filter(tr=>tr.fromDC===userDC);

  // Incoming trips — is DC ko aa rahe hain (status: dispatched)
  const incomingTrips = trips.filter(tr=>{
    if (tr.status==="received") return false;
    const destDC = tr.toCity?.startsWith("DC-") ? tr.toCity.replace("DC-","") : null;
    return destDC === userDC && tr.status === "dispatched";
  });

  // Trip number
  const tripNum = `TRIP-${new Date().getFullYear()}-${String(outgoingTrips.length+1).padStart(3,"0")}`;

  // Destination select hone par — hold_ship invoices dhundho
  const destDC = form.toCity?.startsWith("DC-") ? form.toCity.replace("DC-","") : null;

  // Assigned invoices in current DC
  const assignedInvs = invoices.filter(i=>i.dc===userDC&&i.uploadBatch&&i.status==="assigned");

  // Hold_ship invoices — Jeddah/Dammam ne mark kiya, origin: Riyadh (current DC)
  const transitInvs = destDC ? invoices.filter(i=>
    i.status==="hold_ship" &&
    (i.holdOrigin===userDC||i.originDC===userDC) &&
    i.dc===destDC
  ) : [];

  const selVehicle = fsVehicles.find(v=>v.plate===form.vehicle);
  const selDriver = fsDrivers.find(d=>d.name===form.driver);

  async function createTrip() {
    if (!form.toCity||!form.driver||!form.vehicle||!form.tentativeDate) { alert("Please fill all required fields including Tentative Completion Date"); return; }
    const dest = TRIP_DESTINATIONS?.find(d=>d.value===form.toCity);
    const newTrip = {
      tripNumber:tripNum,
      date:form.date,
      fromDC:userDC,
      toCity:form.toCity,
      toCityLabel:dest?.label||form.toCity,
      driver:form.driver,
      vehicle:form.vehicle,
      storage:form.storage,
      notes:form.notes,
      tentativeDate:form.tentativeDate||"",
      status:"dispatched",
      invoiceIds:selInv,
      createdBy:user.name,
      createdAt:new Date().toLocaleString(),
    };

    try {
      const docRef = await addDoc(collection(db,"trips"), newTrip);
      newTrip.firestoreId = docRef.id;

      // Invoices ko intransit mark karo
      for (const invId of selInv) {
        const inv = invoices.find(i=>(i.id===invId||i.firestoreId===invId));
        if (inv?.firestoreId) {
          try { await updateDoc(doc(db,"invoices",inv.firestoreId),{status:"intransit",tripId:tripNum}); } catch(e){console.error(e);}
        }
      }
      setInvoices(prev=>prev.map(i=>
        selInv.includes(i.id)||selInv.includes(i.firestoreId)
          ? {...i,status:"intransit",tripId:tripNum}
          : i
      ));

      setTrips(prev=>[...prev,newTrip]);
      setDone(t.tripCreated);
      setShowForm(false);
      setForm({toCity:"",driver:"",vehicle:"",storage:"Ambient (15-25°C)",notes:"",tentativeDate:"",date:new Date().toISOString().split("T")[0]});
      setSelInv([]);
    } catch(e) { setDone("❌ Error: "+e.message); }
  }

  async function receiveTrip(trip) {
    try {
      const updateData = {
        status:"received",
        receivedBy:user.name,
        receivedAt:new Date().toLocaleString()
      };

      // Trip update
      if (trip.firestoreId) {
        await updateDoc(doc(db,"trips",trip.firestoreId), updateData);
      }

      // Invoices update
      for (const invId of (trip.invoiceIds||[])) {
        const inv = invoices.find(i=>i.id===invId||i.firestoreId===invId);
        if (!inv) continue;

        let invUpdate = {};
        if (inv.status==="intransit") {
          // Normal assigned invoice — pending
          invUpdate = {status:"pending_trip",tripId:null};
        } else if (inv.status==="hold_ship") {
          // Transit invoice — DC change karo
          const destDC = trip.toCity?.startsWith("DC-") ? trip.toCity.replace("DC-","") : userDC;
          invUpdate = {
            status:"pending_trip",
            dc:destDC,
            city:destDC,
            holdType:null,
            holdOrigin:null,
            originDC:null,
            holdReason:null,
            tripId:null
          };
        }

        if (Object.keys(invUpdate).length>0 && inv.firestoreId) {
          try { await updateDoc(doc(db,"invoices",inv.firestoreId), invUpdate); } catch(e){console.error(e);}
        }
      }

      setInvoices(prev=>prev.map(i=>{
        if (!(trip.invoiceIds||[]).includes(i.id)&&!(trip.invoiceIds||[]).includes(i.firestoreId)) return i;
        const destDC = trip.toCity?.startsWith("DC-") ? trip.toCity.replace("DC-","") : userDC;
        if (i.status==="intransit") return {...i,status:"pending_trip",tripId:null};
        if (i.status==="hold_ship") return {...i,status:"pending_trip",dc:destDC,city:destDC,holdType:null,holdOrigin:null,originDC:null,holdReason:null,tripId:null};
        return i;
      }));

      setTrips(prev=>prev.map(tr=>tr.firestoreId===trip.firestoreId?{...tr,...updateData}:tr));
      setDone(t.tripReceived);
    } catch(e) { setDone("❌ Error: "+e.message); }
  }

  function toggleInv(id) {
    setSelInv(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  }

  const storageOptions = STORAGE_CONDITIONS?.map(s=>s.name+" ("+s.range+")")||["Ambient (15-25°C)","Refrigerated (2-8°C)","Frozen (-20°C)"];

  return (
    <div style={{direction:rtl?"rtl":"ltr"}}>
      {done&&<SuccessMsg msg={done}/>}

      <TabBar tabs={tabs} active={tab} onChange={setTab}/>

      {/* ===== OUTGOING TRIPS ===== */}
      {tab==="outgoing"&&(
        <div>
          {canManage&&!showForm&&(
            <Btn onClick={()=>setShowForm(true)} style={{marginBottom:16,padding:"12px 24px",fontSize:15}}>
              🚀 {t.newTrip}
            </Btn>
          )}

          {/* New Trip Form */}
          {showForm&&(
            <Card style={{borderTop:"4px solid #10b981",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <CardTitle style={{margin:0}}>🚚 New Trip — {userDC} Distribution Center</CardTitle>
                <Btn small onClick={()=>setShowForm(false)} color="#64748b">{t.cancel}</Btn>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0 16px"}}>
                {/* Trip Number */}
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6}}>{t.tripNo}</label>
                  <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,color:"#64748b"}}>{tripNum}</div>
                </div>

                {/* Trip Date */}
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6}}>{t.tripDate}</label>
                  <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
                    style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
                </div>

                {/* Destination */}
                <div style={{gridColumn:"1/-1",marginBottom:14}}>
                  <label style={{display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6}}>{t.destination}</label>
                  <select value={form.toCity} onChange={e=>setForm({...form,toCity:e.target.value,})}
                    style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",background:"white",boxSizing:"border-box"}}>
                    <option value="">Select destination...</option>
                    <optgroup label="Distribution Centers">
                      {["Riyadh","Jeddah","Dammam"].filter(d=>d!==userDC).map(d=>(
                        <option key={"DC-"+d} value={"DC-"+d}>Distribution Center — {d}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Cities">
                      {["Riyadh","Jeddah","Dammam","Mecca","Medina","Taif","Abha","Tabuk"].filter(c=>c!==userDC).map(c=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Driver */}
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6}}>👤 {t.driver}</label>
                  {loading?(
                    <div style={{padding:"11px 14px",fontSize:14,color:"#94a3b8"}}>⏳ {t.loadingDrivers}</div>
                  ):fsDrivers.length===0?(
                    <div style={{padding:"11px 14px",fontSize:14,color:"#ef4444",background:"#fee2e2",borderRadius:8}}>
                      ⚠️ No drivers found for {userDC} DC
                    </div>
                  ):(
                    <select value={form.driver} onChange={e=>setForm({...form,driver:e.target.value})}
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",background:"white",boxSizing:"border-box"}}>
                      <option value="">Select driver...</option>
                      {fsDrivers.map(d=><option key={d.uid} value={d.name}>{d.name}</option>)}
                    </select>
                  )}
                </div>

                {/* Vehicle */}
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6}}>🚗 {t.vehicle}</label>
                  {loading?(
                    <div style={{padding:"11px 14px",fontSize:14,color:"#94a3b8"}}>⏳ {t.loadingVehicles}</div>
                  ):fsVehicles.length===0?(
                    <div style={{padding:"11px 14px",fontSize:14,color:"#ef4444",background:"#fee2e2",borderRadius:8}}>
                      ⚠️ No vehicles found for {userDC} DC
                    </div>
                  ):(
                    <select value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})}
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",background:"white",boxSizing:"border-box"}}>
                      <option value="">Select vehicle...</option>
                      {fsVehicles.map(v=>(
                        <option key={v.plate||v.id} value={v.plate}>
                          {v.plate} — {v.type} ({v.fuelLevel||0}L fuel)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Storage */}
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6}}>🌡️ {t.storage}</label>
                  <select value={form.storage} onChange={e=>setForm({...form,storage:e.target.value})}
                    style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",background:"white",boxSizing:"border-box"}}>
                    {storageOptions.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Notes */}
                <div style={{gridColumn:"1/-1",marginBottom:14}}>
                  <label style={{display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6}}>📝 {t.notes}</label>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:6}}>
                      📅 Tentative Completion Date * <span style={{color:"#ef4444"}}>*</span>
                    </label>
                    <input type="date" value={form.tentativeDate} onChange={e=>setForm({...form,tentativeDate:e.target.value})}
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",boxSizing:"border-box"}} />
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Required for SLA tracking</div>
                  </div>
                  <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}
                    style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit"}}/>
                </div>
              </div>

              {/* Vehicle Detail */}
              {selVehicle&&(
                <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#0369a1",marginBottom:8}}>🚗 {selVehicle.plate} — {selVehicle.type}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,fontSize:14}}>
                    <div style={{background:"white",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
                      <div style={{fontSize:12,color:"#64748b"}}>⛽ Fuel</div>
                      <div style={{fontWeight:800,fontSize:18,color:(selVehicle.fuelLevel||0)<20?"#ef4444":"#10b981"}}>{selVehicle.fuelLevel||0}L</div>
                    </div>
                    <div style={{background:"white",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
                      <div style={{fontSize:12,color:"#64748b"}}>🛣️ KM</div>
                      <div style={{fontWeight:800,fontSize:18,color:"#6366f1"}}>{(selVehicle.totalKM||0).toLocaleString()}</div>
                    </div>
                    <div style={{background:"white",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
                      <div style={{fontSize:12,color:"#64748b"}}>📊 km/L</div>
                      <div style={{fontWeight:800,fontSize:18,color:"#7c3aed"}}>{selVehicle.mileage||12}</div>
                    </div>
                  </div>
                  {(selVehicle.fuelLevel||0)<20&&(
                    <div style={{background:"#fee2e2",borderRadius:6,padding:"8px 12px",fontSize:13,color:"#991b1b",fontWeight:600,marginTop:8}}>⚠️ Low Fuel Warning!</div>
                  )}
                </div>
              )}

              {/* Driver Detail */}
              {selDriver&&(
                <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#065f46"}}>👤 {selDriver.name}</div>
                  <div style={{fontSize:13,color:"#64748b",marginTop:4}}>📱 {selDriver.mobile||"-"} | 📄 Lic exp: {selDriver.licExp||"-"}</div>
                </div>
              )}

              {/* Assigned Invoices — Optional */}
              {assignedInvs.length>0&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontWeight:600,fontSize:14,color:"#374151",marginBottom:8}}>📋 {t.assignedInv}</div>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <Btn small onClick={()=>setSelInv(assignedInvs.map(i=>i.id||i.firestoreId))} color="#6366f1">{t.selectAll}</Btn>
                    <Btn small onClick={()=>setSelInv([])} color="#64748b">{t.clearAll}</Btn>
                  </div>
                  {assignedInvs.map(inv=>{
                    const id=inv.id||inv.firestoreId;
                    return (
                      <div key={id} onClick={()=>toggleInv(id)}
                        style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",border:`1px solid ${selInv.includes(id)?"#6366f1":"#e2e8f0"}`,background:selInv.includes(id)?"#eef2ff":"white",borderRadius:8,cursor:"pointer",marginBottom:4}}>
                        <span style={{color:"#6366f1",fontSize:18}}>{selInv.includes(id)?"☑":"☐"}</span>
                        <span style={{fontWeight:600,fontSize:14}}>{inv.id}</span>
                        <span style={{fontSize:13,color:"#64748b",flex:1}}>{inv.customer}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Transit Invoices — hold_ship */}
              {destDC&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#7c3aed",marginBottom:8}}>
                    🚚 {t.pendingShipLabel} → {destDC} Distribution Center
                  </div>
                  {transitInvs.length===0?(
                    <div style={{background:"#f5f3ff",border:"1px solid #c4b5fd",borderRadius:8,padding:"12px 16px",fontSize:14,color:"#6b21a8"}}>
                      📭 {t.noHoldInv}
                    </div>
                  ):(
                    <div>
                      <div style={{background:"#f5f3ff",border:"1px solid #c4b5fd",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#6b21a8",marginBottom:10}}>
                        📌 These invoices are physically at {userDC} DC — marked by {destDC} DC Manager as "Pending Shipment"
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:8}}>
                        <Btn small onClick={()=>setSelInv(p=>[...new Set([...p,...transitInvs.map(i=>i.id||i.firestoreId)])])} color="#7c3aed">Select All Transit</Btn>
                      </div>
                      {transitInvs.map(inv=>{
                        const id=inv.id||inv.firestoreId;
                        return (
                          <div key={id} onClick={()=>toggleInv(id)}
                            style={{display:"flex",alignItems:"center",gap:8,padding:"12px 14px",border:`2px solid ${selInv.includes(id)?"#7c3aed":"#c4b5fd"}`,background:selInv.includes(id)?"#f5f3ff":"white",borderRadius:8,cursor:"pointer",marginBottom:6}}>
                            <span style={{color:"#7c3aed",fontSize:18}}>{selInv.includes(id)?"☑":"☐"}</span>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,fontSize:14,color:"#7c3aed"}}>{inv.id}</div>
                              <div style={{fontSize:13,color:"#64748b"}}>{inv.customer}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:12,color:"#7c3aed",fontWeight:600}}>→ {destDC} DC</div>
                              {inv.holdReason&&<div style={{fontSize:11,color:"#94a3b8"}}>{inv.holdReason}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <Btn onClick={createTrip} color="#10b981"
                style={{width:"100%",padding:14,fontSize:15}}
                disabled={!form.toCity||!form.driver||!form.vehicle||!form.tentativeDate}>
                🚀 {t.createBtn} {selInv.length>0?"("+selInv.length+" "+t.invoiceCount+")":""}
              </Btn>
            </Card>
          )}

          {/* Outgoing Trips List */}
          <Card>
            <CardTitle>📋 {t.outgoingTrips} ({outgoingTrips.length})</CardTitle>
            {loading&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>⏳ {t.loading}</div>}
            {!loading&&outgoingTrips.length===0&&<div style={{textAlign:"center",padding:24,color:"#94a3b8",fontSize:15}}>{t.noTrips}</div>}
            {[...outgoingTrips].reverse().map(trip=>(
              <div key={trip.firestoreId||trip.id} style={{border:"1px solid #e2e8f0",borderRadius:10,padding:16,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
                  <span style={{fontWeight:800,color:"#6366f1",fontSize:16}}>{trip.tripNumber||trip.id}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:600,padding:"4px 12px",borderRadius:99,background:STATUS_BG[trip.status]||"#f1f5f9",color:STATUS_COLOR[trip.status]||"#64748b"}}>
                      {trip.status==="dispatched"?"🚚 Dispatched":"✅ Received"}
                    </span>
                    <Btn small onClick={()=>printTripReport(trip)} color="#6366f1">{t.printTrip}</Btn>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,fontSize:14,color:"#374151",marginBottom:8}}>
                  <div>📦 <b>{t.from}:</b> {trip.fromDC} DC</div>
                  <div>📍 <b>{t.to}:</b> {trip.toCityLabel||trip.toCity}</div>
                  <div>👤 {trip.driver}</div>
                  <div>🚗 {trip.vehicle}</div>
                  <div>📅 {trip.date}</div>
                  {(trip.invoiceIds||[]).length>0&&<div>📋 {trip.invoiceIds.length} invoices</div>}
                </div>
                {trip.notes&&<div style={{fontSize:13,color:"#64748b",marginBottom:8}}>📝 {trip.notes}</div>}
                {trip.receivedBy&&<div style={{fontSize:13,color:"#10b981",fontWeight:600}}>✅ Received by: {trip.receivedBy} — {trip.receivedAt}</div>}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ===== INCOMING TRIPS ===== */}
      {tab==="incoming"&&(
        <div>
          <Card>
            <CardTitle>📥 {t.incomingTrips} — {userDC} Distribution Center</CardTitle>
            {loading&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>⏳ {t.loading}</div>}
            {!loading&&incomingTrips.length===0&&(
              <div style={{textAlign:"center",padding:32,color:"#94a3b8",fontSize:15}}>
                <div style={{fontSize:48,marginBottom:12}}>📭</div>
                {t.noIncoming}
              </div>
            )}
            {incomingTrips.map(trip=>{
              const tripInvoices = (trip.invoiceIds||[]).map(id=>invoices.find(i=>i.id===id||i.firestoreId===id)).filter(Boolean);
              return (
                <div key={trip.firestoreId||trip.id} style={{border:"2px solid #10b981",borderRadius:10,padding:16,marginBottom:12,background:"#f0fdf4"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                    <div>
                      <span style={{fontWeight:800,color:"#6366f1",fontSize:16}}>{trip.tripNumber||trip.id}</span>
                      <span style={{fontSize:13,color:"#64748b",marginLeft:8}}>🚚 Dispatched</span>
                    </div>
                    <Btn small onClick={()=>printTripReport(trip)} color="#6366f1">{t.printTrip}</Btn>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,fontSize:14,color:"#374151",marginBottom:12}}>
                    <div>📦 <b>{t.from}:</b> {trip.fromDC} Distribution Center</div>
                    <div>📍 <b>{t.to}:</b> {userDC} Distribution Center</div>
                    <div>👤 {trip.driver}</div>
                    <div>🚗 {trip.vehicle}</div>
                    <div>📅 {trip.date}</div>
                    <div>🌡️ {trip.storage}</div>
                    {tripInvoices.length>0&&<div>📋 {tripInvoices.length} invoices</div>}
                  </div>

                  {/* Invoices in this trip */}
                  {tripInvoices.length>0&&(
                    <div style={{marginBottom:12}}>
                      <div style={{fontWeight:600,fontSize:13,color:"#374151",marginBottom:8}}>📋 Invoices in this trip:</div>
                      {tripInvoices.map(inv=>(
                        <div key={inv.id||inv.firestoreId} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"white",borderRadius:6,marginBottom:4,border:"1px solid #e2e8f0"}}>
                          <span style={{fontWeight:700,fontSize:14,color:"#7c3aed"}}>{inv.id}</span>
                          <span style={{fontSize:13,color:"#64748b",flex:1}}>{inv.customer}</span>
                          <span style={{fontSize:12,fontWeight:600,padding:"2px 8px",borderRadius:99,background:inv.status==="hold_ship"?"#f5f3ff":"#dbeafe",color:inv.status==="hold_ship"?"#7c3aed":"#1e40af"}}>
                            {inv.status==="hold_ship"?"🚚 Transit":"📦 Assigned"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {trip.notes&&<div style={{fontSize:13,color:"#64748b",marginBottom:12}}>📝 {trip.notes}</div>}

                  {canManage&&(
                    <Btn onClick={()=>receiveTrip(trip)} color="#10b981" style={{width:"100%",padding:12,fontSize:15}}>
                      ✅ {t.confirmReceipt}
                    </Btn>
                  )}
                </div>
              );
            })}
          </Card>

          {/* Received trips history */}
          {trips.filter(tr=>{
            const destDC = tr.toCity?.startsWith("DC-") ? tr.toCity.replace("DC-","") : null;
            return destDC===userDC&&tr.status==="received";
          }).length>0&&(
            <Card>
              <CardTitle>✅ Recently Received</CardTitle>
              {trips.filter(tr=>{
                const destDC = tr.toCity?.startsWith("DC-") ? tr.toCity.replace("DC-","") : null;
                return destDC===userDC&&tr.status==="received";
              }).map(trip=>(
                <div key={trip.firestoreId||trip.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:14,color:"#6366f1"}}>{trip.tripNumber||trip.id}</span>
                  <span style={{fontSize:13,color:"#64748b",flex:1}}>From: {trip.fromDC} DC | {trip.date}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#10b981"}}>✅ Received by {trip.receivedBy}</span>
                  <Btn small onClick={()=>printTripReport(trip)} color="#6366f1">{t.printTrip}</Btn>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
