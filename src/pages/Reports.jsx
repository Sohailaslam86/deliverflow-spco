import { useState, useEffect, useRef } from "react";
import { Card, CardTitle, StatCard, TabBar } from "../components/Shared.jsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useSettings } from "../context/SettingsContext.jsx";

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
    csvDownload:"Download CSV", pdfDownload:"Download PDF", totalDel:"Delivered", totalFail:"Failed", rate:"Rate",
    inCity:"In-City", outCity:"Out-City", vehUtil:"Vehicle Utilization",
    active:"Active", maintenance:"Maintenance", totalKM:"Total KM",
    totalLiters:"Total Liters", totalCost:"Total Cost (SAR)", avgEff:"Avg Efficiency",
    fresh:"Fresh", aging2:"Aging", critical:"Critical", days:"days",
    riyadhDC:"Riyadh Distribution Center",
    jeddahDC:"Jeddah Distribution Center",
    dammamDC:"Dammam Distribution Center",
    howCalc:"How calculated", driverPerf:"Driver Performance", fuelRep:"Fuel Report",
    allDrivers:"All Drivers", allVehicles:"All Vehicles", allDCs:"All DCs",
    fromDate:"From", toDate:"To", quickPeriod:"Quick:",
    nextService:"Next Service", avgKMday:"Avg KM/Day", docExpiry:"Document Expiry",
    failReasons:"Fail Reason Breakdown", avgDelivery:"Avg Deliveries/Day",
    summaryCard:"Summary Overview", bestDriver:"Top Driver", mostActive:"Most Active Vehicle",
    criticalAging:"Critical Aging",
    productivity:"Productivity", workingDays:"Working Days", activeDays:"Active Days",
    unassignedDays:"Unassigned Days",
    heatmap:"SLA Heatmap", slaDriver:"Delivery Partner Heatmap", slaVehicle:"Vehicle Heatmap",
    onTime:"On-Time", partialSla:"Partial / Ext. SLA", noActivity:"No Activity", incitySla:"In-City (<300km)", outcitySla:"Out-City (≥300km)", slaNote:"SLA Rule: In-City → same-day on-time | Out-City (≥300km) → next-day SLA", delivPart:"Delivery Partners", monthSummary:"Month Summary", onRoadDays:"On-Road Days", maintDays:"Maintenance Days",
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
    csvDownload:"تحميل CSV", pdfDownload:"تحميل PDF", totalDel:"مسلمة", totalFail:"فاشلة", rate:"النسبة",
    inCity:"داخل المدينة", outCity:"خارج المدينة", vehUtil:"استخدام المركبات",
    active:"نشطة", maintenance:"صيانة", totalKM:"إجمالي الكيلومترات",
    totalLiters:"إجمالي اللترات", totalCost:"إجمالي التكلفة", avgEff:"متوسط الكفاءة",
    fresh:"حديثة", aging2:"متقادمة", critical:"حرجة", days:"يوم",
    riyadhDC:"مركز توزيع الرياض",
    jeddahDC:"مركز توزيع جدة",
    dammamDC:"مركز توزيع الدمام",
    howCalc:"طريقة الحساب", driverPerf:"أداء السائق", fuelRep:"تقرير الوقود",
    allDrivers:"جميع السائقين", allVehicles:"جميع المركبات", allDCs:"جميع المراكز",
    fromDate:"من", toDate:"إلى", quickPeriod:"سريع:",
    nextService:"الصيانة القادمة", avgKMday:"متوسط كم/يوم", docExpiry:"انتهاء الوثائق",
    failReasons:"أسباب الفشل", avgDelivery:"متوسط التسليم/يوم",
    summaryCard:"ملخص سريع", bestDriver:"أفضل سائق", mostActive:"أكثر مركبة نشاطاً",
    criticalAging:"فواتير حرجة",
    productivity:"الإنتاجية", workingDays:"أيام العمل", activeDays:"الأيام النشطة",
    unassignedDays:"الأيام غير المخصصة",
    heatmap:"خريطة مستوى الخدمة", slaDriver:"خريطة شريك التوصيل", slaVehicle:"خريطة المركبة",
    onTime:"في الوقت", partialSla:"جزئي", noActivity:"لا نشاط", incitySla:"داخل المدينة", outcitySla:"خارج المدينة", slaNote:"قاعدة الخدمة: داخلي → نفس اليوم | خارجي (300+ كم) → اليوم التالي", delivPart:"شركاء التوصيل", monthSummary:"ملخص الشهر", onRoadDays:"أيام العمل", maintDays:"أيام الصيانة",
  }
};

const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };

function dcLabel(dc, t) {
  if (dc==="Riyadh") return t.riyadhDC;
  if (dc==="Jeddah") return t.jeddahDC;
  return t.dammamDC;
}

function getWorkingDays(from, to, holidays=[], leaveDates=[]) {
  let count = 0;
  let date = new Date(from);
  const end = new Date(to);
  while (date <= end) {
    const day = date.getDay();
    const dateStr = date.toISOString().split("T")[0];
    const isFriSat = day === 5 || day === 6;
    const isHoliday = holidays.some(h=>dateStr>=h.from&&dateStr<=h.to);
    const isLeave = leaveDates.includes(dateStr);
    if (!isFriSat && !isHoliday && !isLeave) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

function getLeaveDates(leaves, driverId) {
  const dates = [];
  leaves.filter(l=>l.driverId===driverId&&l.status==="approved").forEach(l=>{
    let d = new Date(l.from);
    const end = new Date(l.to);
    while (d <= end) { dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate()+1); }
  });
  return dates;
}

function getVehicleOffDates(offDays, plate) {
  const dates = [];
  offDays.filter(o=>o.vehiclePlate===plate).forEach(o=>{
    let d = new Date(o.from);
    const end = new Date(o.to);
    while (d <= end) { dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate()+1); }
  });
  return dates;
}

function getToday() { return new Date().toISOString().split("T")[0]; }

function getQuickRange(q) {
  const now = new Date();
  const today = getToday();
  if (q==="today") return { from:today, to:today };
  if (q==="week") { const d=new Date(now); d.setDate(d.getDate()-6); return { from:d.toISOString().split("T")[0], to:today }; }
  if (q==="month") { const d=new Date(now); d.setDate(1); return { from:d.toISOString().split("T")[0], to:today }; }
  const d=new Date(now); d.setFullYear(d.getFullYear()-1);
  return { from:d.toISOString().split("T")[0], to:today };
}

function getUserDC(user) {
  if (!user.dc || user.dc === "Head Office") return null;
  return user.dc;
}

function downloadCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map(r=>keys.map(k=>JSON.stringify(r[k]??(""))).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = filename; a.click();
}

function downloadPDF(elementId, filename) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const w = window.open("","_blank");
  w.document.write(`<html><head><title>${filename}</title>
    <style>body{font-family:Arial,sans-serif;font-size:13px;padding:20px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}
    th{background:#1A3A5C;color:white}tr:nth-child(even){background:#f8fafc}
    h2{color:#1A3A5C}.stat{display:inline-block;margin:8px;padding:10px 18px;background:#f1f5f9;border-radius:8px}
    @media print{button{display:none}}</style></head>
    <body>${el.innerHTML}<br/><button onclick="window.print()">🖨️ Print / Save PDF</button></body></html>`);
  w.document.close();
}

