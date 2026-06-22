// src/components/Shell.jsx
import { useState, useEffect } from "react";
import { RC, RA, RI, ROLE_LABELS } from "../data/masterData.js";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { loadNotifications, markRead, markAllRead } from "../notificationService.js";

const T = {
  en: {
    dashboard:"Dashboard",
    invoices:"All Invoices", dcinvoices:"Deliverables",
    upload:"Invoice Upload & Post",
    trips:"Trip Management",
    calendar:"Dispatch Calendar",
    users:"User Management",
    masterdata:"System Configuration",
    fleet:"Fleet Management",
    fuel:"Fuel Tracking",
    reports:"Reports",
    download:"POD Management",
    assign:"Dispatch Management",
    mydeliveries:"My Deliveries",
    odometer:"Daily Mileage Log",
    search:"Search Invoices",
    alerts:"Alerts", logout:"Logout",
    admin:"System Administrator",
    planning:"Planning",
    manager:"Distribution Center Manager",
    logistic:"Logistics Manager",
    driver:"Delivery Partner",
    viewonly:"View Only",
    management:"Management",
    notifications:"Notifications",
    markAllRead:"Mark All Read",
    noNotifications:"No new notifications",
  },
  ar: {
    dashboard:"لوحة القيادة",
    invoices:"جميع الفواتير", dcinvoices:"المستحقات",
    upload:"رفع وترحيل الفواتير",
    trips:"إدارة الرحلات",
    calendar:"تقويم الإرسال",
    users:"إدارة المستخدمين",
    masterdata:"إعدادات النظام",
    fleet:"إدارة الأسطول",
    fuel:"تتبع الوقود",
    reports:"التقارير",
    download:"إدارة وثائق التسليم",
    assign:"إدارة الإرسال",
    mydeliveries:"تسليماتي",
    odometer:"سجل المسافات اليومي",
    search:"البحث عن الفواتير",
    alerts:"تنبيهات", logout:"تسجيل الخروج",
    admin:"مدير النظام",
    planning:"التخطيط",
    manager:"مدير مركز التوزيع",
    logistic:"مدير اللوجستيات",
    driver:"شريك التوصيل",
    viewonly:"عرض فقط",
    management:"الإدارة",
    notifications:"الإشعارات",
    markAllRead:"تعليم الكل كمقروء",
    noNotifications:"لا توجد إشعارات جديدة",
  }
};

// Navigation per role
// calendar added after trips for admin and manager
const NAV = {
  admin:      [["dashboard","📊"],["assign","🚚"],["upload","📤"],["trips","🔄"],["calendar","📅"],["fleet","🚗"],["fuel","⛽"],["users","👥"],["masterdata","⚙️"],["reports","📈"],["download","📥"]],
  planning:   [["dashboard","📊"],["upload","📤"],["download","📥"],["users","👥"]],
  manager:    [["dashboard","📊"],["assign","🚚"],["trips","🔄"],["calendar","📅"],["fleet","🚗"],["fuel","⛽"],["reports","📈"],["users","👥"],["masterdata","⚙️"],["download","📥"]],
  logistic:   [["dashboard","📊"],["fleet","🚗"],["fuel","⛽"],["reports","📈"],["users","👥"],["download","📥"]],
  driver:     [["mydeliveries","📦"],["odometer","🔢"],["masterdata","⚙️"]],
  viewonly:   [["search","🔍"]],
  management: [["dashboard","📊"],["fleet","🚗"],["fuel","⛽"],["reports","📈"],["download","📥"]],
};

const NOTIF_ICONS = {
  upload:             "📤",
  delivered:          "✅",
  failed:             "❌",
  staged:             "📦",
  invoice_assigned:   "📦",
  leave:              "🏖️",
  leave_approved:     "✅",
  leave_rejected:     "❌",
  request:            "📝",
  request_action:     "🔔",
  vehicle:            "🚗",
  vehicle_approved:   "✅",
  vehicle_rejected:   "❌",
  activity_request:   "🏃",
  activity_approved:  "✅",
  activity_rejected:  "❌",
};

