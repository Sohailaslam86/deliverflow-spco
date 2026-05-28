import { useState } from "react";
import { Card, CardTitle, Btn, Select, Input, SuccessMsg } from "../components/Shared.jsx";

export default function Download({ invoices, uploads }) {
  const [dcF,   setDcF]   = useState("all");
  const [dateF, setDateF] = useState("");
  const [done,  setDone]  = useState("");

  const delivered = invoices.filter(i=>{
    const mD  = dcF==="all"||i.dc===dcF;
    const mDt = !dateF||i.date===dateF;
    return i.status==="delivered"&&mD&&mDt;
  });

  function downloadCSV() {
    const headers = ["Invoice#","Customer","Institution","DC","City","Driver","Vehicle","Storage","Date","DeliveredAt","Status","Batch","GPS_Lat","GPS_Lng"];
    const rows = delivered.map(i=>[
      i.id,i.customer,i.inst,i.dc,i.city||i.dc,i.driverId||"-",i.vehicle||"-",
      i.storage,i.date,i.deliveredAt||"-",i.status,i.uploadBatch||"-",
      i.gps?.lat||"-",i.gps?.lng||"-"
    ]);
    const csv = [headers.join(","),...rows.map(r=>r.join(","))].join("\n");
    const a   = document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`SPCO_Deliveries_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    setDone("CSV report downloaded!");
    setTimeout(()=>setDone(""),3000);
  }

  return (
    <div>
      {done && <SuccessMsg msg={done} />}

      <Card>
        <CardTitle>📥 Download PODs & Reports</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0 12px",marginBottom:16}}>
          <Select label="DC Filter" value={dcF} onChange={setDcF} options={["all","Riyadh","Jeddah","Dammam"]} />
          <Input label="Date Filter" value={dateF} onChange={setDateF} type="date" />
        </div>
        <div style={{fontSize:14,fontWeight:600,color:"#6366f1",marginBottom:16}}>
          {delivered.length} delivered invoices found
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:16}}>
          <div style={{border:"1px solid #e2e8f0",borderRadius:10,padding:18,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:6}}>🗜️</div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>POD Images (ZIP)</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>All POD photos — requires Firebase Storage (Phase 2)</div>
            <Btn onClick={()=>alert("ZIP download will be available after Firebase Storage setup in Phase 2.")} color="#64748b">⬇ Download ZIP</Btn>
          </div>
          <div style={{border:"1px solid #e2e8f0",borderRadius:10,padding:18,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:6}}>📊</div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Excel/CSV Report</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Full delivery data with GPS, batch IDs, all details</div>
            <Btn onClick={downloadCSV} color="#10b981">⬇ Download CSV</Btn>
          </div>
        </div>
      </Card>

      {/* Upload history */}
      <Card>
        <CardTitle>📋 Upload Batch History</CardTitle>
        {(uploads||[]).length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No uploads yet</div>}
        {[...(uploads||[])].reverse().map(u=>(
          <div key={u.batchId} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,color:"#6366f1"}}>{u.batchId}</div>
              <div style={{fontSize:12,color:"#64748b"}}>{u.date} {u.time} | By: {u.uploadedBy} | {u.invoiceCount} invoices</div>
              {u.postedAt&&<div style={{fontSize:11,color:"#10b981"}}>Posted: {u.postedAt}</div>}
            </div>
            <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:"#d1fae5",color:"#065f46"}}>POSTED</span>
          </div>
        ))}
      </Card>

      {/* Delivered list */}
      {delivered.length>0&&(
        <Card>
          <CardTitle>✅ Delivered Invoices ({delivered.length})</CardTitle>
          {delivered.map(inv=>(
            <div key={inv.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:"#6366f1",minWidth:130}}>{inv.id}</span>
              <span style={{flex:1,fontSize:13}}>{inv.customer}</span>
              <span style={{fontSize:12,color:"#64748b"}}>{inv.dc} DC</span>
              <span style={{fontSize:12,color:"#64748b"}}>📅 {inv.date}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
