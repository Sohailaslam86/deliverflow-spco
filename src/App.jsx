import { useState, useEffect } from "react";
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  doc, getDoc, collection, addDoc, getDocs,
  updateDoc, query, where, orderBy, serverTimestamp
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════
const T = {
  en: {
    appName: "DeliverFlow",
    company: "Saudi Pharmaceutical Co.",
    companyAr: "الشركة السعودية للأدوية",
    tagline: "Logistics & Delivery Management",
    loginTitle: "Welcome Back",
    loginSub: "Sign in to continue",
    emailOrPhone: "Email Address",
    password: "Password",
    signIn: "Sign In",
    signingIn: "Signing in...",
    invalidCreds: "Invalid email or password",
    requestAccess: "Request Access",
    dashboard: "Dashboard",
    invoices: "Invoices",
    trips: "Trips",
    users: "Users",
    masterData: "Master Data",
    fleet: "Fleet",
    reports: "Reports",
    upload: "Upload",
    myDeliveries: "My Deliveries",
    odometer: "Odometer",
    search: "Search",
    logout: "Logout",
    roles: {
      admin: "Administrator",
      planning: "Planning",
      manager: "DC Manager",
      driver: "Driver",
      viewonly: "View Only"
    },
    locations: {
      hq: "Head Office",
      riyadh: "Riyadh DC",
      jeddah: "Jeddah DC",
      dammam: "Dammam DC"
    },
    status: {
      pending: "Pending",
      assigned: "Assigned",
      delivered: "Delivered",
      failed: "Failed",
      outstanding: "Outstanding",
      intransit: "In Transit"
    }
  },
  ar: {
    appName: "ديليفر فلو",
    company: "Saudi Pharmaceutical Co.",
    companyAr: "الشركة السعودية للأدوية",
    tagline: "إدارة الخدمات اللوجستية والتوصيل",
    loginTitle: "مرحباً بعودتك",
    loginSub: "سجّل دخولك للمتابعة",
    emailOrPhone: "البريد الإلكتروني",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جاري تسجيل الدخول...",
    invalidCreds: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    requestAccess: "طلب الوصول",
    dashboard: "لوحة التحكم",
    invoices: "الفواتير",
    trips: "الرحلات",
    users: "المستخدمون",
    masterData: "البيانات الرئيسية",
    fleet: "الأسطول",
    reports: "التقارير",
    upload: "رفع البيانات",
    myDeliveries: "توصيلاتي",
    odometer: "عداد المسافة",
    search: "بحث",
    logout: "تسجيل الخروج",
    roles: {
      admin: "مدير النظام",
      planning: "التخطيط",
      manager: "مدير التوزيع",
      driver: "السائق",
      viewonly: "عرض فقط"
    },
    locations: {
      hq: "المكتب الرئيسي",
      riyadh: "مستودع الرياض",
      jeddah: "مستودع جدة",
      dammam: "مستودع الدمام"
    },
    status: {
      pending: "معلق",
      assigned: "تم التعيين",
      delivered: "تم التسليم",
      failed: "فشل",
      outstanding: "معلق - إعادة تعيين",
      intransit: "في الطريق"
    }
  }
};

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const ROLE_COLORS = {
  admin:    "#1A3A5C",
  planning: "#0F3460",
  manager:  "#1B4332",
  driver:   "#7B2D00",
  viewonly: "#2D2D2D"
};

const ROLE_ACCENTS = {
  admin:    "#2471A3",
  planning: "#2980B9",
  manager:  "#27AE60",
  driver:   "#E85D04",
  viewonly: "#888888"
};

const STATUS_STYLES = {
  pending:     { bg: "#fef3c7", color: "#92400e", icon: "⏳" },
  assigned:    { bg: "#dbeafe", color: "#1e40af", icon: "🔵" },
  delivered:   { bg: "#d1fae5", color: "#065f46", icon: "✅" },
  failed:      { bg: "#fee2e2", color: "#991b1b", icon: "❌" },
  outstanding: { bg: "#ffedd5", color: "#9a3412", icon: "🟠" },
  intransit:   { bg: "#ede9fe", color: "#5b21b6", icon: "🔄" }
};

// Demo users for testing (Firebase se replace hoga)
const DEMO_USERS = [
  { uid: "admin1", email: "sohail@spco.sa",   role: "admin",    name: "Sohail Aslam",      nameAr: "سهيل أسلم",       location: "hq",      dc: null },
  { uid: "plan1",  email: "shakil@spco.sa",   role: "planning", name: "Muhammad Shakil",   nameAr: "محمد شكيل",       location: "hq",      dc: null },
  { uid: "mgr1",   email: "waleed@spco.sa",   role: "manager",  name: "AlWaleed Qahtani",  nameAr: "الوليد القحطاني", location: "riyadh",  dc: "Riyadh" },
  { uid: "mgr2",   email: "anas@spco.sa",     role: "manager",  name: "Muhammad Anas",     nameAr: "محمد أنس",        location: "jeddah",  dc: "Jeddah" },
  { uid: "mgr3",   email: "saleh@spco.sa",    role: "manager",  name: "Muhammad Saleh",    nameAr: "محمد صالح",       location: "dammam",  dc: "Dammam" },
  { uid: "drv1",   email: "khaled@spco.sa",   role: "driver",   name: "Khaled Sharahili",  nameAr: "خالد شراحيلي",    location: "riyadh",  dc: "Riyadh" },
  { uid: "drv2",   email: "rahman@spco.sa",   role: "driver",   name: "Abdul Rahman",      nameAr: "عبدالرحمن",       location: "riyadh",  dc: "Riyadh" },
  { uid: "view1",  email: "sabei@spco.sa",    role: "viewonly", name: "Muhammad Sabei",    nameAr: "محمد السبيعي",    location: "hq",      dc: null },
];