// Bilingual notification text — uses structured data payload
const NOTIF_T = {
  en: {
    upload:             (d) => (d.count || "") + " new invoices for " + (d.dc || "") + " DC",
    delivered:          (d) => "Invoice " + (d.invoiceId || "") + " delivered by " + (d.driverName || ""),
    failed:             (d) => "Invoice " + (d.invoiceId || "") + " failed — " + (d.failReason || ""),
    staged:             (d) => "Invoice " + (d.invoiceId || "") + " assigned to you",
    invoice_assigned:   (d) => "Invoice " + (d.invoiceId || "") + " assigned to you",
    leave:              (d) => (d.driverName || "") + " submitted a leave request",
    leave_approved:     ()  => "Your leave request has been approved",
    leave_rejected:     ()  => "Your leave request was rejected",
    request:            (d) => "New access request from " + (d.name || ""),
    request_action:     (d) => "Your request status: " + (d.status || ""),
    vehicle:            (d) => "Vehicle request from " + (d.dc || "") + " DC",
    vehicle_approved:   (d) => "Vehicle " + (d.plate || "") + " request approved",
    vehicle_rejected:   ()  => "Your vehicle request was rejected",
    activity_request:   (d) => (d.driverName || "") + " submitted an additional activity request",
    activity_approved:  (d) => "Your additional activity has been approved" + (d.purpose ? ": " + d.purpose : ""),
    activity_rejected:  ()  => "Your additional activity request was rejected",
  },
  ar: {
    upload:             (d) => "تم رفع " + (d.count || "") + " فواتير لمركز " + (d.dc || ""),
    delivered:          (d) => "تم تسليم الفاتورة " + (d.invoiceId || "") + " بواسطة " + (d.driverName || ""),
    failed:             (d) => "فشل تسليم الفاتورة " + (d.invoiceId || ""),
    staged:             (d) => "تم تخصيص الفاتورة " + (d.invoiceId || "") + " لك",
    invoice_assigned:   (d) => "تم تخصيص الفاتورة " + (d.invoiceId || "") + " لك",
    leave:              (d) => (d.driverName || "") + " قدّم طلب إجازة",
    leave_approved:     ()  => "تمت الموافقة على طلب إجازتك",
    leave_rejected:     ()  => "تم رفض طلب إجازتك",
    request:            (d) => "طلب وصول جديد من " + (d.name || ""),
    request_action:     (d) => "تم اتخاذ إجراء على طلبك: " + (d.status || ""),
    vehicle:            (d) => "طلب مركبة من مركز " + (d.dc || ""),
    vehicle_approved:   (d) => "تمت الموافقة على طلب المركبة " + (d.plate || ""),
    vehicle_rejected:   ()  => "تم رفض طلب المركبة",
    activity_request:   (d) => (d.driverName || "") + " قدّم طلب نشاط إضافي",
    activity_approved:  (d) => "تمت الموافقة على نشاطك الإضافي" + (d.purpose ? ": " + d.purpose : ""),
    activity_rejected:  ()  => "تم رفض طلب نشاطك الإضافي",
  },
};

// Resolve notification text in the current language
// Falls back to legacy title/message fields for old notifications
function getNotifText(n, lang) {
  const langMap = NOTIF_T[lang] || NOTIF_T.en;
  const fn = langMap[n.type];
  if (fn) return fn(n.data || n);
  // Legacy fallback — old notifications stored title/message directly
  return n.message || n.title || "🔔";
}


