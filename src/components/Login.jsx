import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { DEMO_USERS, DEMO_PW, RC, RI, DEPARTMENTS, LOCATIONS, DCS } from "../data/masterData.js";
import { Input, Select, Textarea, Btn } from "./Shared.jsx";

const EMPTY = "";

const T = {
  en: {
    companyAr:"الشركة السعودية للأدوية",
    company:"Saudi Pharmaceutical Co.",
    welcome:"Welcome Back", signin:"Sign in to continue",
    emailPhone:"Email or Phone", password:"Password",
    signInBtn:"Sign In", requestAccess:"Request Access",
    driverAccess:"Driver Access Request", demoAccounts:"Demo Accounts",
    invalidCreds:"Invalid email or password",
    requestTitle:"Request System Access", driverTitle:"Driver Access Request",
    back:"Back", submitted:"Request Submitted!",
    submittedMsg:"Your request has been sent for approval.",
    backToLogin:"Back to Login", submitBtn:"Submit Request",
    fullName:"Full Name", displayName:"Display Name in System",
    empId:"Employee ID", mobile:"Mobile Number", email:"Email Address",
    dept:"Department", location:"Location", dcAccess:"DC Access",
    licNo:"License Number", licExp:"License Expiry",
    reason:"Reason for Access",
    refNote:"Your request will receive a unique reference number upon approval.",
    footer:"2026 Saudi Pharmaceutical Co. SPCO"
  },
  ar: {
    companyAr:"الشركة السعودية للأدوية",
    company:"Saudi Pharmaceutical Co.",
    welcome:"مرحباً بك", signin:"سجّل دخولك للمتابعة",
    emailPhone:"البريد أو الهاتف", password:"كلمة المرور",
    signInBtn:"تسجيل الدخول", requestAccess:"طلب الوصول",
    driverAccess:"طلب وصول سائق", demoAccounts:"الحسابات التجريبية",
    invalidCreds:"بيانات غير صحيحة",
    requestTitle:"طلب الوصول للنظام", driverTitle:"طلب وصول سائق",
    back:"رجوع", submitted:"تم إرسال الطلب!",
    submittedMsg:"تم إرسال طلبك للموافقة.",
    backToLogin:"العودة لتسجيل الدخول", submitBtn:"إرسال الطلب",
    fullName:"الاسم الكامل", displayName:"اسم العرض في النظام",
    empId:"رقم الموظف", mobile:"رقم الجوال", email:"البريد الإلكتروني",
    dept:"القسم", location:"الموقع", dcAccess:"صلاحية المركز",
    licNo:"رقم الرخصة", licExp:"انتهاء الرخصة",
    reason:"سبب الوصول",
    refNote:"سيحصل طلبك على رقم مرجعي فريد عند الموافقة.",
    footer:"2026 الشركة السعودية للأدوية SPCO"
  }
};

