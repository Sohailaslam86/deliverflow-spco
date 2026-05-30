import { useState } from "react";
import { Card, CardTitle, Btn, SuccessMsg, Badge } from "../components/Shared.jsx";

const T = {
  en: {
    pending:"Pending Deliveries", completed:"Completed", remaining:"Remaining",
    inCity:"In-City", outCity:"Out-City", startDelivery:"Start Delivery",
    gpsStep:"Step 1: Get GPS Location (Required)",
    podStep:"Step 2: Take POD Photo (Required)",
    markDelivered:"Mark Delivered", markFailed:"Mark Failed", cancel:"Cancel",
    getGPS:"Get My Location", gettingGPS:"Getting location...",
    allDone:"All deliveries completed! Great work.",
    podRequired:"Please take POD photo first",
    vehicle:"Assigned Vehicle", vehicleAlerts:"Vehicle Alerts",
    maintenance:"Under Maintenance", lowFuel:"Low Fuel Warning",
    expirySoon:"Document Expiring Soon"
  },
  ar: {
    pending:"تسليمات معلقة", completed:"مكتملة", remaining:"المتبقي",
    inCity:"داخل المدينة", outCity:"خارج المدينة", startDelivery:"بدء التسليم",
    gpsStep:"الخطوة 1: تحديد الموقع (مطلوب)",
    podStep:"الخطوة 2: صورة إثبات التسليم (مطلوبة)",
    markDelivered:"تسليم ناجح", markFailed:"تسليم فاشل", cancel:"إلغاء",
    getGPS:"تحديد موقعي", gettingGPS:"جاري تحديد الموقع...",
    allDone:"تم إكمال جميع التسليمات! عمل رائع.",
    podRequired:"يرجى التقاط صورة إثبات التسليم أولاً",
    vehicle:"المركبة المخصصة", vehicleAlerts:"تنبيهات المركبة",
    maintenance:"تحت الصيانة", lowFuel:"تحذير: وقود منخفض",
    expirySoon:"وثيقة ستنتهي قريباً"
  }
};