const DEMO_PASSWORD = "spco2026";

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]   = useState(null);
  const [lang, setLang]   = useState("en");
  const [loading, setLoading] = useState(false);

  // Demo login — Firebase Auth se replace hoga
  function handleLogin(email, password) {
    setLoading(true);
    setTimeout(() => {
      const found = DEMO_USERS.find(
        u => u.email === email.trim().toLowerCase() &&
        password === DEMO_PASSWORD
      );
      if (found) {
        setUser(found);
      } else {
        setLoading(false);
        return false;
      }
      setLoading(false);
      return true;
    }, 800);
    return true;
  }

  function handleLogout() {
    setUser(null);
  }

  if (!user) {
    return (
      <LoginScreen
        lang={lang}
        setLang={setLang}
        onLogin={handleLogin}
        loading={loading}
        demoUsers={DEMO_USERS}
        demoPassword={DEMO_PASSWORD}
      />
    );
  }

  return (
    <MainApp
      user={user}
      lang={lang}
      setLang={setLang}
      onLogout={handleLogout}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════
function LoginScreen({ lang, setLang, onLogin, loading, demoUsers, demoPassword }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [screen, setScreen]     = useState("login");
  const [reqSent, setReqSent]   = useState(false);
  const [req, setReq]           = useState({ name: "", email: "", phone: "", reason: "" });

  const t   = T[lang];
  const rtl = lang === "ar";

  function doLogin() {
    if (!email || !password) return;
    setError("");
    const result = onLogin(email, password);
    setTimeout(() => {
      const found = demoUsers.find(
        u => u.email === email.trim().toLowerCase() && password === demoPassword
      );
      if (!found) setError(t.invalidCreds);
    }, 900);
  }

  return (
    <div style={{ ...s.loginRoot, direction: rtl ? "rtl" : "ltr" }}>
      {/* Background */}
      <div style={s.loginBgLeft} />
      <div style={s.loginBgRight} />

      {/* Lang Toggle */}
      <div style={{ ...s.langBar, [rtl ? "left" : "right"]: 20 }}>
        {["en", "ar"].map(l => (
          <button key={l} style={{ ...s.langBtn, ...(lang === l ? s.langBtnOn : {}) }}
            onClick={() => setLang(l)}>
            {l === "en" ? "EN" : "عر"}
          </button>
        ))}
      </div>

      <div style={s.loginWrap}>
        {/* Brand Panel */}
        <div style={s.brandPanel}>
          <div style={s.brandLogo}>
            <div style={s.logoTri}><span style={s.logoTxt}>AL<br/>SEIF</span></div>
          </div>
          <div style={s.brandNameAr}>{t.companyAr}</div>
          <div style={s.brandNameEn}>{t.company}</div>
          <div style={s.brandLine} />
          <div style={s.brandApp}>{t.appName}</div>
          <div style={s.brandTag}>{t.tagline}</div>
          <div style={s.dcList}>
            {["Riyadh DC", "Jeddah DC", "Dammam DC"].map(dc => (
              <div key={dc} style={s.dcItem}><span style={s.dcDot} />{dc}</div>
            ))}
          </div>
        </div>

        {/* Form Panel */}
        <div style={s.formPanel}>
          {screen === "login" ? (
            <div style={s.formBox}>
              <h1 style={s.formTitle}>{t.loginTitle}</h1>
              <p style={s.formSub}>{t.loginSub}</p>

              <div style={s.field}>
                <label style={s.label}>{t.emailOrPhone}</label>
                <input style={s.input} type="email" value={email}
                  placeholder="email@spco.sa"
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doLogin()}
                  dir="ltr" />
              </div>

              <div style={s.field}>
                <label style={s.label}>{t.password}</label>
                <input style={s.input} type="password" value={password}
                  placeholder="••••••••"
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doLogin()}
                  dir="ltr" />
              </div>

              {error && <div style={s.errMsg}>{error}</div>}

              <button style={s.loginBtn} onClick={doLogin} disabled={loading}>
                {loading ? t.signingIn : t.signIn}
              </button>

              <button style={s.reqBtn} onClick={() => setScreen("request")}>
                {t.requestAccess}
              </button>

              {/* Demo Accounts */}
              <button style={s.demoToggle} onClick={() => setShowDemo(!showDemo)}>
                🔑 Demo Accounts {showDemo ? "▲" : "▼"}
              </button>
              {showDemo && (
                <div style={s.demoList}>
                  <div style={s.demoNote}>Password for all: <b>spco2026</b></div>
                  {demoUsers.map(u => (
                    <button key={u.uid} style={s.demoItem}
                      onClick={() => { setEmail(u.email); setPassword(demoPassword); }}>
                      <span style={{ ...s.demoRole, background: ROLE_COLORS[u.role] }}>
                        {u.role === "admin" ? "⚙️" : u.role === "planning" ? "📋" :
                         u.role === "manager" ? "🏭" : u.role === "driver" ? "🚚" : "👁️"}
                      </span>
                      <div>
                        <div style={s.demoName}>{rtl ? u.nameAr : u.name}</div>
                        <div style={s.demoEmail}>{u.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Request Access Screen
            <div style={s.formBox}>
              <button style={s.backBtn} onClick={() => setScreen("login")}>
                {rtl ? "→ عودة" : "← Back"}
              </button>
              <h1 style={s.formTitle}>{rtl ? "طلب الوصول" : "Request Access"}</h1>
              {reqSent ? (
                <div style={s.successBox}>
                  ✅ {rtl ? "تم إرسال الطلب! سيتواصل معك المدير قريباً." : "Request sent! Admin will contact you soon."}
                </div>
              ) : (
                <>
                  {[
                    { key: "name",   label: rtl ? "الاسم الكامل" : "Full Name",   type: "text" },
                    { key: "email",  label: rtl ? "البريد الإلكتروني" : "Email",  type: "email" },
                    { key: "phone",  label: rtl ? "رقم الهاتف" : "Phone",         type: "tel" },
                    { key: "reason", label: rtl ? "السبب" : "Reason for Access",  type: "text" },
                  ].map(f => (
                    <div key={f.key} style={s.field}>
                      <label style={s.label}>{f.label}</label>
                      <input style={s.input} type={f.type}
                        value={req[f.key]}
                        onChange={e => setReq({ ...req, [f.key]: e.target.value })} />
                    </div>
                  ))}
                  <button style={s.loginBtn} onClick={() => setReqSent(true)}>
                    {rtl ? "إرسال الطلب" : "Submit Request"}
                  </button>
                </>
              )}
            </div>
          )}
          <div style={s.footer}>© 2026 Saudi Pharmaceutical Co. (SPCO)</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP — After Login
// ═══════════════════════════════════════════════════════════
function MainApp({ user, lang, setLang, onLogout }) {
  const [page, setPage]           = useState("dashboard");
  const [sidebarOpen, setSidebar] = useState(false);
  const t   = T[lang];
  const rtl = lang === "ar";
  const rc  = ROLE_COLORS[user.role];
  const ra  = ROLE_ACCENTS[user.role];

  const NAV = {
    admin: [
      { id: "dashboard",  icon: "📊", label: t.dashboard },
      { id: "invoices",   icon: "📋", label: t.invoices },
      { id: "trips",      icon: "🔄", label: t.trips },
      { id: "users",      icon: "👥", label: t.users },
      { id: "masterdata", icon: "⚙️", label: t.masterData },
      { id: "fleet",      icon: "🚗", label: t.fleet },
      { id: "reports",    icon: "📈", label: t.reports },
    ],
    planning: [
      { id: "upload",     icon: "📤", label: t.upload },
      { id: "invoices",   icon: "📋", label: t.invoices },
      { id: "dashboard",  icon: "📊", label: t.dashboard },
    ],
    manager: [
      { id: "dashboard",  icon: "📊", label: t.dashboard },
      { id: "assign",     icon: "👤", label: rtl ? "تعيين السائقين" : "Assign Drivers" },
      { id: "trips",      icon: "🔄", label: t.trips },
      { id: "fleet",      icon: "🚗", label: t.fleet },
      { id: "reports",    icon: "📈", label: t.reports },
    ],
    driver: [
      { id: "mydeliveries", icon: "📦", label: t.myDeliveries },
      { id: "odometer",     icon: "🔢", label: t.odometer },
    ],
    viewonly: [
      { id: "search",     icon: "🔍", label: t.search },
      { id: "dashboard",  icon: "📊", label: t.dashboard },
    ],
  };

  const navItems = NAV[user.role] || NAV.viewonly;

  return (
    <div style={{ ...s.appRoot, direction: rtl ? "rtl" : "ltr" }}>
      {/* Sidebar */}
      <aside style={{
        ...s.sidebar, background: rc,
        transform: sidebarOpen ? "translateX(0)" : (rtl ? "translateX(100%)" : "translateX(-100%)"),
        [rtl ? "right" : "left"]: 0
      }}>
        {/* Logo */}
        <div style={s.sidebarLogo}>
          <div style={s.sidebarLogoIcon}>🚚</div>
          <div>
            <div style={s.sidebarAppName}>{t.appName}</div>
            <div style={s.sidebarSPCO}>SPCO</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.sidebarNav}>
          {navItems.map(item => (
            <button key={item.id}
              style={{ ...s.navBtn, ...(page === item.id ? { ...s.navBtnOn, background: ra + "33", borderColor: ra } : {}) }}
              onClick={() => { setPage(item.id); setSidebar(false); }}>
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Lang Toggle in Sidebar */}
        <div style={s.sidebarLang}>
          {["en", "ar"].map(l => (
            <button key={l}
              style={{ ...s.sidebarLangBtn, ...(lang === l ? { background: ra, color: "white" } : {}) }}
              onClick={() => setLang(l)}>
              {l === "en" ? "EN" : "عر"}
            </button>
          ))}
        </div>

        {/* User Info */}
        <div style={s.sidebarUser}>
          <div style={{ ...s.sidebarAvatar, background: ra }}>
            {(rtl ? user.nameAr : user.name).charAt(0)}
          </div>
          <div style={s.sidebarUserInfo}>
            <div style={s.sidebarUserName}>{rtl ? user.nameAr : user.name}</div>
            <div style={s.sidebarUserRole}>{t.roles[user.role]}</div>
            <div style={s.sidebarUserLoc}>
              📍 {user.dc || (rtl ? "المكتب الرئيسي" : "Head Office")}
            </div>
          </div>
        </div>

        <button style={s.logoutBtn} onClick={onLogout}>
          {rtl ? "← " + t.logout : t.logout + " →"}
        </button>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div style={s.overlay} onClick={() => setSidebar(false)} />}

      {/* Main */}
      <div style={s.main}>
        {/* Topbar */}
        <header style={{ ...s.topbar, borderBottom: `3px solid ${ra}` }}>
          <button style={s.menuBtn} onClick={() => setSidebar(!sidebarOpen)}>☰</button>
          <div style={s.topbarTitle}>
            {navItems.find(n => n.id === page)?.label || t.dashboard}
          </div>
          <div style={{ ...s.roleBadge, background: ra }}>
            {user.role === "admin" ? "⚙️" : user.role === "planning" ? "📋" :
             user.role === "manager" ? "🏭" : user.role === "driver" ? "🚚" : "👁️"}
            {" "}{t.roles[user.role]}
          </div>
        </header>

        {/* Content */}
        <main style={s.content}>
          {page === "dashboard"    && <Dashboard    user={user} lang={lang} t={t} ra={ra} />}
          {page === "upload"       && <UploadPage   user={user} lang={lang} t={t} />}
          {page === "assign"       && <AssignPage   user={user} lang={lang} t={t} rtl={rtl} />}
          {page === "mydeliveries" && <DriverPage   user={user} lang={lang} t={t} rtl={rtl} />}
          {page === "odometer"     && <OdometerPage user={user} lang={lang} t={t} rtl={rtl} />}
          {page === "search"       && <SearchPage   user={user} lang={lang} t={t} rtl={rtl} />}
          {page === "invoices"     && <InvoicesPage user={user} lang={lang} t={t} ra={ra} />}
          {!["dashboard","upload","assign","mydeliveries","odometer","search","invoices"].includes(page) && (
            <ComingSoon label={navItems.find(n => n.id === page)?.label} lang={lang} />
          )}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function Dashboard({ user, lang, t, ra }) {
  const rtl = lang === "ar";
  const stats = [
    { icon: "📋", label: rtl ? "إجمالي الفواتير" : "Total Invoices",  value: "142", color: "#6366f1" },
    { icon: "✅", label: rtl ? "تم التسليم"       : "Delivered",       value: "118", color: "#10b981" },
    { icon: "⏳", label: rtl ? "معلق"             : "Pending",         value: "16",  color: "#f59e0b" },
    { icon: "❌", label: rtl ? "فشل"              : "Failed",          value: "8",   color: "#ef4444" },
  ];

  const dcStats = [
    { dc: rtl ? "مستودع الرياض" : "Riyadh DC",  del: 48, pend: 6, fail: 3, color: "#ef4444" },
    { dc: rtl ? "مستودع جدة"   : "Jeddah DC",   del: 42, pend: 7, fail: 3, color: "#3b82f6" },
    { dc: rtl ? "مستودع الدمام" : "Dammam DC",  del: 28, pend: 3, fail: 2, color: "#10b981" },
  ];

  const recentInvoices = [
    { id: "INV-6032151025", customer: "National Guards Hospital", dc: "Riyadh DC", status: "pending",   inst: "Government" },
    { id: "INV-6032151026", customer: "Al-Hammadi Hospital",      dc: "Riyadh DC", status: "assigned",  inst: "Private" },
    { id: "INV-6032151027", customer: "King Fahd Hospital",       dc: "Jeddah DC", status: "delivered", inst: "Government" },
    { id: "INV-6032151028", customer: "MOH Hospital Dammam",      dc: "Dammam DC", status: "failed",    inst: "Government" },
  ];

  return (
    <div>
      {/* Stats */}
      <div style={s.statsGrid}>
        {stats.map((st, i) => (
          <div key={i} style={{ ...s.statCard, borderTop: `4px solid ${st.color}` }}>
            <div style={s.statIcon}>{st.icon}</div>
            <div style={{ ...s.statVal, color: st.color }}>{st.value}</div>
            <div style={s.statLbl}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* DC Breakdown */}
      {user.role === "admin" && (
        <div style={s.dcGrid}>
          {dcStats.map(dc => (
            <div key={dc.dc} style={{ ...s.dcCard, borderLeft: `4px solid ${dc.color}` }}>
              <div style={s.dcName}>📍 {dc.dc}</div>
              <div style={s.dcNums}>
                <span style={{ color: "#10b981", fontWeight: 700 }}>{dc.del} ✅</span>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{dc.pend} ⏳</span>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>{dc.fail} ❌</span>
              </div>
              <div style={s.dcBarBg}>
                <div style={{ ...s.dcBarFill, width: `${Math.round(dc.del / (dc.del + dc.pend + dc.fail) * 100)}%`, background: dc.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent */}
      <div style={s.card}>
        <div style={s.cardTitle}>{rtl ? "آخر الفواتير" : "Recent Invoices"}</div>
        {recentInvoices.map(inv => (
          <div key={inv.id} style={s.invRow}>
            <span style={s.invId}>{inv.id}</span>
            <span style={s.invCustomer}>{inv.customer}</span>
            <span style={s.invDC}>{inv.dc}</span>
            <StatusBadge status={inv.status} lang={lang} />
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div style={s.alertsGrid}>
        <div style={s.card}>
          <div style={s.cardTitle}>⚠️ {rtl ? "تنبيهات" : "Alerts"}</div>
          {[
            rtl ? "انتهاء رخصة خالد — 28 يوم" : "Khaled license expiry — 28 days",
            rtl ? "فحص BUS-2629 مستحق"         : "Vehicle BUS-2629 Fahas due soon",
            rtl ? "طلب وصول جديد معلق"          : "New access request pending",
          ].map((a, i) => (
            <div key={i} style={s.alertItem}>🔔 {a}</div>
          ))}
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>📊 {rtl ? "ملخص اليوم" : "Today's Summary"}</div>
          {[
            rtl ? "35 فاتورة مرفوعة" : "35 invoices uploaded",
            rtl ? "28 تم التعيين"    : "28 assigned to drivers",
            rtl ? "24 تم التسليم"    : "24 delivered so far",
            rtl ? "معدل: 86%"        : "Success rate: 86%",
          ].map((a, i) => (
            <div key={i} style={s.alertItem}>✅ {a}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UPLOAD PAGE — Planning
// ═══════════════════════════════════════════════════════════
function UploadPage({ user, lang, t }) {
  const rtl = lang === "ar";
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [done, setDone]       = useState(false);
  const [dragging, setDragging] = useState(false);

  const SAMPLE = [
    ["6032151025", "2026-05-23", "National Guards Hospital", "Government", "Riyadh"],
    ["6032151026", "2026-05-23", "Al-Hammadi Hospital",      "Private",    "Jeddah"],
    ["6032151027", "2026-05-23", "King Salman Hospital",     "Government", "Dammam"],
  ];

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setPreview(SAMPLE);
  }

  function downloadTemplate() {
    const csv = "Invoice Number,Invoice Date,Customer Name,Institution,DC\n6032151025,2026-05-23,Customer Name,Government,Riyadh";
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "DeliverFlow_Invoice_Template.csv"; a.click();
  }

  return (
    <div>
      <div style={s.card}>
        <div style={s.cardTitle}>{rtl ? "الخطوة 1 — تحميل النموذج" : "Step 1 — Download Template"}</div>
        <p style={s.cardDesc}>{rtl ? "حمّل النموذج، أضف البيانات، ثم ارفعه." : "Download CSV template, fill it, then upload."}</p>
        <button style={s.dlBtn} onClick={downloadTemplate}>
          ⬇ {rtl ? "تحميل نموذج CSV" : "Download CSV Template"}
        </button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {["Invoice Number", "Invoice Date", "Customer Name", "Institution", "DC"].map(c => (
            <span key={c} style={s.colTag}>{c}</span>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>{rtl ? "الخطوة 2 — رفع الملف" : "Step 2 — Upload CSV File"}</div>
        <div style={{ ...s.dropZone, ...(dragging ? s.dropZoneOn : {}) }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
          <div style={{ color: "#64748b", marginBottom: 12 }}>
            {file ? file.name : (rtl ? "اسحب الملف هنا" : "Drag & drop CSV here")}
          </div>
          <input type="file" accept=".csv" id="csvfile" style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])} />
          <label htmlFor="csvfile" style={s.browseBtn}>
            {rtl ? "اختر ملفاً" : "Choose File"}
          </label>
        </div>
      </div>

      {preview && (
        <div style={s.card}>
          <div style={s.cardTitle}>
            {rtl ? `الخطوة 3 — معاينة (${preview.length} فواتير)` : `Step 3 — Preview (${preview.length} invoices)`}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>{["Invoice #", "Date", "Customer", "Institution", "DC"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "white" }}>
                    {row.map((cell, j) => <td key={j} style={s.td}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {done ? (
            <div style={s.successMsg}>✅ {rtl ? "تم الاستيراد بنجاح!" : "Imported successfully!"}</div>
          ) : (
            <button style={s.importBtn} onClick={() => setDone(true)}>
              ✅ {rtl ? `استيراد ${preview.length} فواتير` : `Import ${preview.length} Invoices`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ASSIGN PAGE — DC Manager
// ═══════════════════════════════════════════════════════════
function AssignPage({ user, lang, t, rtl }) {
  const [selected, setSelected] = useState([]);
  const [driver,   setDriver]   = useState("");
  const [vehicle,  setVehicle]  = useState("");
  const [city,     setCity]     = useState("");
  const [dtype,    setDtype]    = useState("");
  const [storage,  setStorage]  = useState("");
  const [done,     setDone]     = useState(false);

  const invoices = [
    { id: "INV-6032151025", customer: "National Guards Hospital", inst: "Government", status: "pending" },
    { id: "INV-6032151026", customer: "King Fahd Medical City",   inst: "Government", status: "pending" },
    { id: "INV-6032151027", customer: "Al-Hammadi Hospital",      inst: "Private",    status: "pending" },
    { id: "INV-6032151028", customer: "Bugshan Hospital",         inst: "Private",    status: "assigned" },
  ];

  const drivers  = user.dc === "Riyadh"
    ? ["Khaled Sharahili", "Abdul Rahman Al-Qarni", "Mohamed Al-Harithi", "Turki Al-Ahmad"]
    : user.dc === "Jeddah"
    ? ["Belkacem Al-Faqih", "Abdullah Ahmed", "Ahmed Al Alawi"]
    : ["Mishaan bin Naif Al-Anzi", "Talal bin Abdullah", "Ali bin Hassan"];

  const vehicles = user.dc === "Riyadh"
    ? ["Dyna 5784", "BUS 2630", "BUS 2629", "BUS 4295"]
    : user.dc === "Jeddah"
    ? ["BUS 2631", "Dyna 1217", "Dyna 5787"]
    : ["BUS 4472", "Dyna 5789"];

  const cities   = ["Riyadh", "Jeddah", "Dammam", "Makkah", "Madinah", "Tabuk"];
  const storages = [
    "Ambient (15-25°C)",
    "Refrigerated (2-8°C)",
    "Cold Chain (2-25°C)",
    "Frozen (-18 to -20°C)"
  ];

  function assign() {
    if (!driver || !vehicle || !city || !dtype || !storage || selected.length === 0) return;
    setDone(true);
    setTimeout(() => { setDone(false); setSelected([]); }, 3000);
  }

  const canAssign = driver && vehicle && city && dtype && storage && selected.length > 0;

  return (
    <div>
      {done && (
        <div style={s.successMsg}>
          ✅ {selected.length} {rtl ? "فاتورة تم تعيينها لـ" : "invoice(s) assigned to"} {driver}!
        </div>
      )}

      {/* Invoice Selection */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          {rtl ? "اختر الفواتير" : "Select Invoices"}
          {selected.length > 0 && (
            <span style={{ ...s.badge, background: "#6366f1", color: "white", marginRight: 8 }}>
              {selected.length} {rtl ? "محددة" : "selected"}
            </span>
          )}
        </div>
        {invoices.map(inv => (
          <div key={inv.id}
            style={{ ...s.checkRow, ...(selected.includes(inv.id) ? s.checkRowOn : {}), ...(inv.status === "assigned" ? { opacity: 0.5 } : {}) }}
            onClick={() => {
              if (inv.status === "assigned") return;
              setSelected(p => p.includes(inv.id) ? p.filter(x => x !== inv.id) : [...p, inv.id]);
            }}>
            <span style={s.checkbox}>{selected.includes(inv.id) ? "☑" : "☐"}</span>
            <div style={{ flex: 1 }}>
              <div style={s.invId}>{inv.id}</div>
              <div style={s.invCustomer}>{inv.customer}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <StatusBadge status={inv.status} lang={lang} />
              <span style={{ fontSize: 11, color: inv.inst === "Government" ? "#1e40af" : "#6d28d9" }}>
                {inv.inst === "Government" ? "🏛️ Govt" : "🏥 Private"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment Details */}
      <div style={s.card}>
        <div style={s.cardTitle}>{rtl ? "تفاصيل التعيين" : "Assignment Details"}</div>
        <div style={s.assignGrid}>
          {[
            { label: rtl ? "السائق" : "Driver",        val: driver,  set: setDriver,  opts: drivers,   icon: "👤" },
            { label: rtl ? "المركبة" : "Vehicle",      val: vehicle, set: setVehicle, opts: vehicles,  icon: "🚗" },
            { label: rtl ? "مدينة التسليم" : "Delivery City", val: city, set: setCity, opts: cities, icon: "📍" },
            { label: rtl ? "حالة التخزين" : "Storage", val: storage, set: setStorage, opts: storages,  icon: "🌡️" },
          ].map(f => (
            <div key={f.label} style={s.assignField}>
              <label style={s.label}>{f.icon} {f.label}</label>
              <select style={s.select} value={f.val} onChange={e => f.set(e.target.value)}>
                <option value="">{rtl ? "اختر..." : "Select..."}</option>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Delivery Type */}
        <div style={{ marginTop: 12 }}>
          <label style={s.label}>{rtl ? "نوع التسليم" : "Delivery Type"}</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {[
              { val: "incity",  label: rtl ? "🏙️ داخل المدينة" : "🏙️ In-City" },
              { val: "outcity", label: rtl ? "🛣️ خارج المدينة" : "🛣️ Out-City" },
            ].map(opt => (
              <button key={opt.val}
                style={{ ...s.toggleBtn, ...(dtype === opt.val ? s.toggleBtnOn : {}) }}
                onClick={() => setDtype(opt.val)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button style={{ ...s.assignBtn, opacity: canAssign ? 1 : 0.5 }}
          onClick={assign} disabled={!canAssign}>
          🚚 {rtl ? `تعيين ${selected.length} فاتورة` : `Assign ${selected.length} Invoice(s)`}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DRIVER PAGE
// ═══════════════════════════════════════════════════════════
function DriverPage({ user, lang, t, rtl }) {
  const [active,     setActive]     = useState(null);
  const [completed,  setCompleted]  = useState([]);
  const [gps,        setGps]        = useState(null);
  const [locating,   setLocating]   = useState(false);
  const [podPreview, setPodPreview] = useState(null);

  const invoices = [
    { id: "INV-6032151025", customer: "National Guards Hospital", address: "King Fahd Road, Olaya", city: "Riyadh", storage: "Refrigerated (2-8°C)", dtype: "incity",  remarks: "Handle with care" },
    { id: "INV-6032151026", customer: "Al-Hammadi Hospital",      address: "Tahlia Street",         city: "Riyadh", storage: "Ambient (15-25°C)",    dtype: "incity",  remarks: "" },
    { id: "INV-6032151027", customer: "King Salman Hospital",     address: "Prince Mohammed Road",  city: "Riyadh", storage: "Frozen (-18 to -20°C)", dtype: "outcity", remarks: "Urgent — keep frozen" },
  ];

  const pending = invoices.filter(i => !completed.includes(i.id));

  function getLocation() {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
        ()   => { setGps({ lat: 24.7136, lng: 46.6753 }); setLocating(false); }
      );
    } else {
      setGps({ lat: 24.7136, lng: 46.6753 });
      setLocating(false);
    }
  }

  function handlePhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => setPodPreview(ev.target.result);
    r.readAsDataURL(f);
  }

  function submit(inv, status) {
    if (status === "delivered" && !podPreview) {
      alert(rtl ? "الرجاء رفع صورة الفاتورة" : "Please upload POD photo first");
      return;
    }
    setCompleted(p => [...p, inv.id]);
    setActive(null);
    setPodPreview(null);
    setGps(null);
  }

  return (
    <div>
      {/* Summary */}
      <div style={s.driverSum}>
        {[
          { label: rtl ? "متبقي"  : "Remaining", val: pending.length,                             color: "#0f172a" },
          { label: rtl ? "مكتمل" : "Completed",  val: completed.length,                           color: "#10b981" },
          { label: rtl ? "إجمالي" : "Total",      val: invoices.length,                            color: "#6366f1" },
        ].map((st, i) => (
          <div key={i} style={s.driverSumCard}>
            <span style={{ ...s.driverSumNum, color: st.color }}>{st.val}</span>
            <span style={s.driverSumLbl}>{st.label}</span>
          </div>
        ))}
      </div>

      <div style={s.sectionTitle}>
        📦 {rtl ? "التوصيلات المعلقة" : "Pending Deliveries"} ({pending.length})
      </div>

      {pending.length === 0 && (
        <div style={s.emptyState}>
          🎉 {rtl ? "أحسنت! تم إنجاز جميع التوصيلات" : "All deliveries completed! Great work."}
        </div>
      )}

      {pending.map(inv => (
        <div key={inv.id} style={s.driverCard}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
            <span style={s.invId}>{inv.id}</span>
            <span style={{
              ...s.badge,
              background: inv.dtype === "incity" ? "#dbeafe" : "#fef3c7",
              color:      inv.dtype === "incity" ? "#1e40af" : "#92400e",
              fontSize: 11
            }}>
              {inv.dtype === "incity" ? (rtl ? "🏙️ داخل المدينة" : "🏙️ In-City") : (rtl ? "🛣️ خارج المدينة" : "🛣️ Out-City")}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>{inv.customer}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>📍 {inv.address}, {inv.city}</div>
          <div style={{ fontSize: 13, color: "#0891b2", marginBottom: 4 }}>🌡️ {inv.storage}</div>
          {inv.remarks && <div style={{ fontSize: 13, color: "#d97706", background: "#fffbeb", padding: "6px 10px", borderRadius: 6, marginBottom: 8 }}>💬 {inv.remarks}</div>}

          {active?.id === inv.id ? (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, background: "#f8fafc", marginTop: 10 }}>
              {/* GPS */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  {rtl ? "الخطوة 1: تحديد الموقع" : "Step 1: Get GPS Location"}
                </div>
                <button style={{ ...s.gpsBtn, ...(gps ? { background: "#10b981" } : {}) }}
                  onClick={getLocation} disabled={locating}>
                  {locating ? (rtl ? "جاري التحديد..." : "Getting location...") :
                   gps ? `✅ ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` :
                   (rtl ? "📍 تحديد موقعي" : "📍 Get My Location")}
                </button>
              </div>

              {/* Photo */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  {rtl ? "الخطوة 2: التقط صورة الفاتورة" : "Step 2: Scan Invoice / Take Photo"}
                </div>
                <input type="file" accept="image/*" capture="environment" id={`pod_${inv.id}`}
                  style={{ display: "none" }} onChange={handlePhoto} />
                <label htmlFor={`pod_${inv.id}`} style={s.photoBtn}>
                  📸 {podPreview ? (rtl ? "تغيير الصورة" : "Change Photo") : (rtl ? "التقاط صورة" : "Take Photo")}
                </label>
                {podPreview && <img src={podPreview} alt="POD" style={{ display: "block", marginTop: 8, width: "100%", maxWidth: 200, borderRadius: 8, border: "2px solid #e2e8f0" }} />}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={s.deliverBtn} onClick={() => submit(inv, "delivered")}>
                  ✅ {rtl ? "تم التسليم" : "Mark Delivered"}
                </button>
                <button style={s.failBtn} onClick={() => submit(inv, "failed")}>
                  ❌ {rtl ? "فشل" : "Failed"}
                </button>
                <button style={{ ...s.browseBtn, background: "#f1f5f9", color: "#64748b" }} onClick={() => setActive(null)}>
                  {rtl ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <button style={s.startBtn} onClick={() => { setActive(inv); setGps(null); setPodPreview(null); }}>
              {rtl ? "بدء التوصيل ←" : "Start Delivery →"}
            </button>
          )}
        </div>
      ))}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <div style={s.sectionTitle}>✅ {rtl ? "مكتملة" : "Completed"} ({completed.length})</div>
          {invoices.filter(i => completed.includes(i.id)).map(inv => (
            <div key={inv.id} style={{ ...s.driverCard, opacity: 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={s.invId}>{inv.id}</span>
                <StatusBadge status="delivered" lang={lang} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.customer}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ODOMETER PAGE
// ═══════════════════════════════════════════════════════════
function OdometerPage({ user, lang, t, rtl }) {
  const [startPhoto, setStartPhoto] = useState(null);
  const [endPhoto,   setEndPhoto]   = useState(null);
  const [submitted,  setSubmitted]  = useState(false);

  return (
    <div>
      <div style={s.card}>
        <div style={s.cardTitle}>🔢 {rtl ? "قراءة عداد المسافة" : "Odometer Reading"}</div>
        <p style={s.cardDesc}>
          {rtl
            ? "التقط صورة من عداد المسافة في بداية ونهاية الرحلة. سيقرأ الذكاء الاصطناعي القيمة تلقائياً ثم يوافق عليها مدير التوزيع."
            : "Take a photo of the odometer at trip start and end. AI reads the value automatically, then DC Manager approves."}
        </p>

        {[
          { label: rtl ? "🟢 بداية الرحلة" : "🟢 Trip Start", id: "start", photo: startPhoto, set: setStartPhoto, km: "102,345" },
          { label: rtl ? "🔴 نهاية الرحلة" : "🔴 Trip End",   id: "end",   photo: endPhoto,   set: setEndPhoto,   km: "102,487" },
        ].map(sec => (
          <div key={sec.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{sec.label}</div>
            <input type="file" accept="image/*" capture="environment" id={`odo_${sec.id}`}
              style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files[0];
                if (f) sec.set(URL.createObjectURL(f));
              }} />
            <label htmlFor={`odo_${sec.id}`} style={s.photoBtn}>
              📸 {sec.photo ? (rtl ? "تغيير" : "Change") : (rtl ? "التقاط صورة" : "Take Photo")}
            </label>
            {sec.photo && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <img src={sec.photo} alt="odo" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6 }} />
                <div style={{ background: "#f0fdf4", padding: "6px 12px", borderRadius: 6, fontSize: 13 }}>
                  🤖 AI {rtl ? "قرأ:" : "Read:"} <b>{sec.km} KM</b>
                </div>
              </div>
            )}
            {!sec.photo && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#94a3b8" }}>
                🤖 AI {rtl ? "قرأ:" : "Read:"} <b>{sec.km} KM</b> (demo)
              </div>
            )}
          </div>
        ))}

        {endPhoto && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", padding: "12px 16px", borderRadius: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>📏 {rtl ? "المسافة المقطوعة:" : "Distance Covered:"}</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>142 KM</span>
          </div>
        )}

        {submitted ? (
          <div style={s.successMsg}>✅ {rtl ? "تم الإرسال! في انتظار موافقة المدير." : "Submitted! Awaiting DC Manager approval."}</div>
        ) : (
          <button style={s.assignBtn} onClick={() => setSubmitted(true)}>
            {rtl ? "إرسال للموافقة" : "Submit for Approval"}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SEARCH PAGE — View Only
// ═══════════════════════════════════════════════════════════
function SearchPage({ user, lang, t, rtl }) {
  const [search,   setSearch]   = useState("");
  const [results,  setResults]  = useState([]);
  const [searched, setSearched] = useState(false);

  const ALL = [
    { id: "INV-6032151025", customer: "National Guards Hospital", dc: "Riyadh DC", status: "delivered", date: "2026-05-23", driver: "Khaled Sharahili", km: "12.4", inst: "Government" },
    { id: "INV-6032151026", customer: "Al-Hammadi Hospital",      dc: "Riyadh DC", status: "assigned",  date: "2026-05-23", driver: "Abdul Rahman",    km: "—",    inst: "Private" },
    { id: "INV-6032151027", customer: "King Fahd Hospital",       dc: "Jeddah DC", status: "pending",   date: "2026-05-23", driver: "—",               km: "—",    inst: "Government" },
    { id: "INV-6032151028", customer: "MOH Hospital Dammam",      dc: "Dammam DC", status: "failed",    date: "2026-05-23", driver: "Mishaan",         km: "—",    inst: "Government" },
  ];

  function doSearch() {
    const q = search.trim().toLowerCase();
    setResults(q ? ALL.filter(i => i.id.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q)) : ALL);
    setSearched(true);
  }

  return (
    <div>
      <div style={s.card}>
        <div style={s.cardTitle}>🔍 {rtl ? "البحث عن الفواتير" : "Search Invoices"}</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input style={{ ...s.input, flex: 1 }}
            placeholder={rtl ? "رقم الفاتورة أو اسم العميل..." : "Invoice # or Customer Name..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()} />
          <button style={s.assignBtn} onClick={doSearch}>
            {rtl ? "بحث" : "Search"}
          </button>
        </div>

        {searched && (
          <div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
              {results.length} {rtl ? "نتيجة" : "results"}
            </div>
            {results.map(inv => (
              <div key={inv.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                  <span style={s.invId}>{inv.id}</span>
                  <StatusBadge status={inv.status} lang={lang} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{inv.customer}</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#64748b" }}>
                  <span>📍 {inv.dc}</span>
                  <span>👤 {inv.driver}</span>
                  <span>📅 {inv.date}</span>
                  {inv.km !== "—" && <span>📏 {inv.km} KM</span>}
                  <span style={{ color: inv.inst === "Government" ? "#1e40af" : "#6d28d9" }}>
                    {inv.inst === "Government" ? "🏛️ Govt" : "🏥 Private"}
                  </span>
                </div>
                {inv.status === "delivered" && (
                  <button style={{ ...s.browseBtn, marginTop: 8 }}>
                    📸 {rtl ? "عرض POD" : "View POD"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INVOICES PAGE
// ═══════════════════════════════════════════════════════════
function InvoicesPage({ user, lang, t, ra }) {
  const rtl = lang === "ar";
  const [search, setSearch]   = useState("");
  const [statusF, setStatusF] = useState("all");

  const invoices = [
    { id: "INV-6032151025", customer: "National Guards Hospital", dc: "Riyadh DC", status: "pending",   date: "2026-05-23", inst: "Government" },
    { id: "INV-6032151026", customer: "Al-Hammadi Hospital",      dc: "Riyadh DC", status: "assigned",  date: "2026-05-23", inst: "Private" },
    { id: "INV-6032151027", customer: "King Fahd Hospital",       dc: "Jeddah DC", status: "delivered", date: "2026-05-23", inst: "Government" },
    { id: "INV-6032151028", customer: "MOH Hospital Dammam",      dc: "Dammam DC", status: "failed",    date: "2026-05-23", inst: "Government" },
    { id: "INV-6032151029", customer: "Bugshan Hospital",         dc: "Jeddah DC", status: "outstanding",date: "2026-05-22", inst: "Private" },
  ];

  const filtered = invoices.filter(i => {
    const matchS = statusF === "all" || i.status === statusF;
    const matchQ = i.id.includes(search) || i.customer.toLowerCase().includes(search.toLowerCase());
    const matchDC = user.role !== "manager" || i.dc.includes(user.dc);
    return matchS && matchQ && matchDC;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input style={{ ...s.input, flex: 1, minWidth: 180 }}
          placeholder={rtl ? "بحث..." : "Search invoice # or customer..."}
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={s.select} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="all">{rtl ? "كل الحالات" : "All Status"}</option>
          {Object.keys(STATUS_STYLES).map(k => (
            <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
        {filtered.length} {rtl ? "فاتورة" : "invoices"}
      </div>

      {filtered.map(inv => (
        <div key={inv.id} style={{ ...s.invRow, ...s.card, marginBottom: 8, flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 6 }}>
            <span style={s.invId}>{inv.id}</span>
            <StatusBadge status={inv.status} lang={lang} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.customer}</div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
            <span>📍 {inv.dc}</span>
            <span>📅 {inv.date}</span>
            <span style={{ color: inv.inst === "Government" ? "#1e40af" : "#6d28d9" }}>
              {inv.inst === "Government" ? "🏛️ Govt" : "🏥 Private"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMING SOON
// ═══════════════════════════════════════════════════════════
function ComingSoon({ label, lang }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🚧</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: "#0f172a", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#94a3b8" }}>
        {lang === "ar" ? "هذه الشاشة قيد التطوير — قريباً!" : "This screen is being built — coming next!"}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════
function StatusBadge({ status, lang }) {
  const st = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const T_STATUS = {
    en: { pending: "Pending", assigned: "Assigned", delivered: "Delivered", failed: "Failed", outstanding: "Outstanding", intransit: "In Transit" },
    ar: { pending: "معلق", assigned: "تم التعيين", delivered: "تم التسليم", failed: "فشل", outstanding: "معلق - إعادة تعيين", intransit: "في الطريق" }
  };
  return (
    <span style={{ ...s.badge, background: st.bg, color: st.color }}>
      {st.icon} {T_STATUS[lang]?.[status] || status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const s = {
  // Login
  loginRoot:    { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", position: "relative", overflow: "hidden" },
  loginBgLeft:  { position: "fixed", top: 0, left: 0, width: "50%", height: "100%", background: "linear-gradient(135deg,#0d1b2a,#1a3a5c)", zIndex: 0 },
  loginBgRight: { position: "fixed", top: 0, right: 0, width: "50%", height: "100%", background: "#f8fafc", zIndex: 0 },
  langBar:      { position: "fixed", top: 16, zIndex: 1000, display: "flex", gap: 4, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 4, backdropFilter: "blur(8px)" },
  langBtn:      { background: "none", border: "none", color: "rgba(255,255,255,0.6)", padding: "6px 14px", borderRadius: 16, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  langBtnOn:    { background: "white", color: "#1A3A5C" },
  loginWrap:    { display: "flex", width: "100%", maxWidth: 960, minHeight: "100vh", position: "relative", zIndex: 10 },
  brandPanel:   { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 32px", color: "white" },
  brandLogo:    { marginBottom: 24 },
  logoTri:      { width: 72, height: 72, background: "linear-gradient(135deg,#c0392b,#e74c3c)", clipPath: "polygon(50% 0%,0% 100%,100% 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoTxt:      { color: "white", fontSize: 10, fontWeight: 900, textAlign: "center", letterSpacing: 1, lineHeight: 1.3, marginTop: 20 },
  brandNameAr:  { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  brandNameEn:  { fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 16 },
  brandLine:    { width: 50, height: 3, background: "#e74c3c", borderRadius: 2, marginBottom: 14 },
  brandApp:     { fontSize: 34, fontWeight: 900, letterSpacing: "-1px", marginBottom: 6 },
  brandTag:     { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 28 },
  dcList:       { display: "flex", flexDirection: "column", gap: 8 },
  dcItem:       { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(255,255,255,0.7)" },
  dcDot:        { width: 8, height: 8, borderRadius: "50%", background: "#e74c3c", flexShrink: 0 },
  formPanel:    { flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 32px" },
  formBox:      { maxWidth: 380, width: "100%", margin: "0 auto" },
  formTitle:    { fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" },
  formSub:      { fontSize: 14, color: "#64748b", marginBottom: 24 },
  field:        { marginBottom: 14 },
  label:        { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 },
  input:        { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" },
  errMsg:       { background: "#fee2e2", color: "#991b1b", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12 },
  loginBtn:     { width: "100%", background: "linear-gradient(135deg,#1A3A5C,#2471A3)", color: "white", border: "none", padding: 13, borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 },
  reqBtn:       { width: "100%", background: "white", border: "1.5px solid #e2e8f0", color: "#374151", padding: 11, borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 16 },
  demoToggle:   { width: "100%", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "#64748b" },
  demoList:     { marginTop: 10 },
  demoNote:     { fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 8 },
  demoItem:     { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", background: "white", textAlign: "left", marginBottom: 4, width: "100%" },
  demoRole:     { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  demoName:     { fontWeight: 600, fontSize: 13, color: "#0f172a" },
  demoEmail:    { fontSize: 11, color: "#94a3b8" },
  backBtn:      { background: "none", border: "none", color: "#1A3A5C", cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0 },
  successBox:   { background: "#d1fae5", color: "#065f46", borderRadius: 10, padding: 16, fontSize: 14 },
  footer:       { marginTop: 24, textAlign: "center", fontSize: 11, color: "#94a3b8" },
  // App
  appRoot:      { display: "flex", minHeight: "100vh", background: "#f1f5f9" },
  sidebar:      { width: 240, position: "fixed", height: "100vh", display: "flex", flexDirection: "column", zIndex: 200, transition: "transform 0.3s", boxShadow: "4px 0 20px rgba(0,0,0,0.3)", overflowY: "auto" },
  sidebarLogo:  { display: "flex", alignItems: "center", gap: 10, padding: "18px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  sidebarLogoIcon: { fontSize: 22 },
  sidebarAppName:  { fontWeight: 800, fontSize: 15, color: "white" },
  sidebarSPCO:     { fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2 },
  sidebarNav:   { flex: 1, padding: "10px 8px" },
  navBtn:       { width: "100%", background: "none", border: "1px solid transparent", color: "rgba(255,255,255,0.6)", padding: "10px 12px", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 2, transition: "all 0.2s" },
  navBtnOn:     { color: "white", fontWeight: 600 },
  navIcon:      { fontSize: 15, width: 20, textAlign: "center" },
  sidebarLang:  { display: "flex", gap: 6, padding: "8px 16px" },
  sidebarLangBtn: { flex: 1, border: "1px solid rgba(255,255,255,0.2)", background: "none", color: "rgba(255,255,255,0.6)", borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  sidebarUser:  { display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" },
  sidebarAvatar:{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "white", flexShrink: 0 },
  sidebarUserInfo: { flex: 1, minWidth: 0 },
  sidebarUserName: { fontSize: 13, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sidebarUserRole: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  sidebarUserLoc:  { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  logoutBtn:    { margin: "0 16px 16px", background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12, padding: "8px", borderRadius: 6, width: "calc(100% - 32px)" },
  overlay:      { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 199 },
  main:         { flex: 1, display: "flex", flexDirection: "column" },
  topbar:       { background: "white", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 0 #e2e8f0" },
  menuBtn:      { background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#374151", flexShrink: 0 },
  topbarTitle:  { flex: 1, fontWeight: 800, fontSize: 18, color: "#0f172a" },
  roleBadge:    { fontSize: 12, fontWeight: 700, color: "white", padding: "5px 12px", borderRadius: 20, whiteSpace: "nowrap" },
  content:      { flex: 1, padding: "20px", overflowY: "auto" },
  // Cards & Stats
  statsGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 16 },
  statCard:     { background: "white", borderRadius: 10, padding: "14px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  statIcon:     { fontSize: 22, marginBottom: 4 },
  statVal:      { fontWeight: 800, fontSize: 22, marginBottom: 2 },
  statLbl:      { fontSize: 12, color: "#94a3b8" },
  dcGrid:       { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 16 },
  dcCard:       { background: "white", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  dcName:       { fontWeight: 700, fontSize: 14, marginBottom: 8 },
  dcNums:       { display: "flex", gap: 12, marginBottom: 8 },
  dcBarBg:      { background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden" },
  dcBarFill:    { height: "100%", borderRadius: 99, transition: "width 0.5s" },
  card:         { background: "white", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16 },
  cardTitle:    { fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 },
  cardDesc:     { fontSize: 13, color: "#64748b", marginBottom: 14 },
  invRow:       { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" },
  invId:        { fontWeight: 700, fontSize: 13, color: "#6366f1", minWidth: 130 },
  invCustomer:  { flex: 1, fontSize: 13, color: "#0f172a", minWidth: 140 },
  invDC:        { fontSize: 12, color: "#64748b" },
  alertsGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 },
  alertItem:    { fontSize: 13, color: "#374151", padding: "6px 0", borderBottom: "1px solid #f1f5f9" },
  badge:        { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" },
  // Upload
  dlBtn:        { background: "#0f172a", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13, marginBottom: 8 },
  colTag:       { background: "#f1f5f9", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#374151" },
  dropZone:     { border: "2px dashed #cbd5e1", borderRadius: 10, padding: "32px", textAlign: "center", transition: "all 0.2s", marginBottom: 12 },
  dropZoneOn:   { border: "2px dashed #6366f1", background: "#eef2ff" },
  browseBtn:    { display: "inline-block", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 600 },
  table:        { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:           { background: "#f8fafc", padding: "9px 12px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 12, borderBottom: "1px solid #e2e8f0" },
  td:           { padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155" },
  importBtn:    { marginTop: 14, background: "#10b981", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  successMsg:   { background: "#d1fae5", color: "#065f46", borderRadius: 8, padding: "12px 16px", fontWeight: 600, marginBottom: 12 },
  // Assign
  assignGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 12 },
  assignField:  { display: "flex", flexDirection: "column", gap: 5 },
  select:       { border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", background: "white" },
  checkRow:     { display: "flex", alignItems: "center", gap: 10, padding: 12, border: "1px solid #f1f5f9", borderRadius: 8, marginBottom: 6, cursor: "pointer" },
  checkRowOn:   { border: "1px solid #a5b4fc", background: "#eef2ff" },
  checkbox:     { fontSize: 20, color: "#6366f1", flexShrink: 0 },
  toggleBtn:    { flex: 1, border: "2px solid #e2e8f0", background: "white", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b" },
  toggleBtnOn:  { border: "2px solid #6366f1", background: "#eef2ff", color: "#4338ca" },
  assignBtn:    { marginTop: 14, background: "#1A3A5C", color: "white", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14, width: "100%" },
  // Driver
  driverSum:    { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 },
  driverSumCard:{ background: "white", borderRadius: 10, padding: 16, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 4 },
  driverSumNum: { fontWeight: 900, fontSize: 28 },
  driverSumLbl: { fontSize: 12, color: "#94a3b8" },
  sectionTitle: { fontWeight: 700, fontSize: 15, color: "#0f172a", margin: "16px 0 10px" },
  driverCard:   { background: "white", borderRadius: 10, padding: 16, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  gpsBtn:       { background: "#0ea5e9", color: "white", border: "none", padding: "9px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 600, fontSize: 13, width: "100%" },
  photoBtn:     { display: "inline-block", background: "#8b5cf6", color: "white", border: "none", padding: "9px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 600, fontSize: 13 },
  deliverBtn:   { background: "#10b981", color: "white", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  failBtn:      { background: "#ef4444", color: "white", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  startBtn:     { background: "#1A3A5C", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13, marginTop: 8, width: "100%" },
  emptyState:   { textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: 15 },
};
