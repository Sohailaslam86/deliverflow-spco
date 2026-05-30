import { useState } from "react";
import { Card, CardTitle, Btn, Input, SuccessMsg, InfoBox } from "../components/Shared.jsx";
import { genId } from "../data/masterData.js";

const T = {
  en: {
    step1:"Step 1 — Download Template", step2:"Step 2 — Upload CSV File",
    step3:"Step 3 — Preview & POST", downloadTpl:"Download CSV Template",
    dragDrop:"Drag & drop CSV here", chooseFile:"Choose File",
    postBtn:"POST — Make Invoices Live", history:"Upload & Posting History",
    noHistory:"No uploads yet", batchId:"Batch ID", date:"Date",
    uploadedBy:"Uploaded by", postedBy:"Posted by", invoices:"invoices",
    warning:"Once POSTED, invoices will be live in all DC queues. Verify data before posting.",
    posted:"POSTED", draft:"DRAFT",
    editBtn:"Edit", deleteBtn:"Delete", cancelBtn:"Cancel Batch",
    confirmDel:"Are you sure you want to delete this batch?",
    adminOnly:"Admin only", viewPDF:"View PDF",
    pdfNote:"CSV is automatically saved as PDF record"
  },
  ar: {
    step1:"\u0627\u0644\u062e\u0637\u0648\u0629 1 \u2014 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0646\u0645\u0648\u0630\u062c",
    step2:"\u0627\u0644\u062e\u0637\u0648\u0629 2 \u2014 \u0631\u0641\u0639 \u0645\u0644\u0641 CSV",
    step3:"\u0627\u0644\u062e\u0637\u0648\u0629 3 \u2014 \u0645\u0639\u0627\u064a\u0646\u0629 \u0648\u062a\u0631\u062d\u064a\u0644",
    downloadTpl:"\u062a\u062d\u0645\u064a\u0644 \u0646\u0645\u0648\u0630\u062c CSV",
    dragDrop:"\u0627\u0633\u062d\u0628 \u0648\u0623\u0641\u0644\u062a \u0645\u0644\u0641 CSV \u0647\u0646\u0627",
    chooseFile:"\u0627\u062e\u062a\u0631 \u0645\u0644\u0641\u0627\u064b",
    postBtn:"\u062a\u0631\u062d\u064a\u0644 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631",
    history:"\u0633\u062c\u0644 \u0627\u0644\u0631\u0641\u0639 \u0648\u0627\u0644\u062a\u0631\u062d\u064a\u0644",
    noHistory:"\u0644\u0627 \u064a\u0648\u062c\u062f \u0633\u062c\u0644\u0627\u062a \u0628\u0639\u062f",
    batchId:"\u0631\u0642\u0645 \u0627\u0644\u062f\u0641\u0639\u0629",
    date:"\u0627\u0644\u062a\u0627\u0631\u064a\u062e",
    uploadedBy:"\u0631\u0641\u0639 \u0628\u0648\u0627\u0633\u0637\u0629",
    postedBy:"\u0631\u062d\u0651\u0644 \u0628\u0648\u0627\u0633\u0637\u0629",
    invoices:"\u0641\u0648\u0627\u062a\u064a\u0631",
    warning:"\u0628\u0639\u062f \u0627\u0644\u062a\u0631\u062d\u064a\u0644\u060c \u0633\u062a\u0638\u0647\u0631 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631 \u0641\u064a \u062c\u0645\u064a\u0639 \u0637\u0648\u0627\u0628\u064a\u0631 \u0627\u0644\u0645\u0631\u0627\u0643\u0632.",
    posted:"\u0645\u0631\u062d\u0651\u0644", draft:"\u0645\u0633\u0648\u062f\u0629",
    editBtn:"\u062a\u0639\u062f\u064a\u0644", deleteBtn:"\u062d\u0630\u0641",
    cancelBtn:"\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062f\u0641\u0639\u0629",
    confirmDel:"\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u062f\u0641\u0639\u0629\u061f",
    adminOnly:"\u0644\u0644\u0645\u062f\u064a\u0631 \u0641\u0642\u0637",
    viewPDF:"\u0639\u0631\u0636 PDF",
    pdfNote:"\u064a\u062a\u0645 \u062d\u0641\u0638 CSV \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0643\u0633\u062c\u0644 PDF"
  }
};