// ── Notification Deep Linking ─────────────────────────────────────────────────
// Maps notification type + user role → destination page
function getNotifDestPage(notif, userRole) {
  const type = notif.type || "";
  const map = {
    upload:             { admin:"upload",       planning:"upload"                                          },
    delivered:          { admin:"assign",        manager:"assign",    driver:"mydeliveries", logistic:"assign"   },
    failed:             { admin:"assign",        manager:"assign",    driver:"mydeliveries", logistic:"assign"   },
    staged:             { admin:"assign",        manager:"assign",    driver:"mydeliveries", planning:"assign"   },
    invoice_assigned:   { admin:"assign",        manager:"assign",    driver:"mydeliveries", planning:"assign"   },
    leave:              { admin:"masterdata",    manager:"masterdata", logistic:"masterdata"                },
    leave_approved:     { driver:"masterdata"                                                              },
    leave_rejected:     { driver:"masterdata"                                                              },
    request:            { admin:"users",         manager:"users",     logistic:"users",     planning:"users" },
    request_action:     { admin:"users",         manager:"users",     logistic:"users",     planning:"users" },
    vehicle:            { admin:"fleet"                                                                    },
    vehicle_approved:   { admin:"fleet",         manager:"fleet",     logistic:"fleet"                    },
    vehicle_rejected:   { admin:"fleet",         manager:"fleet",     logistic:"fleet"                    },
    activity_request:   { admin:"reports",       manager:"reports",   logistic:"reports"                  },
    activity_approved:  { driver:"mydeliveries"                                                            },
    activity_rejected:  { driver:"mydeliveries"                                                            },
  };
  const typeMap = map[type];
  if (!typeMap) return null;
  return typeMap[userRole] || null;
}

