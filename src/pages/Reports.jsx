import { useState, useEffect } from "react";
import { Card, CardTitle, StatCard, TabBar } from "../components/Shared.jsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const T = {
  en: {
    daily:"Daily Status", driver:"Driver Performance", vehicle:"Vehicle Utilization",
    fuel:"Fuel Report", aging:"Aging Report", unassignedReport:"Unassigned Report",
    overall:"Overall Summary", period:"Period",
    today:"Today", week:"This Week", month:"This Month", all:"All Time",
    total:"Total", delivered:"Delivered", pending:"Pending", assigned:"Assigned",
    failed:"Failed", outstanding:"Outstanding", inTransit:"In Transit", scheduled:"Scheduled",
    deliveryRate:"Delivery Rate", instBreak:"Institution Breakdown",
    govt:"Government", priv:"Private", noData:"No data for this period",
    csvDownload:"Download CSV", totalDel:"Delivered", totalFail:"Failed", rate:"Rate",
    inCity:"In-City", outCity:"Out-City", vehUtil:"Vehicle Utilization",
    active:"Active", maintenance:"Maintenance", totalKM:"Total KM",
    totalLiters:"Total Liters", totalCost:"Total Cost", avgEff:"Avg Efficiency",
    fresh:"Fresh", aging2:"Aging", critical:"Critical", days:"days",
    riyadhDC:"Riyadh Distribution Center",
    jeddahDC:"Jeddah Distribution Center",
    dammamDC:"Dammam Distribution Center",
    howCalc:"How calculated", driverPerf:"Driver Performance", fuelRep:"Fuel Report"
  },
  ar: {
    daily:"الحالة اليومية", driver:"أداء السائقين", vehicle:"استخدام المركبات",
    fuel:"تقرير الوقود", aging:"تقرير التقادم", unassignedReport:"تقرير غير المخصصين",
    overall:"الملخص العام", period:"الفترة",
    today:"اليوم", week:"هذا الأسبوع", month:"هذا الشهر", all:"كل الوقت",
    total:"الإجمالي", delivered:"مسلمة", pending:"معلقة", assigned:"مخصصة",
    failed:"فاشلة", outstanding:"متأخرة", inTransit:"في الطريق", scheduled:"مجدولة",
    deliveryRate:"معدل التسليم", instBreak:"توزيع المؤسسات",
    govt:"حكومي", priv:"خاص", noData:"لا توجد بيانات",
    csvDownload:"تحميل CSV", totalDel:"مسلمة", totalFail:"فاشلة", rate:"النسبة",
    inCity:"داخل المدينة", outCity:"خارج المدينة", vehUtil:"استخدام المركبات",
    active:"نشطة", maintenance:"صيانة", totalKM:"إجمالي الكيلومترات",
    totalLiters:"إجمالي اللترات", totalCost:"إجمالي التكلفة", avgEff:"متوسط الكفاءة",
    fresh:"حديثة", aging2:"متقادمة", critical:"حرجة", days:"يوم",
    riyadhDC:"مركز توزيع الرياض",
    jeddahDC:"مركز توزيع جدة",
    dammamDC:"مركز توزيع الدمام",
    howCalc:"طريقة الحساب", driverPerf:"أداء السائق", fuelRep:"تقرير الوقود"
  }
};

const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };

function dcLabel(dc, t) {
  if (dc==="Riyadh") return t.riyadhDC;
  if (dc==="Jeddah") return t.jeddahDC;
  return t.dammamDC;
}

// Working days calculator — exclude Fri/Sat/public holidays/leaves
function getWorkingDays(from, to, holidays=[], leaveDates=[]) {
  let count = 0;
  let date = new Date(from);
  const end = new Date(to);
  while (date <= end) {
    const day = date.getDay();
    const dateStr = date.toISOString().split("T")[0];
    const isFriSat = day === 5 || day === 6; // 5=Fri, 6=Sat
    const isHoliday = holidays.some(h=>dateStr>=h.from&&dateStr<=h.to);
    const isLeave = leaveDates.includes(dateStr);
    if (!isFriSat && !isHoliday && !isLeave) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

// Get all dates in a leave period
function getLeaveDates(leaves, driverId) {
  const dates = [];
  leaves.filter(l=>l.driverId===driverId).forEach(l=>{
    let d = new Date(l.from);
    const end = new Date(l.to);
    while (d <= end) { dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate()+1); }
  });
  return dates;
}

// Get all dates in vehicle off period
function getVehicleOffDates(offDays, plate) {
  const dates = [];
  offDays.filter(o=>o.vehiclePlate===plate).forEach(o=>{
    let d = new Date(o.from);
    const end = new Date(o.to);
    while (d <= end) { dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate()+1); }
  });
  return dates;
}

