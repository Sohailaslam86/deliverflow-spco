import { useState } from "react";
import { DEMO_USERS, DEMO_PW, RC, RI, DEPARTMENTS, LOCATIONS, DCS } from "../data/masterData.js";
import { Input, Select, Textarea, Btn } from "./Shared.jsx";

export default function Login({ onLogin, lang, setLang }) {
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [demo, setDemo] = useState(false);
  const rtl = lang === "ar";

  function doLogin() {
    const u = DEMO_USERS.find(
      u => (u.email === email.trim().toLowerCase() || u.phone === email.trim()) && pass === DEMO_PW
    );
    if (u) onLogin(u);
    else setErr(rtl ? "بيانات غير صحيحة" : "Invalid email or password");
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#0a0a0f", direction:rtl?"rtl":"ltr", fontFamily:"Segoe UI,sans-serif" }}>
      <div style={{ position:"fixed", top:0, left:0, width:"50%", height:"100%", background:"linear-gradient(135deg,#0d1b2a,#1a3a5c)", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, right:0, width:"50%", height:"100%", background:"#f8fafc", zIndex:0 }} />
      <div style={{ position:"fixed", top:16, [rtl?"left":"right"]:16, zIndex:100, display:"flex", gap:4, background:"rgba(255,255,255,0.1)", borderRadius:20, padding:4 }}>
        {[["en","EN"],["ar","عربي"]].map(([l,lbl]) => (
          <button key={l} onClick={() => setLang(l)}
            style={{ background:lang===l?"white":"none", color:lang===l?"#1A3A5C":"rgba(255,255,255,0.6)", border:"none", padding:"6px 14px", borderRadius:16, cursor:"pointer", fontSize:13, fontWeight:600 }}>
            {lbl}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", width:"100%", maxWidth:960, margin:"0 auto", minHeight:"100vh", position:"relative", zIndex:10 }}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 32px", color:"white" }}>
          <div style={{ width:72, height:72, marginBottom:24, background:"linear-gradient(135deg,#c0392b,#e74c3c)", clipPath:"polygon(50% 0%,0% 100%,100% 100%)" }} />
          <div style={{ fontSize:20, fontWeight:700 }}>الشركة السعودية للأدوية</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:16 }}>Saudi Pharmaceutical Co.</div>
          <div style={{ width:50, height:3, background:"#e74c3c", borderRadius:2, marginBottom:14 }} />
          <div style={{ fontSize:36, fontWeight:900, letterSpacing:"-1px", marginBottom:6 }}>DeliverFlow</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Logistics & Delivery Management</div>
          {["Riyadh DC","Jeddah DC","Dammam DC"].map(dc => (
            <div key={dc} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, fontSize:14, color:"rgba(255,255,255,0.7)" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#e74c3c", flexShrink:0 }} />{dc}
            </div>
          ))}
        </div>
        <div style={{ flex:1, background:"#f8fafc", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 32px" }}>
          {screen === "login" ? (
            <div style={{ maxWidth:380, width:"100%" }}>
              <h1 style={{ fontSize:26, fontWeight:900, color:"#0f172a", margin:"0 0 6px" }}>
                {rtl ? "مرحباً بك" : "Welcome Back"}
              </h1>
              <p style={{ fontSize:14, color:"#64748b", marginBottom:24 }}>
                {rtl ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
              </p>
              <Input label={rtl?"البريد أو الهاتف":"Email or Phone"} value={email} onChange={setEmail} placeholder="email@spco.sa" />
              <Input label={rtl?"كلمة المرور":"Password"} value={pass} onChange={setPass} type="password" placeholder="........" />
              {err && <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:12 }}>{err}</div>}
              <Btn onClick={doLogin} style={{ width:"100%", marginBottom:10, padding:13, fontSize:15 }}>
                {rtl ? "تسجيل الدخول" : "Sign In"}
              </Btn>
              <button onClick={() => setScreen("request")}
                style={{ width:"100%", background:"white", border:"1.5px solid #e2e8f0", color:"#374151", padding:11, borderRadius:8, fontWeight:600, fontSize:14, cursor:"pointer", marginBottom:10 }}>
                {rtl ? "طلب الوصول" : "Request Access"}
              </button>
              <button onClick={() => setScreen("driver")}
                style={{ width:"100%", background:"white", border:"1.5px solid #10b981", color:"#065f46", padding:11, borderRadius:8, fontWeight:600, fontSize:14, cursor:"pointer", marginBottom:16 }}>
                {rtl ? "طلب وصول سائق" : "Driver Access Request"}
              </button>
              <button onClick={() => setDemo(!demo)}
                style={{ width:"100%", background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:"8px", cursor:"pointer", fontSize:13, color:"#64748b" }}>
                Demo Accounts {demo ? "▲" : "▼"}
              </button>
              {demo && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:12, color:"#94a3b8", textAlign:"center", marginBottom:8 }}>Password: <b>spco2026</b></div>
                  {DEMO_USERS.map(u => (
                    <button key={u.uid} onClick={() => { setEmail(u.email); setPass(DEMO_PW); }}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", background:"white", textAlign:"left", marginBottom:4, width:"100%" }}>
                      <span style={{ width:28, height:28, borderRadius:"50%", background:RC[u.role], display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{RI[u.role]}</span>
                      <div style={{ flex:1, textAlign:"left" }}>
                        <div style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{u.name}</div>
                        <div style={{ fontSize:11, color:"#94a3b8" }}>{u.role} — {u.location}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <AccessRequestForm type={screen === "driver" ? "driver" : "authority"} onBack={() => setScreen("login")} rtl={rtl} />
          )}
          <div style={{ marginTop:24, textAlign:"center", fontSize:11, color:"#94a3b8" }}>
            2026 Saudi Pharmaceutical Co. (SPCO)
          </div>
        </div>
      </div>
    </div>1
  );
}

function AccessRequestForm({ type, onBack, rtl }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name:"", displayName:"", empId:"", mobile:"", email:"", dept:"", role: type==="driver"?"driver":"viewonly", location:"", dc:"", reason:"", licNo:"", licExp:"" });
  const isDriver = type === "driver";

  if (sent) return (
    <div style={{ maxWidth:380, width:"100%" }}>
      <div style={{ background:"#d1fae5", color:"#065f46", borderRadius:10, padding:20, textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>Request Submitted!</div>
        <div style={{ fontSize:13, marginBottom:16 }}>Your request has been sent for approval.</div>
        <button onClick={onBack} style={{ background:"#065f46", color:"white", border:"none", padding:"10px 24px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>Back to Login</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:480, width:"100%", maxHeight:"80vh", overflowY:"auto" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#1A3A5C", cursor:"pointer", fontSize:14, fontWeight:600, marginBottom:16, padding:0 }}>← Back</button>
      <h1 style={{ fontSize:22, fontWeight:900, color:"#0f172a", margin:"0 0 20px" }}>
        {isDriver ? "Driver Access Request" : "Request System Access"}
      </h1>
      <Input label="Full Name" value={form.name} onChange={v=>setForm({...form,name:v})} required />
      {!isDriver && <Input label="Display Name in System" value={form.displayName} onChange={v=>setForm({...form,displayName:v})} required />}
      <Input label="Employee ID" value={form.empId} onChange={v=>setForm({...form,empId:v})} />
      <Input label="Mobile Number" value={form.mobile} onChange={v=>setForm({...form,mobile:v})} required />
      <Input label="Email Address" value={form.email} onChange={v=>setForm({...form,email:v})} type="email" />
      {isDriver ? (
        <>
          <Select label="DC Assignment" value={form.dc} onChange={v=>setForm({...form,dc:v})} options={DCS} required />
          <Input label="License Number" value={form.licNo} onChange={v=>setForm({...form,licNo:v})} required />
          <Input label="License Expiry" value={form.licExp} onChange={v=>setForm({...form,licExp:v})} type="date" required />
        </>
      ) : (
        <>
          <Select label="Department" value={form.dept} onChange={v=>setForm({...form,dept:v})} options={DEPARTMENTS} required />
          <Select label="Location" value={form.location} onChange={v=>setForm({...form,location:v})} options={LOCATIONS} />
          <Select label="DC Access" value={form.dc} onChange={v=>setForm({...form,dc:v})} options={["All",...DCS]} />
        </>
      )}
      <Textarea label="Reason for Access" value={form.reason} onChange={v=>setForm({...form,reason:v})} required />
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#0369a1", marginBottom:16 }}>
        Your request will receive a unique reference number upon approval.
        {isDriver && " Your DC Manager will approve first, then Admin will finalize."}
      </div>
      <Btn onClick={() => setSent(true)} style={{ width:"100%" }}>Submit Request</Btn>
    </div>
  );
}