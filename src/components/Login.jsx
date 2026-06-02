import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Input, Btn } from "./Shared.jsx";

const T = {
  en: {
    welcome:"Welcome Back", signin:"Sign in to continue",
    email:"Email Address", password:"Password",
    signInBtn:"Sign In", invalidCreds:"Invalid email or password",
    footer:"2026 Saudi Pharmaceutical Co. SPCO",
    contactAdmin:"Contact your administrator for access"
  },
  ar: {
    welcome:"مرحباً بك", signin:"سجّل دخولك للمتابعة",
    email:"البريد الإلكتروني", password:"كلمة المرور",
    signInBtn:"تسجيل الدخول", invalidCreds:"بيانات غير صحيحة",
    footer:"2026 الشركة السعودية للأدوية SPCO",
    contactAdmin:"تواصل مع المسؤول للحصول على صلاحية الدخول"
  }
};

const DCS = [
  "Riyadh — Distribution Center",
  "Jeddah — Distribution Center",
  "Dammam — Distribution Center"
];

export default function Login({ onLogin, lang, setLang }) {
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const rtl = lang === "ar";
  const t = T[lang] || T.en;

  // Online/offline detection
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

  function handleKey(e) { if (e.key === "Enter") doLogin(); }

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#0a0a0f", fontFamily:"'Segoe UI',sans-serif" }}>
      {/* Background */}
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

      {/* Offline Banner */}
      {!isOnline && (
        <div style={{ position:"fixed", top:0, left:0, right:0, background:"#f59e0b", color:"white", textAlign:"center", padding:"8px", fontSize:13, fontWeight:600, zIndex:200 }}>
          ⚠️ You are offline — Please connect to internet to login
        </div>
      )}

      <div style={{ display:"flex", width:"100%", maxWidth:1000, margin:"0 auto", minHeight:"100vh", position:"relative", zIndex:10 }}>

        {/* Left Panel — Branding */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"40px 32px", color:"white", direction:"ltr" }}>

          {/* Full Logo */}
          <div style={{ width:"100%", maxWidth:340, background:"white", borderRadius:12, padding:"14px 20px", marginBottom:28, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            {/* Left — English */}
            <div style={{ fontSize:10, fontWeight:900, color:"#1A3A5C", lineHeight:1.3, flex:1 }}>
              SAUDI<br/>PHARMACEUTICAL<br/>CO.
            </div>
            {/* Center — ELSEIF Triangle Logo */}
            <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ position:"relative", width:70, height:70 }}>
                {/* Outer triangle */}
                <svg viewBox="0 0 100 100" width="70" height="70">
                  <polygon points="50,2 98,95 2,95" fill="#c0392b" stroke="#c0392b" strokeWidth="2"/>
                  {/* Inner white lines */}
                  <line x1="50" y1="15" x2="50" y2="85" stroke="white" strokeWidth="2.5"/>
                  <line x1="25" y1="85" x2="75" y2="85" stroke="white" strokeWidth="2.5"/>
                  <line x1="50" y1="15" x2="28" y2="85" stroke="white" strokeWidth="1.5"/>
                  <line x1="50" y1="15" x2="72" y2="85" stroke="white" strokeWidth="1.5"/>
                  {/* Text: AL SEIF */}
                  <text x="50" y="60" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="Arial">
                    Al SEIF
                  </text>
                  <text x="50" y="75" textAnchor="middle" fill="white" fontSize="7" fontFamily="Arial">
                    الـسـيـف
                  </text>
                </svg>
              </div>
            </div>
            {/* Right — Arabic */}
            <div style={{ fontSize:11, fontWeight:900, color:"#1A3A5C", lineHeight:1.4, flex:1, textAlign:"right", direction:"rtl", fontFamily:"Arial" }}>
              الشركة<br/>السعودية<br/>للأدوية
            </div>
          </div>

          {/* DeliverFlow Title */}
          <div style={{ width:50, height:3, background:"#e74c3c", borderRadius:2, marginBottom:14 }} />
          <div style={{ fontSize:38, fontWeight:900, letterSpacing:"-1px", marginBottom:6 }}>DeliverFlow</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:32 }}>Logistics and Delivery Management</div>

          {/* Distribution Centers */}
          {DCS.map(dc => (
            <div key={dc} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, fontSize:14, color:"rgba(255,255,255,0.75)" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#e74c3c", flexShrink:0 }} />
              {dc}
            </div>
          ))}
        </div>

        {/* Right Panel — Login Form */}
        <div style={{ flex:1, background:"#f8fafc", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 32px", direction:rtl?"rtl":"ltr" }}>
          <div style={{ maxWidth:380, width:"100%", marginLeft:rtl?"auto":"0", marginRight:rtl?"0":"auto" }}>
            <h1 style={{ fontSize:28, fontWeight:900, color:"#0f172a", margin:"0 0 6px" }}>{t.welcome}</h1>
            <p style={{ fontSize:15, color:"#64748b", marginBottom:28 }}>{t.signin}</p>

            <Input label={t.email} value={email} onChange={setEmail} placeholder="name@spco.sa" />
            <div onKeyDown={handleKey}>
              <Input label={t.password} value={pass} onChange={setPass} type="password" placeholder="••••••••" />
            </div>

            {err && (
              <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"12px 16px", fontSize:14, marginBottom:14 }}>
                ❌ {err}
              </div>
            )}

            <Btn onClick={doLogin} disabled={loading||!isOnline} style={{ width:"100%", padding:14, fontSize:16, marginBottom:12 }}>
              {loading ? "Signing in..." : t.signInBtn}
            </Btn>

            {!isOnline && (
              <div style={{ background:"#fef3c7", color:"#92400e", borderRadius:8, padding:"10px 14px", fontSize:13, textAlign:"center", marginBottom:12 }}>
                ⚠️ Internet connection required to login
              </div>
            )}

            <div style={{ textAlign:"center", fontSize:13, color:"#94a3b8" }}>
              {t.contactAdmin}
            </div>
          </div>

          <div style={{ marginTop:32, textAlign:"center", fontSize:12, color:"#94a3b8" }}>{t.footer}</div>
        </div>
      </div>
    </div>
  );
}