// Period date range
function getPeriodRange(period) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (period==="today") return { from:today, to:today };
  if (period==="week") {
    const d = new Date(now); d.setDate(d.getDate()-6);
    return { from:d.toISOString().split("T")[0], to:today };
  }
  if (period==="month") {
    const d = new Date(now); d.setDate(1);
    return { from:d.toISOString().split("T")[0], to:today };
  }
  // all time — use last year
  const d = new Date(now); d.setFullYear(d.getFullYear()-1);
  return { from:d.toISOString().split("T")[0], to:today };
}

function getUserDC(user) {
  if (!user.dc || user.dc === "Head Office") return null;
  return user.dc;
}

function downloadCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map(r=>keys.map(k=>r[k]).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = filename; a.click();
}

function filterByPeriod(invoices, period) {
  const now = new Date();
  return invoices.filter(i=>{
    const d = new Date(i.date);
    if (period==="today") return i.date===now.toISOString().split("T")[0];
    if (period==="week") { const w=new Date(now); w.setDate(now.getDate()-7); return d>=w; }
    if (period==="month") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    return true;
  });
}

export default function Reports({ user, invoices, fuelLogs, vehicles, users, lang }) {
  const [tab, setTab] = useState("daily");
  const [period, setPeriod] = useState("month");
  const [tripLogs, setTripLogs] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [driverLeaves, setDriverLeaves] = useState([]);
  const [vehicleOffDays, setVehicleOffDays] = useState([]);
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const isAdmin = user.role==="admin";

  useEffect(() => {
    async function loadData() {
      try {
        const [tSnap, hSnap, lSnap, vSnap] = await Promise.all([
          getDocs(collection(db, "tripLogs")),
          getDocs(collection(db, "publicHolidays")),
          getDocs(collection(db, "driverLeaves")),
          getDocs(collection(db, "vehicleOffDays")),
        ]);
        setTripLogs(tSnap.docs.map(d=>({id:d.id,...d.data()})));
        setHolidays(hSnap.docs.map(d=>({id:d.id,...d.data()})));
        setDriverLeaves(lSnap.docs.map(d=>({id:d.id,...d.data()})));
        setVehicleOffDays(vSnap.docs.map(d=>({id:d.id,...d.data()})));
      } catch(e) { console.error("Reports load:", e); }
    }
    loadData();
  }, []);

  // DC filter — ALWAYS apply
  const userDC = getUserDC(user);

  const allInv = userDC ? invoices.filter(i=>i.dc===userDC&&i.uploadBatch) : invoices.filter(i=>i.uploadBatch);
  const myInv = filterByPeriod(allInv, period);
  const myLogs = userDC ? fuelLogs.filter(l=>l.dc===userDC) : fuelLogs;
  const myVeh = userDC ? vehicles.filter(v=>v.dc===userDC) : vehicles;
  const myUsers = userDC ? (users||[]).filter(u=>u.dc===userDC) : (users||[]);

  const tabs = [
    ["daily","📊",t.daily],["driver","👤",t.driver],
    ["vehicle","🚗",t.vehicle],["fuel","⛽",t.fuel],
    ["aging","⏱️",t.aging],["unassigned","⚪",t.unassignedReport]
  ];
  const periods = [["today",t.today],["week",t.week],["month",t.month],["all",t.all]];

  const periodRange = getPeriodRange(period);

  const driverMap = {};
  myInv.filter(i=>i.driverId).forEach(i=>{
    if(!driverMap[i.driverId]) driverMap[i.driverId]={name:i.driverName||i.driverId,driverId:i.driverId,delivered:0,failed:0,total:0,incity:0,outcity:0,totalKM:0,fuelUsed:0,activeDays:0};
    driverMap[i.driverId].total++;
    if(i.status==="delivered") driverMap[i.driverId].delivered++;
    if(i.status==="failed") driverMap[i.driverId].failed++;
    if(i.dtype==="incity") driverMap[i.driverId].incity++;
    if(i.dtype==="outcity") driverMap[i.driverId].outcity++;
  });

  // Add KM + active days from tripLogs
  const myTripLogs = tripLogs.filter(tl=>{
    const inPeriod = tl.startDate>=periodRange.from && tl.startDate<=periodRange.to;
    const inDC = !userDC || tl.dc===userDC;
    return inPeriod && inDC;
  });
  myTripLogs.forEach(tl=>{
    if(!driverMap[tl.driverId]) driverMap[tl.driverId]={name:tl.driverName,driverId:tl.driverId,delivered:0,failed:0,total:0,incity:0,outcity:0,totalKM:0,fuelUsed:0,activeDays:0};
    driverMap[tl.driverId].totalKM = Math.round(((driverMap[tl.driverId].totalKM||0)+(tl.totalKM||0))*10)/10;
    driverMap[tl.driverId].fuelUsed = Math.round(((driverMap[tl.driverId].fuelUsed||0)+(tl.fuelUsed||0))*10)/10;
    driverMap[tl.driverId].activeDays = Math.round(((driverMap[tl.driverId].activeDays||0)+(tl.daysActive||1))*2)/2;
  });

  // Add working days + productivity to each driver
  const driverStats = Object.values(driverMap).map(d=>{
    const leaveDates = getLeaveDates(driverLeaves, d.driverId);
    const workingDays = getWorkingDays(periodRange.from, periodRange.to, holidays, leaveDates);
    const unassignedDays = Math.max(0, workingDays - d.activeDays);
    const productivity = workingDays>0?Math.round(d.activeDays/workingDays*100):0;
    return {
      ...d,
      rate: d.total>0?Math.round(d.delivered/d.total*100):0,
      workingDays, unassignedDays, productivity
    };
  }).sort((a,b)=>b.rate-a.rate);

  const agingInv = allInv.filter(i=>["pending","assigned","outstanding"].includes(i.status))
    .map(i=>({...i,days:Math.floor((new Date()-new Date(i.date))/(1000*60*60*24))}))
    .sort((a,b)=>b.days-a.days);

  const countable = myInv.filter(i=>!["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = myInv.filter(i=>i.status==="delivered").length;
  const rate = countable.length>0?Math.round(del/countable.length*100):0;

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* Period Filter */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:14, fontWeight:600, color:"#374151" }}>{t.period}:</span>
        {periods.map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)}
            style={{ padding:"8px 16px", borderRadius:8, border:"none", background:period===v?"#1A3A5C":"#f1f5f9", color:period===v?"white":"#374151", cursor:"pointer", fontSize:14, fontWeight:600 }}>
            {l}
          </button>
        ))}
      </div>

      {/* DAILY STATUS */}
      {tab==="daily"&&(
        <div>
          <Card style={{ borderTop:"4px solid #1A3A5C" }}>
            <CardTitle>
              📊 {t.overall} — {userDC ? dcLabel(userDC,t) : "All Distribution Centers"}
            </CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:10, marginBottom:12 }}>
              <StatCard icon="📋" label={t.total} value={myInv.length} color="#6366f1" />
              <StatCard icon="✅" label={t.delivered} value={del} color="#10b981" />
              <StatCard icon="⏳" label={t.pending} value={myInv.filter(i=>i.status==="pending").length} color="#f59e0b" />
              <StatCard icon="👤" label={t.assigned} value={myInv.filter(i=>i.status==="assigned").length} color="#3b82f6" />
              <StatCard icon="❌" label={t.failed} value={myInv.filter(i=>i.status==="failed").length} color="#ef4444" />
              <StatCard icon="⚠️" label={t.outstanding} value={myInv.filter(i=>i.status==="outstanding").length} color="#f97316" />
              <StatCard icon="🚚" label={t.inTransit} value={myInv.filter(i=>i.status==="intransit").length} color="#8b5cf6" />
              <StatCard icon="📅" label={t.scheduled} value={myInv.filter(i=>["scheduled","hold_await","hold_ship"].includes(i.status)).length} color="#a855f7" />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, marginBottom:4 }}>
              <span style={{ fontWeight:700 }}>{t.deliveryRate}</span>
              <span style={{ fontWeight:900, fontSize:22, color:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444" }}>{rate}%</span>
            </div>
            <div style={{ background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden" }}>
              <div style={{ width:`${rate}%`, height:"100%", background:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
            </div>
            <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>{t.howCalc}: Delivered ÷ (Total - Scheduled) × 100</div>
          </Card>

          {/* DC Breakdown — Admin only */}
          {!userDC&&(
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
              {["Riyadh","Jeddah","Dammam"].map(dc=>{
                const color = DC_COLORS[dc];
                const inv = myInv.filter(i=>i.dc===dc);
                const countableDC = inv.filter(i=>!["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
                const delDC = inv.filter(i=>i.status==="delivered").length;
                const rateDC = countableDC.length>0?Math.round(delDC/countableDC.length*100):0;
                return (
                  <Card key={dc} style={{ borderTop:`4px solid ${color}` }}>
                    <CardTitle style={{ color }}>📍 {dcLabel(dc,t)}</CardTitle>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:10 }}>
                      <StatCard icon="📋" label={t.total} value={inv.length} color={color} />
                      <StatCard icon="✅" label={t.delivered} value={delDC} color="#10b981" />
                      <StatCard icon="⏳" label={t.pending} value={inv.filter(i=>i.status==="pending").length} color="#f59e0b" />
                      <StatCard icon="❌" label={t.failed} value={inv.filter(i=>i.status==="failed").length} color="#ef4444" />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                      <span style={{ fontWeight:600 }}>{t.deliveryRate}</span>
                      <span style={{ fontWeight:800, color:rateDC>=80?"#10b981":rateDC>=50?"#f59e0b":"#ef4444" }}>{rateDC}%</span>
                    </div>
                    <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
                      <div style={{ width:`${rateDC}%`, height:"100%", background:rateDC>=80?"#10b981":rateDC>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <Card>
            <CardTitle>🏥 {t.instBreak}</CardTitle>
            {["Government","Private"].map(inst=>{
              const n=myInv.filter(i=>i.inst===inst).length;
              const d=myInv.filter(i=>i.inst===inst&&i.status==="delivered").length;
              return (
                <div key={inst} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:14 }}>
                    <span style={{ fontWeight:600 }}>{inst==="Government"?"🏛️ "+t.govt:"🏥 "+t.priv}</span>
                    <span style={{ color:"#64748b" }}>{d}/{n} — {n>0?Math.round(d/n*100):0}%</span>
                  </div>
                  <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${n>0?Math.round(d/n*100):0}%`, height:"100%", background:inst==="Government"?"#1e40af":"#6d28d9", borderRadius:99 }} />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* DRIVER PERFORMANCE */}
      {tab==="driver"&&(
        <Card>
          <CardTitle>👤 {t.driverPerf}
            <button onClick={()=>downloadCSV(driverStats.map(d=>({Driver:d.name,Total:d.total,Delivered:d.delivered,Failed:d.failed,Rate:d.rate+"%",InCity:d.incity,OutCity:d.outcity})),"driver_report.csv")}
              style={{ marginLeft:"auto", background:"#10b981", color:"white", border:"none", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 }}>
              ⬇ {t.csvDownload}
            </button>
          </CardTitle>
          {driverStats.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>{t.noData}</div>}
          {driverStats.map((d,i)=>(
            <div key={d.name} style={{ padding:"14px 0", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:15 }}>#{i+1} {d.name}</span>
                <span style={{ fontWeight:800, fontSize:20, color:d.rate>=80?"#10b981":d.rate>=60?"#f59e0b":"#ef4444" }}>{d.rate}%</span>
              </div>
              <div style={{ display:"flex", gap:16, fontSize:14, color:"#64748b", flexWrap:"wrap", marginBottom:6 }}>
                <span>📋 {d.total} invoices</span>
                <span style={{ color:"#10b981" }}>✅ {d.delivered} delivered</span>
                <span style={{ color:"#ef4444" }}>❌ {d.failed} failed</span>
                <span>🏙️ {t.inCity}: {d.incity}</span>
                <span>🛣️ {t.outCity}: {d.outcity}</span>
              </div>
              <div style={{ display:"flex", gap:16, fontSize:13, color:"#64748b", flexWrap:"wrap", marginBottom:8 }}>
                <span>📍 {d.totalKM} km covered</span>
                <span>⛽ {d.fuelUsed}L fuel used</span>
                <span style={{ color:"#6366f1", fontWeight:600 }}>✅ {d.activeDays} active days / {d.workingDays} working days</span>
                <span style={{ color:d.unassignedDays>0?"#ef4444":"#10b981", fontWeight:600 }}>⚪ {d.unassignedDays} unassigned days</span>
                <span style={{ fontWeight:700, color:d.productivity>=80?"#10b981":d.productivity>=60?"#f59e0b":"#ef4444" }}>🎯 {d.productivity}% productivity</span>
              </div>
              <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                <div style={{ width:`${d.rate}%`, height:"100%", background:d.rate>=80?"#10b981":d.rate>=60?"#f59e0b":"#ef4444", borderRadius:99 }} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* VEHICLE UTILIZATION */}
      {tab==="vehicle"&&(
        <div>
          <Card style={{ borderTop:"4px solid #1A3A5C" }}>
            <CardTitle>🚗 {t.vehUtil} — {userDC?dcLabel(userDC,t):"All Distribution Centers"}</CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
              <StatCard icon="🚗" label={t.total} value={myVeh.length} color="#6366f1" />
              <StatCard icon="✅" label={t.active} value={myVeh.filter(v=>v.status==="Active").length} color="#10b981" />
              <StatCard icon="🔧" label={t.maintenance} value={myVeh.filter(v=>v.status==="Maintenance").length} color="#f59e0b" />
              <StatCard icon="🛣️" label={t.totalKM} value={myVeh.reduce((s,v)=>s+(v.totalKM||0),0).toLocaleString()} color="#0891b2" />
            </div>
          </Card>
          {!userDC&&["Riyadh","Jeddah","Dammam"].map((dc,idx)=>{
            const dv=vehicles.filter(v=>v.dc===dc);
            const colors=["#1A3A5C","#0f766e","#7c3aed"];
            return (
              <Card key={dc} style={{ borderTop:`4px solid ${colors[idx]}` }}>
                <CardTitle style={{ color:colors[idx] }}>📍 {dcLabel(dc,t)}</CardTitle>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
                  <StatCard icon="🚗" label={t.total} value={dv.length} color={colors[idx]} />
                  <StatCard icon="✅" label={t.active} value={dv.filter(v=>v.status==="Active").length} color="#10b981" />
                  <StatCard icon="🔧" label={t.maintenance} value={dv.filter(v=>v.status==="Maintenance").length} color="#f59e0b" />
                </div>
                {dv.map(v=>(
                  <div key={v.plate||v.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:14, minWidth:100 }}>{v.plate}</span>
                    <span style={{ fontSize:13, color:"#64748b", flex:1 }}>{v.type} | {(v.totalKM||0).toLocaleString()} km</span>
                    <span style={{ fontSize:13, fontWeight:600, padding:"3px 10px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                  </div>
                ))}
              </Card>
            );
          })}
          {userDC&&myVeh.map(v=>{
            const vOffDates = getVehicleOffDates(vehicleOffDays, v.plate);
            const workingDays = getWorkingDays(periodRange.from, periodRange.to, holidays, vOffDates);
            const vTrips = myTripLogs.filter(tl=>tl.vehiclePlate===v.plate);
            const activeDays = vTrips.reduce((s,tl)=>s+(tl.daysActive||1),0);
            const periodKM = vTrips.reduce((s,tl)=>s+(tl.totalKM||0),0);
            const periodFuel = vTrips.reduce((s,tl)=>s+(tl.fuelUsed||0),0);
            const unassignedDays = Math.max(0, workingDays - activeDays);
            const productivity = workingDays>0?Math.round(activeDays/workingDays*100):0;
            return (
              <div key={v.plate||v.id} style={{ border:"1px solid #e2e8f0", borderRadius:10, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:8 }}>
                  <span style={{ fontWeight:700, fontSize:15, minWidth:100 }}>{v.plate}</span>
                  <span style={{ fontSize:14, color:"#64748b", flex:1 }}>{v.type} {v.brand}</span>
                  <span style={{ fontSize:13, fontWeight:600, padding:"4px 12px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:8, fontSize:13 }}>
                  <span style={{ color:"#0891b2", fontWeight:600 }}>🛣️ Total KM: {(v.totalKM||0).toLocaleString()}</span>
                  <span style={{ color:"#6366f1", fontWeight:600 }}>📅 Period KM: {Math.round(periodKM*10)/10}</span>
                  <span style={{ color:"#f59e0b" }}>⛽ Fuel Used: {Math.round(periodFuel*10)/10}L</span>
                  <span style={{ color:"#10b981", fontWeight:600 }}>✅ Active: {Math.round(activeDays*2)/2} days</span>
                  <span style={{ color:unassignedDays>0?"#ef4444":"#10b981", fontWeight:600 }}>⚪ Unassigned: {Math.round(unassignedDays*2)/2} days</span>
                  <span style={{ color:productivity>=80?"#10b981":productivity>=60?"#f59e0b":"#ef4444", fontWeight:700 }}>🎯 {productivity}% productivity</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FUEL REPORT */}
      {tab==="fuel"&&(
        <div>
          <Card style={{ borderTop:"4px solid #f59e0b" }}>
            <CardTitle>⛽ {t.fuelRep} — {userDC?dcLabel(userDC,t):"All Distribution Centers"}
              <button onClick={()=>downloadCSV(myLogs.map(l=>({ID:l.id,Date:l.date,Vehicle:l.vehicle,Driver:l.driver,Liters:l.liters,SAR:l.sar,KM:l.tripKM,Efficiency:l.liters>0?(l.tripKM/l.liters).toFixed(1)+" km/L":"-",DC:l.dc})),"fuel_report.csv")}
                style={{ marginLeft:"auto", background:"#10b981", color:"white", border:"none", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                ⬇ {t.csvDownload}
              </button>
            </CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
              <StatCard icon="⛽" label={t.totalLiters} value={myLogs.reduce((s,l)=>s+(l.liters||0),0)+"L"} color="#f59e0b" />
              <StatCard icon="💰" label={t.totalCost} value={"SAR "+myLogs.reduce((s,l)=>s+(l.sar||0),0)} color="#ef4444" />
              <StatCard icon="🛣️" label={t.totalKM} value={myLogs.reduce((s,l)=>s+(l.tripKM||0),0)+" km"} color="#6366f1" />
              <StatCard icon="📊" label={t.avgEff} value={myLogs.reduce((s,l)=>s+(l.liters||0),0)>0?(myLogs.reduce((s,l)=>s+(l.tripKM||0),0)/myLogs.reduce((s,l)=>s+(l.liters||0),0)).toFixed(1)+" km/L":"-"} color="#10b981" />
            </div>
          </Card>
          {!userDC&&["Riyadh","Jeddah","Dammam"].map((dc,idx)=>{
            const dl=fuelLogs.filter(l=>l.dc===dc);
            const colors=["#1A3A5C","#0f766e","#7c3aed"];
            return (
              <Card key={dc} style={{ borderTop:`4px solid ${colors[idx]}` }}>
                <CardTitle style={{ color:colors[idx] }}>📍 {dcLabel(dc,t)}</CardTitle>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  <StatCard icon="⛽" label={t.totalLiters} value={dl.reduce((s,l)=>s+(l.liters||0),0)+"L"} color="#f59e0b" />
                  <StatCard icon="💰" label={t.totalCost} value={"SAR "+dl.reduce((s,l)=>s+(l.sar||0),0)} color="#ef4444" />
                  <StatCard icon="🛣️" label={t.totalKM} value={dl.reduce((s,l)=>s+(l.tripKM||0),0)+" km"} color="#6366f1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* UNASSIGNED REPORT */}
      {tab==="unassigned"&&(
        <Card>
          <CardTitle>⚪ {t.unassignedReport}</CardTitle>
          <div style={{ marginBottom:14, fontSize:14, color:"#64748b" }}>
            Drivers with no deliveries assigned in selected period.
          </div>
          {myUsers.filter(u=>u.role==="driver").length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>{t.noData}</div>}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr style={{ background:"#1A3A5C" }}>
                  {["#","Driver","Distribution Center","Total","Delivered","Rate","Status"].map(h=>(
                    <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontWeight:700, color:"white", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myUsers.filter(u=>u.role==="driver").map((driver,i)=>{
                  const dStats = driverStats.find(d=>d.name===driver.name)||{delivered:0,failed:0,total:0,rate:0};
                  const isUnassigned = dStats.total===0;
                  return (
                    <tr key={driver.uid} style={{ background:isUnassigned?"#fff7ed":i%2===0?"white":"#f8fafc" }}>
                      <td style={{ padding:"12px 14px", color:"#94a3b8" }}>{i+1}</td>
                      <td style={{ padding:"12px 14px", fontWeight:600 }}>{driver.name}</td>
                      <td style={{ padding:"12px 14px", color:"#64748b" }}>{dcLabel(driver.dc,t)||driver.dc}</td>
                      <td style={{ padding:"12px 14px", textAlign:"center" }}>{dStats.total}</td>
                      <td style={{ padding:"12px 14px", textAlign:"center", color:"#10b981", fontWeight:700 }}>{dStats.delivered}</td>
                      <td style={{ padding:"12px 14px", textAlign:"center" }}>
                        <span style={{ fontWeight:700, color:dStats.rate>=80?"#10b981":dStats.rate>=50?"#f59e0b":"#ef4444" }}>{dStats.rate}%</span>
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <span style={{ fontSize:13, fontWeight:600, padding:"3px 10px", borderRadius:99,
                          background:isUnassigned?"#fef3c7":driver.status==="active"||driver.status==="Active"?"#d1fae5":"#fee2e2",
                          color:isUnassigned?"#92400e":driver.status==="active"||driver.status==="Active"?"#065f46":"#991b1b"
                        }}>
                          {isUnassigned?"⚪ Unassigned":driver.status||"Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* AGING REPORT */}
      {tab==="aging"&&(
        <Card>
          <CardTitle>⏱️ {t.aging}</CardTitle>
          <div style={{ display:"flex", gap:16, marginBottom:14, flexWrap:"wrap" }}>
            {[
              { label:"🟢 "+t.fresh+" (≤1 "+t.days+")", count:agingInv.filter(i=>i.days<=1).length, color:"#10b981" },
              { label:"🟡 "+t.aging2+" (2-3 "+t.days+")", count:agingInv.filter(i=>i.days>1&&i.days<=3).length, color:"#f59e0b" },
              { label:"🔴 "+t.critical+" (4+ "+t.days+")", count:agingInv.filter(i=>i.days>3).length, color:"#ef4444" },
            ].map(s=>(
              <div key={s.label} style={{ fontSize:14, fontWeight:600, color:s.color }}>{s.label}: <b>{s.count}</b></div>
            ))}
          </div>
          {agingInv.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>{t.noData}</div>}
          {agingInv.map(inv=>(
            <div key={inv.id||inv.firestoreId} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:14, color:"#6366f1", minWidth:130 }}>{inv.id}</span>
              <span style={{ flex:1, fontSize:14 }}>{inv.customer}</span>
              <span style={{ fontSize:13, color:"#64748b" }}>{dcLabel(inv.dc,t)||inv.dc}</span>
              <span style={{ fontSize:13, fontWeight:600, padding:"3px 10px", borderRadius:99,
                background:inv.days<=1?"#d1fae5":inv.days<=3?"#fef3c7":"#fee2e2",
                color:inv.days<=1?"#065f46":inv.days<=3?"#92400e":"#991b1b"
              }}>
                {inv.days} {t.days} — {inv.days<=1?t.fresh:inv.days<=3?t.aging2:t.critical}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