export default function Upload({ user, invoices, setInvoices, uploads, setUploads, lang }) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [done, setDone] = useState("");
  const [pendingBatch, setPendingBatch] = useState(null);
  const [viewPDF, setViewPDF] = useState(null);

  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const isAdmin = user.role === "admin";

  function dlTemplate() {
    const csv = "Invoice Number,Invoice Date,Customer Name,Institution,DC\n6032151035,2026-05-27,Hospital Name,Government,Riyadh";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "SPCO_Invoice_Template.csv"; a.click();
  }

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    const rows = [
      ["INV-"+Math.floor(6032151100+Math.random()*1000),"2026-05-29","King Abdullah Medical City","Government","Riyadh"],
      ["INV-"+Math.floor(6032151100+Math.random()*1000),"2026-05-29","Dr Sulaiman Al Habib - Jeddah","Private","Jeddah"],
      ["INV-"+Math.floor(6032151100+Math.random()*1000),"2026-05-29","Dammam Central Hospital","Government","Dammam"],
    ];
    setPendingBatch({ rows, batchId:genId("UPLOAD") });
    setDone("");
  }

  function postInvoices() {
    if (!pendingBatch) return;
    const { rows, batchId } = pendingBatch;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0,5);

    const newInvs = rows.map(r => ({
      id:r[0], customer:r[2], inst:r[3], dc:r[4], city:r[4],
      status:"pending", driverId:null, vehicle:null,
      storage:"Ambient (15-25\u00b0C)", dtype:"incity",
      date:r[1], uploadBatch:batchId,
      remarks:"", podImage:null, gps:null,
      assignedAt:null, deliveredAt:null, attempts:0
    }));

    setInvoices(prev => [...prev, ...newInvs]);
    setUploads(prev => [...prev, {
      batchId, date:rows[0][1]||now.toISOString().split("T")[0],
      time:timeStr, uploadedBy:user.name,
      postedBy:user.name, postedAt:now.toLocaleString(),
      status:"posted", invoiceCount:rows.length,
      rows, notes:""
    }]);

    setDone("\u2705 Batch "+batchId+" posted — "+rows.length+" invoices live!");
    setPendingBatch(null); setFile(null);
  }

  function deleteBatch(batchId) {
    if (!window.confirm(t.confirmDel)) return;
    setUploads(prev => prev.filter(u => u.batchId !== batchId));
    setInvoices(prev => prev.filter(i => i.uploadBatch !== batchId));
    setDone("Batch "+batchId+" deleted.");
    setTimeout(()=>setDone(""),3000);
  }

  function showPDF(batch) {
    setViewPDF(batch);
  }

  if (viewPDF) {
    return (
      <div style={{ direction:rtl?"rtl":"ltr" }}>
        <button onClick={()=>setViewPDF(null)}
          style={{ background:"#1A3A5C", color:"white", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, marginBottom:16 }}>
          \u2190 Back
        </button>
        <Card>
          <CardTitle>\ud83d\udcc4 {t.viewPDF} — {viewPDF.batchId}</CardTitle>
          <div style={{ marginBottom:12, fontSize:13, color:"#64748b" }}>
            {t.date}: {viewPDF.date} | {t.uploadedBy}: {viewPDF.uploadedBy} | {t.postedBy}: {viewPDF.postedBy}
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#1A3A5C" }}>
                  {["Invoice #","Date","Customer","Institution","DC"].map(h=>(
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:"white" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(viewPDF.rows||[]).map((r,i)=>(
                  <tr key={i} style={{ background:i%2===0?"white":"#f8fafc" }}>
                    {r.map((c,j)=><td key={j} style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9" }}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:16, fontSize:12, color:"#94a3b8", textAlign:"center" }}>
            Saudi Pharmaceutical Co. (SPCO) — DeliverFlow — Read Only Record
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done && <SuccessMsg msg={done} />}

      <Card>
        <CardTitle>{t.step1}</CardTitle>
        <p style={{ fontSize:13, color:"#64748b", marginBottom:14 }}>Download CSV, fill 5 columns, then upload below.</p>
        <Btn onClick={dlTemplate} style={{ marginBottom:12 }}>\u2b07 {t.downloadTpl}</Btn>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["Invoice Number","Invoice Date","Customer Name","Institution","DC"].map(c=>(
            <span key={c} style={{ background:"#f1f5f9", borderRadius:6, padding:"4px 10px", fontSize:12, color:"#374151" }}>{c}</span>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>{t.step2}</CardTitle>
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
          style={{ border:`2px dashed ${drag?"#6366f1":"#cbd5e1"}`, background:drag?"#eef2ff":"white", borderRadius:10, padding:"32px", textAlign:"center", marginBottom:12 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>\ud83d\udcc2</div>
          <div style={{ color:"#64748b", marginBottom:12 }}>{file?file.name:t.dragDrop}</div>
          <input type="file" accept=".csv" id="csv" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
          <label htmlFor="csv" style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:600 }}>{t.chooseFile}</label>
        </div>
      </Card>

      {pendingBatch && (
        <Card>
          <CardTitle>{t.step3}</CardTitle>
          <InfoBox>Batch ID: <b>{pendingBatch.batchId}</b></InfoBox>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr>{["Invoice #","Date","Customer","Institution","DC"].map(h=><th key={h} style={{ background:"#f8fafc", padding:"9px 12px", textAlign:"left", fontWeight:700, borderBottom:"1px solid #e2e8f0" }}>{h}</th>)}</tr></thead>
              <tbody>{pendingBatch.rows.map((r,i)=><tr key={i} style={{ background:i%2===0?"#f8fafc":"white" }}>{r.map((c,j)=><td key={j} style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9" }}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div style={{ background:"#fef3c7", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#92400e", margin:"12px 0" }}>
            \u26a0\ufe0f {t.warning}
          </div>
          <Btn onClick={postInvoices} color="#10b981" style={{ width:"100%", padding:12 }}>
            \ud83d\ude80 {t.postBtn} ({pendingBatch.rows.length})
          </Btn>
        </Card>
      )}

      <Card>
        <CardTitle>\ud83d\udccb {t.history}</CardTitle>
        <div style={{ fontSize:12, color:"#94a3b8", marginBottom:10 }}>\ud83d\udca1 {t.pdfNote}</div>
        {uploads.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noHistory}</div>}
        {[...uploads].reverse().map(u=>(
          <div key={u.batchId} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{u.batchId}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{u.date} {u.time} — {t.uploadedBy}: {u.uploadedBy} — {u.invoiceCount} {t.invoices}</div>
              {u.postedAt&&<div style={{ fontSize:11, color:"#10b981" }}>{t.postedBy}: {u.postedBy} | {u.postedAt}</div>}
            </div>
            <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:u.status==="posted"?"#d1fae5":"#fef3c7", color:u.status==="posted"?"#065f46":"#92400e" }}>
              {u.status==="posted"?t.posted:t.draft}
            </span>
            <Btn small onClick={()=>showPDF(u)} color="#6366f1">\ud83d\udcc4 {t.viewPDF}</Btn>
            {isAdmin && (
              <Btn small onClick={()=>deleteBatch(u.batchId)} color="#ef4444">\ud83d\uddd1\ufe0f {t.deleteBtn}</Btn>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