export default function Shell({ user, lang, setLang, page, setPage, onLogout, children, alerts }) {
  const [open, setOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  // Change password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwDone, setPwDone] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const nav = NAV[user.role] || NAV.viewonly;
  const cur = nav.find(n => n[0] === page)?.[0] || nav[0][0];
  const activeAlerts = (alerts||[]).filter(a =>
    a.status === "active" &&
    (!user.dc || a.dc === user.dc || user.role === "admin" || user.role === "management")
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  // DC label — clean, no duplication
  const dcLabel = user.dc && user.dc !== "Head Office" ? ` — ${user.dc}` : "";

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) fetchNotifications();
    });
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function fetchNotifications() {
    const notifs = await loadNotifications(user);
    setNotifications(notifs);
  }

  async function handleMarkRead(notifId) {
    await markRead(notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? {...n, read:true} : n));
  }

  async function handleMarkAllRead() {
    await markAllRead(user);
    setNotifications(prev => prev.map(n => ({...n, read:true})));
  }

  function timeAgo(iso) {
    const diff = Math.floor((new Date() - new Date(iso)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff/60) + "m ago";
    if (diff < 86400) return Math.floor(diff/3600) + "h ago";
    return Math.floor(diff/86400) + "d ago";
  }

  async function changePassword() {
    if (!currentPw) { setPwErr("Please enter current password"); return; }
    if (newPw.length < 6) { setPwErr("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { setPwErr("Passwords do not match"); return; }
    setPwLoading(true); setPwErr("");
    try {
      const firebaseUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPw);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPw);
      setPwDone("✅ Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(()=>{ setShowChangePw(false); setPwDone(""); }, 3000);
    } catch(e) {
      if (e.code==="auth/wrong-password"||e.code==="auth/invalid-credential") {
        setPwErr("Current password is incorrect");
      } else {
        setPwErr("Error: " + e.message);
      }
    }
    setPwLoading(false);
  }

  function getPageLabel(id) {
    if (id === "invoices" && (user.role === "manager" || user.role === "logistic")) return t.dcinvoices;
    if (id === "assign") return t.assign;
    return t[id] || id;
  }

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f1f5f9", direction:rtl?"rtl":"ltr", fontFamily:"'Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{
        width:250, position:"fixed", height:"100vh",
        background:RC[user.role]||"#1A3A5C",
        display:"flex", flexDirection:"column", zIndex:200,
        transition:"transform 0.3s",
        transform:open?"translateX(0)":(rtl?"translateX(100%)":"translateX(-100%)"),
        [rtl?"right":"left"]:0,
        overflowY:"auto",
        boxShadow:"4px 0 20px rgba(0,0,0,0.3)"
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize:26 }}>🚚</span>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:"white" }}>DeliverFlow</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:2 }}>SPCO</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 8px" }}>
          {nav.map(([id, icon]) => (
            <button key={id} onClick={() => { setPage(id); setOpen(false); }}
              style={{
                width:"100%",
                background:cur===id?(RA[user.role]||"#2471A3")+"44":"none",
                border:`1px solid ${cur===id?(RA[user.role]||"#2471A3"):"transparent"}`,
                color:cur===id?"white":"rgba(255,255,255,0.65)",
                padding:"12px 14px", borderRadius:8, cursor:"pointer",
                textAlign:rtl?"right":"left", fontSize:14,
                display:"flex", alignItems:"center", gap:10,
                marginBottom:3, fontWeight:cur===id?700:400
              }}>
              <span style={{ fontSize:17, width:22, textAlign:"center" }}>{icon}</span>
              <span>{getPageLabel(id)}</span>
            </button>
          ))}
        </nav>

        {/* Language toggle */}
        <div style={{ display:"flex", gap:6, padding:"10px 16px" }}>
          {[["en","EN"],["ar","عربي"]].map(([l,lbl]) => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                flex:1, border:"1px solid rgba(255,255,255,0.2)",
                background:lang===l?(RA[user.role]||"#2471A3"):"none",
                color:lang===l?"white":"rgba(255,255,255,0.5)",
                borderRadius:6, padding:"7px 0", cursor:"pointer",
                fontSize:13, fontWeight:600
              }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* User info */}
        <div style={{ padding:"14px 18px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{
              width:40, height:40, borderRadius:"50%",
              background:RA[user.role]||"#2471A3",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:700, fontSize:16, color:"white", flexShrink:0
            }}>{(user.name||"?").charAt(0)}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user.displayName||user.name}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                {ROLE_LABELS[user.role]||user.role}{dcLabel}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>{setShowChangePw(true);setShowUserMenu(false);setPwErr("");setPwDone("");}}
              style={{flex:1,background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:12,padding:"9px 6px",borderRadius:6,fontWeight:600}}>
              🔑 Change PW
            </button>
            <button onClick={onLogout}
              style={{flex:1,background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.6)",cursor:"pointer",fontSize:12,padding:"9px 6px",borderRadius:6,fontWeight:600}}>
              {t.logout} →
            </button>
          </div>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:199 }} />}

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <header style={{
          background:"white", padding:"0 20px", height:60,
          display:"flex", alignItems:"center", gap:12,
          position:"sticky", top:0, zIndex:100,
          borderBottom:`3px solid ${RA[user.role]||"#2471A3"}`,
          boxShadow:"0 1px 4px rgba(0,0,0,0.06)"
        }}>
          <button onClick={() => setOpen(!open)} style={{
            background:"none", border:"none", fontSize:24,
            cursor:"pointer", color:"#374151", flexShrink:0, padding:4
          }}>☰</button>

          <div style={{ flex:1, fontWeight:800, fontSize:18, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {getPageLabel(cur)}
          </div>

          {activeAlerts.length > 0 && (
            <button onClick={() => setPage("dashboard")} style={{
              background:"#fee2e2", border:"none", borderRadius:8,
              padding:"6px 14px", cursor:"pointer", fontSize:13,
              fontWeight:700, color:"#991b1b", whiteSpace:"nowrap"
            }}>
              🔔 {activeAlerts.length} {t.alerts}
            </button>
          )}

          {/* Notification Bell */}
          <div style={{ position:"relative" }}>
            <button onClick={() => setShowNotif(!showNotif)} style={{
              background:"none", border:"none", cursor:"pointer",
              fontSize:22, padding:"4px 8px", position:"relative",
              color:"#374151"
            }}>
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position:"absolute", top:0, right:0,
                  background:"#ef4444", color:"white",
                  borderRadius:"50%", width:18, height:18,
                  fontSize:11, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  lineHeight:1
                }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {showNotif && (
              <div style={{
                position:"absolute", top:44, right:0,
                background:"white", borderRadius:12,
                boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
                width:360, maxHeight:480, overflowY:"auto",
                zIndex:500, border:"1px solid #e2e8f0"
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:"1px solid #f1f5f9" }}>
                  <span style={{ fontWeight:700, fontSize:15, color:"#0f172a" }}>🔔 {t.notifications}</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{
                      background:"none", border:"none", cursor:"pointer",
                      fontSize:12, color:"#6366f1", fontWeight:600
                    }}>{t.markAllRead}</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:14 }}>
                    🔕 {t.noNotifications}
                  </div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div key={n.id} onClick={() => { handleMarkRead(n.id); const dest = getNotifDestPage(n, user.role); if (dest) { setPage(dest); setShowNotif(false); } }}
                      style={{
                        padding:"12px 16px", borderBottom:"1px solid #f8fafc",
                        background:n.read ? "white" : "#f0f4ff",
                        cursor:"pointer",
                        borderLeft:`3px solid ${n.read?"transparent":"#6366f1"}`
                      }}>
                      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <span style={{ fontSize:18, flexShrink:0 }}>{NOTIF_ICONS[n.type]||"🔔"}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:n.read?400:700, fontSize:13, color:"#0f172a", marginBottom:2 }}>
                            {getNotifText(n, lang)}
                          </div>
                          {n.data?.destination && (
                            <div style={{ fontSize:12, color:"#64748b", marginBottom:2 }}>📍 {n.data.destination}</div>
                          )}
                          <div style={{ fontSize:11, color:"#94a3b8" }}>{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.read && (
                          <span style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", flexShrink:0, marginTop:4 }} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Role badge */}
          <div style={{
            fontSize:13, fontWeight:700, color:"white",
            padding:"6px 14px", borderRadius:20,
            background:RA[user.role]||"#2471A3", whiteSpace:"nowrap",
            display:"flex", alignItems:"center", gap:6
          }}>
            {RI[user.role]} {ROLE_LABELS[user.role]||user.role}
            {user.dc && user.dc !== "Head Office" && (
              <span style={{ fontSize:14, fontWeight:700 }}>— {user.dc}</span>
            )}
          </div>
        </header>

        {showNotif && <div onClick={() => setShowNotif(false)} style={{ position:"fixed", inset:0, zIndex:499 }} />}

        {/* CHANGE PASSWORD MODAL */}
        {showChangePw&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{background:"white",borderRadius:12,padding:28,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
              <div style={{fontWeight:800,fontSize:18,color:"#0f172a",marginBottom:4}}>🔑 Change Password</div>
              <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>{user.name} — {user.email}</div>
              {pwDone?(
                <div style={{background:"#d1fae5",color:"#065f46",borderRadius:8,padding:"14px 16px",fontSize:14,fontWeight:600,textAlign:"center"}}>
                  {pwDone}
                </div>
              ):(
                <>
                  <div style={{marginBottom:12}}>
                    <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Current Password *</label>
                    <input type="password" value={currentPw} onChange={e=>setCurrentPw(e.target.value)}
                      placeholder="Enter current password"
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",boxSizing:"border-box"}} />
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>New Password *</label>
                    <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)}
                      placeholder="Min 6 characters"
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",boxSizing:"border-box"}} />
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Confirm New Password *</label>
                    <input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)}
                      placeholder="Repeat new password"
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:15,outline:"none",boxSizing:"border-box"}} />
                  </div>
                  {pwErr&&(
                    <div style={{background:"#fee2e2",color:"#991b1b",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:14}}>⚠️ {pwErr}</div>
                  )}
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={changePassword} disabled={pwLoading}
                      style={{flex:1,background:"#1A3A5C",color:"white",border:"none",padding:"12px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14,opacity:pwLoading?0.6:1}}>
                      {pwLoading?"Changing...":"✅ Change Password"}
                    </button>
                    <button onClick={()=>{setShowChangePw(false);setCurrentPw("");setNewPw("");setConfirmPw("");setPwErr("");}}
                      style={{background:"#f1f5f9",border:"none",padding:"12px 16px",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14,color:"#64748b"}}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <main style={{ flex:1, padding:"20px", overflowY:"auto", maxWidth:1400, width:"100%", margin:"0 auto", boxSizing:"border-box" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
