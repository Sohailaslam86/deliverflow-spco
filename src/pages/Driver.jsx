import { useState, useEffect, useRef } from "react";
import { Card, CardTitle, Btn, SuccessMsg, Badge } from "../components/Shared.jsx";

const T = {
  en: {
    pending:"Pending Deliveries", completed:"Completed Today", remaining:"Remaining",
    inCity:"In-City", outCity:"Out-City", startDelivery:"Start Delivery",
    gpsStep:"Step 1: Get GPS Location (Required)",
    podStep:"Step 2: Take POD Photo (Required)",
    markDelivered:"Mark Delivered", markFailed:"Mark Failed", cancel:"Cancel",
    getGPS:"Get My Location", gettingGPS:"Getting location...",
    allDone:"All deliveries completed! Great work.",
    podRequired:"Please take POD photo first",
    vehicle:"Assigned Vehicle", vehicleAlerts:"Vehicle Alerts",
    maintenance:"Under Maintenance", lowFuel:"Low Fuel Warning",
    expirySoon:"Document Expiring Soon",
    startTrip:"Start Trip", endTrip:"End Trip", tripActive:"Trip Active",
    elapsed:"Elapsed", distance:"Distance",
    history:"Delivery History",
    histDate:"Date", histVehicle:"Vehicle #", histInvoices:"Invoices",
    histStatus:"Status", histDistance:"Distance (km)", histSuccess:"Success Rate",
    histType:"Type", noHistory:"No delivery history yet",
    tripStarted:"Trip started! Timer running.", tripEnded:"Trip ended."
  },
  ar: {
    pending:"تسليمات معلقة", completed:"مكتملة اليوم", remaining:"المتبقي",
    inCity:"داخل المدينة", outCity:"خارج المدينة", startDelivery:"بدء التسليم",
    gpsStep:"الخطوة 1: تحديد الموقع (مطلوب)",
    podStep:"الخطوة 2: صورة إثبات التسليم (مطلوبة)",
    markDelivered:"تسليم ناجح", markFailed:"تسليم فاشل", cancel:"إلغاء",
    getGPS:"تحديد موقعي", gettingGPS:"جاري تحديد الموقع...",
    allDone:"تم إكمال جميع التسليمات!",
    podRequired:"يرجى التقاط صورة أولاً",
    vehicle:"المركبة المخصصة", vehicleAlerts:"تنبيهات المركبة",
    maintenance:"تحت الصيانة", lowFuel:"وقود منخفض",
    expirySoon:"وثيقة ستنتهي قريباً",
    startTrip:"بدء الرحلة", endTrip:"إنهاء الرحلة", tripActive:"الرحلة نشطة",
    elapsed:"الوقت المنقضي", distance:"المسافة",
    history:"سجل التسليم",
    histDate:"التاريخ", histVehicle:"رقم المركبة", histInvoices:"الفواتير",
    histStatus:"الحالة", histDistance:"المسافة (كم)", histSuccess:"معدل النجاح",
    histType:"النوع", noHistory:"لا يوجد سجل تسليم",
    tripStarted:"بدأت الرحلة!", tripEnded:"انتهت الرحلة."
  }
};

