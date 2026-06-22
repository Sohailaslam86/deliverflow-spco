// src/pages/DispatchCalendar.jsx
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:    { bg:"#f1f5f9", text:"#64748b", border:"#cbd5e1", label:"Pending",           icon:"⏳" },
  assigned:   { bg:"#dbeafe", text:"#1d4ed8", border:"#93c5fd", label:"Staged for Dispatch",icon:"📦" },
  intransit:  { bg:"#fef3c7", text:"#d97706", border:"#fcd34d", label:"In Transit",         icon:"🚚" },
  "in-transit":{ bg:"#fef3c7", text:"#d97706", border:"#fcd34d", label:"In Transit",        icon:"🚚" },
  completed:  { bg:"#d1fae5", text:"#065f46", border:"#6ee7b7", label:"Completed",          icon:"✅" },
  delivered:  { bg:"#d1fae5", text:"#065f46", border:"#6ee7b7", label:"Completed",          icon:"✅" },
  failed:     { bg:"#fee2e2", text:"#991b1b", border:"#fca5a5", label:"Failed",             icon:"❌" },
  cancelled:  { bg:"#f8fafc", text:"#94a3b8", border:"#e2e8f0", label:"Cancelled",          icon:"🚫" },
};

function getStatusCfg(status) {
  return STATUS_CFG[(status||"").toLowerCase()] || STATUS_CFG.pending;
}

const DAYS_OF_WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const T = {
  en: {
    title:"Dispatch Calendar", today:"Today", refresh:"Refresh",
    allDC:"All Distribution Centers", allStatuses:"All Statuses",
    pending:"Pending", staged:"Staged for Dispatch", intransit:"In Transit",
    completed:"Completed", failed:"Failed",
    totalTrips:"Total Trips", tripDetails:"Trip Details",
    tripId:"Trip ID", date:"Date", dc:"Distribution Center",
    driver:"Delivery Partner", vehicle:"Vehicle", origin:"Origin",
    dest:"Destination", invoices:"Invoices", notes:"Notes",
    noTrips:"No trips scheduled", loading:"Loading trips...",
    moreTrips:"more", riyadhDC:"Riyadh Distribution Center",
    jeddahDC:"Jeddah Distribution Center", dammamDC:"Dammam Distribution Center",
  },
  ar: {
    title:"تقويم الإرسال", today:"اليوم", refresh:"تحديث",
    allDC:"جميع مراكز التوزيع", allStatuses:"جميع الحالات",
    pending:"معلق", staged:"مرحلة الإرسال", intransit:"في الطريق",
    completed:"مكتمل", failed:"فاشل",
    totalTrips:"إجمالي الرحلات", tripDetails:"تفاصيل الرحلة",
    tripId:"رقم الرحلة", date:"التاريخ", dc:"مركز التوزيع",
    driver:"شريك التوصيل", vehicle:"المركبة", origin:"نقطة الانطلاق",
    dest:"الوجهة", invoices:"الفواتير", notes:"ملاحظات",
    noTrips:"لا توجد رحلات مجدولة", loading:"جارٍ التحميل...",
    moreTrips:"المزيد", riyadhDC:"مركز توزيع الرياض",
    jeddahDC:"مركز توزيع جدة", dammamDC:"مركز توزيع الدمام",
  },
};

