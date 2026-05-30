import { useState } from "react";
import { Card, CardTitle, StatCard, TabBar } from "../components/Shared.jsx";

export default function Reports({ user, invoices, fuelLogs, vehicles }) {
  const [tab, setTab] = useState("daily");
  const dc = user.dc;
  const myInv = dc ? invoices.filter(i=>i.dc===dc) : invoices;
  const myLogs = dc ? fuelLogs.filter(l=>l.dc===dc) : fuelLogs;
  const myVeh  = dc ? vehicles.filter(v=>v.dc===dc) : vehicles;

  const tabs = [["daily","📊","Daily Status"],["driver","👤","Driver Performance"],["vehicle","🚗","Vehicle Utilization"],["fuel","⛽","Fuel Report"],["aging","⏱️","Aging Report"]];

  // Driver stats from invoices
  const driverMap = {};
  myInv.filter(i=>i.driverId).forEach(i=>{
    if(!driverMap[i.driverId]) driverMap[i.driverId]={delivered:0,failed:0,total:0,incity:0,outcity:0};
    driverMap[i.driverId].total++;
    if(i.status==="delivered") driverMap[i.driverId].delivered++;
    if(i.status==="failed")    driverMap[i.driverId].failed++;
    if(i.dtype==="incity")     driverMap[i.driverId].incity++;
    if(i.dtype==="outcity")    driverMap[i.driverId].outcity++;
  });
  const driverStats = Object.entries(driverMap).map(([id,s])=>({...s,id,rate:s.total>0?Math.round(s.delivered/s.total*100):0})).sort((a,b)=>b.rate-a.rate);

  // Aging
  const agingInv = myInv.filter(i=>["pending","assigned","outstanding"].includes(i.status)).map(i=>({...i,days:Math.floor((new Date()-new Date(i.date))/(1000*60*60*24))})).sort((a,b)=>b.days-a.days);

  function downloadCSV(data, filename) {
    const keys = Object.keys(data[0]||{});
    const csv  = [keys.join(","), ...data.map(r=>keys.map(k=>r[k]).join(","))].join("\n");
    const a    = document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=filename; a.click();
  }

  return (
    <div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* DAILY */}
      {tab==="daily" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:12,marginBottom:16}}>
            {[
              {icon:"📋",label:"Total",value:myInv.length,color:"#6366f1"},
              {icon:"✅",label:"Delivered",value:myInv.filter(i=>i.status==="delivered").length,color:"#10b981"},
              {icon:"⏳",label:"Pending",value:myInv.filter(i=>i.status==="pending").length,color:"#f59e0b"},
              {icon:"🔵",label:"Assigned",value:myInv.filter(i=>i.status==="assigned").length,color:"#3b82f6"},
              {icon:"❌",label:"Failed",value:myInv.filter(i=>i.status==="failed").length,color:"#ef4444"},
              {icon:"🟠",label:"Outstanding",value:myInv.filter(i=>i.status==="outstanding").length,color:"#f97316"},
            ].map((s,i)=><StatCard key={i} {...s} />)}
          </div>
          {/* DC comparison - admin */}
          {user.role==="admin" && (
            <Card>
              <CardTitle>📍 DC Comparison</CardTitle>
              {["Riyadh","Jeddah","Dammam"].map(d=>{
                const di=invoices.filter(i=>i.dc===d);
                const del=di.filter(i=>i.status==="delivered").length;
                return (
                  <div key={d} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}>
                      <span style={{fontWeight:600}}>📍 {d} DC</span>
                      <span style={{color:"#64748b"}}>{del}/{di.length} — {di.length>0?Math.round(del/di.length*100):0}%</span>
                    </div>
                    <div style={{background:"#f1f5f9",borderRadius:99,height:8,overflow:"hidden"}}>
                      <div style={{width:`${di.length>0?Math.round(del/di.length*100):0}%`,height:"100%",background:"#10b981",borderRadius:99}} />
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
          <Card>
            <CardTitle>🏭 Institution Breakdown</CardTitle>
            {["Government","Private"].map(inst=>{
              const n=myInv.filter(i=>i.inst===inst).length;
              const d=myInv.filter(i=>i.inst===inst&&i.status==="delivered").length;
              return (
                <div key={inst} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}>
                    <span style={{fontWeight:600}}>{inst==="Government"?"🏛️ Government":"🏥 Private"}</span>
                    <span style={{color:"#64748b"}}>{d}/{n} — {n>0?Math.round(d/n*100):0}%</span>
                  </div>
                  <div style={{background:"#f1f5f9",borderRadius:99,height:8,overflow:"hidden"}}>
                    <div style={{width:`${n>0?Math.round(d/n*100):0}%`,height:"100%",background:inst==="Government"?"#1e40af":"#6d28d9",borderRadius:99}} />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* DRIVER */}
      {tab==="driver" && (
        <Card>
          <CardTitle>👤 Driver Performance
            <button onClick={()=>downloadCSV(driverStats.map(d=>({Driver:d.id,Total:d.total,Delivered:d.delivered,Failed:d.failed,Rate:d.rate+"%",InCity:d.incity,OutCity:d.outcity})),"driver_report.csv")}
              style={{marginLeft:"auto",background:"#10b981",color:"white",border:"none",padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>⬇ CSV</button>
          </CardTitle>
          {driverStats.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No delivery data yet</div>}
          {driverStats.map((d,i)=>(
            <div key={d.id} style={{padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:6}}>
                <span style={{fontWeight:700,fontSize:14}}>#{i+1} Driver ID: {d.id}</span>
                <span style={{fontWeight:800,fontSize:18,color:d.rate>=80?"#10b981":d.rate>=60?"#f59e0b":"#ef4444"}}>{d.rate}%</span>
              </div>
              <div style={{display:"flex",gap:16,fontSize:13,color:"#64748b",flexWrap:"wrap",marginBottom:6}}>
                <span>📋 Total: <b>{d.total}</b></span>
                <span style={{color:"#10b981"}}>✅ Delivered: <b>{d.delivered}</b></span>
                <span style={{color:"#ef4444"}}>❌ Failed: <b>{d.failed}</b></span>
                <span>🏙️ In-City: <b>{d.incity}</b></span>
                <span>🛣️ Out-City: <b>{d.outcity}</b></span>
              </div>
              <div style={{background:"#f1f5f9",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${d.rate}%`,height:"100%",background:d.rate>=80?"#10b981":d.rate>=60?"#f59e0b":"#ef4444",borderRadius:99}} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* VEHICLE */}
      {tab==="vehicle" && (
        <Card>
          <CardTitle>🚗 Vehicle Utilization</CardTitle>
          {myVeh.map((v,i)=>(
            <div key={v.plate} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:120}}>
                <div style={{fontWeight:700,fontSize:14}}>{v.plate}</div>
                <div style={{fontSize:12,color:"#64748b"}}>{v.type} — {v.dc} DC | KM: {(v.totalKM||0).toLocaleString()}</div>
              </div>
              <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:v.status==="Maintenance"?"#fef3c7":"#d1fae5",color:v.status==="Maintenance"?"#92400e":"#065f46"}}>{v.status}</span>
              <div style={{fontSize:12,color:"#64748b",textAlign:"right"}}>
                <div>Fahas: {v.fahas||"—"}</div>
                <div>Insurance: {v.insurance||"—"}</div>
                {(v.maintHistory||[]).length>0&&<div style={{color:"#f59e0b"}}>🔧 {v.maintHistory.length} maintenance event(s)</div>}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* FUEL */}
      {tab==="fuel" && (
        <Card>
          <CardTitle>⛽ Fuel Consumption Report
            <button onClick={()=>downloadCSV(myLogs.map(l=>({ID:l.id,Date:l.date,Vehicle:l.vehicle,Driver:l.driver,Liters:l.liters,SAR:l.sar,KM:l.tripKM,Efficiency:l.liters>0?(l.tripKM/l.liters).toFixed(1)+" km/L":"-"})),"fuel_report.csv")}
              style={{marginLeft:"auto",background:"#10b981",color:"white",border:"none",padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>⬇ CSV</button>
          </CardTitle>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:16}}>
            {[
              {label:"Total Liters",value:myLogs.reduce((s,l)=>s+l.liters,0)+"L",color:"#f59e0b"},
              {label:"Total Cost",value:"SAR "+myLogs.reduce((s,l)=>s+l.sar,0),color:"#ef4444"},
              {label:"Total KM",value:myLogs.reduce((s,l)=>s+l.tripKM,0)+" km",color:"#6366f1"},
            ].map((s,i)=><StatCard key={i} icon="⛽" {...s} />)}
          </div>
          {myLogs.map(log=>(
            <div key={log.id} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid #f1f5f9",fontSize:13,flexWrap:"wrap"}}>
              <span style={{fontWeight:600,color:"#6366f1",minWidth:90}}>{log.vehicle}</span>
              <span style={{flex:1}}>{log.driver||"—"}</span>
              <span>⛽ {log.liters}L | 💰 SAR {log.sar} | 🛣️ {log.tripKM}km | 📊 {log.liters>0?(log.tripKM/log.liters).toFixed(1):"-"}km/L</span>
              <span style={{color:"#94a3b8"}}>📅 {log.date}</span>
            </div>
          ))}
          {myLogs.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No fuel data yet</div>}
        </Card>
      )}

      {/* AGING */}
      {tab==="aging" && (
        <Card>
          <CardTitle>⏱️ Invoice Aging Report</CardTitle>
          <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
            {[
              {label:"🟢 Fresh (≤1 day)",count:agingInv.filter(i=>i.days<=1).length,color:"#10b981"},
              {label:"🟡 Aging (2-3 days)",count:agingInv.filter(i=>i.days>1&&i.days<=3).length,color:"#f59e0b"},
              {label:"🔴 Critical (4+ days)",count:agingInv.filter(i=>i.days>3).length,color:"#ef4444"},
            ].map(s=><div key={s.label} style={{fontSize:13,fontWeight:600,color:s.color}}>{s.label}: <b>{s.count}</b></div>)}
          </div>
          {agingInv.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No pending invoices</div>}
          {agingInv.map(inv=>(
            <div key={inv.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:"#6366f1",minWidth:130}}>{inv.id}</span>
              <span style={{flex:1,fontSize:13}}>{inv.customer}</span>
              <span style={{fontSize:12,color:"#64748b"}}>{inv.dc} DC</span>
              <span style={{fontSize:12,fontWeight:600,padding:"2px 8px",borderRadius:99,background:inv.days<=1?"#d1fae5":inv.days<=3?"#fef3c7":"#fee2e2",color:inv.days<=1?"#065f46":inv.days<=3?"#92400e":"#991b1b"}}>{inv.days}d — {inv.days<=1?"Fresh":inv.days<=3?"Aging":"Critical"}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