export default function Driver({ user, invoices, setInvoices, vehicles, lang }) {
  const [active, setActive] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [gps, setGps] = useState(null);
  const [locating, setLocating] = useState(false);
  const [pod, setPod] = useState(null);
  const [done, setDone] = useState("");
  const rtl = lang==="ar";
  const t = T[lang]||T.en;

  const myInv = invoices.filter(i=>i.status==="assigned"&&i.driverId===user.uid);
  const pending = myInv.filter(i=>!completed.includes(i.id));
  const doneList = myInv.filter(i=>completed.includes(i.id));
  const inCity = pending.filter(i=>i.dtype==="incity");
  const outCity = pending.filter(i=>i.dtype==="outcity");

  const assignedVehiclePlate = myInv.length>0?myInv[0].vehicle:null;
  const assignedVehicle = assignedVehiclePlate&&vehicles?vehicles.find(v=>v.plate===assignedVehiclePlate):null;

  const vAlerts = [];
  if (assignedVehicle) {
    if (assignedVehicle.status==="Maintenance") vAlerts.push({type:"error",msg:t.maintenance});
    if ((assignedVehicle.fuelLevel||0)/(assignedVehicle.fuelCapacity||80)<0.25) vAlerts.push({type:"warning",msg:t.lowFuel+": "+(assignedVehicle.fuelLevel||0)+"L"});
    if (assignedVehicle.fahas) {
      const days=Math.ceil((new Date(assignedVehicle.fahas)-new Date())/(1000*60*60*24));
      if (days<=30) vAlerts.push({type:"warning",msg:"Fahas "+t.expirySoon+" ("+days+" days)"});
    }
    if (assignedVehicle.insurance) {
      const days=Math.ceil((new Date(assignedVehicle.insurance)-new Date())/(1000*60*60*24));
      if (days<=30) vAlerts.push({type:"warning",msg:"Insurance "+t.expirySoon+" ("+days+" days)"});
    }
  }

  function getGPS() {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p=>{setGps({lat:p.coords.latitude,lng:p.coords.longitude});setLocating(false);},
        ()=>{setGps({lat:24.7136,lng:46.6753});setLocating(false);}
      );
    } else { setGps({lat:24.7136,lng:46.6753}); setLocating(false); }
  }

  function handlePhoto(e) {
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader(); r.onload=ev=>setPod(ev.target.result); r.readAsDataURL(f);
  }

  function submit(inv, status) {
    if (status==="delivered"&&!pod) { alert(t.podRequired); return; }
    setInvoices(prev=>prev.map(i=>i.id===inv.id?{...i,status,podImage:pod,gps,deliveredAt:new Date().toLocaleString(),attempts:(i.attempts||0)+1}:i));
    setCompleted(p=>[...p,inv.id]);
    setDone(status==="delivered"?"✅ "+inv.id+" delivered!":"❌ "+inv.id+" failed.");
    setActive(null); setPod(null); setGps(null);
    setTimeout(()=>setDone(""),3000);
  }

  function InvCard({ inv }) {
    return (
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, flexWrap:"wrap", gap:6 }}>
          <span style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</span>
          <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:6, background:inv.dtype==="incity"?"#dbeafe":"#fef3c7", color:inv.dtype==="incity"?"#1e40af":"#92400e" }}>
            {inv.dtype==="incity"?"🏙️ "+t.inCity:"🛣️ "+t.outCity}
          </span>
        </div>
        <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", marginBottom:4 }}>{inv.customer}</div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>📍 {inv.city} | 🌡️ {inv.storage}</div>
        {inv.vehicle&&<div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>🚗 {t.vehicle}: <b>{inv.vehicle}</b></div>}
        {inv.remarks&&<div style={{ fontSize:13, color:"#d97706", background:"#fffbeb", padding:"6px 10px", borderRadius:6, marginBottom:8 }}>💬 {inv.remarks}</div>}

        {active?.id===inv.id?(
          <div style={{ marginTop:12, border:"1px solid #e2e8f0", borderRadius:8, padding:14, background:"#f8fafc" }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>{t.gpsStep}</div>
              <button onClick={getGPS} disabled={locating}
                style={{ background:gps?"#10b981":"#0ea5e9", color:"white", border:"none", padding:"9px 16px", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13, width:"100%" }}>
                {locating?t.gettingGPS:gps?"✅ GPS: "+gps.lat.toFixed(4)+", "+gps.lng.toFixed(4):"📍 "+t.getGPS}
              </button>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>{t.podStep}</div>
              <input type="file" accept="image/*" capture="environment" id={"pod_"+inv.id} style={{ display:"none" }} onChange={handlePhoto} />
              <label htmlFor={"pod_"+inv.id} style={{ display:"inline-block", background:"#8b5cf6", color:"white", border:"none", padding:"9px 16px", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13 }}>
                📸 {pod?"Change Photo":"Take Photo"}
              </label>
              {pod&&<img src={pod} alt="POD" style={{ display:"block", marginTop:8, width:"100%", maxWidth:200, borderRadius:8, border:"2px solid #e2e8f0" }} />}
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={()=>submit(inv,"delivered")} style={{ background:"#10b981", color:"white", border:"none", padding:"10px 16px", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 }}>✅ {t.markDelivered}</button>
              <button onClick={()=>submit(inv,"failed")} style={{ background:"#ef4444", color:"white", border:"none", padding:"10px 16px", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 }}>❌ {t.markFailed}</button>
              <button onClick={()=>{setActive(null);setPod(null);setGps(null);}} style={{ background:"#f1f5f9", border:"none", padding:"10px 14px", borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:13, color:"#64748b" }}>{t.cancel}</button>
            </div>
          </div>
        ):(
          <button onClick={()=>{setActive(inv);setGps(null);setPod(null);}}
            style={{ background:"#1A3A5C", color:"white", border:"none", padding:"10px 20px", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13, marginTop:8, width:"100%" }}>
            {t.startDelivery} →
          </button>
        )}
      </Card>
    );
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}

      {assignedVehicle&&(
        <Card style={{ borderLeft:"4px solid #0891b2" }}>
          <CardTitle>🚗 {t.vehicle}: {assignedVehicle.plate}</CardTitle>
          <div style={{ display:"flex", gap:16, fontSize:13, color:"#64748b", flexWrap:"wrap", marginBottom:8 }}>
            <span>{assignedVehicle.type} | {assignedVehicle.brand} {assignedVehicle.model}</span>
            <span>⛽ Fuel: {assignedVehicle.fuelLevel||0}L / {assignedVehicle.fuelCapacity||80}L</span>
            <span>🛣️ {assignedVehicle.totalKM||0} KM</span>
          </div>
          {vAlerts.length>0&&(
            <div>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>🔔 {t.vehicleAlerts}</div>
              {vAlerts.map((a,i)=>(
                <div key={i} style={{ background:a.type==="error"?"#fee2e2":"#fef3c7", color:a.type==="error"?"#991b1b":"#92400e", borderRadius:6, padding:"6px 12px", fontSize:13, fontWeight:600, marginBottom:4 }}>
                  {a.type==="error"?"🔴":"⚠️"} {a.msg}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[[t.remaining,pending.length,"#0f172a"],[t.inCity,inCity.length,"#1e40af"],[t.outCity,outCity.length,"#92400e"],[t.completed,doneList.length,"#10b981"]].map(([l,v,c])=>(
          <div key={l} style={{ background:"white", borderRadius:10, padding:16, textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight:900, fontSize:24, color:c }}>{v}</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>{l}</div>
          </div>
        ))}
      </div>

      {inCity.length>0&&(
        <>
          <div style={{ fontWeight:700, fontSize:15, color:"#1e40af", margin:"16px 0 10px" }}>🏙️ {t.inCity} ({inCity.length})</div>
          {inCity.map(inv=><InvCard key={inv.id} inv={inv} />)}
        </>
      )}
      {outCity.length>0&&(
        <>
          <div style={{ fontWeight:700, fontSize:15, color:"#92400e", margin:"16px 0 10px" }}>🛣️ {t.outCity} ({outCity.length})</div>
          {outCity.map(inv=><InvCard key={inv.id} inv={inv} />)}
        </>
      )}
      {pending.length===0&&<div style={{ textAlign:"center", padding:"40px", color:"#94a3b8", background:"white", borderRadius:10 }}>🎉 {t.allDone}</div>}

      {doneList.length>0&&(
        <>
          <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", margin:"16px 0 10px" }}>✅ {t.completed} ({doneList.length})</div>
          {doneList.map(inv=>(
            <Card key={inv.id} style={{ opacity:0.65 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</span>
                <Badge status="delivered" />
              </div>
              <div style={{ fontWeight:600, fontSize:14 }}>{inv.customer}</div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