// Simple bar chart using SVG
function BarChart({ data, title, color="#1A3A5C", unit="" }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d=>d.value), 1);
  const W = 600, H = 200, PAD = 40, BAR_W = Math.min(50, (W - PAD*2) / data.length - 8);

  return (
    <div style={{ overflowX:"auto", marginTop:12 }}>
      <div style={{ fontWeight:700, fontSize:14, color:"#374151", marginBottom:8 }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H+60}`} style={{ width:"100%", maxWidth:W }}>
        {data.map((d,i)=>{
          const barH = Math.round((d.value/max)*(H-20));
          const x = PAD + i*((W-PAD*2)/data.length) + ((W-PAD*2)/data.length - BAR_W)/2;
          const y = H - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={BAR_W} height={barH} fill={d.color||color} rx={4} opacity={0.85} />
              <text x={x+BAR_W/2} y={y-5} textAnchor="middle" fontSize={11} fill="#374151" fontWeight="600">
                {d.value}{unit}
              </text>
              <text x={x+BAR_W/2} y={H+18} textAnchor="middle" fontSize={10} fill="#64748b">
                {d.label.length>8?d.label.slice(0,8)+"…":d.label}
              </text>
            </g>
          );
        })}
        <line x1={PAD-5} y1={H} x2={W-PAD+5} y2={H} stroke="#e2e8f0" strokeWidth={1.5} />
      </svg>
    </div>
  );
}

export default function Reports({ user, invoices, fuelLogs, vehicles, users, lang }) {
  const [tab, setTab] = useState("daily");
  const [tripLogs, setTripLogs] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [driverLeaves, setDriverLeaves] = useState([]);
  const [vehicleOffDays, setVehicleOffDays] = useState([]);
  const [additionalActivities, setAdditionalActivities] = useState([]);

  // Date range state
  const today = getToday();
  const monthStart = new Date(); monthStart.setDate(1);
  const [fromDate, setFromDate] = useState(monthStart.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(today);

  // Dropdown filters
  const [selDriver, setSelDriver] = useState("all");
  const [selVehicle, setSelVehicle] = useState("all");
  const [selDC, setSelDC] = useState("all");

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const isAdmin = user.role==="admin";
  const isLogistic = user.role==="logistic";
  const userDC = getUserDC(user);
  const { getShiftForDCAndDate } = useSettings();

  useEffect(() => {
    async function loadData() {
      try {
        const [tSnap, hSnap, lSnap, vSnap, aSnap] = await Promise.all([
          getDocs(collection(db, "tripLogs")),
          getDocs(collection(db, "publicHolidays")),
          getDocs(collection(db, "driverLeaves")),
          getDocs(collection(db, "vehicleOffDays")),
          getDocs(collection(db, "additionalActivities")),
        ]);
        setTripLogs(tSnap.docs.map(d=>({id:d.id,...d.data()})));
        setHolidays(hSnap.docs.map(d=>({id:d.id,...d.data()})));
        setDriverLeaves(lSnap.docs.map(d=>({id:d.id,...d.data()})));
        setVehicleOffDays(vSnap.docs.map(d=>({id:d.id,...d.data()})));
        setAdditionalActivities(aSnap.docs.map(d=>({id:d.id,...d.data()})));
      } catch(e) { console.error("Reports load:", e); }
    }
    loadData();
  }, []);

  function applyQuick(q) {
    const r = getQuickRange(q);
    setFromDate(r.from);
    setToDate(r.to);
  }

  const periodRange = { from: fromDate, to: toDate };

  // DC filter
  const allInv = userDC ? invoices.filter(i=>i.dc===userDC&&i.uploadBatch) : invoices.filter(i=>i.uploadBatch);

  // Filter by date range
  function filterByRange(invList) {
    return invList.filter(i=>{
      if (!i.date) return true;
      return i.date >= fromDate && i.date <= toDate;
    });
  }

  const myInv = filterByRange(allInv);
  const myLogs = userDC ? fuelLogs.filter(l=>l.dc===userDC) : fuelLogs;
  const myVeh = userDC ? vehicles.filter(v=>v.dc===userDC) : vehicles;
  const myUsers = userDC ? (users||[]).filter(u=>u.dc===userDC) : (users||[]);

  const tabs = isLogistic
    ? [["vehicle","🚗",t.vehicle],["fuel","⛽",t.fuel],["ledger","📒","Ledger"]]
    : [
        ["daily","📊",t.daily],["driver","👤",t.driver],
        ["vehicle","🚗",t.vehicle],["fuel","⛽",t.fuel],
        ["aging","⏱️",t.aging],["unassigned","⚪",t.unassignedReport],
        ["ledger","📒","Ledger"],["heatmap","🗺️","SLA Heatmap"]
      ];

  // Trip logs filtered by period + DC
  const myTripLogs = tripLogs.filter(tl=>{
    const inPeriod = tl.startDate>=periodRange.from && tl.startDate<=periodRange.to;
    const inDC = !userDC || tl.dc===userDC;
    return inPeriod && inDC;
  });

  // Build driver stats
  const driverMap = {};
  myInv.filter(i=>i.driverId).forEach(i=>{
    if(!driverMap[i.driverId]) driverMap[i.driverId]={name:i.driverName||i.driverId,driverId:i.driverId,dc:i.dc||"",delivered:0,failed:0,total:0,incity:0,outcity:0,totalKM:0,fuelUsed:0,activeDays:0,failReasons:{}};
    driverMap[i.driverId].total++;
    if(i.status==="delivered") driverMap[i.driverId].delivered++;
    if(i.status==="failed"){
      driverMap[i.driverId].failed++;
      const reason = i.failReason||"Unknown";
      driverMap[i.driverId].failReasons[reason]=(driverMap[i.driverId].failReasons[reason]||0)+1;
    }
    if(i.dtype==="incity") driverMap[i.driverId].incity++;
    if(i.dtype==="outcity") driverMap[i.driverId].outcity++;
  });

  myTripLogs.forEach(tl=>{
    if(!driverMap[tl.driverId]) driverMap[tl.driverId]={name:tl.driverName||tl.driverId,driverId:tl.driverId,dc:tl.dc||"",delivered:0,failed:0,total:0,incity:0,outcity:0,totalKM:0,fuelUsed:0,activeDays:0,failReasons:{}};
    driverMap[tl.driverId].totalKM=Math.round(((driverMap[tl.driverId].totalKM||0)+(tl.totalKM||0))*10)/10;
    driverMap[tl.driverId].fuelUsed=Math.round(((driverMap[tl.driverId].fuelUsed||0)+(tl.fuelUsed||0))*10)/10;
    driverMap[tl.driverId].activeDays=Math.round(((driverMap[tl.driverId].activeDays||0)+(tl.daysActive||1))*2)/2;
  });

  const workingDaysInPeriod = getWorkingDays(periodRange.from, periodRange.to, holidays, []);
  const periodDays = Math.max(1, workingDaysInPeriod);

  const driverStats = Object.values(driverMap).map(d=>{
    const leaveDates = getLeaveDates(driverLeaves, d.driverId);
    const workingDays = getWorkingDays(periodRange.from, periodRange.to, holidays, leaveDates);
    const unassignedDays = Math.max(0, workingDays - d.activeDays);
    const productivity = workingDays>0?Math.round(d.activeDays/workingDays*100):0;
    const avgPerDay = d.activeDays>0?Math.round((d.delivered/d.activeDays)*10)/10:0;
    return { ...d, rate:d.total>0?Math.round(d.delivered/d.total*100):0, workingDays, unassignedDays, productivity, avgPerDay };
  }).sort((a,b)=>b.productivity-a.productivity);

  // Driver dropdown list
  const driverList = myUsers.filter(u=>u.role==="driver");
  const vehicleList = myVeh;
  const dcList = ["Riyadh","Jeddah","Dammam"];

  // Filtered driver stats by dropdown
  const filteredDriverStats = selDriver==="all" ? driverStats : driverStats.filter(d=>d.driverId===selDriver);

  // Filtered vehicles by dropdown
  const filteredVehicles = selVehicle==="all" ? myVeh : myVeh.filter(v=>v.plate===selVehicle);

  // Filtered fuel logs by DC dropdown (admin only)
  const filteredFuelLogs = (!userDC && selDC!=="all") ? myLogs.filter(l=>l.dc===selDC) : myLogs;

  const agingInv = allInv.filter(i=>["pending","assigned","outstanding"].includes(i.status))
    .map(i=>({...i,days:Math.floor((new Date()-new Date(i.date))/(1000*60*60*24))}))
    .sort((a,b)=>b.days-a.days);

  const countable = myInv.filter(i=>!["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = myInv.filter(i=>i.status==="delivered").length;
  const rate = countable.length>0?Math.round(del/countable.length*100):0;

  // Summary card data
  const topDriver = driverStats[0];
  const topVehicle = myTripLogs.reduce((acc,tl)=>{
    acc[tl.vehiclePlate]=(acc[tl.vehiclePlate]||0)+(tl.totalKM||0);
    return acc;
  },{});
  const topVehiclePlate = Object.entries(topVehicle).sort((a,b)=>b[1]-a[1])[0];
  const criticalCount = agingInv.filter(i=>i.days>3).length;

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }} id="reports-root">

      <TabBar tabs={tabs} active={tab} onChange={t2=>{setTab(t2);setSelDriver("all");setSelVehicle("all");setSelDC("all");}} />

      {/* ── DATE RANGE + QUICK BUTTONS ── */}
      <div style={{ background:"white", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", flexWrap:"wrap", gap:12, alignItems:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{t.fromDate}:</span>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"7px 10px", fontSize:13, outline:"none", cursor:"pointer" }} />
          <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{t.toDate}:</span>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"7px 10px", fontSize:13, outline:"none", cursor:"pointer" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>{t.quickPeriod}</span>
          {[["today",t.today],["week",t.week],["month",t.month],["all",t.all]].map(([v,l])=>(
            <button key={v} onClick={()=>applyQuick(v)}
              style={{ padding:"6px 12px", borderRadius:7, border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#374151", cursor:"pointer", fontSize:12, fontWeight:600 }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── SUMMARY CARD — always visible ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginBottom:16 }}>
        <div style={{ background:"white", borderRadius:10, padding:"12px 16px", borderLeft:"4px solid #1A3A5C", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>📊 {t.deliveryRate}</div>
          <div style={{ fontSize:28, fontWeight:900, color:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444" }}>{rate}%</div>
        </div>
        <div style={{ background:"white", borderRadius:10, padding:"12px 16px", borderLeft:"4px solid #10b981", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>🏆 {t.bestDriver}</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#0f172a" }}>{topDriver?topDriver.name:"—"}</div>
          {topDriver&&<div style={{ fontSize:12, color:"#10b981" }}>{topDriver.productivity}% productivity</div>}
        </div>
        <div style={{ background:"white", borderRadius:10, padding:"12px 16px", borderLeft:"4px solid #0891b2", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>🚗 {t.mostActive}</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#0f172a" }}>{topVehiclePlate?topVehiclePlate[0]:"—"}</div>
          {topVehiclePlate&&<div style={{ fontSize:12, color:"#0891b2" }}>{Math.round(topVehiclePlate[1])} km</div>}
        </div>
        <div style={{ background:"white", borderRadius:10, padding:"12px 16px", borderLeft:"4px solid #ef4444", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>⏱️ {t.criticalAging}</div>
          <div style={{ fontSize:28, fontWeight:900, color:criticalCount>0?"#ef4444":"#10b981" }}>{criticalCount}</div>
        </div>
        <div style={{ background:"white", borderRadius:10, padding:"12px 16px", borderLeft:"4px solid #6366f1", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>📋 {t.total} Invoices</div>
          <div style={{ fontSize:28, fontWeight:900, color:"#6366f1" }}>{myInv.length}</div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB: DAILY STATUS
      ══════════════════════════════════════ */}
      {tab==="daily"&&(
        <div id="report-daily">
          <Card style={{ borderTop:"4px solid #1A3A5C" }}>
            <CardTitle>
              📊 {t.overall} — {userDC ? dcLabel(userDC,t) : "All Distribution Centers"}
              <button onClick={()=>downloadPDF("report-daily","daily_status.pdf")}
                style={{ marginLeft:"auto", background:"#6366f1", color:"white", border:"none", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                🖨️ {t.pdfDownload}
              </button>
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
              const n=myInv.filter(i=>i.inst===inst||i.inst===(inst==="Government"?"Govt":inst)).length;
              const d=myInv.filter(i=>(i.inst===inst||i.inst===(inst==="Government"?"Govt":inst))&&i.status==="delivered").length;
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

      {/* ══════════════════════════════════════
          TAB: DRIVER PERFORMANCE
      ══════════════════════════════════════ */}
      {tab==="driver"&&(
        <div id="report-driver">
          {/* Driver filter dropdown */}
          <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>👤 Filter Driver:</label>
            <select value={selDriver} onChange={e=>setSelDriver(e.target.value)}
              style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 14px", fontSize:13, outline:"none", background:"white", cursor:"pointer", minWidth:200 }}>
              <option value="all">{t.allDrivers} ({driverStats.length})</option>
              {driverList.map(d=><option key={d.uid} value={d.uid}>{d.name} — {d.dc}</option>)}
            </select>
            <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
              <button onClick={()=>downloadCSV(filteredDriverStats.map(d=>({Driver:d.name,DC:d.dc,Total:d.total,Delivered:d.delivered,Failed:d.failed,Rate:d.rate+"%",KM:d.totalKM,Fuel:d.fuelUsed+"L",ActiveDays:d.activeDays,WorkingDays:d.workingDays,UnassignedDays:d.unassignedDays,Productivity:d.productivity+"%"})),"driver_report.csv")}
                style={{ background:"#10b981", color:"white", border:"none", padding:"8px 14px", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                ⬇ {t.csvDownload}
              </button>
              <button onClick={()=>downloadPDF("report-driver","driver_report.pdf")}
                style={{ background:"#6366f1", color:"white", border:"none", padding:"8px 14px", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                🖨️ {t.pdfDownload}
              </button>
            </div>
          </div>

          <Card>
            <CardTitle>👤 {t.driverPerf}</CardTitle>
            {filteredDriverStats.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>{t.noData}</div>}
            {filteredDriverStats.map((d,i)=>(
              <div key={d.driverId} style={{ padding:"16px 0", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  <div>
                    <span style={{ fontWeight:800, fontSize:16 }}>#{i+1} {d.name}</span>
                    <span style={{ fontSize:13, color:"#64748b", marginLeft:10 }}>📍 {d.dc}</span>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontWeight:800, fontSize:20, color:d.rate>=80?"#10b981":d.rate>=60?"#f59e0b":"#ef4444" }}>{d.rate}% Rate</span>
                    <span style={{ fontWeight:800, fontSize:20, color:d.productivity>=80?"#10b981":d.productivity>=60?"#f59e0b":"#ef4444" }}>{d.productivity}% Productivity</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:8, marginBottom:10 }}>
                  <div style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                    <div style={{ color:"#64748b", fontSize:11 }}>Total Invoices</div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{d.total}</div>
                  </div>
                  <div style={{ background:"#f0fdf4", borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                    <div style={{ color:"#64748b", fontSize:11 }}>✅ Delivered</div>
                    <div style={{ fontWeight:700, fontSize:16, color:"#10b981" }}>{d.delivered}</div>
                  </div>
                  <div style={{ background:"#fef2f2", borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                    <div style={{ color:"#64748b", fontSize:11 }}>❌ Failed</div>
                    <div style={{ fontWeight:700, fontSize:16, color:"#ef4444" }}>{d.failed}</div>
                  </div>
                  <div style={{ background:"#f0f9ff", borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                    <div style={{ color:"#64748b", fontSize:11 }}>🛣️ KM Covered</div>
                    <div style={{ fontWeight:700, fontSize:16, color:"#0891b2" }}>{d.totalKM}</div>
                  </div>
                  <div style={{ background:"#fefce8", borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                    <div style={{ color:"#64748b", fontSize:11 }}>⛽ Fuel Used</div>
                    <div style={{ fontWeight:700, fontSize:16, color:"#f59e0b" }}>{d.fuelUsed}L</div>
                  </div>
                  <div style={{ background:"#f5f3ff", borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                    <div style={{ color:"#64748b", fontSize:11 }}>📦 Avg/Day</div>
                    <div style={{ fontWeight:700, fontSize:16, color:"#6366f1" }}>{d.avgPerDay}</div>
                  </div>
                </div>

                {/* Working days breakdown */}
                <div style={{ display:"flex", gap:16, fontSize:13, flexWrap:"wrap", marginBottom:10 }}>
                  <span style={{ color:"#6366f1", fontWeight:600 }}>📅 {d.activeDays} {t.activeDays} / {d.workingDays} {t.workingDays}</span>
                  <span style={{ color:d.unassignedDays>0?"#ef4444":"#10b981", fontWeight:600 }}>⚪ {d.unassignedDays} {t.unassignedDays}</span>
                  <span style={{ color:"#64748b" }}>🏙️ In-City: {d.incity} | 🛣️ Out-City: {d.outcity}</span>
                </div>

                {/* Delivery rate bar */}
                <div style={{ marginBottom:6 }}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:3 }}>Delivery Rate</div>
                  <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${d.rate}%`, height:"100%", background:d.rate>=80?"#10b981":d.rate>=60?"#f59e0b":"#ef4444", borderRadius:99 }} />
                  </div>
                </div>

                {/* Productivity bar */}
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:3 }}>Productivity</div>
                  <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${d.productivity}%`, height:"100%", background:d.productivity>=80?"#10b981":d.productivity>=60?"#f59e0b":"#ef4444", borderRadius:99 }} />
                  </div>
                </div>

                {/* Fail reasons breakdown */}
                {d.failed>0&&Object.keys(d.failReasons).length>0&&(
                  <div style={{ background:"#fef2f2", borderRadius:8, padding:"8px 12px", marginTop:6 }}>
                    <div style={{ fontWeight:600, fontSize:12, color:"#991b1b", marginBottom:6 }}>❌ {t.failReasons}:</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {Object.entries(d.failReasons).map(([reason,count])=>(
                        <span key={reason} style={{ fontSize:12, background:"#fee2e2", color:"#991b1b", padding:"3px 10px", borderRadius:99, fontWeight:600 }}>
                          {reason}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: VEHICLE UTILIZATION
      ══════════════════════════════════════ */}
      {tab==="vehicle"&&(
        <div id="report-vehicle">
          {/* Vehicle filter dropdown */}
          <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>🚗 Filter Vehicle:</label>
            <select value={selVehicle} onChange={e=>setSelVehicle(e.target.value)}
              style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 14px", fontSize:13, outline:"none", background:"white", cursor:"pointer", minWidth:200 }}>
              <option value="all">{t.allVehicles} ({myVeh.length})</option>
              {vehicleList.map(v=><option key={v.plate||v.id} value={v.plate}>{v.plate} — {v.dc}</option>)}
            </select>
            <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
              <button onClick={()=>{
                const data=filteredVehicles.map(v=>{
                  const vTrips=myTripLogs.filter(tl=>tl.vehiclePlate===v.plate);
                  const periodKM=vTrips.reduce((s,tl)=>s+(tl.totalKM||0),0);
                  const activeDays=vTrips.reduce((s,tl)=>s+(tl.daysActive||1),0);
                  return {Plate:v.plate,Type:v.type,DC:v.dc,Status:v.status,TotalKM:v.totalKM||0,PeriodKM:Math.round(periodKM),ActiveDays:Math.round(activeDays*2)/2,FuelUsed:Math.round(vTrips.reduce((s,tl)=>s+(tl.fuelUsed||0),0)*10)/10};
                });
                downloadCSV(data,"vehicle_report.csv");
              }} style={{ background:"#10b981", color:"white", border:"none", padding:"8px 14px", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                ⬇ {t.csvDownload}
              </button>
              <button onClick={()=>downloadPDF("report-vehicle","vehicle_report.pdf")}
                style={{ background:"#6366f1", color:"white", border:"none", padding:"8px 14px", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                🖨️ {t.pdfDownload}
              </button>
            </div>
          </div>

          <Card style={{ borderTop:"4px solid #1A3A5C" }}>
            <CardTitle>🚗 {t.vehUtil} — {userDC?dcLabel(userDC,t):"All Distribution Centers"}</CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
              <StatCard icon="🚗" label={t.total} value={myVeh.length} color="#6366f1" />
              <StatCard icon="✅" label={t.active} value={myVeh.filter(v=>v.status==="Active").length} color="#10b981" />
              <StatCard icon="🔧" label={t.maintenance} value={myVeh.filter(v=>v.status==="Maintenance").length} color="#f59e0b" />
              <StatCard icon="🛣️" label={t.totalKM} value={myVeh.reduce((s,v)=>s+(v.totalKM||0),0).toLocaleString()} color="#0891b2" />
            </div>
          </Card>

          {filteredVehicles.map(v=>{
            const vOffDates = getVehicleOffDates(vehicleOffDays, v.plate);
            const workingDays = getWorkingDays(periodRange.from, periodRange.to, holidays, vOffDates);
            const vTrips = myTripLogs.filter(tl=>tl.vehiclePlate===v.plate);
            const activeDays = vTrips.reduce((s,tl)=>s+(tl.daysActive||1),0);
            const periodKM = vTrips.reduce((s,tl)=>s+(tl.totalKM||0),0);
            const periodFuel = vTrips.reduce((s,tl)=>s+(tl.fuelUsed||0),0);
            const unassignedDays = Math.max(0, workingDays - activeDays);
            const productivity = workingDays>0?Math.round(activeDays/workingDays*100):0;
            const avgKMDay = activeDays>0?Math.round(periodKM/activeDays):0;

            // Doc expiry warnings
            const now = new Date();
            const checkExpiry = (dateStr)=>{
              if (!dateStr) return null;
              const d = new Date(dateStr);
              const diffDays = Math.ceil((d-now)/(1000*60*60*24));
              return diffDays;
            };
            const fahasLeft = checkExpiry(v.fahas);
            const istimaraLeft = checkExpiry(v.istimara);
            const insuranceLeft = checkExpiry(v.insurance);

            return (
              <Card key={v.plate||v.id} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:12 }}>
                  <span style={{ fontWeight:800, fontSize:16 }}>🚗 {v.plate}</span>
                  <span style={{ fontSize:14, color:"#64748b" }}>{v.type} {v.brand} {v.model}</span>
                  <span style={{ fontSize:13, fontWeight:600, padding:"4px 12px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                  <span style={{ fontSize:13, color:"#94a3b8" }}>📍 {v.dc}</span>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:8, marginBottom:12 }}>
                  <div style={{ background:"#f0f9ff", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:11, color:"#64748b" }}>🛣️ Total KM (All Time)</div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#0891b2" }}>{(v.totalKM||0).toLocaleString()}</div>
                  </div>
                  <div style={{ background:"#f5f3ff", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:11, color:"#64748b" }}>📅 Period KM</div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#6366f1" }}>{Math.round(periodKM*10)/10}</div>
                  </div>
                  <div style={{ background:"#fefce8", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:11, color:"#64748b" }}>⛽ Fuel Used</div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#f59e0b" }}>{Math.round(periodFuel*10)/10}L</div>
                  </div>
                  <div style={{ background:"#f0fdf4", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:11, color:"#64748b" }}>✅ Active Days</div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#10b981" }}>{Math.round(activeDays*2)/2}</div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:11, color:"#64748b" }}>📊 {t.avgKMday}</div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#374151" }}>{avgKMDay} km</div>
                  </div>
                  <div style={{ background:unassignedDays>0?"#fef2f2":"#f0fdf4", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:11, color:"#64748b" }}>⚪ Unassigned</div>
                    <div style={{ fontWeight:700, fontSize:15, color:unassignedDays>0?"#ef4444":"#10b981" }}>{Math.round(unassignedDays*2)/2} days</div>
                  </div>
                </div>

                {/* Productivity bar */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                    <span style={{ fontWeight:600 }}>🎯 Productivity</span>
                    <span style={{ fontWeight:800, color:productivity>=80?"#10b981":productivity>=60?"#f59e0b":"#ef4444" }}>{productivity}%</span>
                  </div>
                  <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${productivity}%`, height:"100%", background:productivity>=80?"#10b981":productivity>=60?"#f59e0b":"#ef4444", borderRadius:99 }} />
                  </div>
                </div>

                {/* Document expiry warnings */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[["Fahas",fahasLeft,v.fahas],["Istimara",istimaraLeft,v.istimara],["Insurance",insuranceLeft,v.insurance]].map(([label,left,date])=>{
                    if (!date) return null;
                    const color = left<0?"#ef4444":left<=30?"#f59e0b":"#10b981";
                    const bg = left<0?"#fee2e2":left<=30?"#fef3c7":"#f0fdf4";
                    return (
                      <span key={label} style={{ fontSize:12, padding:"4px 10px", borderRadius:8, background:bg, color, fontWeight:600 }}>
                        📄 {label}: {date} {left<0?"(EXPIRED ❌)":left<=30?`(${left}d left ⚠️)`:`(${left}d)`}
                      </span>
                    );
                  })}
                  {v.nextOilKM&&(
                    <span style={{ fontSize:12, padding:"4px 10px", borderRadius:8, background:"#f0f9ff", color:"#0891b2", fontWeight:600 }}>
                      🔧 Next Oil: {v.nextOilKM} km
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: FUEL REPORT
      ══════════════════════════════════════ */}
      {tab==="fuel"&&(
        <div id="report-fuel">
          {/* DC filter for Admin */}
          {!userDC&&(
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>📍 Filter DC:</label>
              <select value={selDC} onChange={e=>setSelDC(e.target.value)}
                style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 14px", fontSize:13, outline:"none", background:"white", cursor:"pointer" }}>
                <option value="all">{t.allDCs}</option>
                {dcList.map(dc=><option key={dc} value={dc}>{dc}</option>)}
              </select>
            </div>
          )}

          <Card style={{ borderTop:"4px solid #f59e0b" }}>
            <CardTitle>⛽ {t.fuelRep} — {userDC?dcLabel(userDC,t):selDC==="all"?"All Distribution Centers":selDC}
              <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                <button onClick={()=>downloadCSV(filteredFuelLogs.map(l=>({ID:l.id,Date:l.date,Vehicle:l.vehicle,Driver:l.driver,Liters:l.liters,SAR:l.sar,KM:l.tripKM,Efficiency:l.liters>0?(l.tripKM/l.liters).toFixed(1)+" km/L":"-",DC:l.dc})),"fuel_report.csv")}
                  style={{ background:"#10b981", color:"white", border:"none", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                  ⬇ {t.csvDownload}
                </button>
                <button onClick={()=>downloadPDF("report-fuel","fuel_report.pdf")}
                  style={{ background:"#6366f1", color:"white", border:"none", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                  🖨️ {t.pdfDownload}
                </button>
              </div>
            </CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
              <StatCard icon="⛽" label={t.totalLiters} value={filteredFuelLogs.reduce((s,l)=>s+(l.liters||0),0)+"L"} color="#f59e0b" />
              <StatCard icon="💰" label={t.totalCost} value={"SAR "+filteredFuelLogs.reduce((s,l)=>s+(l.sar||0),0).toLocaleString()} color="#ef4444" />
              <StatCard icon="🛣️" label="Trip KM (at refuel)" value={filteredFuelLogs.reduce((s,l)=>s+(l.tripKM||0),0)+" km"} color="#6366f1" />
              <StatCard icon="📊" label={t.avgEff} value={filteredFuelLogs.reduce((s,l)=>s+(l.liters||0),0)>0?(filteredFuelLogs.reduce((s,l)=>s+(l.tripKM||0),0)/filteredFuelLogs.reduce((s,l)=>s+(l.liters||0),0)).toFixed(1)+" km/L":"-"} color="#10b981" />
            </div>

            {/* Bar chart — fuel per vehicle */}
            {(()=>{
              const vFuel = {};
              filteredFuelLogs.forEach(l=>{ vFuel[l.vehicle]=(vFuel[l.vehicle]||0)+(l.liters||0); });
              const chartData = Object.entries(vFuel).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([label,value])=>({label,value:Math.round(value)}));
              return chartData.length>1?<BarChart data={chartData} title="⛽ Fuel Consumption by Vehicle (Liters)" color="#f59e0b" unit="L" />:null;
            })()}

            {/* Bar chart — fuel cost per DC */}
            {!userDC&&selDC==="all"&&(()=>{
              const dcFuel = {};
              filteredFuelLogs.forEach(l=>{ dcFuel[l.dc]=(dcFuel[l.dc]||0)+(l.sar||0); });
              const chartData = Object.entries(dcFuel).map(([label,value])=>({label,value:Math.round(value),color:DC_COLORS[label]||"#6366f1"}));
              return chartData.length>0?<BarChart data={chartData} title="💰 Fuel Cost by DC (SAR)" unit=" SAR" />:null;
            })()}
          </Card>

          {/* DC breakdown — Admin all DCs */}
          {!userDC&&selDC==="all"&&["Riyadh","Jeddah","Dammam"].map((dc,idx)=>{
            const dl=filteredFuelLogs.filter(l=>l.dc===dc);
            const colors=["#1A3A5C","#0f766e","#7c3aed"];
            return (
              <Card key={dc} style={{ borderTop:`4px solid ${colors[idx]}` }}>
                <CardTitle style={{ color:colors[idx] }}>📍 {dcLabel(dc,t)}</CardTitle>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  <StatCard icon="⛽" label={t.totalLiters} value={dl.reduce((s,l)=>s+(l.liters||0),0)+"L"} color="#f59e0b" />
                  <StatCard icon="💰" label="SAR" value={"SAR "+dl.reduce((s,l)=>s+(l.sar||0),0)} color="#ef4444" />
                  <StatCard icon="🛣️" label={t.totalKM} value={dl.reduce((s,l)=>s+(l.tripKM||0),0)+" km"} color="#6366f1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: UNASSIGNED REPORT
      ══════════════════════════════════════ */}
      {tab==="unassigned"&&(
        <div id="report-unassigned">
          {/* Driver filter */}
          <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>👤 Filter Driver:</label>
            <select value={selDriver} onChange={e=>setSelDriver(e.target.value)}
              style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 14px", fontSize:13, outline:"none", background:"white", cursor:"pointer", minWidth:200 }}>
              <option value="all">{t.allDrivers}</option>
              {driverList.map(d=><option key={d.uid} value={d.uid}>{d.name} — {d.dc}</option>)}
            </select>
            <button onClick={()=>downloadPDF("report-unassigned","unassigned_report.pdf")}
              style={{ marginLeft:"auto", background:"#6366f1", color:"white", border:"none", padding:"8px 14px", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600 }}>
              🖨️ {t.pdfDownload}
            </button>
          </div>

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
                    {["#","Driver","DC","Total","Delivered","Rate","Productivity","Status"].map(h=>(
                      <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontWeight:700, color:"white", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myUsers.filter(u=>u.role==="driver"&&(selDriver==="all"||u.uid===selDriver)).map((driver,i)=>{
                    const dStats = driverStats.find(d=>d.driverId===driver.uid)||{delivered:0,failed:0,total:0,rate:0,productivity:0};
                    const isUnassigned = dStats.total===0;
                    return (
                      <tr key={driver.uid} style={{ background:isUnassigned?"#fff7ed":i%2===0?"white":"#f8fafc" }}>
                        <td style={{ padding:"12px 14px", color:"#94a3b8" }}>{i+1}</td>
                        <td style={{ padding:"12px 14px", fontWeight:600 }}>{driver.name}</td>
                        <td style={{ padding:"12px 14px", color:"#64748b" }}>{driver.dc}</td>
                        <td style={{ padding:"12px 14px", textAlign:"center" }}>{dStats.total}</td>
                        <td style={{ padding:"12px 14px", textAlign:"center", color:"#10b981", fontWeight:700 }}>{dStats.delivered}</td>
                        <td style={{ padding:"12px 14px", textAlign:"center" }}>
                          <span style={{ fontWeight:700, color:dStats.rate>=80?"#10b981":dStats.rate>=50?"#f59e0b":"#ef4444" }}>{dStats.rate}%</span>
                        </td>
                        <td style={{ padding:"12px 14px", textAlign:"center" }}>
                          <span style={{ fontWeight:700, color:dStats.productivity>=80?"#10b981":dStats.productivity>=50?"#f59e0b":"#ef4444" }}>{dStats.productivity}%</span>
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
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: AGING REPORT
      ══════════════════════════════════════ */}
      {tab==="aging"&&(
        <div id="report-aging">
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
            <button onClick={()=>downloadPDF("report-aging","aging_report.pdf")}
              style={{ background:"#6366f1", color:"white", border:"none", padding:"8px 14px", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600 }}>
              🖨️ {t.pdfDownload}
            </button>
          </div>

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
                <span style={{ fontSize:13, color:"#64748b" }}>{inv.dc}</span>
                <span style={{ fontSize:13, color:"#64748b" }}>{inv.status}</span>
                <span style={{ fontSize:13, fontWeight:600, padding:"3px 10px", borderRadius:99,
                  background:inv.days<=1?"#d1fae5":inv.days<=3?"#fef3c7":"#fee2e2",
                  color:inv.days<=1?"#065f46":inv.days<=3?"#92400e":"#991b1b"
                }}>
                  {inv.days} {t.days} — {inv.days<=1?t.fresh:inv.days<=3?t.aging2:t.critical}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: LEDGER — Driver + Vehicle
      ══════════════════════════════════════ */}
      {tab==="ledger"&&(
        <LedgerTab
          tripLogs={tripLogs}
          invoices={invoices}
          driverLeaves={driverLeaves}
          fuelLogs={fuelLogs}
          vehicleOffDays={vehicleOffDays}
          holidays={holidays}
          additionalActivities={additionalActivities}
          vehicles={vehicles}
          users={users}
          user={user}
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          t={t}
          getShiftForDCAndDate={getShiftForDCAndDate}
          userDC={userDC}
        />

      {/* ══════════════════════════════════════
          TAB: SLA HEATMAP
      ══════════════════════════════════════ */}
      {tab==="heatmap"&&(
        <SlaHeatmap
          invoices={invoices}
          vehicles={myVeh}
          users={myUsers}
          user={user}
          tripLogs={tripLogs}
          vehicleOffDays={vehicleOffDays}
          userDC={userDC}
          t={t}
          lang={lang}
        />
      )}
    </div>
  );
}

// ── LEDGER TAB ────────────────────────────────────────────────────────────────
function LedgerTab({ tripLogs, invoices, driverLeaves, fuelLogs, vehicleOffDays, holidays, additionalActivities, vehicles, users, user, fromDate, toDate, setFromDate, setToDate, t, getShiftForDCAndDate, userDC }) {
  const [subTab, setSubTab] = useState("driver");
  const [selDriver, setSelDriver] = useState("all");
  const [selVehicle, setSelVehicle] = useState("all");
  const [viewMode, setViewMode] = useState("monthly"); // daily | weekly | monthly

  const driverList = (users||[]).filter(u=>u.role==="driver"&&(!userDC||u.dc===userDC));
  const vehicleList = vehicles.filter(v=>!userDC||v.dc===userDC);

  const inputStyle = { border:"1.5px solid #e2e8f0", borderRadius:8, padding:"7px 10px", fontSize:13, outline:"none", cursor:"pointer" };

  // Get dates in range
  function getDatesInRange(from, to) {
    const dates=[]; let d=new Date(from); const end=new Date(to);
    while(d<=end){ dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate()+1); }
    return dates;
  }

  function isWorkingDay(dateStr) {
    const d=new Date(dateStr); const day=d.getDay();
    if(day===5||day===6) return false; // Fri/Sat
    if(holidays.some(h=>dateStr>=h.from&&dateStr<=h.to)) return false;
    return true;
  }

  function getHoursFromShift(dc, dateStr) {
    const shift = getShiftForDCAndDate(dc, dateStr);
    return shift.hours || 8;
  }

  function downloadCSV(rows, filename) {
    if(!rows.length) return;
    const keys=Object.keys(rows[0]);
    const csv=[keys.join(","),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??"",-0)).join(","))].join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=filename+".csv"; a.click();
  }

  // ── DRIVER LEDGER ──────────────────────────────────────────────────────────
  function DriverLedger() {
    const driver = selDriver!=="all" ? driverList.find(d=>d.uid===selDriver) : null;
    const dc = driver?.dc || userDC || "Riyadh";

    const myLogs = tripLogs.filter(tl=>
      (selDriver==="all"||tl.driverId===selDriver) &&
      tl.startDate>=fromDate && tl.startDate<=toDate
    );
    const myInvs = invoices.filter(i=>
      (selDriver==="all"||i.driverId===selDriver) &&
      i.date>=fromDate && i.date<=toDate
    );
    const myLeaves = driverLeaves.filter(l=>
      (selDriver==="all"||l.driverId===selDriver) &&
      l.status==="approved"
    );
    const myActivities = additionalActivities.filter(a=>
      (selDriver==="all"||a.driverId===selDriver)
    );

    const workDates = getDatesInRange(fromDate, toDate).filter(d=>isWorkingDay(d));
    const leaveDates=new Set(); myLeaves.forEach(l=>{let d=new Date(l.from);while(d<=new Date(l.to)){leaveDates.add(d.toISOString().split("T")[0]);d.setDate(d.getDate()+1);}});

    const workingDays=workDates.length;
    const leaveDaysCount=[...leaveDates].filter(d=>workDates.includes(d)).length;
    const actualWorkingDays=workingDays-leaveDaysCount;

    // Build daily rows
    const dailyRows = workDates.map(dateStr=>{
      const dayLogs=myLogs.filter(tl=>tl.startDate===dateStr);
      const dayInvs=myInvs.filter(i=>i.date===dateStr);
      const isLeave=leaveDates.has(dateStr);
      const shiftHrs=getHoursFromShift(dc,dateStr);
      const opHrs=dayLogs.reduce((s,tl)=>s+(tl.operationalHours||0),0);
      const standbyHrs=Math.max(0,shiftHrs-opHrs);
      const util=shiftHrs>0?Math.round(opHrs/shiftHrs*100):0;
      const km=dayLogs.reduce((s,tl)=>s+(tl.totalKM||0),0);
      const delivered=dayInvs.filter(i=>i.status==="delivered").length;
      const failed=dayInvs.filter(i=>i.status==="failed").length;
      const inCity=dayInvs.filter(i=>i.dtype==="incity").length;
      const outCity=dayInvs.filter(i=>i.dtype==="outcity").length;
      const activity=myActivities.filter(a=>a.submittedAt?.split("T")[0]===dateStr&&a.completed);
      const actType=dayLogs.some(tl=>tl.type==="additional_activity")?"Additional Activity":dayLogs.length>0?"Invoice Delivery":isLeave?"Leave":"Unassigned";
      const vehicle=dayLogs[0]?.vehiclePlate||"—";
      return { date:dateStr, actType, vehicle, inCity, outCity, km:Math.round(km*10)/10, shiftHrs, opHrs:Math.round(opHrs*100)/100, standbyHrs:Math.round(standbyHrs*100)/100, util, invoices:dayInvs.length, delivered, failed, isLeave };
    });

    const totalOpHrs=dailyRows.reduce((s,r)=>s+r.opHrs,0);
    const totalShiftHrs=dailyRows.reduce((s,r)=>s+r.shiftHrs,0);
    const totalKM=dailyRows.reduce((s,r)=>s+r.km,0);
    const totalDelivered=dailyRows.reduce((s,r)=>s+r.delivered,0);
    const totalFailed=dailyRows.reduce((s,r)=>s+r.failed,0);
    const totalInvs=dailyRows.reduce((s,r)=>s+r.invoices,0);
    const activeDays=dailyRows.filter(r=>r.actType!=="Unassigned"&&r.actType!=="Leave").length;
    const totalUtil=totalShiftHrs>0?Math.round(totalOpHrs/totalShiftHrs*100):0;
    const standbyHrsTotal=Math.max(0,totalShiftHrs-totalOpHrs);
    const deliveryRate=totalInvs>0?Math.round(totalDelivered/totalInvs*100):0;

    return (
      <div>
        <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
          <select value={selDriver} onChange={e=>setSelDriver(e.target.value)} style={{...inputStyle,minWidth:160}}>
            <option value="all">All Drivers</option>
            {driverList.map(d=><option key={d.uid} value={d.uid}>{d.name} ({d.dc})</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={inputStyle} />
          <span style={{fontSize:13,color:"#64748b"}}>→</span>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={inputStyle} />
          <button onClick={()=>downloadCSV(dailyRows,"driver_ledger")} style={{padding:"7px 14px",borderRadius:7,border:"1px solid #6366f1",background:"white",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:13}}>📥 CSV</button>
        </div>

        {/* Monthly Summary */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16 }}>
          {[
            {label:"Working Days",val:workingDays,color:"#1A3A5C"},
            {label:"Active Days",val:activeDays,color:"#10b981"},
            {label:"Leave Days",val:leaveDaysCount,color:"#f59e0b"},
            {label:"Unassigned Days",val:Math.max(0,actualWorkingDays-activeDays),color:"#64748b"},
            {label:"Shift Hours",val:Math.round(totalShiftHrs*10)/10+"h",color:"#6366f1"},
            {label:"Operational Hours",val:Math.round(totalOpHrs*10)/10+"h",color:"#0891b2"},
            {label:"Standby Hours",val:Math.round(standbyHrsTotal*10)/10+"h",color:"#94a3b8"},
            {label:"Utilization %",val:totalUtil+"%",color:totalUtil>=80?"#10b981":totalUtil>=50?"#f59e0b":"#ef4444"},
            {label:"Total KM",val:Math.round(totalKM)+" km",color:"#7c3aed"},
            {label:"Delivery Rate",val:deliveryRate+"%",color:deliveryRate>=80?"#10b981":"#f59e0b"},
          ].map(s=>(
            <div key={s.label} style={{background:"white",borderRadius:8,padding:"10px 12px",borderLeft:"3px solid "+s.color,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>{s.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Daily Rows */}
        <div style={{ overflowX:"auto" }}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#f8fafc"}}>
                {["Date","Activity","Vehicle","In-City","Out-City","Shift Hrs","Op Hrs","Standby Hrs","Util%","KM","Invoices","Del","Failed"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:"#374151",borderBottom:"2px solid #e2e8f0",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((r,i)=>(
                <tr key={r.date} style={{background:i%2===0?"white":"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"7px 10px",fontWeight:600,whiteSpace:"nowrap"}}>{r.date}</td>
                  <td style={{padding:"7px 10px"}}>
                    <span style={{fontSize:12,fontWeight:600,padding:"2px 7px",borderRadius:5,
                      background:r.actType==="Invoice Delivery"?"#dbeafe":r.actType==="Additional Activity"?"#f3e8ff":r.actType==="Leave"?"#fef3c7":"#f1f5f9",
                      color:r.actType==="Invoice Delivery"?"#1e40af":r.actType==="Additional Activity"?"#7c3aed":r.actType==="Leave"?"#92400e":"#475569"
                    }}>{r.actType}</span>
                  </td>
                  <td style={{padding:"7px 10px",color:"#64748b"}}>{r.vehicle}</td>
                  <td style={{padding:"7px 10px",textAlign:"center"}}>{r.inCity||"—"}</td>
                  <td style={{padding:"7px 10px",textAlign:"center"}}>{r.outCity||"—"}</td>
                  <td style={{padding:"7px 10px",color:"#6366f1",fontWeight:600}}>{r.shiftHrs}h</td>
                  <td style={{padding:"7px 10px",color:"#0891b2",fontWeight:600}}>{r.opHrs}h</td>
                  <td style={{padding:"7px 10px",color:"#94a3b8"}}>{r.standbyHrs}h</td>
                  <td style={{padding:"7px 10px",fontWeight:600,color:r.util>=80?"#10b981":r.util>=50?"#f59e0b":"#ef4444"}}>{r.util}%</td>
                  <td style={{padding:"7px 10px"}}>{r.km}</td>
                  <td style={{padding:"7px 10px",textAlign:"center"}}>{r.invoices||"—"}</td>
                  <td style={{padding:"7px 10px",textAlign:"center",color:"#10b981",fontWeight:r.delivered>0?700:400}}>{r.delivered||"—"}</td>
                  <td style={{padding:"7px 10px",textAlign:"center",color:"#ef4444",fontWeight:r.failed>0?700:400}}>{r.failed||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── VEHICLE LEDGER ──────────────────────────────────────────────────────────
  function VehicleLedger() {
    const vehicle = selVehicle!=="all" ? vehicleList.find(v=>v.plate===selVehicle) : null;
    const dc = vehicle?.dc || userDC || "Riyadh";

    const myLogs = tripLogs.filter(tl=>
      (selVehicle==="all"||tl.vehiclePlate===selVehicle) &&
      tl.startDate>=fromDate && tl.startDate<=toDate
    );
    const myInvs = invoices.filter(i=>
      (selVehicle==="all"||i.vehicle===selVehicle) &&
      i.date>=fromDate && i.date<=toDate
    );
    const myFuelLogs = fuelLogs.filter(l=>
      (selVehicle==="all"||l.vehicle===selVehicle) &&
      l.date>=fromDate && l.date<=toDate
    );
    const myOffDays = vehicleOffDays.filter(o=>
      (selVehicle==="all"||o.vehiclePlate===selVehicle)
    );

    const workDates = getDatesInRange(fromDate, toDate).filter(d=>isWorkingDay(d));
    const offDayDates=new Set(); myOffDays.forEach(o=>{let d=new Date(o.from);while(d<=new Date(o.to)){offDayDates.add(d.toISOString().split("T")[0]);d.setDate(d.getDate()+1);}});

    const workingDays=workDates.length;
    const maintDays=[...offDayDates].filter(d=>workDates.includes(d)).length;

    const dailyRows = workDates.map(dateStr=>{
      const dayLogs=myLogs.filter(tl=>tl.startDate===dateStr);
      const dayFuel=myFuelLogs.filter(l=>l.date===dateStr);
      const dayInvs=myInvs.filter(i=>i.date===dateStr);
      const isMaint=offDayDates.has(dateStr);
      const shiftHrs=getHoursFromShift(dc,dateStr);
      const onRoadHrs=dayLogs.reduce((s,tl)=>s+(tl.operationalHours||0),0);
      const standbyHrs=Math.max(0,shiftHrs-onRoadHrs);
      const util=shiftHrs>0?Math.round(onRoadHrs/shiftHrs*100):0;
      const km=dayLogs.reduce((s,tl)=>s+(tl.totalKM||0),0);
      const fuelAdded=dayFuel.reduce((s,l)=>s+(l.liters||0),0);
      const fuelUsed=dayLogs.reduce((s,tl)=>s+(tl.fuelUsed||0),0);
      const driver=dayLogs[0]?.driverName||"—";
      const actType=isMaint?"Maintenance":dayLogs.length>0?"On-Road":"Standby";
      return {date:dateStr,actType,driver,km:Math.round(km*10)/10,shiftHrs,onRoadHrs:Math.round(onRoadHrs*100)/100,standbyHrs:Math.round(standbyHrs*100)/100,util,fuelAdded:Math.round(fuelAdded*10)/10,fuelUsed:Math.round(fuelUsed*10)/10,invoices:dayInvs.length,isMaint};
    });

    const totalOnRoad=dailyRows.reduce((s,r)=>s+r.onRoadHrs,0);
    const totalShift=dailyRows.reduce((s,r)=>s+r.shiftHrs,0);
    const totalKM=dailyRows.reduce((s,r)=>s+r.km,0);
    const totalFuelAdded=dailyRows.reduce((s,r)=>s+r.fuelAdded,0);
    const totalFuelUsed=dailyRows.reduce((s,r)=>s+r.fuelUsed,0);
    const onRoadDays=dailyRows.filter(r=>r.actType==="On-Road").length;
    const totalUtil=totalShift>0?Math.round(totalOnRoad/totalShift*100):0;
    const kmpl=totalFuelUsed>0?Math.round(totalKM/totalFuelUsed*10)/10:0;

    return (
      <div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <select value={selVehicle} onChange={e=>setSelVehicle(e.target.value)} style={{...inputStyle,minWidth:160}}>
            <option value="all">All Vehicles</option>
            {vehicleList.map(v=><option key={v.plate} value={v.plate}>{v.plate} ({v.dc})</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={inputStyle} />
          <span style={{fontSize:13,color:"#64748b"}}>→</span>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={inputStyle} />
          <button onClick={()=>downloadCSV(dailyRows,"vehicle_ledger")} style={{padding:"7px 14px",borderRadius:7,border:"1px solid #6366f1",background:"white",color:"#6366f1",cursor:"pointer",fontWeight:600,fontSize:13}}>📥 CSV</button>
        </div>

        {/* Monthly Summary */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Working Days",val:workingDays,color:"#1A3A5C"},
            {label:"On-Road Days",val:onRoadDays,color:"#10b981"},
            {label:"Maintenance Days",val:maintDays,color:"#f59e0b"},
            {label:"Standby Days",val:Math.max(0,workingDays-onRoadDays-maintDays),color:"#64748b"},
            {label:"Shift Hours",val:Math.round(totalShift*10)/10+"h",color:"#6366f1"},
            {label:"On-Road Hours",val:Math.round(totalOnRoad*10)/10+"h",color:"#0891b2"},
            {label:"Standby Hours",val:Math.round(Math.max(0,totalShift-totalOnRoad)*10)/10+"h",color:"#94a3b8"},
            {label:"Utilization %",val:totalUtil+"%",color:totalUtil>=80?"#10b981":totalUtil>=50?"#f59e0b":"#ef4444"},
            {label:"Total KM",val:Math.round(totalKM)+" km",color:"#7c3aed"},
            {label:"Fuel Added",val:Math.round(totalFuelAdded*10)/10+"L",color:"#0ea5e9"},
            {label:"Fuel Consumed",val:Math.round(totalFuelUsed*10)/10+"L",color:"#ef4444"},
            {label:"KMPL Efficiency",val:kmpl+" km/L",color:kmpl>=10?"#10b981":"#f59e0b"},
          ].map(s=>(
            <div key={s.label} style={{background:"white",borderRadius:8,padding:"10px 12px",borderLeft:"3px solid "+s.color,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>{s.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Daily Rows */}
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#f8fafc"}}>
                {["Date","Activity","Driver","KM","Shift Hrs","On-Road Hrs","Standby Hrs","Util%","Fuel Added","Fuel Used","Invoices"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:"#374151",borderBottom:"2px solid #e2e8f0",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((r,i)=>(
                <tr key={r.date} style={{background:i%2===0?"white":"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"7px 10px",fontWeight:600,whiteSpace:"nowrap"}}>{r.date}</td>
                  <td style={{padding:"7px 10px"}}>
                    <span style={{fontSize:12,fontWeight:600,padding:"2px 7px",borderRadius:5,
                      background:r.actType==="On-Road"?"#dbeafe":r.actType==="Maintenance"?"#fef3c7":"#f1f5f9",
                      color:r.actType==="On-Road"?"#1e40af":r.actType==="Maintenance"?"#92400e":"#475569"
                    }}>{r.actType}</span>
                  </td>
                  <td style={{padding:"7px 10px",color:"#64748b"}}>{r.driver}</td>
                  <td style={{padding:"7px 10px"}}>{r.km||"—"}</td>
                  <td style={{padding:"7px 10px",color:"#6366f1",fontWeight:600}}>{r.shiftHrs}h</td>
                  <td style={{padding:"7px 10px",color:"#0891b2",fontWeight:600}}>{r.onRoadHrs}h</td>
                  <td style={{padding:"7px 10px",color:"#94a3b8"}}>{r.standbyHrs}h</td>
                  <td style={{padding:"7px 10px",fontWeight:600,color:r.util>=80?"#10b981":r.util>=50?"#f59e0b":"#ef4444"}}>{r.util}%</td>
                  <td style={{padding:"7px 10px",color:"#0ea5e9"}}>{r.fuelAdded||"—"}</td>
                  <td style={{padding:"7px 10px",color:"#ef4444"}}>{r.fuelUsed||"—"}</td>
                  <td style={{padding:"7px 10px",textAlign:"center"}}>{r.invoices||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tab switcher */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["driver","👤 Driver Ledger"],["vehicle","🚗 Vehicle Ledger"]].map(([v,l])=>(
          <button key={v} onClick={()=>setSubTab(v)}
            style={{padding:"10px 18px",borderRadius:8,border:"none",background:subTab===v?"#1A3A5C":"#f1f5f9",color:subTab===v?"white":"#374151",cursor:"pointer",fontSize:14,fontWeight:600}}>
            {l}
          </button>
        ))}
      </div>
      {subTab==="driver"&&<DriverLedger />}
      {subTab==="vehicle"&&<VehicleLedger />}
    </div>
  );
}


// ── SLA HEATMAP ───────────────────────────────────────────────────────────────
// Props: invoices, vehicles, users, user, tripLogs, vehicleOffDays, userDC, t, lang
function SlaHeatmap({ invoices, vehicles, users, user, tripLogs, vehicleOffDays, userDC, t, lang }) {
  const [hmView, setHmView]   = useState("driver"); // "driver" | "vehicle"
  const [hmDC,   setHmDC]     = useState(userDC || "all");
  const [tooltip, setTooltip] = useState(null);

  const now = new Date();
  const [hmMonth, setHmMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`
  );

  const [hmYear, hmMon] = hmMonth.split("-").map(Number);
  const daysInMonth = new Date(hmYear, hmMon, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i+1).padStart(2,"0");
    return `${hmMonth}-${d}`;
  });

  const rtl = lang === "ar";

  // Filter invoices for this month + DC
  const hmInv = invoices.filter(inv => {
    if (!inv.date || !inv.date.startsWith(hmMonth)) return false;
    if (hmDC !== "all" && inv.dc !== hmDC) return false;
    return true;
  });

  // Driver + vehicle lists
  const driverList  = (users||[]).filter(u => u.role === "driver" && (hmDC === "all" || u.dc === hmDC));
  const vehicleList = vehicles.filter(v => hmDC === "all" || v.dc === hmDC);

  // ── Cell status: driver ───────────────────────────────────────────────────
  function getDriverCellStatus(driverId, dateStr) {
    const dayInv = hmInv.filter(i => i.driverId === driverId && i.date === dateStr);
    if (!dayInv.length) return "none";

    const delivered      = dayInv.filter(i => i.status === "delivered");
    const failed         = dayInv.filter(i => i.status === "failed");
    const outcityPending = dayInv.filter(i =>
      i.dtype === "outcity" &&
      ["pending","assigned","intransit","outstanding"].includes(i.status)
    );
    const otherPending   = dayInv.filter(i =>
      i.dtype !== "outcity" &&
      ["pending","assigned","intransit","outstanding"].includes(i.status)
    );

    if (failed.length > 0 && delivered.length === 0 && outcityPending.length === 0) return "red";
    if (delivered.length > 0 && failed.length === 0 && otherPending.length === 0) return "green";
    if (outcityPending.length > 0 && failed.length === 0 && otherPending.length === 0) return "yellow";
    return "yellow";
  }

  function driverCellColor(s) {
    if (s === "green")  return "#10b981";
    if (s === "yellow") return "#f59e0b";
    if (s === "red")    return "#ef4444";
    return "#f1f5f9";
  }

  function driverCellLabel(s) {
    if (s === "green")  return t.onTime   || "On-Time";
    if (s === "yellow") return t.partialSla || "Partial/Ext.SLA";
    if (s === "red")    return "Failed";
    return t.noActivity || "No Activity";
  }

  // ── Cell status: vehicle ──────────────────────────────────────────────────
  function getVehicleCellStatus(plate, dateStr) {
    const onRoad = tripLogs.some(tl =>
      tl.vehiclePlate === plate &&
      (tl.startDate === dateStr || tl.date === dateStr)
    );
    const inMaint = vehicleOffDays.some(od =>
      od.vehiclePlate === plate &&
      dateStr >= od.from && dateStr <= od.to
    );
    if (onRoad)  return "green";
    if (inMaint) return "orange";
    return "none";
  }

  function vehicleCellColor(s) {
    if (s === "green")  return "#10b981";
    if (s === "orange") return "#f97316";
    return "#f1f5f9";
  }

  // ── Month summary counters ─────────────────────────────────────────────────
  const driverAllCells   = driverList.flatMap(d => days.map(day => getDriverCellStatus(d.uid, day)));
  const vehicleAllCells  = vehicleList.flatMap(v => days.map(day => getVehicleCellStatus(v.plate, day)));
  const driverGreen      = driverAllCells.filter(s => s === "green").length;
  const driverYellow     = driverAllCells.filter(s => s === "yellow").length;
  const driverRed        = driverAllCells.filter(s => s === "red").length;
  const driverActive     = driverAllCells.filter(s => s !== "none").length;
  const vehicleOnRoad    = vehicleAllCells.filter(s => s === "green").length;
  const vehicleMaint     = vehicleAllCells.filter(s => s === "orange").length;
  const vehicleStandby   = vehicleAllCells.filter(s => s === "none").length;
  const vehicleUtil      = vehicleAllCells.length > 0
    ? Math.round(vehicleOnRoad / vehicleAllCells.length * 100) : 0;

  const CELL_W = 26;
  const LABEL_W = 150;

  const inputSt = { border:"1.5px solid #e2e8f0", borderRadius:8, padding:"7px 10px", fontSize:13, outline:"none", cursor:"pointer", background:"white" };

  return (
    <div style={{ background:"white", borderRadius:12, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", borderTop:"4px solid #6366f1" }}>

      {/* Title + controls */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center", marginBottom:14 }}>
        <span style={{ fontWeight:800, fontSize:16, color:"#0f172a" }}>🗺️ {t.heatmap || "SLA Heatmap"}</span>

        {/* Month picker */}
        <input type="month" value={hmMonth} onChange={e => setHmMonth(e.target.value)} style={inputSt} />

        {/* DC filter — admin only */}
        {!userDC && (
          <select value={hmDC} onChange={e => setHmDC(e.target.value)} style={inputSt}>
            <option value="all">All Distribution Centers</option>
            <option value="Riyadh">Riyadh DC</option>
            <option value="Jeddah">Jeddah DC</option>
            <option value="Dammam">Dammam DC</option>
          </select>
        )}

        {/* View toggle */}
        <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:"1.5px solid #e2e8f0" }}>
          {[["driver", `👤 ${t.delivPart||"Delivery Partners"}`], ["vehicle", `🚗 ${t.vehicle||"Vehicles"}`]].map(([v,l]) => (
            <button key={v} onClick={() => setHmView(v)}
              style={{ padding:"7px 14px", border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                background: hmView===v ? "#1A3A5C" : "white", color: hmView===v ? "white" : "#374151" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginLeft:"auto" }}>
          {(hmView === "driver"
            ? [["#10b981", t.onTime||"On-Time ✅"], ["#f59e0b", t.partialSla||"Partial/Ext.SLA ⚠️"], ["#ef4444","Failed ❌"], ["#e2e8f0", t.noActivity||"No Activity"]]
            : [["#10b981","On-Road 🚗"], ["#f97316","Maintenance 🔧"], ["#e2e8f0","Standby"]]
          ).map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#64748b" }}>
              <div style={{ width:13, height:13, borderRadius:3, background:c, border:"1px solid #e2e8f0" }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* SLA rule note */}
      <div style={{ fontSize:12, color:"#64748b", background:"#f8fafc", borderRadius:8,
        padding:"8px 12px", marginBottom:16, lineHeight:1.6 }}>
        📌 {t.slaNote || "SLA Rule: In-City (<300km one-way) → same-day on-time | Out-City (≥300km) → next-day SLA applies"}
      </div>

      {/* Scrollable heatmap grid */}
      <div style={{ overflowX:"auto" }}>

        {/* Day number headers */}
        <div style={{ display:"flex", minWidth: LABEL_W + days.length * (CELL_W+2), marginBottom:4 }}>
          <div style={{ width:LABEL_W, flexShrink:0 }} />
          {days.map(dateStr => {
            const dayNum   = parseInt(dateStr.split("-")[2]);
            const dow      = new Date(dateStr).getDay();
            const isWeekend = dow === 5 || dow === 6;
            return (
              <div key={dateStr} style={{
                width:CELL_W, flexShrink:0, textAlign:"center",
                fontSize:9, fontWeight:700,
                color: isWeekend ? "#94a3b8" : "#374151", paddingBottom:3
              }}>
                {dayNum}
              </div>
            );
          })}
        </div>

        {/* Delivery Partner rows */}
        {hmView === "driver" && (
          driverList.length === 0
            ? <div style={{ padding:"24px 0", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No Delivery Partners found for this DC / month</div>
            : driverList.map(driver => (
                <div key={driver.uid} style={{ display:"flex", alignItems:"center", marginBottom:2, minWidth: LABEL_W + days.length * (CELL_W+2) }}>
                  <div style={{ width:LABEL_W, flexShrink:0, fontSize:11, fontWeight:600, color:"#374151",
                    paddingRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {driver.name}
                    <span style={{ fontSize:9, color:"#94a3b8", marginLeft:4 }}>{driver.dc}</span>
                  </div>
                  {days.map(dateStr => {
                    const status   = getDriverCellStatus(driver.uid, dateStr);
                    const dow      = new Date(dateStr).getDay();
                    const isWeekend = dow === 5 || dow === 6;
                    const dayInv   = hmInv.filter(i => i.driverId === driver.uid && i.date === dateStr);
                    const del      = dayInv.filter(i => i.status === "delivered").length;
                    const fail     = dayInv.filter(i => i.status === "failed").length;
                    const outcity  = dayInv.filter(i => i.dtype === "outcity").length;
                    const incity   = dayInv.filter(i => i.dtype === "incity").length;

                    return (
                      <div key={dateStr}
                        onMouseEnter={e => {
                          if (dayInv.length) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({ type:"driver", x:rect.left, y:rect.top,
                              name:driver.name, date:dateStr, total:dayInv.length,
                              del, fail, outcity, incity, label:driverCellLabel(status) });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          width:CELL_W-2, height:20, flexShrink:0, margin:1,
                          borderRadius:4, cursor: dayInv.length ? "pointer" : "default",
                          background: isWeekend && status==="none" ? "#f8fafc" : driverCellColor(status),
                          opacity: isWeekend && status==="none" ? 0.35 : 1,
                          border: isWeekend ? "1px dashed #e2e8f0" : "1px solid transparent",
                        }}
                      />
                    );
                  })}
                </div>
              ))
        )}

        {/* Vehicle rows */}
        {hmView === "vehicle" && (
          vehicleList.length === 0
            ? <div style={{ padding:"24px 0", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No vehicles found</div>
            : vehicleList.map(v => (
                <div key={v.plate} style={{ display:"flex", alignItems:"center", marginBottom:2, minWidth: LABEL_W + days.length * (CELL_W+2) }}>
                  <div style={{ width:LABEL_W, flexShrink:0, fontSize:11, fontWeight:600, color:"#374151",
                    paddingRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {v.plate}
                    <span style={{ fontSize:9, color:"#94a3b8", marginLeft:4 }}>{v.dc}</span>
                  </div>
                  {days.map(dateStr => {
                    const status    = getVehicleCellStatus(v.plate, dateStr);
                    const dow       = new Date(dateStr).getDay();
                    const isWeekend = dow === 5 || dow === 6;
                    const label     = status==="green"?"On-Road":status==="orange"?"Maintenance":"Standby";
                    return (
                      <div key={dateStr}
                        onMouseEnter={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({ type:"vehicle", x:rect.left, y:rect.top, plate:v.plate, dc:v.dc, date:dateStr, label });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          width:CELL_W-2, height:20, flexShrink:0, margin:1,
                          borderRadius:4,
                          background: isWeekend && status==="none" ? "#f8fafc" : vehicleCellColor(status),
                          opacity: isWeekend && status==="none" ? 0.35 : 1,
                          border: isWeekend ? "1px dashed #e2e8f0" : "1px solid transparent",
                        }}
                      />
                    );
                  })}
                </div>
              ))
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:"fixed", left:tooltip.x + 10, top:tooltip.y - 10,
          background:"#0f172a", color:"white", padding:"10px 14px",
          borderRadius:8, fontSize:12, zIndex:9999, pointerEvents:"none",
          minWidth:170, boxShadow:"0 4px 20px rgba(0,0,0,0.3)", lineHeight:1.7
        }}>
          {tooltip.type === "vehicle" ? (
            <>
              <div style={{ fontWeight:800 }}>{tooltip.plate}</div>
              <div style={{ color:"#94a3b8", fontSize:11 }}>{tooltip.dc} · {tooltip.date}</div>
              <div style={{ marginTop:4, fontWeight:700,
                color: tooltip.label==="On-Road"?"#10b981" : tooltip.label==="Maintenance"?"#f97316":"#94a3b8" }}>
                {tooltip.label==="On-Road"?"🚗":tooltip.label==="Maintenance"?"🔧":"⏸"} {tooltip.label}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight:800 }}>{tooltip.name}</div>
              <div style={{ color:"#94a3b8", fontSize:11 }}>{tooltip.date}</div>
              <div style={{ marginTop:4 }}>📦 {tooltip.total} invoice(s)</div>
              <div style={{ color:"#10b981" }}>✅ {tooltip.del} delivered</div>
              {tooltip.fail > 0 && <div style={{ color:"#ef4444" }}>❌ {tooltip.fail} failed</div>}
              <div style={{ fontSize:11, color:"#94a3b8" }}>🏙️ In-City: {tooltip.incity} · 🛣️ Out-City: {tooltip.outcity}</div>
              <div style={{ marginTop:4, fontWeight:700,
                color: tooltip.label.includes("On-Time")?"#10b981": tooltip.label.includes("Partial")?"#f59e0b":"#ef4444" }}>
                {tooltip.label}
              </div>
            </>
          )}
        </div>
      )}

      {/* Month summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginTop:20, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
        {(hmView === "driver" ? [
          { label: t.onTime||"On-Time Days",        val: driverGreen,  color:"#10b981" },
          { label: t.partialSla||"Partial/Ext.SLA", val: driverYellow, color:"#f59e0b" },
          { label: "Failed Days",                   val: driverRed,    color:"#ef4444" },
          { label: "Active Driver-Days",             val: driverActive, color:"#6366f1" },
        ] : [
          { label: t.onRoadDays||"On-Road Days",    val: vehicleOnRoad,   color:"#10b981" },
          { label: t.maintDays||"Maintenance Days", val: vehicleMaint,    color:"#f97316" },
          { label: "Standby Days",                  val: vehicleStandby,  color:"#94a3b8" },
          { label: "Fleet Utilization",             val: vehicleUtil+"%", color:"#6366f1" },
        ]).map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:8, padding:"10px 12px",
            borderLeft:`3px solid ${s.color}`, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", border:`1px solid #f1f5f9` }}>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:3 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
