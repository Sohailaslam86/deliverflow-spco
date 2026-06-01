import React from "react";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { uploadImage } from "../cloudinaryService.js";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { DEPARTMENTS, RC, RI, genId } from "../data/masterData.js";

const LOCATIONS = ["Distribution Center - Riyadh","Distribution Center - Jeddah","Distribution Center - Dammam","Head Office"];
const LOCATION_TO_DC = { "Distribution Center - Riyadh":"Riyadh","Distribution Center - Jeddah":"Jeddah","Distribution Center - Dammam":"Dammam","Head Office":"Head Office" };
const SPCO_DOMAIN = "@spco.sa";

const ROLE_LABELS = {
  en:{ admin:"System Administrator",planning:"Planning",manager:"DC Manager",driver:"Delivery Driver",viewonly:"View Only" },
  ar:{ admin:"مدير النظام",planning:"التخطيط",manager:"مدير مركز التوزيع",driver:"سائق التسليم",viewonly:"عرض فقط" }
};

const DEFAULT_PERMISSIONS = {
  "Data Entry":{
    "Upload Invoice CSV":{ admin:true,planning:true,manager:false,driver:false,viewonly:false },
    "View All DC Invoices":{ admin:true,planning:true,manager:false,driver:false,viewonly:true },
    "View Own DC Invoices":{ admin:true,planning:true,manager:true,driver:false,viewonly:true },
    "Search Invoice / Customer":{ admin:true,planning:true,manager:true,driver:true,viewonly:true },
    "View Own Assigned Invoices":{ admin:false,planning:false,manager:false,driver:true,viewonly:false },
  },
  "Assignment":{
    "Assign Driver to Invoice":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Assign Vehicle to Invoice":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Select Delivery City":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Select In-City / Out-City":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Select Storage Condition":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Re-assign Failed Invoice":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Schedule Hold on Invoice":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
  },
  "Trip Management":{
    "Create Trip":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Attach Transit Invoices":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Receive Relay Trip + POD":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
  },
  "POD Management":{
    "Upload POD (Own Invoices)":{ admin:false,planning:false,manager:false,driver:true,viewonly:false },
    "Upload POD on Driver Behalf":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "View POD Image":{ admin:true,planning:true,manager:true,driver:true,viewonly:true },
    "Download Single POD":{ admin:true,planning:true,manager:true,driver:false,viewonly:true },
    "Bulk Download POD (All DCs)":{ admin:true,planning:true,manager:false,driver:false,viewonly:false },
    "Bulk Download POD (Own DC)":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
  },
  "Odometer":{
    "Upload Odometer Photo":{ admin:false,planning:false,manager:false,driver:true,viewonly:false },
    "Approve Odometer Readings":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
  },
  "Fleet Management":{
    "Mark Vehicle in Maintenance":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Upload Fuel Fill Record":{ admin:true,planning:false,manager:true,driver:true,viewonly:false },
  },
  "User Management":{
    "Submit User / Driver Request":{ admin:true,planning:true,manager:true,driver:false,viewonly:false },
    "Approve / Reject All Requests":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Reset Any User Password":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
  },
  "Reports Management":{
    "Daily Delivery Status":{ admin:true,planning:true,manager:true,driver:false,viewonly:true },
    "Driver Performance Report":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Vehicle Utilization Report":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Fuel Consumption Report":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Aging Report":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Monthly Closing Report":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
  },
};

const ROLES_ORDER = ["admin","planning","manager","driver","viewonly"];

