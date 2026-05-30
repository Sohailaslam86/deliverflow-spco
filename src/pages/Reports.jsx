import { useState } from "react";
import { Card, CardTitle, StatCard, TabBar } from "../components/Shared.jsx";

const T = {
  en: {
    daily:"Daily Status", driver:"Driver Performance", vehicle:"Vehicle Utilization",
    fuel:"Fuel Report", aging:"Aging Report", overall:"Overall — All DCs",
    period:"Period", today:"Today", week:"This Week", month:"This Month",
    all:"All Time", total:"Total", delivered:"Delivered", pending:"Pending",
    assigned:"Assigned", failed:"Failed", outstanding:"Outstanding",
    inTransit:"In Transit", scheduled:"Scheduled", deliveryRate:"Delivery Rate",
    dcBreakdown:"Distribution Center Breakdown", instBreak:"Institution Breakdown",
    govt:"Government", priv:"Private", noData:"No data for this period",
    csvDownload:"Download CSV", driverPerf:"Driver Performance",
    totalDel:"Total Delivered", totalFail:"Total Failed", rate:"Rate",
    inCity:"In-City", outCity:"Out-City", vehUtil:"Vehicle Utilization",
    active:"Active", maintenance:"Maintenance", totalKM:"Total KM",
    fuelRep:"Fuel Report", totalLiters:"Total Liters", totalCost:"Total Cost",
    avgEff:"Avg Efficiency", fresh:"Fresh", aging2:"Aging", critical:"Critical",
    days:"days", riyadhDC:"Riyadh DC", jeddahDC:"Jeddah DC", dammamDC:"Dammam DC"
  },
  ar: {
    daily:"\u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u064a\u0648\u0645\u064a\u0629",
    driver:"\u0623\u062f\u0627\u0621 \u0627\u0644\u0633\u0627\u0626\u0642\u064a\u0646",
    vehicle:"\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a",
    fuel:"\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0648\u0642\u0648\u062f",
    aging:"\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u062a\u0642\u0627\u062f\u0645",
    overall:"\u0625\u062c\u0645\u0627\u0644\u064a \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0631\u0627\u0643\u0632",
    period:"\u0627\u0644\u0641\u062a\u0631\u0629", today:"\u0627\u0644\u064a\u0648\u0645",
    week:"\u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639",
    month:"\u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631", all:"\u0643\u0644 \u0627\u0644\u0648\u0642\u062a",
    total:"\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
    delivered:"\u0645\u0633\u0644\u0645\u0629", pending:"\u0645\u0639\u0644\u0642\u0629",
    assigned:"\u0645\u062e\u0635\u0635\u0629", failed:"\u0641\u0627\u0634\u0644\u0629",
    outstanding:"\u0645\u062a\u0623\u062e\u0631\u0629", inTransit:"\u0641\u064a \u0627\u0644\u0637\u0631\u064a\u0642",
    scheduled:"\u0645\u062c\u062f\u0648\u0644\u0629",
    deliveryRate:"\u0645\u0639\u062f\u0644 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    dcBreakdown:"\u062a\u0648\u0632\u064a\u0639 \u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    instBreak:"\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a",
    govt:"\u062d\u0643\u0648\u0645\u064a", priv:"\u062e\u0627\u0635",
    noData:"\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a",
    csvDownload:"\u062a\u062d\u0645\u064a\u0644 CSV",
    driverPerf:"\u0623\u062f\u0627\u0621 \u0627\u0644\u0633\u0627\u0626\u0642",
    totalDel:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    totalFail:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u0634\u0644",
    rate:"\u0627\u0644\u0646\u0633\u0628\u0629", inCity:"\u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    outCity:"\u062e\u0627\u0631\u062c \u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    vehUtil:"\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a",
    active:"\u0646\u0634\u0637\u0629", maintenance:"\u0635\u064a\u0627\u0646\u0629",
    totalKM:"\u0625\u062c\u0645\u0627\u0644\u064a \u0643\u0645",
    fuelRep:"\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0648\u0642\u0648\u062f",
    totalLiters:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0644\u062a\u0631\u0627\u062a",
    totalCost:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0643\u0644\u0641\u0629",
    avgEff:"\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0643\u0641\u0627\u0621\u0629",
    fresh:"\u062d\u062f\u064a\u062b\u0629", aging2:"\u0645\u062a\u0642\u0627\u062f\u0645\u0629",
    critical:"\u062d\u0631\u062c\u0629", days:"\u064a\u0648\u0645",
    riyadhDC:"\u0645\u0631\u0643\u0632 \u0627\u0644\u0631\u064a\u0627\u0636",
    jeddahDC:"\u0645\u0631\u0643\u0632 \u062c\u062f\u0629",
    dammamDC:"\u0645\u0631\u0643\u0632 \u0627\u0644\u062f\u0645\u0627\u0645"
  }
};

function downloadCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map(r => keys.map(k => r[k]).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = filename; a.click();
}

function filterByPeriod(invoices, period) {
  const now = new Date();
  return invoices.filter(i => {
    const d = new Date(i.date);
    if (period === "today") return i.date === now.toISOString().split("T")[0];
    if (period === "week") { const w=new Date(now); w.setDate(now.getDate()-7); return d>=w; }
    if (period === "month") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    return true;
  });
}

function DCReportBox({ dc, invoices, color, t }) {
  const inv = invoices.filter(i => i.dc === dc);
  const countable = inv.filter(i => !["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = inv.filter(i => i.status==="delivered").length;
  const rate = countable.length>0?Math.round(del/countable.length*100):0;
  const dcLabel = dc==="Riyadh"?t.riyadhDC:dc==="Jeddah"?t.jeddahDC:t.dammamDC;
  return (
    <Card style={{ borderTop:`4px solid ${color}` }}>
      <CardTitle style={{ color }}>\ud83d\udccd {dcLabel}</CardTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))", gap:8, marginBottom:10 }}>
        <StatCard icon="\ud83d\udccb" label={t.total} value={inv.length} color={color} />
        <StatCard icon="\u2705" label={t.delivered} value={del} color="#10b981" />
        <StatCard icon="\u23f3" label={t.pending} value={inv.filter(i=>i.status==="pending").length} color="#f59e0b" />
        <StatCard icon="\u274c" label={t.failed} value={inv.filter(i=>i.status==="failed").length} color="#ef4444" />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
        <span style={{ fontWeight:600 }}>{t.deliveryRate}</span>
        <span style={{ fontWeight:800, color:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444" }}>{rate}%</span>
      </div>
      <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
        <div style={{ width:`${rate}%`, height:"100%", background:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
      </div>
    </Card>
  );
}

export default function Reports({ user, invoices, fuelLogs, vehicles, lang }) {
  const [tab, setTab] = useState("daily");
  const [period, setPeriod] = useState("month");
  const rtl = lang === "ar";
  const t = T[lang] || T.en;

  const dc = user.dc;
  const allInv = dc ? invoices.filter(i => i.dc === dc) : invoices;
  const myInv = filterByPeriod(allInv, period);
  const myLogs = dc ? fuelLogs.filter(l => l.dc === dc) : fuelLogs;
  const myVeh = dc ? vehicles.filter(v => v.dc === dc) : vehicles;

  const tabs = [
    ["daily","\ud83d\udcca",t.daily],
    ["driver","\ud83d\udc64",t.driver],
    ["vehicle","\ud83d\ude97",t.vehicle],
    ["fuel","\u26fd",t.fuel],
    ["aging","\u23f1\ufe0f",t.aging]
  ];

  const periods = [["today",t.today],["week",t.week],["month",t.month],["all",t.all]];

  // Driver stats
  const driverMap = {};
  myInv.filter(i=>i.driverId).forEach(i=>{
    if(!driverMap[i.driverId]) driverMap[i.driverId]={name:i.driverId,delivered:0,failed:0,total:0,incity:0,outcity:0};
    driverMap[i.driverId].total++;
    if(i.status==="delivered") driverMap[i.driverId].delivered++;
    if(i.status==="failed") driverMap[i.driverId].failed++;
    if(i.dtype==="incity") driverMap[i.driverId].incity++;
    if(i.dtype==="outcity") driverMap[i.driverId].outcity++;
  });
  const driverStats = Object.values(driverMap).map(d=>({...d,rate:d.total>0?Math.round(d.delivered/d.total*100):0})).sort((a,b)=>b.rate-a.rate);

  // Aging
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
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#374151", alignSelf:"center" }}>{t.period}:</span>
        {periods.map(([v,l]) => (
          <button key={v} onClick={()=>setPeriod(v)}
            style={{ padding:"6px 14px", borderRadius:8, border:"none", background:period===v?"#1A3A5C":"#f1f5f9", color:period===v?"white":"#374151", cursor:"pointer", fontSize:13, fontWeight:600 }}>
            {l}
          </button>
        ))}
      </div>

      {/* DAILY STATUS */}
      {tab==="daily" && (
        <div>
          {/* Overall Box */}
          <Card style={{ borderTop:"4px solid #1A3A5C" }}>
            <CardTitle>\ud83d\udcca {t.overall}</CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:10, marginBottom:12 }}>
              <StatCard icon="\ud83d\udccb" label={t.total} value={myInv.length} color="#6366f1" />
              <StatCard icon="\u2705" label={t.delivered} value={del} color="#10b981" />
              <StatCard icon="\u23f3" label={t.pending} value={myInv.filter(i=>i.status==="pending").length} color="#f59e0b" />
              <StatCard icon="\ud83d\udc64" label={t.assigned} value={myInv.filter(i=>i.status==="assigned").length} color="#3b82f6" />
              <StatCard icon="\u274c" label={t.failed} value={myInv.filter(i=>i.status==="failed").length} color="#ef4444" />
              <StatCard icon="\u26a0\ufe0f" label={t.outstanding} value={myInv.filter(i=>i.status==="outstanding").length} color="#f97316" />
              <StatCard icon="\ud83d\ude9a" label={t.inTransit} value={myInv.filter(i=>i.status==="intransit").length} color="#8b5cf6" />
              <StatCard icon="\ud83d\udcc5" label={t.scheduled} value={myInv.filter(i=>["scheduled","hold_await","hold_ship"].includes(i.status)).length} color="#a855f7" />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, marginBottom:4 }}>
              <span style={{ fontWeight:700 }}>{t.deliveryRate}</span>
              <span style={{ fontWeight:900, fontSize:20, color:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444" }}>{rate}%</span>
            </div>
            <div style={{ background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden" }}>
              <div style={{ width:`${rate}%`, height:"100%", background:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
            </div>
          </Card>

          {/* DC Breakdown — Admin only */}
          {!dc && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
              <DCReportBox dc="Riyadh" invoices={myInv} color="#1A3A5C" t={t} />
              <DCReportBox dc="Jeddah" invoices={myInv} color="#0f766e" t={t} />
              <DCReportBox dc="Dammam" invoices={myInv} color="#7c3aed" t={t} />
            </div>
          )}

          {/* Institution Breakdown */}
          <Card>
            <CardTitle>\ud83c\udfe5 {t.instBreak}</CardTitle>
            {["Government","Private"].map(inst=>{
              const n=myInv.filter(i=>i.inst===inst).length;
              const d=myInv.filter(i=>i.inst===inst&&i.status==="delivered").length;
              return (
                <div key={inst} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
                    <span style={{ fontWeight:600 }}>{inst==="Government"?"\ud83c\udfd9\ufe0f "+t.govt:"\ud83c\udfe5 "+t.priv}</span>
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
      {tab==="driver" && (
        <Card>
          <CardTitle>\ud83d\udc64 {t.driverPerf}
            <button onClick={()=>downloadCSV(driverStats.map(d=>({Driver:d.name,Total:d.total,Delivered:d.delivered,Failed:d.failed,Rate:d.rate+"%",InCity:d.incity,OutCity:d.outcity})),"driver_report.csv")}
              style={{ marginLeft:"auto", background:"#10b981", color:"white", border:"none", padding:"5px 12px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:600 }}>
              \u2b07 {t.csvDownload}
            </button>
          </CardTitle>
          {driverStats.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noData}</div>}
          {driverStats.map((d,i)=>(
            <div key={d.name} style={{ padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:14 }}>#{i+1} {d.name}</span>
                <span style={{ fontWeight:800, fontSize:18, color:d.rate>=80?"#10b981":d.rate>=60?"#f59e0b":"#ef4444" }}>{d.rate}%</span>
              </div>
              <div style={{ display:"flex", gap:16, fontSize:13, color:"#64748b", flexWrap:"wrap", marginBottom:6 }}>
                <span>\ud83d\udccb {t.total}: <b>{d.total}</b></span>
                <span style={{ color:"#10b981" }}>\u2705 {t.totalDel}: <b>{d.delivered}</b></span>
                <span style={{ color:"#ef4444" }}>\u274c {t.totalFail}: <b>{d.failed}</b></span>
                <span>\ud83c\udfd9\ufe0f {t.inCity}: <b>{d.incity}</b></span>
                <span>\ud83d\udee3\ufe0f {t.outCity}: <b>{d.outcity}</b></span>
              </div>
              <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
                <div style={{ width:`${d.rate}%`, height:"100%", background:d.rate>=80?"#10b981":d.rate>=60?"#f59e0b":"#ef4444", borderRadius:99 }} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* VEHICLE UTILIZATION */}
      {tab==="vehicle" && (
        <div>
          <Card style={{ borderTop:"4px solid #1A3A5C" }}>
            <CardTitle>\ud83d\ude97 {t.vehUtil} — {t.overall}</CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:10 }}>
              <StatCard icon="\ud83d\ude97" label={t.total} value={myVeh.length} color="#6366f1" />
              <StatCard icon="\u2705" label={t.active} value={myVeh.filter(v=>v.status==="Active").length} color="#10b981" />
              <StatCard icon="\ud83d\udd27" label={t.maintenance} value={myVeh.filter(v=>v.status==="Maintenance").length} color="#f59e0b" />
              <StatCard icon="\ud83d\udee3\ufe0f" label={t.totalKM} value={myVeh.reduce((s,v)=>s+(v.totalKM||0),0).toLocaleString()} color="#0891b2" />
            </div>
          </Card>
          {!dc && ["Riyadh","Jeddah","Dammam"].map((d,idx)=>{
            const dv=vehicles.filter(v=>v.dc===d);
            const colors=["#1A3A5C","#0f766e","#7c3aed"];
            const dcLabel=d==="Riyadh"?t.riyadhDC:d==="Jeddah"?t.jeddahDC:t.dammamDC;
            return (
              <Card key={d} style={{ borderTop:`4px solid ${colors[idx]}` }}>
                <CardTitle style={{ color:colors[idx] }}>\ud83d\udccd {dcLabel}</CardTitle>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8, marginBottom:10 }}>
                  <StatCard icon="\ud83d\ude97" label={t.total} value={dv.length} color={colors[idx]} />
                  <StatCard icon="\u2705" label={t.active} value={dv.filter(v=>v.status==="Active").length} color="#10b981" />
                  <StatCard icon="\ud83d\udd27" label={t.maintenance} value={dv.filter(v=>v.status==="Maintenance").length} color="#f59e0b" />
                </div>
                {dv.map(v=>(
                  <div key={v.plate} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:13, minWidth:100 }}>{v.plate}</span>
                    <span style={{ fontSize:12, color:"#64748b", flex:1 }}>{v.type} | {t.totalKM}: {(v.totalKM||0).toLocaleString()} km</span>
                    <span style={{ fontSize:12, fontWeight:600, padding:"2px 8px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                  </div>
                ))}
              </Card>
            );
          })}
          {dc && myVeh.map(v=>(
            <div key={v.plate} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:14, minWidth:100 }}>{v.plate}</span>
              <span style={{ fontSize:13, color:"#64748b", flex:1 }}>{v.type} {v.brand} {v.model} | {t.totalKM}: {(v.totalKM||0).toLocaleString()} km | {v.mileage||12} km/L</span>
              <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* FUEL REPORT */}
      {tab==="fuel" && (
        <div>
          <Card style={{ borderTop:"4px solid #f59e0b" }}>
            <CardTitle>\u26fd {t.fuelRep} — {t.overall}
              <button onClick={()=>downloadCSV(myLogs.map(l=>({ID:l.id,Date:l.date,Vehicle:l.vehicle,Driver:l.driver,Liters:l.liters,SAR:l.sar,KM:l.tripKM,Efficiency:l.liters>0?(l.tripKM/l.liters).toFixed(1)+" km/L":"-",DC:l.dc})),"fuel_report.csv")}
                style={{ marginLeft:"auto", background:"#10b981", color:"white", border:"none", padding:"5px 12px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                \u2b07 {t.csvDownload}
              </button>
            </CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:12 }}>
              <StatCard icon="\u26fd" label={t.totalLiters} value={myLogs.reduce((s,l)=>s+l.liters,0)+"L"} color="#f59e0b" />
              <StatCard icon="\ud83d\udcb0" label={t.totalCost} value={"SAR "+myLogs.reduce((s,l)=>s+l.sar,0)} color="#ef4444" />
              <StatCard icon="\ud83d\udee3\ufe0f" label={t.totalKM} value={myLogs.reduce((s,l)=>s+l.tripKM,0)+" km"} color="#6366f1" />
              <StatCard icon="\ud83d\udcca" label={t.avgEff} value={myLogs.reduce((s,l)=>s+l.liters,0)>0?(myLogs.reduce((s,l)=>s+l.tripKM,0)/myLogs.reduce((s,l)=>s+l.liters,0)).toFixed(1)+" km/L":"-"} color="#10b981" />
            </div>
          </Card>
          {!dc && ["Riyadh","Jeddah","Dammam"].map((d,idx)=>{
            const dl=fuelLogs.filter(l=>l.dc===d);
            const colors=["#1A3A5C","#0f766e","#7c3aed"];
            const dcLabel=d==="Riyadh"?t.riyadhDC:d==="Jeddah"?t.jeddahDC:t.dammamDC;
            return (
              <Card key={d} style={{ borderTop:`4px solid ${colors[idx]}` }}>
                <CardTitle style={{ color:colors[idx] }}>\ud83d\udccd {dcLabel}</CardTitle>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  <StatCard icon="\u26fd" label={t.totalLiters} value={dl.reduce((s,l)=>s+l.liters,0)+"L"} color="#f59e0b" />
                  <StatCard icon="\ud83d\udcb0" label={t.totalCost} value={"SAR "+dl.reduce((s,l)=>s+l.sar,0)} color="#ef4444" />
                  <StatCard icon="\ud83d\udee3\ufe0f" label={t.totalKM} value={dl.reduce((s,l)=>s+l.tripKM,0)+" km"} color="#6366f1" />
                </div>
              </Card>
            );
          })}
          {myLogs.map(log=>(
            <div key={log.id} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13, flexWrap:"wrap" }}>
              <span style={{ fontWeight:600, color:"#6366f1", minWidth:90 }}>{log.vehicle}</span>
              <span style={{ flex:1 }}>{log.driver||"-"}</span>
              <span>\u26fd {log.liters}L</span>
              <span>\ud83d\udcb0 SAR {log.sar}</span>
              <span>\ud83d\udee3\ufe0f {log.tripKM}km</span>
              <span style={{ fontWeight:700, color:"#10b981" }}>{log.liters>0?(log.tripKM/log.liters).toFixed(1):"-"} km/L</span>
              <span style={{ color:"#94a3b8" }}>\ud83d\udcc5 {log.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* AGING REPORT */}
      {tab==="aging" && (
        <Card>
          <CardTitle>\u23f1\ufe0f {t.aging}</CardTitle>
          <div style={{ display:"flex", gap:16, marginBottom:12, flexWrap:"wrap" }}>
            {[
              { label:"\ud83d\udfe2 "+t.fresh+" (\u22641 "+t.days+")", count:agingInv.filter(i=>i.days<=1).length, color:"#10b981" },
              { label:"\ud83d\udfe1 "+t.aging2+" (2-3 "+t.days+")", count:agingInv.filter(i=>i.days>1&&i.days<=3).length, color:"#f59e0b" },
              { label:"\ud83d\udd34 "+t.critical+" (4+ "+t.days+")", count:agingInv.filter(i=>i.days>3).length, color:"#ef4444" },
            ].map(s=>(
              <div key={s.label} style={{ fontSize:13, fontWeight:600, color:s.color }}>{s.label}: <b>{s.count}</b></div>
            ))}
          </div>
          {agingInv.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noData}</div>}
          {agingInv.map(inv=>(
            <div key={inv.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:13, color:"#6366f1", minWidth:130 }}>{inv.id}</span>
              <span style={{ flex:1, fontSize:13 }}>{inv.customer}</span>
              <span style={{ fontSize:12, color:"#64748b" }}>{inv.dc} DC</span>
              <span style={{ fontSize:12, fontWeight:600, padding:"2px 8px", borderRadius:99, background:inv.days<=1?"#d1fae5":inv.days<=3?"#fef3c7":"#fee2e2", color:inv.days<=1?"#065f46":inv.days<=3?"#92400e":"#991b1b" }}>
                {inv.days}{t.days} — {inv.days<=1?t.fresh:inv.days<=3?t.aging2:t.critical}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
