import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, InfoBox } from "../components/Shared.jsx";
import { genId } from "../data/masterData.js";

export default function Upload({ user, invoices, setInvoices, uploads, setUploads }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [drag, setDrag]       = useState(false);
  const [done, setDone]       = useState("");
  const [pendingBatch, setPendingBatch] = useState(null);

  function dlTemplate() {
    const csv = "Invoice Number,Invoice Date,Customer Name,Institution,DC\n6032151035,2026-05-27,Hospital Name,Government,Riyadh";
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="SPCO_Invoice_Template.csv";
    a.click();
  }

  function handleFile(f) {
    if(!f) return;
    setFile(f);
    // Simulate CSV parse - demo rows
    const rows = [
      ["INV-6032151035","2026-05-27","King Abdullah Medical City","Government","Riyadh"],
      ["INV-6032151036","2026-05-27","Dr Sulaiman Al Habib - Jeddah","Private","Jeddah"],
      ["INV-6032151037","2026-05-27","Dammam Central Hospital","Government","Dammam"],
    ];
    setPendingBatch({ rows, batchId: genId("UPLOAD") });
    setDone("");
  }

  function postInvoices() {
    if(!pendingBatch) return;
    const { rows, batchId } = pendingBatch;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0,5);

    const newInvs = rows.map(r => ({
      id: r[0], customer: r[2], inst: r[3], dc: r[4], city: r[4],
      status:"pending", driverId:null, vehicle:null,
      storage:"Ambient (15-25°C)", dtype:"incity",
      date: r[1], uploadBatch: batchId,
      remarks:"", podImage:null, gps:null,
      assignedAt:null, deliveredAt:null, failReason:null, attempts:0
    }));

    setInvoices(prev => [...prev, ...newInvs]);
    setUploads(prev => [...prev, {
      batchId, date: r[1] || now.toISOString().split("T")[0],
      time: timeStr, uploadedBy: user.name,
      postedBy: user.name, postedAt: now.toLocaleString(),
      status:"posted", invoiceCount: rows.length, notes:""
    }]);

    setDone(`✅ Batch ${batchId} posted — ${rows.length} invoices are now live!`);
    setPendingBatch(null); setFile(null); setPreview(null);
  }

  return (
    <div>
      {done && <SuccessMsg msg={done} />}

      {/* Step 1 */}
      <Card>
        <CardTitle>Step 1 — Download Template</CardTitle>
        <p style={{fontSize:13,color:"#64748b",marginBottom:14}}>Download CSV, fill 5 columns, then upload below.</p>
        <Btn onClick={dlTemplate} style={{marginBottom:12}}>⬇ Download CSV Template</Btn>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["Invoice Number","Invoice Date","Customer Name","Institution","DC"].map(c=>(
            <span key={c} style={{background:"#f1f5f9",borderRadius:6,padding:"4px 10px",fontSize:12,color:"#374151"}}>{c}</span>
          ))}
        </div>
      </Card>

      {/* Step 2 */}
      <Card>
        <CardTitle>Step 2 — Upload CSV File</CardTitle>
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}}
          onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
          style={{border:`2px dashed ${drag?"#6366f1":"#cbd5e1"}`,background:drag?"#eef2ff":"white",borderRadius:10,padding:"32px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:40,marginBottom:8}}>📂</div>
          <div style={{color:"#64748b",marginBottom:12}}>{file?file.name:"Drag & drop CSV here"}</div>
          <input type="file" accept=".csv" id="csv" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
          <label htmlFor="csv" style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>Choose File</label>
        </div>
      </Card>

      {/* Step 3 - Preview & POST */}
      {pendingBatch && (
        <Card>
          <CardTitle>Step 3 — Preview & POST</CardTitle>
          <InfoBox>Batch ID: <b>{pendingBatch.batchId}</b> — This will be your permanent reference number</InfoBox>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr>{["Invoice #","Date","Customer","Institution","DC"].map(h=><th key={h} style={{background:"#f8fafc",padding:"9px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:12,borderBottom:"1px solid #e2e8f0"}}>{h}</th>)}</tr></thead>
              <tbody>{pendingBatch.rows.map((r,i)=><tr key={i} style={{background:i%2===0?"#f8fafc":"white"}}>{r.map((c,j)=><td key={j} style={{padding:"8px 12px",borderBottom:"1px solid #f1f5f9",color:"#334155"}}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div style={{background:"#fef3c7",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#92400e",margin:"12px 0"}}>
            ⚠️ Once POSTED, invoices will be live in all DC queues. Verify data before posting.
          </div>
          <Btn onClick={postInvoices} color="#10b981" style={{width:"100%",padding:12,fontSize:14}}>
            🚀 POST — Make {pendingBatch.rows.length} Invoices Live
          </Btn>
        </Card>
      )}

      {/* Upload History */}
      <Card>
        <CardTitle>📋 Upload & Posting History</CardTitle>
        {uploads.length===0 && <div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No uploads yet</div>}
        {[...uploads].reverse().map(u=>(
          <div key={u.batchId} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontWeight:700,fontSize:13,color:"#6366f1"}}>{u.batchId}</div>
              <div style={{fontSize:12,color:"#64748b"}}>{u.date} {u.time} — By: {u.uploadedBy} — {u.invoiceCount} invoices</div>
              {u.postedAt && <div style={{fontSize:11,color:"#10b981"}}>Posted: {u.postedAt} by {u.postedBy}</div>}
            </div>
            <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:u.status==="posted"?"#d1fae5":"#fef3c7",color:u.status==="posted"?"#065f46":"#92400e"}}>{u.status.toUpperCase()}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
