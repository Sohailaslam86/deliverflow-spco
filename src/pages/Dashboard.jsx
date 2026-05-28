// src/pages/Dashboard.jsx
import { useState } from "react";
import { Card, CardTitle, StatCard, Badge, AgingBadge, SectionTitle, Btn, Modal, Select, Textarea } from "../components/Shared.jsx";
import { daysSince, agingColor, ALERT_DISMISS_REASONS, DC_GPS } from "../data/masterData.js";

export default function Dashboard({ user, invoices, vehicles, alerts, setAlerts, users, lang }) {
  const rtl = lang === "ar";
  const dc = user.dc;

  // Filter by role
  const myInvoices = dc ? invoices.filter(i => i.dc === dc) : invoices;
  const myVehicles = dc ? vehicles.filter(v => v.dc === dc) : vehicles;
  const myAlerts   = dc ? alerts.filter(a => a.dc === dc && a.status==="active") : alerts.filter(a => a.status==="active");
  const myDrivers  = users.filter(u => u.role==="driver" && (!dc || u.dc===dc) && u.status==="Active");

  // Stats
  const stats = {
    total:       myInvoices.length,
    delivered:   myInvoices.filter(i=>i.status==="delivered").length,
    pending:     myInvoices.filter(i=>i.status==="pending").length,
    assigned:    myInvoices.filter(i=>i.status==="assigned").length,
    failed:      myInvoices.filter(i=>i.status==="failed").length,
    outstanding: myInvoices.filter(i=>i.status==="outstanding").length,
    intransit:   myInvoices.filter(i=>i.status==="intransit").length,
  };

  const activeVehicles = myVehicles.filter(v=>v.status==="Active").length;
  const maintVehicles  = myVehicles.filter(v=>v.status==="Maintenance").length;

  // DC breakdown for admin
  const dcStats = ["Riyadh","Jeddah","Dammam"].map(d => {
    const di = invoices.filter(i=>i.dc===d);
    const dv = vehicles.filter(v=>v.dc===d);
    const dd = users.filter(u=>u.role==="driver"&&u.dc===d&&u.status==="Active");
    return {
      dc:d,
      color:d==="Riyadh"?"#ef4444":d==="Jeddah"?"#3b82f6":"#10b981",
      total:di.length,
      delivered:di.filter(i=>i.status==="delivered").length,
      pending:di.filter(i=>i.status==="pending").length,
      failed:di.filter(i=>i.status==="failed").length,
      outstanding:di.filter(i=>i.status==="outstanding").length,
      activeVehicles:dv.filter(v=>v.status==="Active").length,
      activeDrivers:dd.length,
    };
  });

  // Aging invoices
  const agingInvoices = myInvoices
    .filter(i => ["pending","assigned","outstanding"].includes(i.status))
    .map(i => ({ ...i, days: daysSince(i.date) }))
    .sort((a,b) => b.days - a.days);

  return (
    <div>
      {/* Main Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:12, marginBottom:16 }}>
        <StatCard icon="📋" label="Total"       value={stats.total}       color="#6366f1" />
        <StatCard icon="✅" label="Delivered"   value={stats.delivered}   color="#10b981" sub={stats.total>0?Math.round(stats.delivered/stats.total*100)+"%":"-"} />
        <StatCard icon="⏳" label="Pending"     value={stats.pending}     color="#f59e0b" />
        <StatCard icon="🔵" label="Assigned"    value={stats.assigned}    color="#3b82f6" />
        <StatCard icon="❌" label="Failed"      value={stats.failed}      color="#ef4444" />
        <StatCard icon="🟠" label="Outstanding" value={stats.outstanding} color="#f97316" />
        <StatCard icon="🔄" label="In Transit"  value={stats.intransit}   color="#8b5cf6" />
        <StatCard icon="🚗" label="Active Vehicles" value={activeVehicles} color="#0891b2" sub={maintVehicles>0?maintVehicles+" in maint.":""} />
        <StatCard icon="👤" label="Active Drivers"  value={myDrivers.length} color="#059669" />
      </div>

      {/* DC Breakdown - Admin Only */}
      {user.role === "admin" && (
        <>
          <SectionTitle>📍 Distribution Center Overview</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12, marginBottom:16 }}>
            {dcStats.map(d => (
              <Card key={d.dc} style={{ borderLeft:`4px solid ${d.color}`, marginBottom:0 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>📍 {d.dc} DC</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
                  {[
                    { label:"Total",       value:d.total,       color:"#6366f1" },
                    { label:"Delivered",   value:d.delivered,   color:"#10b981" },
                    { label:"Pending",     value:d.pending,     color:"#f59e0b" },
                    { label:"Failed",      value:d.failed,      color:"#ef4444" },
                    { label:"Outstanding", value:d.outstanding, color:"#f97316" },
                    { label:"Vehicles",    value:d.activeVehicles+"A", color:"#0891b2" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign:"center", background:"#f8fafc", borderRadius:6, padding:"6px 4px" }}>
                      <div style={{ fontWeight:800, fontSize:16, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:10, color:"#94a3b8" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${d.total>0?Math.round(d.delivered/d.total*100):0}%`, height:"100%", background:d.color, borderRadius:99, transition:"width 0.5s" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:12, color:"#64748b" }}>
                  <span>👤 {d.activeDrivers} drivers</span>
                  <span>{d.total>0?Math.round(d.delivered/d.total*100):0}% delivery rate</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Alerts Panel */}
      {myAlerts.length > 0 && (
        <AlertsPanel alerts={myAlerts} setAlerts={setAlerts} user={user} />
      )}

      {/* Invoice Aging */}
      {agingInvoices.length > 0 && (
        <Card>
          <CardTitle>⏱️ Invoice Aging Report</CardTitle>
          <div style={{ display:"flex", gap:12, marginBottom:12 }}>
            {[
              { label:"🟢 Fresh (≤1 day)",    count:agingInvoices.filter(i=>i.days<=1).length, color:"#10b981" },
              { label:"🟡 Aging (2-3 days)",  count:agingInvoices.filter(i=>i.days>1&&i.days<=3).length, color:"#f59e0b" },
              { label:"🔴 Critical (4+ days)",count:agingInvoices.filter(i=>i.days>3).length, color:"#ef4444" },
            ].map(s => (
              <div key={s.label} style={{ fontSize:13, fontWeight:600, color:s.color }}>
                {s.label}: <b>{s.count}</b>
              </div>
            ))}
          </div>
          {agingInvoices.slice(0,8).map(inv => (
            <div key={inv.id} style={{ display:"flex", alignItems:"center", gap:10,
              padding:"8px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:13, color:"#6366f1", minWidth:130 }}>{inv.id}</span>
              <span style={{ flex:1, fontSize:13, minWidth:140 }}>{inv.customer}</span>
              <span style={{ fontSize:12, color:"#64748b" }}>{inv.dc} DC</span>
              <Badge status={inv.status} />
              <AgingBadge days={inv.days} />
            </div>
          ))}
        </Card>
      )}

      {/* Today's Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:12 }}>
        <Card>
          <CardTitle>📊 Today's Summary</CardTitle>
          {[
            { icon:"📋", text:`${myInvoices.filter(i=>i.date===new Date().toISOString().split("T")[0]).length} invoices uploaded today` },
            { icon:"✅", text:`${stats.delivered} delivered (${stats.total>0?Math.round(stats.delivered/stats.total*100):0}% rate)` },
            { icon:"🔄", text:`${stats.intransit} in transit` },
            { icon:"⏳", text:`${stats.pending} awaiting assignment` },
            { icon:"🚗", text:`${activeVehicles} vehicles active, ${maintVehicles} in maintenance` },
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:8, padding:"7px 0",
              borderBottom:"1px solid #f1f5f9", fontSize:13, color:"#374151" }}>
              <span>{s.icon}</span><span>{s.text}</span>
            </div>
          ))}
        </Card>
        <Card>
          <CardTitle>🏭 Institution Breakdown</CardTitle>
          {["Government","Private"].map(inst => {
            const n = myInvoices.filter(i=>i.inst===inst).length;
            const d = myInvoices.filter(i=>i.inst===inst&&i.status==="delivered").length;
            return (
              <div key={inst} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
                  <span style={{ fontWeight:600 }}>{inst==="Government"?"🏛️ Government":"🏥 Private"}</span>
                  <span style={{ color:"#64748b" }}>{d}/{n} — {n>0?Math.round(d/n*100):0}%</span>
                </div>
                <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${n>0?Math.round(d/n*100):0}%`, height:"100%",
                    background:inst==="Government"?"#1e40af":"#6d28d9", borderRadius:99 }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ── Alerts Panel ─────────────────────────────────────────────
function AlertsPanel({ alerts, setAlerts, user }) {
  const [dismissing, setDismissing] = useState(null);
  const [dismissForm, setDismissForm] = useState({ reason:"", manualReason:"" });

  const alertTypeIcon = {
    undelivered:"📦", license_expiry:"🪪", fahas:"🔧",
    istimara:"📋", insurance:"🛡️", oil_change:"🔩",
    access_request:"👤", fuel_discrepancy:"⛽"
  };

  function submitDismiss(alt) {
    setAlerts(prev => prev.map(a => a.id===alt.id ? {
      ...a, status:"dismissed",
      dismissedBy: user.name,
      dismissReason: dismissForm.reason,
      manualReason: dismissForm.manualReason,
      dismissedAt: new Date().toLocaleString(),
      adminApproved: user.role==="admin" ? "approved" : "pending"
    } : a));
    setDismissing(null);
    setDismissForm({ reason:"", manualReason:"" });
  }

  return (
    <Card style={{ border:"1px solid #fbbf24", marginBottom:16 }}>
      <CardTitle>⚠️ Active Alerts ({alerts.length})</CardTitle>
      {alerts.map(alt => (
        <div key={alt.id} style={{ border:"1px solid #f1f5f9", borderRadius:8,
          padding:"10px 14px", marginBottom:8,
          borderLeft:`4px solid ${alt.type==="undelivered"?"#ef4444":alt.type.includes("expiry")||alt.type.includes("fahas")||alt.type.includes("istimara")||alt.type.includes("insurance")?"#f59e0b":"#6366f1"}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:6 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>
                {alertTypeIcon[alt.type]||"🔔"} {alt.message}
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                Raised: {alt.raisedAt} ({daysSince(alt.raisedAt.split(" ")[0])} days ago)
                {alt.dc && <span> — {alt.dc} DC</span>}
              </div>
            </div>
            <Btn small onClick={() => setDismissing(alt)} color="#64748b">
              {user.role==="admin" ? "✅ Resolve" : "📋 Action"}
            </Btn>
          </div>
        </div>
      ))}

      {dismissing && (
        <Modal title="Alert Action" onClose={() => setDismissing(null)}>
          <div style={{ fontSize:13, color:"#374151", marginBottom:16, padding:"10px 14px",
            background:"#f8fafc", borderRadius:8 }}>
            {dismissing.message}
          </div>
          <Select label="Reason for Action" value={dismissForm.reason}
            onChange={v => setDismissForm({...dismissForm,reason:v})}
            options={ALERT_DISMISS_REASONS} required />
          {dismissForm.reason === "Other (Manual Reason)" && (
            <Textarea label="Manual Reason" value={dismissForm.manualReason}
              onChange={v => setDismissForm({...dismissForm,manualReason:v})}
              placeholder="Enter reason..." required />
          )}
          {user.role !== "admin" && (
            <div style={{ background:"#fef3c7", padding:"8px 12px", borderRadius:6,
              fontSize:12, color:"#92400e", marginBottom:12 }}>
              ⚠️ Your action will be sent to Admin for final approval.
            </div>
          )}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn onClick={() => setDismissing(null)} color="#64748b">Cancel</Btn>
            <Btn onClick={() => submitDismiss(dismissing)}
              disabled={!dismissForm.reason || (dismissForm.reason==="Other (Manual Reason)"&&!dismissForm.manualReason)}
              color="#10b981">
              ✅ Submit Action
            </Btn>
          </div>
        </Modal>
      )}
    </Card>
  );
}
