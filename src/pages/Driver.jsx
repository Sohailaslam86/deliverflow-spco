import { useState } from "react";
import { Card, CardTitle, Btn, SuccessMsg } from "../components/Shared.jsx";
import { Badge } from "../components/Shared.jsx";

export default function Driver({ user, invoices, setInvoices }) {
  const [active, setActive]     = useState(null);
  const [completed, setCompleted] = useState([]);
  const [gps, setGps]           = useState(null);
  const [locating, setLocating] = useState(false);
  const [pod, setPod]           = useState(null);
  const [done, setDone]         = useState("");

  const myInv   = invoices.filter(i=>i.status==="assigned");
  const pending  = myInv.filter(i=>!completed.includes(i.id));
  const doneList = myInv.filter(i=>completed.includes(i.id));

  function getGPS() {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      p=>{ setGps({lat:p.coords.latitude,lng:p.coords.longitude}); setLocating(false); },
      ()=>{ setGps({lat:24.7136,lng:46.6753}); setLocating(false); }
    ) || (setGps({lat:24.7136,lng:46.6753}), setLocating(false));
  }

  function handlePhoto(e) {
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader(); r.onload=ev=>setPod(ev.target.result); r.readAsDataURL(f);
  }

  function submit(inv, status) {
    if(status==="delivered"&&!pod){ alert("Please upload POD photo first"); return; }
    setInvoices(prev=>prev.map(i=>i.id===inv.id?{...i,status,podImage:pod,gps,deliveredAt:new Date().toLocaleString(),attempts:(i.attempts||0)+1}:i));
    setCompleted(p=>[...p,inv.id]);
    setDone(status==="delivered"?`✅ ${inv.id} marked delivered!`:`❌ ${inv.id} marked failed.`);
    setActive(null); setPod(null); setGps(null);
    setTimeout(()=>setDone(""),3000);
  }

  return (
    <div>
      {done && <SuccessMsg msg={done} />}

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[["Remaining",pending.length,"#0f172a"],["Completed",doneList.length,"#10b981"],["Total",myInv.length,"#6366f1"]].map(([l,v,c])=>(
          <div key={l} style={{background:"white",borderRadius:10,padding:16,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
            <div style={{fontWeight:900,fontSize:28,color:c}}>{v}</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{fontWeight:700,fontSize:15,color:"#0f172a",margin:"16px 0 10px"}}>📦 Pending Deliveries ({pending.length})</div>

      {pending.length===0 && <div style={{textAlign:"center",padding:"40px",color:"#94a3b8",background:"white",borderRadius:10}}>🎉 All deliveries completed! Great work.</div>}

      {pending.map(inv=>(
        <Card key={inv.id}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6}}>
            <span style={{fontWeight:700,fontSize:13,color:"#6366f1"}}>{inv.id}</span>
            <div style={{display:"flex",gap:6}}>
              <span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:6,background:inv.dtype==="incity"?"#dbeafe":"#fef3c7",color:inv.dtype==="incity"?"#1e40af":"#92400e"}}>
                {inv.dtype==="incity"?"🏙️ In-City":"🛣️ Out-City"}
              </span>
              {inv.uploadBatch && <span style={{fontSize:10,color:"#94a3b8",padding:"3px 6px",background:"#f1f5f9",borderRadius:4}}>{inv.uploadBatch}</span>}
            </div>
          </div>
          <div style={{fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:4}}>{inv.customer}</div>
          <div style={{fontSize:13,color:"#64748b",marginBottom:4}}>📍 {inv.city} | 🌡️ {inv.storage}</div>
          {inv.vehicle&&<div style={{fontSize:13,color:"#64748b",marginBottom:4}}>🚗 Vehicle: {inv.vehicle}</div>}
          {inv.remarks&&<div style={{fontSize:13,color:"#d97706",background:"#fffbeb",padding:"6px 10px",borderRadius:6,marginBottom:8}}>💬 {inv.remarks}</div>}

          {active?.id===inv.id ? (
            <div style={{marginTop:12,border:"1px solid #e2e8f0",borderRadius:8,padding:14,background:"#f8fafc"}}>
              {/* GPS */}
              <div style={{marginBottom:14}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:6}}>Step 1: Get GPS Location (Required)</div>
                <button onClick={getGPS} disabled={locating}
                  style={{background:gps?"#10b981":"#0ea5e9",color:"white",border:"none",padding:"9px 16px",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:13,width:"100%"}}>
                  {locating?"Getting location...":gps?`✅ GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`:"📍 Get My Location"}
                </button>
              </div>
              {/* Photo */}
              <div style={{marginBottom:14}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:6}}>Step 2: Scan Invoice / Take POD Photo</div>
                <input type="file" accept="image/*" capture="environment" id={`pod_${inv.id}`} style={{display:"none"}} onChange={handlePhoto} />
                <label htmlFor={`pod_${inv.id}`} style={{display:"inline-block",background:"#8b5cf6",color:"white",border:"none",padding:"9px 16px",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:13}}>
                  📸 {pod?"Change Photo":"Take Photo"}
                </label>
                {pod&&<img src={pod} alt="POD" style={{display:"block",marginTop:8,width:"100%",maxWidth:200,borderRadius:8,border:"2px solid #e2e8f0"}} />}
              </div>
              {/* Actions */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>submit(inv,"delivered")} style={{background:"#10b981",color:"white",border:"none",padding:"10px 16px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>✅ Mark Delivered</button>
                <button onClick={()=>submit(inv,"failed")}    style={{background:"#ef4444",color:"white",border:"none",padding:"10px 16px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13}}>❌ Failed Delivery</button>
                <button onClick={()=>setActive(null)}         style={{background:"#f1f5f9",border:"none",padding:"10px 14px",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:13,color:"#64748b"}}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>{setActive(inv);setGps(null);setPod(null);}}
              style={{background:"#1A3A5C",color:"white",border:"none",padding:"10px 20px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13,marginTop:8,width:"100%"}}>
              Start Delivery →
            </button>
          )}
        </Card>
      ))}

      {doneList.length>0 && (
        <>
          <div style={{fontWeight:700,fontSize:15,color:"#0f172a",margin:"16px 0 10px"}}>✅ Completed ({doneList.length})</div>
          {doneList.map(inv=>(
            <Card key={inv.id} style={{opacity:0.65}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontWeight:700,fontSize:13,color:"#6366f1"}}>{inv.id}</span>
                <Badge status="delivered" />
              </div>
              <div style={{fontWeight:600,fontSize:14}}>{inv.customer}</div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