export default function DispatchCalendar({ user, lang, trips: propTrips, users, vehicles }) {
  const [fsTrips, setFsTrips]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selTrip, setSelTrip]     = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1); // 1-based

  const isAdmin  = user.role === "admin";
  const userDC   = (!user.dc || user.dc === "Head Office") ? null : user.dc;
  const [filterDC, setFilterDC] = useState(userDC || "all");

  const rtl = lang === "ar";
  const t   = T[lang] || T.en;

  // ── Load from Firestore ───────────────────────────────────────────────────
  useEffect(() => { loadTrips(); }, []);

  async function loadTrips() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "trips"));
      setFsTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) {
      console.error("[DispatchCalendar] trips load error:", e);
      setFsTrips(propTrips || []);
    }
    setLoading(false);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function resolveDriverName(ref) {
    if (!ref) return "—";
    const found = (users || []).find(u => u.uid === ref || u.name === ref);
    return found ? found.name : ref;
  }

  function formatMonth(y, m) {
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function prevMonth() {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  }

  function nextMonth() {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  }

  // ── Filter & group ────────────────────────────────────────────────────────
  const filtered = fsTrips.filter(trip => {
    if (userDC && trip.dc && trip.dc !== userDC) return false;
    if (filterDC !== "all" && trip.dc !== filterDC) return false;
    if (filterStatus !== "all" && trip.status !== filterStatus) return false;
    return true;
  });

  const monthStr = `${calYear}-${String(calMonth).padStart(2, "0")}`;

  const tripsByDate = {};
  filtered.forEach(trip => {
    const date = trip.tentativeDate || trip.date || "";
    if (!date) return;
    if (!tripsByDate[date]) tripsByDate[date] = [];
    tripsByDate[date].push(trip);
  });

  // ── Calendar geometry ─────────────────────────────────────────────────────
  const firstDayOfMonth = new Date(calYear, calMonth - 1, 1).getDay(); // 0=Sun
  const daysInMonth     = new Date(calYear, calMonth, 0).getDate();

  // ── Month-level stats ─────────────────────────────────────────────────────
  const monthTrips = filtered.filter(t => (t.tentativeDate || t.date || "").startsWith(monthStr));
  const sc = monthTrips.reduce((a, t) => { const s=t.status||"pending"; a[s]=(a[s]||0)+1; return a; }, {});

  const statCards = [
    { label: t.totalTrips,  val: monthTrips.length,                                       color:"#6366f1" },
    { label: t.pending,     val: sc.pending || 0,                                          color:"#94a3b8" },
    { label: t.staged,      val: sc.assigned || 0,                                         color:"#3b82f6" },
    { label: t.intransit,   val: (sc.intransit || 0) + (sc["in-transit"] || 0),            color:"#f59e0b" },
    { label: t.completed,   val: (sc.completed || 0) + (sc.delivered || 0),                color:"#10b981" },
    { label: t.failed,      val: sc.failed || 0,                                            color:"#ef4444" },
  ];

  const btnBase = { border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 };

  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div style={{ background:"white", borderRadius:10, padding:"14px 18px", marginBottom:16,
        display:"flex", flexWrap:"wrap", gap:12, alignItems:"center",
        boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>

        {/* Month nav */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={prevMonth} style={{ ...btnBase, background:"#f1f5f9", width:34, height:34, fontSize:18, color:"#374151" }}>‹</button>
          <span style={{ fontWeight:800, fontSize:16, color:"#0f172a", minWidth:200, textAlign:"center" }}>
            📅 {formatMonth(calYear, calMonth)}
          </span>
          <button onClick={nextMonth} style={{ ...btnBase, background:"#f1f5f9", width:34, height:34, fontSize:18, color:"#374151" }}>›</button>
          <button onClick={()=>{ setCalYear(today.getFullYear()); setCalMonth(today.getMonth()+1); }}
            style={{ ...btnBase, background:"#1A3A5C", color:"white", padding:"7px 14px" }}>
            {t.today}
          </button>
        </div>

        {/* DC filter — admin only */}
        {isAdmin && (
          <select value={filterDC} onChange={e => setFilterDC(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"7px 12px", fontSize:13, outline:"none", background:"white", cursor:"pointer" }}>
            <option value="all">{t.allDC}</option>
            <option value="Riyadh">{t.riyadhDC}</option>
            <option value="Jeddah">{t.jeddahDC}</option>
            <option value="Dammam">{t.dammamDC}</option>
          </select>
        )}

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"7px 12px", fontSize:13, outline:"none", background:"white", cursor:"pointer" }}>
          <option value="all">{t.allStatuses}</option>
          <option value="pending">{t.pending}</option>
          <option value="assigned">{t.staged}</option>
          <option value="intransit">{t.intransit}</option>
          <option value="completed">{t.completed}</option>
          <option value="failed">{t.failed}</option>
        </select>

        {/* Refresh */}
        <button onClick={loadTrips} style={{ ...btnBase, background:"#f1f5f9", color:"#374151", padding:"7px 14px", marginLeft:"auto" }}>
          🔄 {t.refresh}
        </button>
      </div>

      {/* ── Month stats ─────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10, marginBottom:16 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:10, padding:"12px 14px",
            borderLeft:`4px solid ${s.color}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:3 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14 }}>
        {[
          ["#94a3b8", t.pending],
          ["#3b82f6", t.staged],
          ["#f59e0b", t.intransit],
          ["#10b981", t.completed],
          ["#ef4444", t.failed],
        ].map(([c, l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
            <div style={{ width:12, height:12, borderRadius:3, background:c }} />
            {l}
          </div>
        ))}
      </div>

      {/* ── Calendar + Side Panel ─────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>

        {/* Calendar */}
        <div style={{ flex:1, background:"white", borderRadius:12, padding:16,
          boxShadow:"0 1px 4px rgba(0,0,0,0.06)", minWidth:0 }}>

          {loading ? (
            <div style={{ textAlign:"center", padding:60, color:"#94a3b8", fontSize:14 }}>
              🔄 {t.loading}
            </div>
          ) : (
            <>
              {/* Day-of-week headers */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3 }}>
                {DAYS_OF_WEEK.map(d => (
                  <div key={d} style={{
                    textAlign:"center", fontWeight:700, fontSize:11,
                    color: d==="Fri"||d==="Sat" ? "#94a3b8" : "#374151",
                    padding:"8px 4px", background:"#f8fafc", borderRadius:6,
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>

                {/* Offset empty cells */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={"pad"+i} style={{ minHeight:88, borderRadius:8, background:"#fafafa" }} />
                ))}

                {/* Actual day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum  = i + 1;
                  const dateStr = `${monthStr}-${String(dayNum).padStart(2,"0")}`;
                  const dayTrips = tripsByDate[dateStr] || [];
                  const isToday  = dateStr === todayStr;
                  const dow      = new Date(dateStr).getDay();
                  const isWeekend = dow === 5 || dow === 6;

                  return (
                    <div key={dateStr} style={{
                      minHeight:88, borderRadius:8, padding:"5px 4px",
                      background: isToday ? "#eff6ff" : isWeekend ? "#fafafa" : "white",
                      border: isToday ? "2px solid #3b82f6" : "1px solid #f1f5f9",
                      transition:"box-shadow 0.15s",
                    }}>
                      {/* Day number row */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                        <span style={{
                          fontSize:11, fontWeight: isToday ? 800 : 600,
                          color: isToday?"#1d4ed8" : isWeekend?"#94a3b8" : "#374151",
                          background: isToday?"#dbeafe":"transparent",
                          borderRadius:"50%", width:20, height:20,
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>
                          {dayNum}
                        </span>
                        {dayTrips.length > 0 && (
                          <span style={{ fontSize:9, background:"#e0e7ff", color:"#4338ca",
                            borderRadius:99, padding:"1px 5px", fontWeight:700 }}>
                            {dayTrips.length}
                          </span>
                        )}
                      </div>

                      {/* Trip blocks — show max 3 */}
                      {dayTrips.slice(0, 3).map(trip => {
                        const cfg         = getStatusCfg(trip.status);
                        const driverName  = resolveDriverName(trip.driver || trip.driverId);
                        const firstWord   = driverName.split(" ")[0];
                        const plate       = trip.vehicle || trip.vehiclePlate || "";
                        return (
                          <div key={trip.id}
                            onClick={() => setSelTrip(trip)}
                            title={`${driverName} | ${plate} | ${cfg.label}`}
                            style={{
                              background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.border}`,
                              borderRadius:4, padding:"2px 5px", marginBottom:2,
                              fontSize:10, fontWeight:600, cursor:"pointer",
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                              lineHeight:1.5,
                            }}>
                            {cfg.icon} {firstWord} {plate ? `· ${plate}` : ""}
                          </div>
                        );
                      })}

                      {/* +N more link */}
                      {dayTrips.length > 3 && (
                        <div style={{ fontSize:9, color:"#6366f1", fontWeight:700, paddingLeft:2 }}>
                          +{dayTrips.length - 3} {t.moreTrips}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Side Panel ───────────────────────────────────────────────────── */}
        {selTrip && (
          <div style={{
            width:290, flexShrink:0, background:"white", borderRadius:12, padding:20,
            boxShadow:"0 4px 20px rgba(0,0,0,0.12)", position:"sticky", top:20,
          }}>
            {/* Panel header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <span style={{ fontWeight:800, fontSize:15, color:"#0f172a" }}>📋 {t.tripDetails}</span>
              <button onClick={() => setSelTrip(null)}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:"#94a3b8", lineHeight:1 }}>×</button>
            </div>

            {/* Status badge */}
            {(() => {
              const cfg = getStatusCfg(selTrip.status);
              return (
                <div style={{ background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.border}`,
                  borderRadius:8, padding:"9px 12px", marginBottom:14, fontWeight:700, fontSize:13 }}>
                  {cfg.icon} {cfg.label}
                </div>
              );
            })()}

            {/* Info rows */}
            {[
              [t.tripId,   selTrip.id || "—"],
              [t.date,     selTrip.tentativeDate || selTrip.date || "—"],
              [t.dc,       selTrip.dc || "—"],
              [t.driver,   resolveDriverName(selTrip.driver || selTrip.driverId)],
              [t.vehicle,  selTrip.vehicle || selTrip.vehiclePlate || "—"],
              [t.origin,   selTrip.origin || "—"],
              [t.dest,     selTrip.destination || "—"],
              [t.invoices, Array.isArray(selTrip.invoices)
                ? `${selTrip.invoices.length} invoice(s)`
                : selTrip.invoices || "—"],
            ].map(([label, val]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", gap:8,
                padding:"7px 0", borderBottom:"1px solid #f1f5f9", fontSize:12 }}>
                <span style={{ color:"#64748b", fontWeight:600, flexShrink:0 }}>{label}</span>
                <span style={{ color:"#0f172a", fontWeight:600, textAlign:"right",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>
                  {String(val)}
                </span>
              </div>
            ))}

            {/* Invoice list */}
            {Array.isArray(selTrip.invoices) && selTrip.invoices.length > 0 && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:6 }}>📋 Invoice IDs</div>
                <div style={{ maxHeight:120, overflowY:"auto", background:"#f8fafc", borderRadius:8, padding:"6px 10px" }}>
                  {selTrip.invoices.map((inv, idx) => (
                    <div key={idx} style={{ fontSize:11, color:"#6366f1", fontWeight:600, padding:"2px 0", borderBottom:"1px solid #f1f5f9" }}>
                      {typeof inv === "string" ? inv : inv.id || inv.invoiceNo || JSON.stringify(inv)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selTrip.notes && (
              <div style={{ marginTop:12, background:"#f8fafc", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#64748b" }}>
                📝 {selTrip.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
