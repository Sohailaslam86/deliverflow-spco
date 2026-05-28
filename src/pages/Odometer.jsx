import { useState } from "react";
import { Card, CardTitle, Btn, Input, SuccessMsg } from "../components/Shared.jsx";

export default function Odometer({ user }) {
  const [startPhoto, setStartPhoto] = useState(null);
  const [endPhoto,   setEndPhoto]   = useState(null);
  const [startKM,    setStartKM]    = useState("102,345");
  const [endKM,      setEndKM]      = useState(null);
  const [manualStart,setManualStart]= useState("");
  const [manualEnd,  setManualEnd]  = useState("");
  const [useManual,  setUseManual]  = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [lastReading]= useState({ km:"102,345", date:"2026-05-25", photo:null });

  const diff = startKM && endKM ? (Number(endKM.replace(",","")) - Number(startKM.replace(",",""))).toLocaleString() : null;
  const deviation = manualStart && startKM && Math.abs(Number(manualStart.replace(",",""))-Number(startKM.replace(",","")))>5;

  return (
    <div>
      {/* Last reading comparison */}
      <Card style={{borderLeft:"4px solid #3b82f6"}}>
        <CardTitle>📅 Previous Reading (Last Trip End)</CardTitle>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 16px",fontSize:13}}>
            <div style={{fontWeight:700,fontSize:20,color:"#3b82f6"}}>{lastReading.km} KM</div>
            <div style={{color:"#64748b"}}>Date: {lastReading.date}</div>
          </div>
          <div style={{fontSize:13,color:"#64748b"}}>
            <div>⚠️ Today's opening reading must match this value.</div>
            <div>If different, report deviation to DC Manager.</div>
          </div>
        </div>
      </Card>

      {submitted ? (
        <SuccessMsg msg="Daily Mileage Record submitted! Awaiting DC Manager approval." />
      ) : (
        <Card>
          <CardTitle>🔢 Daily Mileage Record</CardTitle>
          <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>
            Take odometer photo at trip start and end. AI reads automatically. Manual entry available with DC Manager approval.
          </p>

          {/* Manual override toggle */}
          <div style={{marginBottom:16}}>
            <button onClick={()=>setUseManual(!useManual)}
              style={{background:useManual?"#fef3c7":"#f1f5f9",border:`1px solid ${useManual?"#fbbf24":"#e2e8f0"}`,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600,color:useManual?"#92400e":"#64748b"}}>
              ✏️ {useManual?"Using Manual Entry (Requires Approval)":"Switch to Manual Entry"}
            </button>
          </div>

          {/* START */}
          <div style={{border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>🟢 Trip Start Reading</div>
            <input type="file" accept="image/*" capture="environment" id="odo_start" style={{display:"none"}}
              onChange={e=>{const f=e.target.files[0];if(f)setStartPhoto(URL.createObjectURL(f));}} />
            <label htmlFor="odo_start" style={{display:"inline-block",background:"#8b5cf6",color:"white",border:"none",padding:"9px 16px",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:13}}>
              📸 {startPhoto?"Change Photo":"Take Photo"}
            </label>
            {startPhoto && (
              <div style={{marginTop:10,display:"flex",alignItems:"center",gap:12}}>
                <img src={startPhoto} alt="odo" style={{width:80,height:60,objectFit:"cover",borderRadius:6,border:"1px solid #e2e8f0"}} />
                <div style={{background:"#f0fdf4",padding:"6px 12px",borderRadius:6,fontSize:13}}>
                  🤖 AI Read: <b>{startKM} KM</b>
                </div>
              </div>
            )}
            {!startPhoto && <div style={{marginTop:8,fontSize:13,color:"#94a3b8"}}>🤖 AI Read: <b>{startKM} KM</b> (demo)</div>}
            {useManual && (
              <div style={{marginTop:10}}>
                <Input label="Manual Reading (KM)" value={manualStart} onChange={setManualStart} placeholder="102,345" />
                {deviation && <div style={{fontSize:12,color:"#ef4444",fontWeight:600}}>⚠️ Deviation detected! Will be flagged for DC Manager review.</div>}
              </div>
            )}
          </div>

          {/* END */}
          <div style={{border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>🔴 Trip End Reading</div>
            <input type="file" accept="image/*" capture="environment" id="odo_end" style={{display:"none"}}
              onChange={e=>{const f=e.target.files[0];if(f){setEndPhoto(URL.createObjectURL(f));setEndKM("102,487");}}} />
            <label htmlFor="odo_end" style={{display:"inline-block",background:"#8b5cf6",color:"white",border:"none",padding:"9px 16px",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:13}}>
              📸 {endPhoto?"Change Photo":"Take Photo"}
            </label>
            {endPhoto && (
              <div style={{marginTop:10,display:"flex",alignItems:"center",gap:12}}>
                <img src={endPhoto} alt="odo" style={{width:80,height:60,objectFit:"cover",borderRadius:6,border:"1px solid #e2e8f0"}} />
                <div style={{background:"#f0fdf4",padding:"6px 12px",borderRadius:6,fontSize:13}}>
                  🤖 AI Read: <b>{endKM} KM</b>
                </div>
              </div>
            )}
            {useManual && endPhoto && (
              <div style={{marginTop:10}}>
                <Input label="Manual Reading (KM)" value={manualEnd} onChange={setManualEnd} placeholder="102,487" />
              </div>
            )}
          </div>

          {/* Distance Summary */}
          {diff && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f0fdf4",padding:"12px 16px",borderRadius:8,marginBottom:12}}>
              <span style={{fontSize:14,fontWeight:600}}>📏 Distance Covered:</span>
              <span style={{fontSize:24,fontWeight:900,color:"#10b981"}}>{diff} KM</span>
            </div>
          )}

          {useManual && (
            <div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#92400e",marginBottom:12}}>
              ⚠️ Manual entry requires DC Manager approval before being recorded.
            </div>
          )}

          <Btn onClick={()=>setSubmitted(true)} style={{width:"100%",padding:12,fontSize:14}}>
            📤 Submit for DC Manager Approval
          </Btn>
        </Card>
      )}
    </div>
  );
}