export default function Login({ onLogin, lang, setLang }) {
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState(EMPTY);
  const [pass, setPass] = useState(EMPTY);
  const [err, setErr] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(false);
  const rtl = lang === "ar";
  const t = T[lang] || T.en;

  async function doLogin() {
    if (!email.trim() || !pass.trim()) {
      setErr(t.invalidCreds);
      return;
    }
    setLoading(true);
    setErr(EMPTY);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      const firebaseUser = userCredential.user;

      // Firestore se profile load karo
      const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (docSnap.exists()) {
        onLogin({ uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() });
      } else {
        // Firestore profile nahi — demo users se dhundho (temporary)
        const demoUser = DEMO_USERS.find(u => u.email === firebaseUser.email);
        if (demoUser) {
          onLogin({ uid: firebaseUser.uid, ...demoUser });
        } else {
          onLogin({ uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.email, role: 'viewonly', dc: 'All' });
        }
      }
    } catch (e) {
      setErr(t.invalidCreds);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#0a0a0f", fontFamily:"Segoe UI,sans-serif" }}>
      <div style={{ position:"fixed", top:0, left:0, width:"50%", height:"100%", background:"linear-gradient(135deg,#0d1b2a,#1a3a5c)", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, right:0, width:"50%", height:"100%", background:"#f8fafc", zIndex:0 }} />

      {/* Language Toggle */}
      <div style={{ position:"fixed", top:16, right:16, zIndex:100, display:"flex", gap:4, background:"rgba(255,255,255,0.1)", borderRadius:20, padding:4 }}>
        {[["en","EN"],["ar","عربي"]].map(([l,lbl]) => (
          <button key={l} onClick={() => setLang(l)}
            style={{ background:lang===l?"white":"none", color:lang===l?"#1A3A5C":"rgba(255,255,255,0.6)", border:"none", padding:"6px 14px", borderRadius:16, cursor:"pointer", fontSize:13, fontWeight:600 }}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", width:"100%", maxWidth:960, margin:"0 auto", minHeight:"100vh", position:"relative", zIndex:10 }}>

        {/* Left Panel — Logo */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 32px", color:"white", direction:"ltr" }}>
          <div style={{ width:72, height:72, marginBottom:24, background:"linear-gradient(135deg,#c0392b,#e74c3c)", clipPath:"polygon(50% 0%,0% 100%,100% 100%)" }} />
          <div style={{ fontSize:20, fontWeight:700 }}>الشركة السعودية للأدوية</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:16 }}>Saudi Pharmaceutical Co.</div>
          <div style={{ width:50, height:3, background:"#e74c3c", borderRadius:2, marginBottom:14 }} />
          <div style={{ fontSize:36, fontWeight:900, letterSpacing:"-1px", marginBottom:6 }}>DeliverFlow</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Logistics and Delivery Management</div>
          {["Riyadh DC","Jeddah DC","Dammam DC"].map(dc => (
            <div key={dc} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, fontSize:14, color:"rgba(255,255,255,0.7)" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#e74c3c", flexShrink:0 }} />{dc}
            </div>
          ))}
        </div>

        {/* Right Panel — Form */}
        <div style={{ flex:1, background:"#f8fafc", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 32px", direction:rtl?"rtl":"ltr" }}>
          {screen === "login" ? (
            <div style={{ maxWidth:380, width:"100%", marginLeft:rtl?"auto":"0", marginRight:rtl?"0":"auto" }}>
              <h1 style={{ fontSize:26, fontWeight:900, color:"#0f172a", margin:"0 0 6px" }}>{t.welcome}</h1>
              <p style={{ fontSize:14, color:"#64748b", marginBottom:24 }}>{t.signin}</p>
              <Input label={t.emailPhone} value={email} onChange={setEmail} placeholder="email@spco.sa" />
              <Input label={t.password} value={pass} onChange={setPass} type="password" placeholder="........" />
              {err && <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:12 }}>{err}</div>}
              <Btn onClick={doLogin} style={{ width:"100%", marginBottom:10, padding:13, fontSize:15 }}>
                {loading ? "Signing in..." : t.signInBtn}
              </Btn>
              <button onClick={() => setScreen("request")}
                style={{ width:"100%", background:"white", border:"1.5px solid #e2e8f0", color:"#374151", padding:11, borderRadius:8, fontWeight:600, fontSize:14, cursor:"pointer", marginBottom:10 }}>
                {t.requestAccess}
              </button>
              <button onClick={() => setScreen("driver")}
                style={{ width:"100%", background:"white", border:"1.5px solid #10b981", color:"#065f46", padding:11, borderRadius:8, fontWeight:600, fontSize:14, cursor:"pointer", marginBottom:16 }}>
                {t.driverAccess}
              </button>
              <button onClick={() => setDemo(!demo)}
                style={{ width:"100%", background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:"8px", cursor:"pointer", fontSize:13, color:"#64748b" }}>
                {t.demoAccounts} {demo?"▲":"▼"}
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
            <AccessRequestForm type={screen==="driver"?"driver":"authority"} onBack={() => setScreen("login")} t={t} />
          )}
          <div style={{ marginTop:24, textAlign:"center", fontSize:11, color:"#94a3b8" }}>{t.footer}</div>
        </div>
      </div>
    </div>
  );
}

function AccessRequestForm({ type, onBack, t }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name:EMPTY, displayName:EMPTY, empId:EMPTY, mobile:EMPTY, email:EMPTY, dept:EMPTY, role:type==="driver"?"driver":"viewonly", location:EMPTY, dc:EMPTY, reason:EMPTY, licNo:EMPTY, licExp:EMPTY });
  const isDriver = type==="driver";

  if (sent) return (
    <div style={{ maxWidth:380, width:"100%" }}>
      <div style={{ background:"#d1fae5", color:"#065f46", borderRadius:10, padding:20, textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>{t.submitted}</div>
        <div style={{ fontSize:13, marginBottom:16 }}>{t.submittedMsg}</div>
        <button onClick={onBack} style={{ background:"#065f46", color:"white", border:"none", padding:"10px 24px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>{t.backToLogin}</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:480, width:"100%", maxHeight:"80vh", overflowY:"auto" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#1A3A5C", cursor:"pointer", fontSize:14, fontWeight:600, marginBottom:16, padding:0 }}>{t.back}</button>
      <h1 style={{ fontSize:22, fontWeight:900, color:"#0f172a", margin:"0 0 20px" }}>{isDriver?t.driverTitle:t.requestTitle}</h1>
      <Input label={t.fullName} value={form.name} onChange={v=>setForm({...form,name:v})} required />
      {!isDriver && <Input label={t.displayName} value={form.displayName} onChange={v=>setForm({...form,displayName:v})} required />}
      <Input label={t.empId} value={form.empId} onChange={v=>setForm({...form,empId:v})} />
      <Input label={t.mobile} value={form.mobile} onChange={v=>setForm({...form,mobile:v})} required />
      <Input label={t.email} value={form.email} onChange={v=>setForm({...form,email:v})} type="email" />
      {isDriver ? (
        <>
          <Select label={t.dcAccess} value={form.dc} onChange={v=>setForm({...form,dc:v})} options={DCS} required />
          <Input label={t.licNo} value={form.licNo} onChange={v=>setForm({...form,licNo:v})} required />
          <Input label={t.licExp} value={form.licExp} onChange={v=>setForm({...form,licExp:v})} type="date" required />
        </>
      ) : (
        <>
          <Select label={t.dept} value={form.dept} onChange={v=>setForm({...form,dept:v})} options={DEPARTMENTS} required />
          <Select label={t.location} value={form.location} onChange={v=>setForm({...form,location:v})} options={LOCATIONS} />
          <Select label={t.dcAccess} value={form.dc} onChange={v=>setForm({...form,dc:v})} options={["All",...DCS]} />
        </>
      )}
      <Textarea label={t.reason} value={form.reason} onChange={v=>setForm({...form,reason:v})} required />
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#0369a1", marginBottom:16 }}>{t.refNote}</div>
      <Btn onClick={() => setSent(true)} style={{ width:"100%" }}>{t.submitBtn}</Btn>
    </div>
  );
}
