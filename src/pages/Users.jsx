import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { DEPARTMENTS, RC, RI, genId } from "../data/masterData.js";

const LOCATIONS = ["Distribution Center - Riyadh","Distribution Center - Jeddah","Distribution Center - Dammam","Head Office"];
const LOCATION_TO_DC = { "Distribution Center - Riyadh":"Riyadh","Distribution Center - Jeddah":"Jeddah","Distribution Center - Dammam":"Dammam","Head Office":null };

const ROLE_LABELS = {
  en:{ admin:"System Administrator",planning:"Planning",manager:"Distribution Center Manager",driver:"Delivery Driver",viewonly:"View Only" },
  ar:{ admin:"مدير النظام",planning:"التخطيط",manager:"مدير مركز التوزيع",driver:"سائق التسليم",viewonly:"عرض فقط" }
};

// Default Permission Matrix
const DEFAULT_PERMISSIONS = {
  "Data Entry": {
    "Upload Invoice CSV":           { admin:true,  planning:true,  manager:false, driver:false, viewonly:false },
    "View All DC Invoices":         { admin:true,  planning:true,  manager:false, driver:false, viewonly:true  },
    "View Own DC Invoices":         { admin:true,  planning:true,  manager:true,  driver:false, viewonly:true  },
    "Search Invoice / Customer":    { admin:true,  planning:true,  manager:true,  driver:true,  viewonly:true  },
    "View Own Assigned Invoices":   { admin:false, planning:false, manager:false, driver:true,  viewonly:false },
  },
  "Assignment": {
    "Assign Driver to Invoice":     { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Assign Vehicle to Invoice":    { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Select Delivery City":         { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Select In-City / Out-City":    { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Select Storage Condition":     { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Re-assign Failed Invoice":     { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Schedule Hold on Invoice":     { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
  },
  "Trip Management": {
    "Create Trip":                  { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Attach Transit Invoices":      { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Receive Relay Trip + POD":     { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
  },
  "POD Management": {
    "Upload POD (Own Invoices)":    { admin:false, planning:false, manager:false, driver:true,  viewonly:false },
    "Upload POD on Driver Behalf":  { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "View POD Image":               { admin:true,  planning:true,  manager:true,  driver:true,  viewonly:true  },
    "Download Single POD":          { admin:true,  planning:true,  manager:true,  driver:false, viewonly:true  },
    "Bulk Download POD (All DCs)":  { admin:true,  planning:true,  manager:false, driver:false, viewonly:false },
    "Bulk Download POD (Own DC)":   { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Unlock Wrong Posting (Own DC)":{ admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
  },
  "Odometer": {
    "Upload Odometer Photo":        { admin:false, planning:false, manager:false, driver:true,  viewonly:false },
    "Approve Odometer Readings":    { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
  },
  "Fleet Management": {
    "Acknowledge Vehicle Assignment":{ admin:false,planning:false, manager:false, driver:true,  viewonly:false },
    "Mark Vehicle in Maintenance":  { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Upload Fuel Fill Record":      { admin:true,  planning:false, manager:true,  driver:true,  viewonly:false },
  },
  "User Management": {
    "Add / Edit / Deactivate Users":{ admin:true,  planning:false, manager:false, driver:false, viewonly:false },
    "Submit User / Driver Request": { admin:false, planning:true,  manager:true,  driver:true,  viewonly:true  },
    "Approve / Reject All Requests":{ admin:true,  planning:false, manager:false, driver:false, viewonly:false },
    "Transfer Driver Between DCs":  { admin:true,  planning:false, manager:false, driver:false, viewonly:false },
    "Transfer Vehicle Between DCs": { admin:true,  planning:false, manager:false, driver:false, viewonly:false },
    "Change Own Password":          { admin:true,  planning:true,  manager:true,  driver:true,  viewonly:true  },
  },
  "Master Data": {
    "Manage Vehicles Master File":  { admin:true,  planning:false, manager:false, driver:false, viewonly:false },
    "Manage Driver Profiles":       { admin:true,  planning:false, manager:false, driver:false, viewonly:false },
    "Manage DC Locations + GPS":    { admin:true,  planning:false, manager:false, driver:false, viewonly:false },
    "Manage Storage Conditions":    { admin:true,  planning:false, manager:false, driver:false, viewonly:false },
    "Manage Delivery Cities":       { admin:true,  planning:false, manager:false, driver:false, viewonly:false },
  },
  "Reports Management": {
    "Daily Delivery Status":        { admin:true,  planning:true,  manager:true,  driver:false, viewonly:true  },
    "Driver Performance Report":    { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Vehicle Utilization Report":   { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Fuel Consumption Report":      { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Aging Report":                 { admin:true,  planning:false, manager:true,  driver:false, viewonly:false },
    "Monthly Closing Report":       { admin:true,  planning:false, manager:false, driver:false, viewonly:false },
  },
};

const ROLES_ORDER = ["admin","planning","manager","driver","viewonly"];

const T = {
  en:{
    userDir:"User Directory", accessReq:"Access Requests", newUser:"New User",
    authMatrix:"Authorization Matrix", myRequest:"Submit Request",
    empType:"Employee Type", systemUser:"🏢 System User", driver:"🚚 Delivery Driver",
    fullName:"Full Name", displayName:"Display Name in System", empId:"Employee ID",
    mobile:"Mobile Number", email:"Email Address", location:"Location", dept:"Department",
    role:"Authorization Level", licNo:"License Number", licExp:"License Expiry",
    driverCard:"Driver Card Number", driverCardExp:"Driver Card Expiry",
    reason:"Reason / Notes", edit:"Edit", activate:"Activate", deactivate:"Deactivate",
    save:"Save Changes", create:"Create User", cancel:"Cancel",
    approve:"✅ Approve", reject:"❌ Reject", noPending:"No pending requests",
    requestedBy:"Requested by", requestSent:"Request submitted!",
    defPass:"Default password: spco2026", updated:"User updated!", created:"User created!",
    approvedMsg:"User approved!", rejectedMsg:"Request rejected.",
    permission:"Permission", addRole:"+ Add Authorization Level",
    roleAdded:"New authorization level added!", roleName:"Level Name",
    saveMatrix:"Save Matrix", matrixSaved:"Authorization matrix saved!",
    newRolePlaceholder:"e.g. Supervisor, Auditor..."
  },
  ar:{
    userDir:"دليل المستخدمين", accessReq:"طلبات الوصول", newUser:"مستخدم جديد",
    authMatrix:"مصفوفة التفويض", myRequest:"تقديم طلب",
    empType:"نوع الموظف", systemUser:"🏢 مستخدم النظام", driver:"🚚 سائق التسليم",
    fullName:"الاسم الكامل", displayName:"اسم العرض في النظام", empId:"رقم الموظف",
    mobile:"رقم الجوال", email:"البريد الإلكتروني", location:"الموقع", dept:"القسم",
    role:"مستوى التفويض", licNo:"رقم الرخصة", licExp:"انتهاء الرخصة",
    driverCard:"رقم بطاقة السائق", driverCardExp:"انتهاء بطاقة السائق",
    reason:"السبب", edit:"تعديل", activate:"تفعيل", deactivate:"تعطيل",
    save:"حفظ التغييرات", create:"إنشاء مستخدم", cancel:"إلغاء",
    approve:"موافقة", reject:"رفض", noPending:"لا توجد طلبات معلقة",
    requestedBy:"طلب بواسطة", requestSent:"تم إرسال الطلب!",
    defPass:"كلمة المرور: spco2026", updated:"تم التحديث", created:"تم الإنشاء",
    approvedMsg:"تمت الموافقة", rejectedMsg:"تم الرفض",
    permission:"الصلاحية", addRole:"+ إضافة مستوى تفويض",
    roleAdded:"تمت إضافة المستوى!", roleName:"اسم المستوى",
    saveMatrix:"حفظ المصفوفة", matrixSaved:"تم حفظ مصفوفة التفويض!",
    newRolePlaceholder:"مثال: مشرف، مراجع..."
  }
};

const EMPTY_FORM = { empType:"systemuser",name:"",displayName:"",empId:"",mobile:"",email:"",location:"Head Office",dept:"",role:"viewonly",dc:"",viewDC:"all",reason:"",licNo:"",licExp:"",driverCard:"",driverCardExp:"",status:"Active" };

export default function Users({ user, users, setUsers, requests, setRequests, lang }) {
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const rl = ROLE_LABELS[lang]||ROLE_LABELS.en;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";

  const adminTabs = [["users","👥",t.userDir],["requests","📝",t.accessReq],["add","➕",t.newUser],["matrix","🔐",t.authMatrix]];
  const managerTabs = [["requests","📝",t.accessReq],["add","➕",t.myRequest]];
  const otherTabs = [["add","➕",t.myRequest]];
  const tabs = isAdmin?adminTabs:isManager?managerTabs:otherTabs;

  const [tab, setTab] = useState(tabs[0][0]);
  const [editUser, setEditUser] = useState(null);
  const [editReq, setEditReq] = useState(null);
  const [done, setDone] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [reqEditForm, setReqEditForm] = useState(null);
  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem("deliverflow_permissions");
      return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
    } catch { return DEFAULT_PERMISSIONS; }
  });
  const [roles, setRoles] = useState(() => {
    try {
      const saved = localStorage.getItem("deliverflow_roles");
      return saved ? JSON.parse(saved) : ROLES_ORDER;
    } catch { return ROLES_ORDER; }
  });
  const [roleLabels, setRoleLabels] = useState(() => {
    try {
      const saved = localStorage.getItem("deliverflow_roleLabels");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [editRoleName, setEditRoleName] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),3000); }
  function resetForm() { setForm(EMPTY_FORM); setEditUser(null); }

  function F(key,val) {
    const updated={...form,[key]:val};
    if(key==="location"){const dc=LOCATION_TO_DC[val]||"";updated.dc=dc;updated.viewDC=dc||"all";}
    if(key==="empType"&&val==="driver"&&isManager){updated.dc=user.dc||"";updated.location=user.location||"Head Office";}
    setForm(updated);
  }

  function save() {
    if(!form.name||!form.mobile) return;
    if(isAdmin){
      if(editUser){setUsers(prev=>prev.map(u=>u.uid===editUser.uid?{...u,...form}:u));flash(t.updated);}
      else{setUsers(prev=>[...prev,{uid:"u"+Date.now(),...form,nameAr:form.name,uniqueRef:genId("USR")}]);flash(t.created);}
      setTab("users");
    } else {
      setRequests(prev=>[...prev,{reqId:genId("REQ"),empType:form.empType,name:form.name,displayName:form.displayName,empId:form.empId,mobile:form.mobile,email:form.email,dept:form.dept,role:form.role,location:form.location,dc:form.dc,viewDC:form.viewDC,licNo:form.licNo,licExp:form.licExp,driverCard:form.driverCard,driverCardExp:form.driverCardExp,reason:form.reason,requestedBy:user.name,reqDate:new Date().toLocaleDateString(),status:"pending"}]);
      flash(t.requestSent);
    }
    resetForm();
  }

  function startEdit(u) {
    setEditUser(u);
    setForm({empType:u.empType||"systemuser",name:u.name,displayName:u.displayName||"",empId:u.empId||"",mobile:u.phone||u.mobile||"",email:u.email||"",location:u.location||"Head Office",dept:u.dept||"",role:u.role,dc:u.dc||"",viewDC:u.viewDC||"all",reason:"",licNo:u.licNo||"",licExp:u.licExp||"",driverCard:u.driverCard||"",driverCardExp:u.driverCardExp||"",status:u.status||"Active"});
    setTab("add");
  }

  function toggleStatus(uid) { setUsers(prev=>prev.map(u=>u.uid===uid?{...u,status:u.status==="Active"?"Inactive":"Active"}:u)); }

  function approveReq(reqId,approved) {
    const req=requests.find(r=>r.reqId===reqId);
    if(approved&&req) setUsers(prev=>[...prev,{uid:"u"+Date.now(),name:req.name,displayName:req.displayName||req.name,empId:req.empId,phone:req.mobile,email:req.email,role:req.role,dept:req.dept,location:req.location||"Head Office",dc:req.dc||null,viewDC:req.viewDC||"all",status:"Active",licNo:req.licNo||null,licExp:req.licExp||null,driverCard:req.driverCard||null,driverCardExp:req.driverCardExp||null,uniqueRef:genId("USR")}]);
    setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:approved?"approved":"rejected",adminName:user.name,adminDate:new Date().toLocaleDateString(),uniqueRef:approved?genId("USR"):null}:r));
    flash(approved?t.approvedMsg:t.rejectedMsg);
    setEditReq(null); setReqEditForm(null);
  }

  function saveReqEdit() {
    if(!reqEditForm) return;
    setRequests(prev=>prev.map(r=>r.reqId===editReq?{...r,...reqEditForm}:r));
    flash(t.updated); setEditReq(null); setReqEditForm(null);
  }

  function togglePerm(category,perm,role) {
    setPermissions(prev=>({...prev,[category]:{...prev[category],[perm]:{...prev[category][perm],[role]:!prev[category][perm][role]}}}));
  }

  function addRole() {
    if(!newRoleName.trim()) return;
    const roleKey = "custom_"+Date.now();
    const displayName = newRoleName.trim();
    setRoles(prev=>[...prev,roleKey]);
    setRoleLabels(prev=>({...prev,[roleKey]:displayName}));
    const updated = {...permissions};
    Object.keys(updated).forEach(cat=>{
      Object.keys(updated[cat]).forEach(perm=>{
        updated[cat][perm][roleKey] = false;
      });
    });
    setPermissions(updated);
    setNewRoleName(""); setShowAddRole(false);
    flash(t.roleAdded);
  }

  function renameRole(roleKey, newName) {
    setRoleLabels(prev=>({...prev,[roleKey]:newName}));
    setEditRoleName(null); setEditRoleValue("");
  }

  function deleteRole(roleKey) {
    if (!window.confirm("Delete this authorization level?")) return;
    setRoles(prev=>prev.filter(r=>r!==roleKey));
    setRoleLabels(prev=>{const n={...prev};delete n[roleKey];return n;});
    const updated = {...permissions};
    Object.keys(updated).forEach(cat=>{
      Object.keys(updated[cat]).forEach(perm=>{
        delete updated[cat][perm][roleKey];
      });
    });
    setPermissions(updated);
    flash("Authorization level deleted.");
  }

  const isDriver = form.empType==="driver";

  // Role label helper
  function getRoleLabel(r) { return roleLabels[r]||rl[r]||r.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()); }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={t2=>{setTab(t2);if(t2!=="add")resetForm();}} />

      {/* USER DIRECTORY */}
      {tab==="users"&&isAdmin&&(
        <div>
          {["admin","planning","manager","driver","viewonly",...roles.filter(r=>!["admin","planning","manager","driver","viewonly"].includes(r))].map(role=>{
            const ru=users.filter(u=>u.role===role);
            if(!ru.length) return null;
            return (
              <Card key={role}>
                <CardTitle>{RI[role]||"👤"} {getRoleLabel(role)} ({ru.length})</CardTitle>
                {ru.map(u=>(
                  <div key={u.uid} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap" }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:RC[role]||"#64748b",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:14,flexShrink:0 }}>{u.name.charAt(0)}</div>
                    <div style={{ flex:1,minWidth:160 }}>
                      <div style={{ fontWeight:600,fontSize:14 }}>{u.name} <span style={{ fontSize:12,color:"#94a3b8" }}>({u.displayName||u.name})</span></div>
                      <div style={{ fontSize:12,color:"#64748b" }}>{u.email} | {u.phone||u.mobile}</div>
                      <div style={{ fontSize:11,color:"#94a3b8" }}>{u.location} {u.dept&&"| "+u.dept} {u.uniqueRef&&"| "+u.uniqueRef}</div>
                      {u.licNo&&<div style={{ fontSize:11,color:"#6366f1" }}>📄 Lic: {u.licNo} | Exp: {u.licExp}</div>}
                    </div>
                    <span style={{ fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:u.status==="Active"?"#d1fae5":"#fee2e2",color:u.status==="Active"?"#065f46":"#991b1b" }}>{u.status||"Active"}</span>
                    <div style={{ display:"flex",gap:6 }}>
                      <Btn small onClick={()=>startEdit(u)} color="#6366f1">✎ {t.edit}</Btn>
                      <Btn small onClick={()=>toggleStatus(u.uid)} color={u.status==="Active"?"#ef4444":"#10b981"}>{u.status==="Active"?t.deactivate:t.activate}</Btn>
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {/* ACCESS REQUESTS */}
      {tab==="requests"&&(isAdmin||isManager)&&(
        <div>
          {requests.length===0&&<Card><div style={{ textAlign:"center",padding:20,color:"#94a3b8" }}>{t.noPending}</div></Card>}
          {requests.map(req=>(
            <Card key={req.reqId} style={{ borderLeft:`4px solid ${req.status==="pending"?"#f59e0b":req.status==="approved"?"#10b981":"#ef4444"}` }}>
              {editReq===req.reqId&&reqEditForm?(
                <div>
                  <CardTitle>✎ Edit — {req.name}</CardTitle>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
                    <Input label={t.fullName} value={reqEditForm.name} onChange={v=>setReqEditForm({...reqEditForm,name:v})} />
                    <Input label={t.mobile} value={reqEditForm.mobile} onChange={v=>setReqEditForm({...reqEditForm,mobile:v})} />
                    <Input label={t.email} value={reqEditForm.email} onChange={v=>setReqEditForm({...reqEditForm,email:v})} />
                    <Input label={t.empId} value={reqEditForm.empId||""} onChange={v=>setReqEditForm({...reqEditForm,empId:v})} />
                    <Select label={t.location} value={reqEditForm.location||"Head Office"} onChange={v=>setReqEditForm({...reqEditForm,location:v})} options={LOCATIONS} />
                    <Select label={t.dept} value={reqEditForm.dept||""} onChange={v=>setReqEditForm({...reqEditForm,dept:v})} options={DEPARTMENTS} />
                    <Select label={t.role} value={reqEditForm.role||"viewonly"} onChange={v=>setReqEditForm({...reqEditForm,role:v})}
                      options={roles.map(r=>({value:r,label:getRoleLabel(r)}))} />
                    <div style={{ gridColumn:"1/-1" }}><Textarea label={t.reason} value={reqEditForm.reason||""} onChange={v=>setReqEditForm({...reqEditForm,reason:v})} /></div>
                  </div>
                  <div style={{ display:"flex",gap:8 }}>
                    <Btn onClick={saveReqEdit} color="#10b981">✅ {t.save}</Btn>
                    <Btn onClick={()=>{setEditReq(null);setReqEditForm(null);}} color="#64748b">{t.cancel}</Btn>
                  </div>
                </div>
              ):(
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:15 }}>{req.name} <span style={{ fontSize:12,color:"#64748b" }}>({req.empType==="driver"?"Delivery Driver":"System User"})</span></div>
                    <div style={{ fontSize:13,color:"#64748b",marginTop:2 }}>{req.dept} | {getRoleLabel(req.role)} | {req.mobile}</div>
                    {req.location&&<div style={{ fontSize:12,color:"#64748b" }}>📍 {req.location}</div>}
                    <div style={{ fontSize:13,color:"#374151",marginTop:4 }}>📝 {req.reason}</div>
                    <div style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>{t.requestedBy}: {req.requestedBy} | {req.reqDate} | {req.reqId}</div>
                    {req.uniqueRef&&<div style={{ fontSize:11,color:"#6366f1",fontWeight:600 }}>Ref: {req.uniqueRef}</div>}
                  </div>
                  <div>
                    <span style={{ fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99,background:req.status==="pending"?"#fef3c7":req.status==="approved"?"#d1fae5":"#fee2e2",color:req.status==="pending"?"#92400e":req.status==="approved"?"#065f46":"#991b1b" }}>{req.status.toUpperCase()}</span>
                    {isAdmin&&(
                      <div style={{ display:"flex",gap:6,marginTop:8,flexWrap:"wrap" }}>
                        <Btn small onClick={()=>{setEditReq(req.reqId);setReqEditForm({name:req.name,mobile:req.mobile,email:req.email||"",empId:req.empId||"",dept:req.dept||"",role:req.role||"viewonly",location:req.location||"Head Office",reason:req.reason||""});}} color="#6366f1">✎ {t.edit}</Btn>
                        {req.status==="pending"&&<>
                          <Btn small onClick={()=>approveReq(req.reqId,true)} color="#10b981">{t.approve}</Btn>
                          <Btn small onClick={()=>approveReq(req.reqId,false)} color="#ef4444">{t.reject}</Btn>
                        </>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ADD / EDIT */}
      {tab==="add"&&(
        <Card>
          <CardTitle>{editUser?t.edit+" "+editUser.name:isAdmin?t.newUser:t.myRequest}</CardTitle>
          {isAdmin&&(
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block" }}>{t.empType} *</label>
              <div style={{ display:"flex",gap:8 }}>
                {[["systemuser",t.systemUser],["driver",t.driver]].map(([v,l])=>(
                  <button key={v} onClick={()=>F("empType",v)}
                    style={{ flex:1,border:`2px solid ${form.empType===v?"#6366f1":"#e2e8f0"}`,background:form.empType===v?"#eef2ff":"white",borderRadius:8,padding:10,cursor:"pointer",fontSize:13,fontWeight:600,color:form.empType===v?"#4338ca":"#64748b" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
            <div style={{ gridColumn:"1/-1" }}><Input label={t.fullName+" *"} value={form.name} onChange={v=>F("name",v)} required /></div>
            {!isDriver&&<div style={{ gridColumn:"1/-1" }}><Input label={t.displayName} value={form.displayName} onChange={v=>F("displayName",v)} /></div>}
            <Input label={t.empId} value={form.empId} onChange={v=>F("empId",v)} placeholder="EMP-XXX" />
            <Input label={t.mobile+" *"} value={form.mobile} onChange={v=>F("mobile",v)} required />
            <div style={{ gridColumn:"1/-1" }}><Input label={t.email} value={form.email} onChange={v=>F("email",v)} type="email" /></div>
            <Select label={t.location} value={form.location} onChange={v=>F("location",v)} options={LOCATIONS} />
            <Select label={t.dept} value={form.dept} onChange={v=>F("dept",v)} options={DEPARTMENTS} />
            {isDriver?(
              <>
                <Input label={t.licNo+" *"} value={form.licNo} onChange={v=>F("licNo",v)} required />
                <Input label={t.licExp+" *"} value={form.licExp} onChange={v=>F("licExp",v)} type="date" required />
                <Input label={t.driverCard} value={form.driverCard} onChange={v=>F("driverCard",v)} />
                <Input label={t.driverCardExp} value={form.driverCardExp} onChange={v=>F("driverCardExp",v)} type="date" />
                <div style={{ gridColumn:"1/-1",background:"#f0f9ff",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#0369a1" }}>🏢 DC: <b>{form.dc||(isManager?user.dc:"Not set")}</b></div>
              </>
            ):(
              isAdmin&&<Select label={t.role} value={form.role} onChange={v=>F("role",v)} options={roles.map(r=>({value:r,label:getRoleLabel(r)}))} />
            )}
            <div style={{ gridColumn:"1/-1" }}><Textarea label={t.reason} value={form.reason} onChange={v=>F("reason",v)} /></div>
          </div>
          {isAdmin&&<div style={{ background:"#f0f9ff",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#0369a1",marginBottom:16 }}>🔑 {t.defPass}</div>}
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={save} color="#10b981" style={{ flex:1,padding:12 }}>✅ {editUser?t.save:isAdmin?t.create:t.myRequest}</Btn>
            {editUser&&<Btn onClick={resetForm} color="#64748b">{t.cancel}</Btn>}
          </div>
        </Card>
      )}

      {/* AUTHORIZATION MATRIX */}
      {tab==="matrix"&&isAdmin&&(
        <div>
          <Card>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8 }}>
              <CardTitle style={{ margin:0 }}>🔐 {t.authMatrix}</CardTitle>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {showAddRole?(
                  <>
                    <input value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} placeholder={t.newRolePlaceholder}
                      style={{ border:"1.5px solid #6366f1",borderRadius:8,padding:"6px 12px",fontSize:13,outline:"none",minWidth:180 }} />
                    <Btn small onClick={addRole} color="#6366f1">✅ Add</Btn>
                    <Btn small onClick={()=>{setShowAddRole(false);setNewRoleName("");}} color="#64748b">{t.cancel}</Btn>
                  </>
                ):(
                  <Btn small onClick={()=>setShowAddRole(true)} color="#6366f1">{t.addRole}</Btn>
                )}
                <Btn small onClick={()=>{
                  try {
                    localStorage.setItem("deliverflow_permissions", JSON.stringify(permissions));
                    localStorage.setItem("deliverflow_roles", JSON.stringify(roles));
                    localStorage.setItem("deliverflow_roleLabels", JSON.stringify(roleLabels));
                  } catch(e) {}
                  flash(t.matrixSaved);
                }} color="#10b981">💾 {t.saveMatrix}</Btn>
              </div>
            </div>

            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#1A3A5C" }}>
                    <th style={{ padding:"12px 14px", textAlign:"left", color:"white", fontWeight:700, minWidth:200, position:"sticky", left:0, background:"#1A3A5C" }}>{t.permission}</th>
                    {roles.map(r=>(
                      <th key={r} style={{ padding:"12px 10px", color:"white", fontWeight:700, textAlign:"center", minWidth:120, whiteSpace:"nowrap" }}>
                        {editRoleName===r ? (
                          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                            <input value={editRoleValue} onChange={e=>setEditRoleValue(e.target.value)}
                              style={{ border:"none", borderRadius:4, padding:"3px 6px", fontSize:12, width:80 }}
                              onKeyDown={e=>e.key==="Enter"&&renameRole(r,editRoleValue)} />
                            <button onClick={()=>renameRole(r,editRoleValue)} style={{ background:"#10b981", border:"none", color:"white", borderRadius:4, padding:"2px 6px", cursor:"pointer", fontSize:11 }}>✓</button>
                            <button onClick={()=>setEditRoleName(null)} style={{ background:"#64748b", border:"none", color:"white", borderRadius:4, padding:"2px 6px", cursor:"pointer", fontSize:11 }}>✕</button>
                          </div>
                        ) : (
                          <div>
                            <div>{getRoleLabel(r)}</div>
                            <div style={{ display:"flex", gap:4, justifyContent:"center", marginTop:4 }}>
                              <button onClick={()=>{setEditRoleName(r);setEditRoleValue(getRoleLabel(r));}}
                                style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"white", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:10 }}>✎</button>
                              {!ROLES_ORDER.includes(r) && (
                                <button onClick={()=>deleteRole(r)}
                                  style={{ background:"rgba(239,68,68,0.6)", border:"none", color:"white", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:10 }}>🗑</button>
                              )}
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissions).map(([category, perms])=>(
                    <>
                      <tr key={"cat-"+category}>
                        <td colSpan={roles.length+1} style={{ padding:"10px 14px", background:"#f0f4ff", fontWeight:700, fontSize:13, color:"#1A3A5C", borderTop:"2px solid #e2e8f0" }}>
                          — {category}
                        </td>
                      </tr>
                      {Object.entries(perms).map(([perm,rolePerms],i)=>(
                        <tr key={perm} style={{ background:i%2===0?"white":"#f8fafc" }}>
                          <td style={{ padding:"10px 14px", color:"#374151", position:"sticky", left:0, background:i%2===0?"white":"#f8fafc", borderBottom:"1px solid #f1f5f9" }}>{perm}</td>
                          {roles.map(r=>(
                            <td key={r} style={{ padding:"10px", textAlign:"center", borderBottom:"1px solid #f1f5f9" }}>
                              <input type="checkbox" checked={rolePerms[r]||false} onChange={()=>togglePerm(category,perm,r)}
                                style={{ width:18, height:18, cursor:"pointer", accentColor:"#1A3A5C" }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
