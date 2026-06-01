import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Input, Btn } from "./Shared.jsx";

const T = {
  en: {
    companyAr:"الشركة السعودية للأدوية",
    welcome:"Welcome Back", signin:"Sign in to continue",
    email:"Email Address", password:"Password",
    signInBtn:"Sign In", invalidCreds:"Invalid email or password",
    footer:"2026 Saudi Pharmaceutical Co. SPCO"
  },
  ar: {
    companyAr:"الشركة السعودية للأدوية",
    welcome:"مرحباً بك", signin:"سجّل دخولك للمتابعة",
    email:"البريد الإلكتروني", password:"كلمة المرور",
    signInBtn:"تسجيل الدخول", invalidCreds:"بيانات غير صحيحة",
    footer:"2026 الشركة السعودية للأدوية SPCO"
  }
};

export default function Login({ onLogin, lang, setLang }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const rtl = lang === "ar";
  const t = T[lang] || T.en;

  async function doLogin() {
    if (!email.trim() || !pass.trim()) { setErr(t.invalidCreds); return; }
    setLoading(true); setErr("");
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      // App.jsx ka onAuthStateChanged handle karega
    } catch (e) {
      setErr(t.invalidCreds);
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key==="Enter") doLogin(); }

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

        {/* Left Panel */}
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

        {/* Right Panel */}
        <div style={{ flex:1, background:"#f8fafc", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 32px", direction:rtl?"rtl":"ltr" }}>
          <div style={{ maxWidth:380, width:"100%", marginLeft:rtl?"auto":"0", marginRight:rtl?"0":"auto" }}>
            <h1 style={{ fontSize:26, fontWeight:900, color:"#0f172a", margin:"0 0 6px" }}>{t.welcome}</h1>
            <p style={{ fontSize:14, color:"#64748b", marginBottom:24 }}>{t.signin}</p>

            <Input label={t.email} value={email} onChange={setEmail} placeholder="name@spco.sa" />
            <div onKeyDown={handleKey}>
              <Input label={t.password} value={pass} onChange={setPass} type="password" placeholder="••••••••" />
            </div>

            {err && (
              <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:12 }}>
                {err}
              </div>
            )}

            <Btn onClick={doLogin} style={{ width:"100%", padding:13, fontSize:15 }}>
              {loading ? "Signing in..." : t.signInBtn}
            </Btn>

            <div style={{ marginTop:16, textAlign:"center", fontSize:12, color:"#94a3b8" }}>
              Contact your administrator for access
            </div>
          </div>
          <div style={{ marginTop:24, textAlign:"center", fontSize:11, color:"#94a3b8" }}>{t.footer}</div>
        </div>
      </div>
    </div>
  );
}