export default function Driver({ user, invoices, setInvoices, vehicles, lang }) {
  const [active, setActive] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [gps, setGps] = useState(null);
  const [locating, setLocating] = useState(false);
  const [pod, setPod] = useState(null);
  const [done, setDone] = useState("");
  const [tripStarted, setTripStarted] = useState(false);
  const [tripStartTime, setTripStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);
  const [view, setView] = useState("deliveries"); // deliveries | history
  const timerRef = useRef(null);

  // Load history from localStorage
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("driver_history_"+user.uid)||"[]"); } catch { return []; }
  });

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
    if (assignedVehicle.fahas&&Math.ceil((new Date(assignedVehicle.fahas)-new Date())/(1000*60*60*24))<=30) vAlerts.push({type:"warning",msg:"Fahas "+t.expirySoon});
    if (assignedVehicle.insurance&&Math.ceil((new Date(assignedVehicle.insurance)-new Date())/(1000*60*60*24))<=30) vAlerts.push({type:"warning",msg:"Insurance "+t.expirySoon});
  }

  // Timer
  useEffect(() => {
    if (tripStarted) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const newElapsed = prev + 1;
          // Simulate distance: ~30km/h average = 0.5km/min = ~0.008km/sec
          setTripDistance(d => Math.round((d + 0.008) * 10) / 10);
          return newElapsed;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [tripStarted]);

  function formatTime(secs) {
    const h = Math.floor(secs/3600);
    const m = Math.floor((secs%3600)/60);
    const s = secs%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  function startTrip() {
    setTripStarted(true);
    setTripStartTime(new Date());
    setElapsed(0);
    setTripDistance(0);
    setDone(t.tripStarted);
    setTimeout(()=>setDone(""),3000);
  }

  function endTrip() {
    if (!tripStarted) return;
    setTripStarted(false);
    const today = new Date().toISOString().split("T")[0];
    const totalInv = doneList.length + pending.length;
    const successRate = totalInv>0?Math.round(doneList.length/totalInv*100):0;
    const entry = {
      date: today,
      vehicle: assignedVehiclePlate||"-",
      invoices: totalInv,
      delivered: doneList.length,
      failed: myInv.filter(i=>completed.includes(i.id)&&invoices.find(x=>x.id===i.id)?.status==="failed").length,
      distance: tripDistance,
      successRate,
      inCity: myInv.filter(i=>i.dtype==="incity").length,
      outCity: myInv.filter(i=>i.dtype==="outcity").length,
      duration: formatTime(elapsed),
      startTime: tripStartTime?.toLocaleTimeString()||"-",
      endTime: new Date().toLocaleTimeString()
    };
    const newHistory = [entry, ...history].slice(0,30);
    setHistory(newHistory);
    try { localStorage.setItem("driver_history_"+user.uid, JSON.stringify(newHistory)); } catch{}
    setDone(t.tripEnded+" "+tripDistance+" km covered in "+formatTime(elapsed));
    setTimeout(()=>setDone(""),5000);
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
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6 }}>
          <span style={{ fontWeight:700,fontSize:14,color:"#6366f1" }}>{inv.id}</span>
          <span style={{ fontSize:12,fontWeight:600,padding:"3px 8px",borderRadius:6,background:inv.dtype==="incity"?"#dbeafe":"#fef3c7",color:inv.dtype==="incity"?"#1e40af":"#92400e" }}>
            {inv.dtype==="incity"?"🏙️ "+t.inCity:"🛣️ "+t.outCity}
          </span>
        </div>
        <div style={{ fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:4 }}>{inv.customer}</div>
        <div style={{ fontSize:14,color:"#64748b",marginBottom:4 }}>📍 {inv.city} | 🌡️ {inv.storage}</div>
        {inv.vehicle&&<div style={{ fontSize:14,color:"#64748b",marginBottom:4 }}>🚗 {inv.vehicle}</div>}

        {active?.id===inv.id?(
          <div style={{ marginTop:12,border:"1px solid #e2e8f0",borderRadius:8,padding:14,background:"#f8fafc" }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:600,fontSize:14,marginBottom:6 }}>{t.gpsStep}</div>
              <button onClick={getGPS} disabled={locating}
                style={{ background:gps?"#10b981":"#0ea5e9",color:"white",border:"none",padding:"9px 16px",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:14,width:"100%" }}>
                {locating?t.gettingGPS:gps?"✅ GPS: "+gps.lat.toFixed(4)+", "+gps.lng.toFixed(4):"📍 "+t.getGPS}
              </button>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:600,fontSize:14,marginBottom:6 }}>{t.podStep}</div>
              <input type="file" accept="image/*" capture="environment" id={"pod_"+inv.id} style={{ display:"none" }} onChange={handlePhoto} />
              <label htmlFor={"pod_"+inv.id} style={{ display:"inline-block",background:"#8b5cf6",color:"white",border:"none",padding:"9px 16px",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:14 }}>
                📸 {pod?"Change Photo":"Take Photo"}
              </label>
              {pod&&<img src={pod} alt="POD" style={{ display:"block",marginTop:8,width:"100%",maxWidth:200,borderRadius:8,border:"2px solid #e2e8f0" }} />}
            </div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              <button onClick={()=>submit(inv,"delivered")} style={{ background:"#10b981",color:"white",border:"none",padding:"10px 16px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>✅ {t.markDelivered}</button>
              <button onClick={()=>submit(inv,"failed")} style={{ background:"#ef4444",color:"white",border:"none",padding:"10px 16px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>❌ {t.markFailed}</button>
              <button onClick={()=>{setActive(null);setPod(null);setGps(null);}} style={{ background:"#f1f5f9",border:"none",padding:"10px 14px",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14,color:"#64748b" }}>{t.cancel}</button>
            </div>
          </div>
        ):(
          <button onClick={()=>{setActive(inv);setGps(null);setPod(null);}}
            style={{ background:"#1A3A5C",color:"white",border:"none",padding:"10px 20px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14,marginTop:8,width:"100%" }}>
            {t.startDelivery} →
          </button>
        )}
      </Card>
    );
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}

      {/* Tab Switch */}
      <div style={{ display:"flex",gap:8,marginBottom:16 }}>
        {[["deliveries","📦","My Deliveries"],["history","📊","Delivery History"]].map(([v,icon,label])=>(
          <button key={v} onClick={()=>setView(v)}
            style={{ padding:"8px 18px",borderRadius:8,border:"none",background:view===v?"#1A3A5C":"#f1f5f9",color:view===v?"white":"#374151",cursor:"pointer",fontSize:14,fontWeight:600 }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {view==="deliveries"&&(
        <>
          {/* Vehicle Info */}
          {assignedVehicle&&(
            <Card style={{ borderLeft:"4px solid #0891b2" }}>
              <CardTitle>🚗 {t.vehicle}: {assignedVehicle.plate}</CardTitle>
              <div style={{ display:"flex",gap:16,fontSize:14,color:"#64748b",flexWrap:"wrap",marginBottom:8 }}>
                <span>{assignedVehicle.type} | {assignedVehicle.brand} {assignedVehicle.model}</span>
                <span>⛽ {assignedVehicle.fuelLevel||0}L / {assignedVehicle.fuelCapacity||80}L</span>
                <span>🛣️ {assignedVehicle.totalKM||0} KM</span>
              </div>
              {vAlerts.length>0&&vAlerts.map((a,i)=>(
                <div key={i} style={{ background:a.type==="error"?"#fee2e2":"#fef3c7",color:a.type==="error"?"#991b1b":"#92400e",borderRadius:6,padding:"6px 12px",fontSize:14,fontWeight:600,marginBottom:4 }}>
                  {a.type==="error"?"🔴":"⚠️"} {a.msg}
                </div>
              ))}
            </Card>
          )}

          {/* Trip Control */}
          <Card style={{ borderTop:`4px solid ${tripStarted?"#10b981":"#1A3A5C"}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
              <div>
                {tripStarted?(
                  <>
                    <div style={{ fontWeight:700,fontSize:14,color:"#10b981",marginBottom:4 }}>🟢 {t.tripActive}</div>
                    <div style={{ display:"flex",gap:20,fontSize:14 }}>
                      <span>⏱️ {t.elapsed}: <b style={{ fontFamily:"monospace",fontSize:16 }}>{formatTime(elapsed)}</b></span>
                      <span>🛣️ {t.distance}: <b>{tripDistance} km</b></span>
                    </div>
                  </>
                ):(
                  <div style={{ fontSize:14,color:"#64748b" }}>Press Start Trip to begin tracking time & distance</div>
                )}
              </div>
              <div style={{ display:"flex",gap:8 }}>
                {!tripStarted?(
                  <Btn onClick={startTrip} color="#10b981" style={{ padding:"10px 20px" }}>🚀 {t.startTrip}</Btn>
                ):(
                  <Btn onClick={endTrip} color="#ef4444" style={{ padding:"10px 20px" }}>🏁 {t.endTrip}</Btn>
                )}
              </div>
            </div>
          </Card>

          {/* Summary */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16 }}>
            {[[t.remaining,pending.length,"#0f172a"],[t.inCity,inCity.length,"#1e40af"],[t.outCity,outCity.length,"#92400e"],[t.completed,doneList.length,"#10b981"]].map(([l,v,c])=>(
              <div key={l} style={{ background:"white",borderRadius:10,padding:16,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight:900,fontSize:24,color:c }}>{v}</div>
                <div style={{ fontSize:13,color:"#94a3b8" }}>{l}</div>
              </div>
            ))}
          </div>

          {inCity.length>0&&(
            <>
              <div style={{ fontWeight:700,fontSize:15,color:"#1e40af",margin:"16px 0 10px" }}>🏙️ {t.inCity} ({inCity.length})</div>
              {inCity.map(inv=><InvCard key={inv.id} inv={inv} />)}
            </>
          )}
          {outCity.length>0&&(
            <>
              <div style={{ fontWeight:700,fontSize:15,color:"#92400e",margin:"16px 0 10px" }}>🛣️ {t.outCity} ({outCity.length})</div>
              {outCity.map(inv=><InvCard key={inv.id} inv={inv} />)}
            </>
          )}
          {pending.length===0&&<div style={{ textAlign:"center",padding:"40px",color:"#94a3b8",background:"white",borderRadius:10 }}>🎉 {t.allDone}</div>}

          {doneList.length>0&&(
            <>
              <div style={{ fontWeight:700,fontSize:15,color:"#0f172a",margin:"16px 0 10px" }}>✅ {t.completed} ({doneList.length})</div>
              {doneList.map(inv=>(
                <Card key={inv.id} style={{ opacity:0.7 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}>
                    <span style={{ fontWeight:700,fontSize:14,color:"#6366f1" }}>{inv.id}</span>
                    <Badge status="delivered" />
                  </div>
                  <div style={{ fontWeight:600,fontSize:14 }}>{inv.customer}</div>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      {view==="history"&&(
        <Card>
          <CardTitle>📊 {t.history}</CardTitle>
          {history.length===0&&<div style={{ textAlign:"center",padding:30,color:"#94a3b8" }}>{t.noHistory}</div>}
          {history.length>0&&(
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
                <thead>
                  <tr style={{ background:"#1A3A5C" }}>
                    {[t.histDate,t.histVehicle,t.histInvoices,"Delivered","Failed",t.histDistance,"Duration",t.histSuccess,t.histType].map(h=>(
                      <th key={h} style={{ padding:"10px 10px",textAlign:"left",fontWeight:700,color:"white",whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h,i)=>(
                    <tr key={i} style={{ background:i%2===0?"white":"#f8fafc" }}>
                      <td style={{ padding:"10px",fontWeight:600 }}>{h.date}</td>
                      <td style={{ padding:"10px",color:"#6366f1" }}>{h.vehicle}</td>
                      <td style={{ padding:"10px",textAlign:"center" }}>{h.invoices}</td>
                      <td style={{ padding:"10px",textAlign:"center",color:"#10b981",fontWeight:700 }}>{h.delivered}</td>
                      <td style={{ padding:"10px",textAlign:"center",color:"#ef4444",fontWeight:700 }}>{h.failed||0}</td>
                      <td style={{ padding:"10px",textAlign:"center" }}>{h.distance} km</td>
                      <td style={{ padding:"10px",textAlign:"center",fontFamily:"monospace" }}>{h.duration}</td>
                      <td style={{ padding:"10px",textAlign:"center" }}>
                        <span style={{ fontWeight:700,color:h.successRate>=80?"#10b981":h.successRate>=50?"#f59e0b":"#ef4444" }}>{h.successRate}%</span>
                      </td>
                      <td style={{ padding:"10px",fontSize:13 }}>
                        🏙️{h.inCity} / 🛣️{h.outCity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
