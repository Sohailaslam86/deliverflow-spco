import { useState } from "react";
import { Card, CardTitle, Badge, AgingBadge, Btn, SectionTitle } from "../components/Shared.jsx";
import { STATUS_STYLES, daysSince } from "../data/masterData.js";

export default function Invoices({ user, invoices, setInvoices }) {
  const [search, setSearch]   = useState("");
  const [statusF, setStatusF] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const dc = user.role==="manager" ? user.dc : null;

  // Filter
  const filtered = invoices.filter(i=>{
    const mDC = !dc || i.dc===dc;
    const mS  = statusF==="all" || i.status===statusF;
    const mQ  = !search || i.id.toLowerCase().includes(search.toLowerCase()) || i.customer.toLowerCase().includes(search.toLowerCase());
    return mDC && mS && mQ;
  });

  // DC Box stats
  const dcStats = ["Riyadh","Jeddah","Dammam"].map(d=>({
    dc:d,
    color:d==="Riyadh"?"#ef4444":d==="Jeddah"?"#3b82f6":"#10b981",
    total:invoices.filter(i=>i.dc===d).length,
    delivered:invoices.filter(i=>i.dc===d&&i.status==="delivered").length,
    pending:invoices.filter(i=>i.dc===d&&i.status==="pending").length,
    assigned:invoices.filter(i=>i.dc===d&&i.status==="assigned").length,
    failed:invoices.filter(i=>i.dc===d&&i.status==="failed").length,
    outstanding:invoices.filter(i=>i.dc===d&&i.status==="outstanding").length,
    intransit:invoices.filter(i=>i.dc===d&&i.status==="intransit").length,
  }));

  function updateStatus(id, status) {
    setInvoices(prev=>prev.map(i=>i.id===id?{...i,status}:i));
  }

  return (
    <div>
      {/* DC Boxes - Admin only */}
      {user.role==="admin" && (
        <>
          <SectionTitle>📍 DC Breakdown</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:16}}>
            {dcStats.map(d=>(
              <Card key={d.dc} style={{borderLeft:`4px solid ${d.color}`,marginBottom:0}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:10}}>📍 {d.dc} DC — {d.total} Total</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
                  {[
                    ["✅","Delivered",d.delivered,"#10b981"],
                    ["⏳","Pending",d.pending,"#f59e0b"],
                    ["🔵","Assigned",d.assigned,"#3b82f6"],
                    ["❌","Failed",d.failed,"#ef4444"],
                    ["🟠","Outstanding",d.outstanding,"#f97316"],
                    ["🔄","Transit",d.intransit,"#8b5cf6"],
                  ].map(([icon,label,val,color])=>(
                    <div key={label} style={{textAlign:"center",background:"#f8fafc",borderRadius:6,padding:"6px 4px",cursor:"pointer"}}
                      onClick={()=>{setStatusF(label.toLowerCase());setSearch("");}}>
                      <div style={{fontWeight:800,fontSize:18,color}}>{val}</div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>{icon} {label}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"#f1f5f9",borderRadius:99,height:6,overflow:"hidden"}}>
                  <div style={{width:`${d.total>0?Math.round(d.delivered/d.total*100):0}%`,height:"100%",background:d.color,borderRadius:99}} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search invoice # or customer..."
          style={{flex:1,minWidth:180,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none"}} />
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",background:"white"}}>
          <option value="all">All Status</option>
          {Object.entries(STATUS_STYLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
      </div>
      <div style={{fontSize:13,color:"#94a3b8",marginBottom:10}}>{filtered.length} invoices</div>

      {/* Invoice List */}
      {filtered.map(inv=>{
        const days = daysSince(inv.date);
        return (
          <Card key={inv.id} style={{marginBottom:8,cursor:"pointer"}}>
            <div onClick={()=>setExpanded(expanded===inv.id?null:inv.id)}
              style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13,color:"#6366f1"}}>{inv.id}</span>
                  <Badge status={inv.status} />
                  <AgingBadge days={days} />
                  {inv.uploadBatch && <span style={{fontSize:10,color:"#94a3b8"}}>{inv.uploadBatch}</span>}
                </div>
                <div style={{fontWeight:600,fontSize:14,color:"#0f172a",marginTop:2}}>{inv.customer}</div>
                <div style={{fontSize:12,color:"#64748b"}}>
                  📍 {inv.dc} DC → {inv.city} | 📅 {inv.date} |
                  <span style={{color:inv.inst==="Government"?"#1e40af":"#6d28d9"}}> {inv.inst==="Government"?"🏛️ Govt":"🏥 Private"}</span>
                  {inv.dtype && <span> | {inv.dtype==="incity"?"🏙️ In-City":"🛣️ Out-City"}</span>}
                </div>
              </div>
            </div>

            {expanded===inv.id && (
              <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #f1f5f9"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8,fontSize:13,color:"#374151",marginBottom:12}}>
                  <div>🌡️ <b>Storage:</b> {inv.storage}</div>
                  <div>🚗 <b>Vehicle:</b> {inv.vehicle||"Not assigned"}</div>
                  <div>⏱️ <b>Age:</b> {days} day{days!==1?"s":""}</div>
                  {inv.attempts>0&&<div>🔄 <b>Attempts:</b> {inv.attempts}</div>}
                  {inv.assignedAt&&<div>🕐 <b>Assigned:</b> {inv.assignedAt}</div>}
                  {inv.deliveredAt&&<div>✅ <b>Delivered:</b> {inv.deliveredAt}</div>}
                  {inv.failReason&&<div>❌ <b>Fail Reason:</b> {inv.failReason}</div>}
                  {inv.remarks&&<div>💬 <b>Remarks:</b> {inv.remarks}</div>}
                  {inv.gps&&<a href={`https://maps.google.com/?q=${inv.gps.lat},${inv.gps.lng}`} target="_blank" rel="noreferrer" style={{color:"#6366f1",fontWeight:600}}>📍 View GPS Location</a>}
                </div>
                {inv.podImage && inv.podImage!=="demo_pod" && (
                  <div style={{marginBottom:12}}>
                    <b style={{fontSize:13}}>📸 POD:</b>
                    <img src={inv.podImage} alt="POD" style={{display:"block",marginTop:6,width:140,height:100,objectFit:"cover",borderRadius:8,border:"2px solid #e2e8f0"}} />
                  </div>
                )}
                {inv.podImage==="demo_pod" && <div style={{fontSize:13,color:"#94a3b8",marginBottom:12}}>📸 POD: Demo image</div>}
                {user.role==="admin" && (
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:6}}>Change Status (Admin):</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {Object.entries(STATUS_STYLES).map(([k,v])=>(
                        <button key={k} onClick={()=>updateStatus(inv.id,k)}
                          style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${v.c}`,background:inv.status===k?v.bg:"white",color:v.c,cursor:"pointer",fontSize:12,fontWeight:600}}>
                          {v.icon} {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
      {filtered.length===0 && <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No invoices found</div>}
    </div>
  );
}