const T = {
  en:{
    userDir:"User Directory", accessReq:"Access Requests", authMatrix:"Authorization Matrix",
    empType:"Employee Type", systemUser:"🏢 System User", driverType:"🚚 Delivery Driver",
    fullName:"Full Name *", empId:"Employee ID (Optional)",
    mobile:"Mobile Number *", loginId:"Login ID *", location:"Location *", dept:"Department *",
    role:"Authorization Level *", licNo:"License Number *", licExp:"License Expiry *",
    licPic:"License Photo *", driverCard:"Driver Card Number *", driverCardExp:"Driver Card Expiry *",
    driverCardPic:"Driver Card Photo *",
    reason:"Reason / Notes", edit:"Edit", activate:"Activate", deactivate:"Deactivate",
    approve:"✅ Approve", reject:"❌ Reject", noPending:"No pending requests",
    requestedBy:"Requested by", requestSent:"✅ Request submitted!",
    updated:"User updated!", approvedMsg:"User approved! Login credentials issued.",
    rejectedMsg:"Request rejected.", permission:"Permission",
    addRole:"+ Add Level", saveMatrix:"Save Matrix", matrixSaved:"Matrix saved!",
    newRolePlaceholder:"e.g. Supervisor...",
    cancel:"Cancel", save:"Save", submit:"Submit Request",
    uploading:"Uploading photo...", approving:"Creating account...",
    loginIdHint:"Only enter username — @spco.sa will be added automatically",
    newRequest:"+ New Request", pendingRequests:"Pending Requests",
    noRequests:"No requests yet"
  },
  ar:{
    userDir:"دليل المستخدمين", accessReq:"طلبات الوصول", authMatrix:"مصفوفة التفويض",
    empType:"نوع الموظف", systemUser:"🏢 مستخدم النظام", driverType:"🚚 سائق التسليم",
    fullName:"الاسم الكامل *", empId:"رقم الموظف (اختياري)",
    mobile:"رقم الجوال *", loginId:"معرف الدخول *", location:"الموقع *", dept:"القسم *",
    role:"مستوى التفويض *", licNo:"رقم الرخصة *", licExp:"انتهاء الرخصة *",
    licPic:"صورة الرخصة *", driverCard:"رقم بطاقة السائق *", driverCardExp:"انتهاء البطاقة *",
    driverCardPic:"صورة البطاقة *",
    reason:"السبب", edit:"تعديل", activate:"تفعيل", deactivate:"تعطيل",
    approve:"موافقة", reject:"رفض", noPending:"لا توجد طلبات معلقة",
    requestedBy:"طلب بواسطة", requestSent:"✅ تم إرسال الطلب!",
    updated:"تم التحديث", approvedMsg:"تمت الموافقة!", rejectedMsg:"تم الرفض",
    permission:"الصلاحية", addRole:"+ إضافة مستوى", saveMatrix:"حفظ المصفوفة",
    matrixSaved:"تم الحفظ!", newRolePlaceholder:"مثال: مشرف...",
    cancel:"إلغاء", save:"حفظ", submit:"إرسال الطلب",
    uploading:"جاري رفع الصورة...", approving:"جاري إنشاء الحساب...",
    loginIdHint:"أدخل اسم المستخدم فقط — سيضاف @spco.sa تلقائياً",
    newRequest:"+ طلب جديد", pendingRequests:"الطلبات المعلقة",
    noRequests:"لا توجد طلبات بعد"
  }
};

const EMPTY_FORM = {
  empType:"systemuser", name:"", empId:"", mobile:"", loginId:"",
  location:"Head Office", dept:"", role:"viewonly", dc:"Head Office",
  reason:"", licNo:"", licExp:"", licPicFile:null, licPicUrl:"",
  driverCard:"", driverCardExp:"", driverCardPicFile:null, driverCardPicUrl:""
};

export default function Users({ user, users, setUsers, requests, setRequests, lang }) {
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const rl = ROLE_LABELS[lang]||ROLE_LABELS.en;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";
  const isPlanning = user.role==="planning";
  const canSubmit = isAdmin||isManager||isPlanning;

  const adminTabs = [["users","👥",t.userDir],["requests","📝",t.accessReq],["matrix","🔐",t.authMatrix]];
  const managerTabs = [["requests","📝",t.accessReq]];
  const planningTabs = [["requests","📝",t.accessReq]];
  const tabs = isAdmin?adminTabs:isManager?managerTabs:planningTabs;

  const [tab, setTab] = useState(tabs[0][0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [done, setDone] = useState("");
  const [approving, setApproving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editReq, setEditReq] = useState(null);
  const [editReqForm, setEditReqForm] = useState(null);
  const [issuedCredentials, setIssuedCredentials] = useState(null);

  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [roles, setRoles] = useState(ROLES_ORDER);
  const [roleLabels, setRoleLabels] = useState({});
  const [newRoleName, setNewRoleName] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);
  const [editRoleName, setEditRoleName] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState("");

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),5000); }
  function getRoleLabel(r) { return roleLabels[r]||rl[r]||r; }

  function F(key, val) {
    const updated = {...form, [key]:val};
    if (key==="location") {
      updated.dc = LOCATION_TO_DC[val]||"Head Office";
    }
    if (key==="empType" && val==="driver") {
      if (isManager) { updated.location = user.location||"Head Office"; updated.dc = user.dc||""; }
    }
    setForm(updated);
  }

  // Image upload handler
  async function handleImageUpload(file, field) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "drivers");
      setForm(prev => ({...prev, [field]:url}));
      flash("✅ Photo uploaded!");
    } catch(e) {
      flash("❌ Photo upload failed: " + e.message);
    }
    setUploading(false);
  }

  // Submit request
  async function submitRequest() {
    // Validation
    const email = form.loginId.trim().toLowerCase() + SPCO_DOMAIN;
    if (!form.name||!form.mobile||!form.loginId) { flash("❌ Please fill all required fields!"); return; }
    if (form.empType==="driver") {
      if (!form.licNo||!form.licExp||!form.licPicUrl) { flash("❌ License details required!"); return; }
      if (!form.driverCard||!form.driverCardExp||!form.driverCardPicUrl) { flash("❌ Driver card details required!"); return; }
    } else {
      if (!form.dept||!form.role) { flash("❌ Please fill all required fields!"); return; }
    }

    const req = {
      reqId: genId("REQ"),
      empType: form.empType,
      name: form.name,
      empId: form.empId||"",
      mobile: form.mobile,
      email: email,
      loginId: form.loginId.trim().toLowerCase(),
      location: isManager?(user.location||form.location):form.location,
      dc: isManager?(user.dc||form.dc):form.dc,
      dept: form.empType==="driver"?"Logistics":form.dept,
      role: form.empType==="driver"?"driver":form.role,
      reason: form.reason,
      licNo: form.licNo||"",
      licExp: form.licExp||"",
      licPicUrl: form.licPicUrl||"",
      driverCard: form.driverCard||"",
      driverCardExp: form.driverCardExp||"",
      driverCardPicUrl: form.driverCardPicUrl||"",
      requestedBy: user.name,
      requestedByRole: user.role,
      requestedByDC: user.dc||"",
      reqDate: new Date().toLocaleDateString(),
      status: "pending",
    };

    // Save to Firestore
    try { await addDoc(collection(db, "requests"), req); } catch(e) { console.error(e); }
    setRequests(prev=>[...prev, req]);
    flash(t.requestSent);
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  // Approve request — Firebase Auth + Firestore
  async function approveReq(reqId) {
    const req = requests.find(r=>r.reqId===reqId);
    if (!req) return;
    setApproving(true);
    try {
      const defaultPassword = "spco2026";
      const uniqueRef = genId("USR");
      const userCredential = await createUserWithEmailAndPassword(auth, req.email, defaultPassword);
      const newUID = userCredential.user.uid;

      const profileData = {
        name: req.name,
        email: req.email,
        mobile: req.mobile,
        empId: req.empId||"",
        role: req.role,
        dept: req.dept,
        dc: req.dc,
        location: req.location,
        status: "active",
        empType: req.empType,
        uniqueRef,
        approvedBy: user.name,
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        licNo: req.licNo||null,
        licExp: req.licExp||null,
        licPicUrl: req.licPicUrl||null,
        driverCard: req.driverCard||null,
        driverCardExp: req.driverCardExp||null,
        driverCardPicUrl: req.driverCardPicUrl||null,
      };

      await setDoc(doc(db, "users", newUID), profileData);
      setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:"approved",uniqueRef,firebaseUID:newUID,approvedBy:user.name}:r));
      setUsers(prev=>[...prev,{uid:newUID,...profileData}]);
      setIssuedCredentials({ name:req.name, email:req.email, password:defaultPassword, role:getRoleLabel(req.role), dc:req.dc, ref:uniqueRef });
      flash(t.approvedMsg);
    } catch(e) {
      if (e.code==="auth/email-already-in-use") {
        flash("❌ Email already exists!");
      } else {
        flash("❌ Error: "+e.message);
      }
    }
    setApproving(false);
  }

  function rejectReq(reqId) {
    setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:"rejected",rejectedBy:user.name}:r));
    flash(t.rejectedMsg);
  }

  function saveReqEdit() {
    if (!editReqForm) return;
    setRequests(prev=>prev.map(r=>r.reqId===editReq?{...r,...editReqForm}:r));
    flash(t.updated); setEditReq(null); setEditReqForm(null);
  }

  function toggleStatus(uid) { setUsers(prev=>prev.map(u=>u.uid===uid?{...u,status:u.status==="active"?"inactive":"active"}:u)); }

  function togglePerm(cat,perm,role) {
    setPermissions(prev=>({...prev,[cat]:{...prev[cat],[perm]:{...prev[cat][perm],[role]:!prev[cat][perm][role]}}}));
  }

  function addRole() {
    if (!newRoleName.trim()) return;
    const key="custom_"+Date.now();
    setRoles(prev=>[...prev,key]);
    setRoleLabels(prev=>({...prev,[key]:newRoleName.trim()}));
    const updated={...permissions};
    Object.keys(updated).forEach(cat=>Object.keys(updated[cat]).forEach(perm=>{updated[cat][perm][key]=false;}));
    setPermissions(updated);
    setNewRoleName(""); setShowAddRole(false);
    flash("Role added!");
  }

  const visibleRequests = isAdmin ? requests : requests.filter(r=>r.requestedByDC===user.dc||r.requestedBy===user.name);
  const pendingRequests = visibleRequests.filter(r=>r.status==="pending");
  const otherRequests = visibleRequests.filter(r=>r.status!=="pending");

  const isDriverForm = form.empType==="driver";

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}

      {/* ===== CREDENTIALS MODAL ===== */}
      {issuedCredentials&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:"white",borderRadius:16,padding:32,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:48,marginBottom:8 }}>🎉</div>
              <h3 style={{ margin:"0 0 4px",fontWeight:900,color:"#065f46",fontSize:20 }}>Account Created!</h3>
              <p style={{ color:"#64748b",fontSize:13,margin:0 }}>Share credentials with user via WhatsApp</p>
            </div>
            <div style={{ background:"#f0fdf4",border:"2px solid #10b981",borderRadius:12,padding:20,marginBottom:16 }}>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>👤 NAME</div>
                <div style={{ fontWeight:700,fontSize:15 }}>{issuedCredentials.name}</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>📧 LOGIN ID</div>
                <div style={{ fontWeight:700,fontSize:15,color:"#1A3A5C",fontFamily:"monospace",background:"#e0f2fe",padding:"6px 10px",borderRadius:6 }}>{issuedCredentials.email}</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>🔑 PASSWORD</div>
                <div style={{ fontWeight:700,fontSize:22,color:"#7c3aed",fontFamily:"monospace",background:"#f3e8ff",padding:"6px 10px",borderRadius:6,letterSpacing:2 }}>{issuedCredentials.password}</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>🏢 ROLE & DC</div>
                <div style={{ fontWeight:600,fontSize:13 }}>{issuedCredentials.role} — {issuedCredentials.dc}</div>
              </div>
              <div>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>🔖 REFERENCE</div>
                <div style={{ fontWeight:600,fontSize:13,color:"#6366f1" }}>{issuedCredentials.ref}</div>
              </div>
            </div>
            <div style={{ background:"#fef3c7",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#92400e",marginBottom:16 }}>
              ⚠️ Share these credentials with the user. They should change password after first login.
            </div>
            <Btn onClick={()=>setIssuedCredentials(null)} style={{ width:"100%",padding:12 }} color="#1A3A5C">✅ Done — Close</Btn>
          </div>
        </div>
      )}

      <TabBar tabs={tabs} active={tab} onChange={t2=>{setTab(t2);setShowForm(false);}} />

      {/* ===== USER DIRECTORY ===== */}
      {tab==="users"&&isAdmin&&(
        <div>
          {["admin","planning","manager","driver","viewonly",...roles.filter(r=>!ROLES_ORDER.includes(r))].map(role=>{
            const ru=users.filter(u=>u.role===role);
            if (!ru.length) return null;
            return (
              <Card key={role}>
                <CardTitle>{RI[role]||"👤"} {getRoleLabel(role)} ({ru.length})</CardTitle>
                {ru.map(u=>(
                  <div key={u.uid} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap" }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:RC[role]||"#64748b",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:14,flexShrink:0 }}>{u.name?.charAt(0)||"?"}</div>
                    <div style={{ flex:1,minWidth:160 }}>
                      <div style={{ fontWeight:600,fontSize:14 }}>{u.name}</div>
                      <div style={{ fontSize:12,color:"#64748b" }}>{u.email} | {u.mobile}</div>
                      <div style={{ fontSize:11,color:"#94a3b8" }}>{u.location} {u.dept&&"| "+u.dept} {u.uniqueRef&&"| "+u.uniqueRef}</div>
                      {u.licNo&&<div style={{ fontSize:11,color:"#6366f1" }}>📄 Lic: {u.licNo} | Exp: {u.licExp}</div>}
                    </div>
                    <span style={{ fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:u.status==="active"?"#d1fae5":"#fee2e2",color:u.status==="active"?"#065f46":"#991b1b" }}>{u.status||"active"}</span>
                    <Btn small onClick={()=>toggleStatus(u.uid)} color={u.status==="active"?"#ef4444":"#10b981"}>{u.status==="active"?"Deactivate":"Activate"}</Btn>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== ACCESS REQUESTS ===== */}
      {tab==="requests"&&canSubmit&&(
        <div>
          {/* New Request Button */}
          {!showForm&&(
            <div style={{ marginBottom:16 }}>
              <Btn onClick={()=>setShowForm(true)} color="#1A3A5C" style={{ padding:"12px 24px" }}>
                {t.newRequest}
              </Btn>
            </div>
          )}

          {/* ===== REQUEST FORM ===== */}
          {showForm&&(
            <Card style={{ borderTop:"4px solid #1A3A5C",marginBottom:20 }}>
              <CardTitle>📝 New Access Request</CardTitle>

              {/* Employee Type */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block" }}>{t.empType} *</label>
                <div style={{ display:"flex",gap:8 }}>
                  {[["systemuser",t.systemUser],
                    ...(!isPlanning?[["driver",t.driverType]]:[])
                  ].map(([v,l])=>(
                    <button key={v} onClick={()=>F("empType",v)}
                      style={{ flex:1,border:`2px solid ${form.empType===v?"#6366f1":"#e2e8f0"}`,background:form.empType===v?"#eef2ff":"white",borderRadius:8,padding:10,cursor:"pointer",fontSize:13,fontWeight:600,color:form.empType===v?"#4338ca":"#64748b" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>

                {/* Full Name */}
                <div style={{ gridColumn:"1/-1" }}>
                  <Input label={t.fullName} value={form.name} onChange={v=>F("name",v)} />
                </div>

                {/* Login ID */}
                <div style={{ gridColumn:"1/-1",marginBottom:12 }}>
                  <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.loginId}</label>
                  <div style={{ display:"flex",alignItems:"center",gap:0 }}>
                    <input value={form.loginId} onChange={e=>F("loginId",e.target.value.replace(/\s/g,"").toLowerCase())}
                      placeholder="e.g. waleed.alqahtani"
                      style={{ flex:1,border:"1.5px solid #e2e8f0",borderRight:"none",borderRadius:"8px 0 0 8px",padding:"9px 12px",fontSize:14,outline:"none" }} />
                    <div style={{ background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderLeft:"none",borderRadius:"0 8px 8px 0",padding:"9px 12px",fontSize:14,color:"#64748b",fontWeight:600,whiteSpace:"nowrap" }}>
                      @spco.sa
                    </div>
                  </div>
                  <div style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>{t.loginIdHint}</div>
                </div>

                {/* Mobile */}
                <Input label={t.mobile} value={form.mobile} onChange={v=>F("mobile",v)} />

                {/* Employee ID */}
                <Input label={t.empId} value={form.empId} onChange={v=>F("empId",v)} />

                {/* Location */}
                {isManager?(
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>📍 Location</label>
                    <div style={{ background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,color:"#64748b" }}>
                      🔒 {user.location||user.dc}
                    </div>
                  </div>
                ):(
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>📍 {t.location}</label>
                    <select value={form.location} onChange={e=>F("location",e.target.value)}
                      style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                      {LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}

                {/* Driver Fields */}
                {isDriverForm?(
                  <>
                    {/* License Number */}
                    <Input label={t.licNo} value={form.licNo} onChange={v=>F("licNo",v)} />

                    {/* License Expiry */}
                    <div style={{ marginBottom:12 }}>
                      <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.licExp}</label>
                      <input type="date" value={form.licExp} onChange={e=>F("licExp",e.target.value)}
                        style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box" }} />
                    </div>

                    {/* License Photo */}
                    <div style={{ gridColumn:"1/-1",marginBottom:12 }}>
                      <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.licPic}</label>
                      {form.licPicUrl?(
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <img src={form.licPicUrl} alt="License" style={{ width:80,height:60,objectFit:"cover",borderRadius:6,border:"1px solid #e2e8f0" }} />
                          <Btn small onClick={()=>F("licPicUrl","")} color="#ef4444">Remove</Btn>
                        </div>
                      ):(
                        <div>
                          <input type="file" accept="image/*" onChange={e=>handleImageUpload(e.target.files[0],"licPicUrl")}
                            style={{ fontSize:13 }} disabled={uploading} />
                          {uploading&&<div style={{ fontSize:12,color:"#6366f1",marginTop:4 }}>⏳ {t.uploading}</div>}
                        </div>
                      )}
                    </div>

                    {/* Driver Card Number */}
                    <Input label={t.driverCard} value={form.driverCard} onChange={v=>F("driverCard",v)} />

                    {/* Driver Card Expiry */}
                    <div style={{ marginBottom:12 }}>
                      <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.driverCardExp}</label>
                      <input type="date" value={form.driverCardExp} onChange={e=>F("driverCardExp",e.target.value)}
                        style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box" }} />
                    </div>

                    {/* Driver Card Photo */}
                    <div style={{ gridColumn:"1/-1",marginBottom:12 }}>
                      <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.driverCardPic}</label>
                      {form.driverCardPicUrl?(
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <img src={form.driverCardPicUrl} alt="Driver Card" style={{ width:80,height:60,objectFit:"cover",borderRadius:6,border:"1px solid #e2e8f0" }} />
                          <Btn small onClick={()=>F("driverCardPicUrl","")} color="#ef4444">Remove</Btn>
                        </div>
                      ):(
                        <div>
                          <input type="file" accept="image/*" onChange={e=>handleImageUpload(e.target.files[0],"driverCardPicUrl")}
                            style={{ fontSize:13 }} disabled={uploading} />
                          {uploading&&<div style={{ fontSize:12,color:"#6366f1",marginTop:4 }}>⏳ {t.uploading}</div>}
                        </div>
                      )}
                    </div>
                  </>
                ):(
                  <>
                    {/* Department */}
                    <div style={{ marginBottom:12 }}>
                      <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.dept}</label>
                      <select value={form.dept} onChange={e=>F("dept",e.target.value)}
                        style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                        <option value="">Select...</option>
                        {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    {/* Role */}
                    <div style={{ marginBottom:12 }}>
                      <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.role}</label>
                      <select value={form.role} onChange={e=>F("role",e.target.value)}
                        style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                        {(isAdmin?["admin","planning","manager","driver","viewonly"]:["planning","manager","driver","viewonly"]).map(r=>(
                          <option key={r} value={r}>{getRoleLabel(r)}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Reason */}
                <div style={{ gridColumn:"1/-1" }}>
                  <Textarea label={t.reason} value={form.reason} onChange={v=>F("reason",v)} />
                </div>
              </div>

              <div style={{ display:"flex",gap:8 }}>
                <Btn onClick={submitRequest} color="#10b981" style={{ flex:1,padding:12 }} disabled={uploading}>
                  ✅ {t.submit}
                </Btn>
                <Btn onClick={()=>{setShowForm(false);setForm(EMPTY_FORM);}} color="#64748b">{t.cancel}</Btn>
              </div>
            </Card>
          )}

          {/* ===== PENDING REQUESTS ===== */}
          {approving&&(
            <div style={{ background:"#dbeafe",borderRadius:8,padding:"12px 16px",marginBottom:12,fontSize:14,color:"#1e40af",fontWeight:600 }}>
              ⏳ {t.approving}
            </div>
          )}

          <CardTitle>📋 {t.pendingRequests} ({pendingRequests.length})</CardTitle>

          {pendingRequests.length===0&&!showForm&&(
            <Card><div style={{ textAlign:"center",padding:20,color:"#94a3b8" }}>{t.noRequests}</div></Card>
          )}

          {pendingRequests.map(req=>(
            <Card key={req.reqId} style={{ borderLeft:"4px solid #f59e0b" }}>
              {editReq===req.reqId&&editReqForm?(
                <div>
                  <CardTitle>✎ Edit — {req.name}</CardTitle>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
                    <Input label="Full Name" value={editReqForm.name} onChange={v=>setEditReqForm({...editReqForm,name:v})} />
                    <Input label="Mobile" value={editReqForm.mobile} onChange={v=>setEditReqForm({...editReqForm,mobile:v})} />
                    <Input label="Login ID" value={editReqForm.loginId||""} onChange={v=>setEditReqForm({...editReqForm,loginId:v,email:v+SPCO_DOMAIN})} />
                    {req.empType!=="driver"&&(
                      <div style={{ marginBottom:12 }}>
                        <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>Role</label>
                        <select value={editReqForm.role} onChange={e=>setEditReqForm({...editReqForm,role:e.target.value})}
                          style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                          {["admin","planning","manager","driver","viewonly"].map(r=>(
                            <option key={r} value={r}>{getRoleLabel(r)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex",gap:8 }}>
                    <Btn onClick={saveReqEdit} color="#10b981">✅ Save</Btn>
                    <Btn onClick={()=>{setEditReq(null);setEditReqForm(null);}} color="#64748b">{t.cancel}</Btn>
                  </div>
                </div>
              ):(
                <div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700,fontSize:15 }}>{req.name}
                        <span style={{ fontSize:12,color:"#64748b",marginLeft:8 }}>({req.empType==="driver"?"Driver":"System User"})</span>
                      </div>
                      <div style={{ fontSize:13,color:"#1A3A5C",fontWeight:600 }}>📧 {req.email}</div>
                      <div style={{ fontSize:12,color:"#64748b" }}>📱 {req.mobile} | 📍 {req.dc} | {getRoleLabel(req.role)}</div>
                      {req.licNo&&<div style={{ fontSize:12,color:"#6366f1" }}>📄 Lic: {req.licNo} | Exp: {req.licExp}</div>}
                      {req.driverCard&&<div style={{ fontSize:12,color:"#6366f1" }}>🪪 Card: {req.driverCard} | Exp: {req.driverCardExp}</div>}
                      {req.licPicUrl&&<img src={req.licPicUrl} alt="License" style={{ width:60,height:40,objectFit:"cover",borderRadius:4,marginTop:4,marginRight:4 }} />}
                      {req.driverCardPicUrl&&<img src={req.driverCardPicUrl} alt="Card" style={{ width:60,height:40,objectFit:"cover",borderRadius:4,marginTop:4 }} />}
                      <div style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>By: {req.requestedBy} | {req.reqDate} | {req.reqId}</div>
                    </div>
                  </div>
                  {isAdmin&&(
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      <Btn small onClick={()=>{setEditReq(req.reqId);setEditReqForm({name:req.name,mobile:req.mobile,loginId:req.loginId||"",email:req.email,role:req.role});}} color="#6366f1">✎ Edit</Btn>
                      <Btn small onClick={()=>approveReq(req.reqId)} color="#10b981" disabled={approving}>{t.approve}</Btn>
                      <Btn small onClick={()=>rejectReq(req.reqId)} color="#ef4444">{t.reject}</Btn>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}

          {/* Other requests */}
          {otherRequests.length>0&&(
            <div style={{ marginTop:20 }}>
              <CardTitle>📋 Previous Requests</CardTitle>
              {otherRequests.map(req=>(
                <Card key={req.reqId} style={{ borderLeft:`4px solid ${req.status==="approved"?"#10b981":"#ef4444"}` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
                    <div>
                      <div style={{ fontWeight:700,fontSize:14 }}>{req.name}</div>
                      <div style={{ fontSize:12,color:"#64748b" }}>{req.email} | {req.dc} | {getRoleLabel(req.role)}</div>
                      <div style={{ fontSize:11,color:"#94a3b8" }}>{req.reqId} | {req.reqDate}</div>
                      {req.uniqueRef&&<div style={{ fontSize:11,color:"#10b981",fontWeight:700 }}>✅ {req.uniqueRef} | Approved by: {req.approvedBy}</div>}
                    </div>
                    <span style={{ fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99,background:req.status==="approved"?"#d1fae5":"#fee2e2",color:req.status==="approved"?"#065f46":"#991b1b" }}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== AUTHORIZATION MATRIX ===== */}
      {tab==="matrix"&&isAdmin&&(
        <Card>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8 }}>
            <CardTitle style={{ margin:0 }}>🔐 {t.authMatrix}</CardTitle>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {showAddRole?(
                <>
                  <input value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} placeholder={t.newRolePlaceholder}
                    style={{ border:"1.5px solid #6366f1",borderRadius:8,padding:"6px 12px",fontSize:13,outline:"none",minWidth:150 }} />
                  <Btn small onClick={addRole} color="#6366f1">✅ Add</Btn>
                  <Btn small onClick={()=>{setShowAddRole(false);setNewRoleName("");}} color="#64748b">{t.cancel}</Btn>
                </>
              ):(
                <Btn small onClick={()=>setShowAddRole(true)} color="#6366f1">{t.addRole}</Btn>
              )}
              <Btn small onClick={()=>flash(t.matrixSaved)} color="#10b981">💾 {t.saveMatrix}</Btn>
            </div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
              <thead>
                <tr style={{ background:"#1A3A5C" }}>
                  <th style={{ padding:"12px 14px",textAlign:"left",color:"white",fontWeight:700,minWidth:200,position:"sticky",left:0,background:"#1A3A5C" }}>{t.permission}</th>
                  {roles.map(r=>(
                    <th key={r} style={{ padding:"12px 10px",color:"white",fontWeight:700,textAlign:"center",minWidth:110 }}>
                      {editRoleName===r?(
                        <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                          <input value={editRoleValue} onChange={e=>setEditRoleValue(e.target.value)}
                            style={{ border:"none",borderRadius:4,padding:"3px 6px",fontSize:12,width:80 }} />
                          <button onClick={()=>{setRoleLabels(p=>({...p,[r]:editRoleValue}));setEditRoleName(null);}}
                            style={{ background:"#10b981",border:"none",color:"white",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:11 }}>✓</button>
                        </div>
                      ):(
                        <div>
                          <div>{getRoleLabel(r)}</div>
                          <button onClick={()=>{setEditRoleName(r);setEditRoleValue(getRoleLabel(r));}}
                            style={{ background:"rgba(255,255,255,0.2)",border:"none",color:"white",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:10,marginTop:4 }}>✎</button>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissions).map(([category,perms])=>(
                  <React.Fragment key={category}>
                    <tr>
                      <td colSpan={roles.length+1} style={{ padding:"10px 14px",background:"#f0f4ff",fontWeight:700,fontSize:13,color:"#1A3A5C",borderTop:"2px solid #e2e8f0" }}>
                        — {category}
                      </td>
                    </tr>
                    {Object.entries(perms).map(([perm,rolePerms],i)=>(
                      <tr key={perm} style={{ background:i%2===0?"white":"#f8fafc" }}>
                        <td style={{ padding:"10px 14px",color:"#374151",position:"sticky",left:0,background:i%2===0?"white":"#f8fafc",borderBottom:"1px solid #f1f5f9" }}>{perm}</td>
                        {roles.map(r=>(
                          <td key={r} style={{ padding:"10px",textAlign:"center",borderBottom:"1px solid #f1f5f9" }}>
                            <input type="checkbox" checked={rolePerms[r]||false} onChange={()=>togglePerm(category,perm,r)}
                              style={{ width:18,height:18,cursor:"pointer",accentColor:"#1A3A5C" }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
