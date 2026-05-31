import React from "react";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, addDoc, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { DEPARTMENTS, RC, RI, genId } from "../data/masterData.js";

const LOCATIONS = ["Distribution Center - Riyadh","Distribution Center - Jeddah","Distribution Center - Dammam","Head Office"];
const LOCATION_TO_DC = { "Distribution Center - Riyadh":"Riyadh","Distribution Center - Jeddah":"Jeddah","Distribution Center - Dammam":"Dammam","Head Office":null };

const ROLE_LABELS = {
  en:{ admin:"System Administrator",planning:"Planning",manager:"Distribution Center Manager",driver:"Delivery Driver",viewonly:"View Only" },
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
    "Unlock Wrong Posting (Own DC)":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
  },
  "Odometer":{
    "Upload Odometer Photo":{ admin:false,planning:false,manager:false,driver:true,viewonly:false },
    "Approve Odometer Readings":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
  },
  "Fleet Management":{
    "Acknowledge Vehicle Assignment":{ admin:false,planning:false,manager:false,driver:true,viewonly:false },
    "Mark Vehicle in Maintenance":{ admin:true,planning:false,manager:true,driver:false,viewonly:false },
    "Upload Fuel Fill Record":{ admin:true,planning:false,manager:true,driver:true,viewonly:false },
  },
  "User Management":{
    "Add / Edit / Deactivate Users":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Submit User / Driver Request":{ admin:false,planning:true,manager:true,driver:true,viewonly:true },
    "Approve / Reject All Requests":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Transfer Driver Between DCs":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Transfer Vehicle Between DCs":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Change Own Password":{ admin:true,planning:true,manager:true,driver:true,viewonly:true },
    "Reset Any User Password":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
  },
  "Master Data":{
    "Manage Vehicles Master File":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Manage Driver Profiles":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Manage DC Locations + GPS":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Manage Storage Conditions":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
    "Manage Delivery Cities":{ admin:true,planning:false,manager:false,driver:false,viewonly:false },
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
    userDir:"User Directory", accessReq:"Access Requests", newUser:"New User",
    authMatrix:"Authorization Matrix", myRequest:"Submit Request",
    empType:"Employee Type", systemUser:"🏢 System User", driverType:"🚚 Delivery Driver",
    fullName:"Full Name", displayName:"Display Name in System", empId:"Employee ID",
    mobile:"Mobile Number", email:"Email Address", location:"Location", dept:"Department",
    role:"Authorization Level", licNo:"License Number", licExp:"License Expiry",
    driverCard:"Driver Card Number", driverCardExp:"Driver Card Expiry",
    reason:"Reason / Notes", edit:"Edit", activate:"Activate", deactivate:"Deactivate",
    save:"Save Changes", create:"Create User", cancel:"Cancel",
    approve:"✅ Approve", reject:"❌ Reject", noPending:"No pending requests",
    requestedBy:"Requested by", requestSent:"Request submitted!",
    defPass:"Default password: spco2026", updated:"User updated!", created:"User created!",
    approvedMsg:"User approved! Login ID & Password issued.", rejectedMsg:"Request rejected.",
    permission:"Permission", addRole:"+ Add Authorization Level",
    roleAdded:"New level added!", roleName:"Level Name",
    saveMatrix:"Save Matrix", matrixSaved:"Authorization matrix saved!",
    newRolePlaceholder:"e.g. Supervisor, Auditor...",
    changePass:"Change Password", resetPass:"Reset Password",
    newPass:"New Password", confirmPass:"Confirm Password",
    passMismatch:"Passwords do not match", passChanged:"Password changed!",
    passReset:"Password reset to: spco2026",
    suggestRole:"Suggested Role", pending:"Pending", myDCOnly:"My DC drivers only",
    loginIssued:"Login ID & Password Issued", approving:"Approving..."
  },
  ar:{
    userDir:"دليل المستخدمين", accessReq:"طلبات الوصول", newUser:"مستخدم جديد",
    authMatrix:"مصفوفة التفويض", myRequest:"تقديم طلب",
    empType:"نوع الموظف", systemUser:"🏢 مستخدم النظام", driverType:"🚚 سائق التسليم",
    fullName:"الاسم الكامل", displayName:"اسم العرض في النظام", empId:"رقم الموظف",
    mobile:"رقم الجوال", email:"البريد الإلكتروني", location:"الموقع", dept:"القسم",
    role:"مستوى التفويض", licNo:"رقم الرخصة", licExp:"انتهاء الرخصة",
    driverCard:"رقم بطاقة السائق", driverCardExp:"انتهاء بطاقة السائق",
    reason:"السبب", edit:"تعديل", activate:"تفعيل", deactivate:"تعطيل",
    save:"حفظ التغييرات", create:"إنشاء مستخدم", cancel:"إلغاء",
    approve:"موافقة", reject:"رفض", noPending:"لا توجد طلبات معلقة",
    requestedBy:"طلب بواسطة", requestSent:"تم إرسال الطلب!",
    defPass:"كلمة المرور: spco2026", updated:"تم التحديث", created:"تم الإنشاء",
    approvedMsg:"تمت الموافقة! تم إصدار بيانات الدخول.", rejectedMsg:"تم الرفض",
    permission:"الصلاحية", addRole:"+ إضافة مستوى تفويض",
    roleAdded:"تمت الإضافة!", roleName:"اسم المستوى",
    saveMatrix:"حفظ المصفوفة", matrixSaved:"تم حفظ مصفوفة التفويض!",
    newRolePlaceholder:"مثال: مشرف، مراجع...",
    changePass:"تغيير كلمة المرور", resetPass:"إعادة تعيين كلمة المرور",
    newPass:"كلمة المرور الجديدة", confirmPass:"تأكيد كلمة المرور",
    passMismatch:"كلمتا المرور غير متطابقتان", passChanged:"تم تغيير كلمة المرور!",
    passReset:"تم إعادة التعيين إلى: spco2026",
    suggestRole:"الدور المقترح", pending:"معلق", myDCOnly:"سائقو مركزي فقط",
    loginIssued:"تم إصدار بيانات الدخول", approving:"جاري الموافقة..."
  }
};

const EMPTY_FORM = { empType:"systemuser",name:"",displayName:"",empId:"",mobile:"",email:"",location:"Head Office",dept:"",role:"viewonly",dc:"",viewDC:"all",reason:"",licNo:"",licExp:"",driverCard:"",driverCardExp:"",status:"Active" };

export default function Users({ user, users, setUsers, requests, setRequests, lang }) {
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const rl = ROLE_LABELS[lang]||ROLE_LABELS.en;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";
  const isDriver = user.role==="driver";

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
  const [passModal, setPassModal] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [approving, setApproving] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState(null);

  const [permissions, setPermissions] = useState(() => {
    try { const s=localStorage.getItem("df_perms"); return s?JSON.parse(s):DEFAULT_PERMISSIONS; } catch { return DEFAULT_PERMISSIONS; }
  });
  const [roles, setRoles] = useState(() => {
    try { const s=localStorage.getItem("df_roles"); return s?JSON.parse(s):ROLES_ORDER; } catch { return ROLES_ORDER; }
  });
  const [roleLabels, setRoleLabels] = useState(() => {
    try { const s=localStorage.getItem("df_roleLabels"); return s?JSON.parse(s):{};} catch { return {}; }
  });
  const [editRoleName, setEditRoleName] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),5000); }
  function resetForm() { setForm(EMPTY_FORM); setEditUser(null); }
  function getRoleLabel(r) { return roleLabels[r]||rl[r]||r.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()); }

  function F(key,val) {
    const updated={...form,[key]:val};
    if (key==="location") {
      const dc=LOCATION_TO_DC[val]||"";
      updated.dc=dc; updated.viewDC=dc||"all";
    }
    if (key==="empType"&&val==="driver") {
      updated.dept="Logistics";
      if (isManager) { updated.dc=user.dc||""; updated.location=user.location||"Head Office"; }
    }
    setForm(updated);
  }

  function getLockedFields() {
    if (isAdmin) return {};
    if (isManager) return { location:user.location||"Head Office", dc:user.dc||"" };
    return { location:user.location||"Head Office", dc:user.dc||"" };
  }
  const locked = getLockedFields();

  function save() {
    if (!form.name||!form.mobile) return;
    if (isAdmin) {
      if (editUser) {
        setUsers(prev=>prev.map(u=>u.uid===editUser.uid?{...u,...form}:u));
        flash(t.updated);
      } else {
        setUsers(prev=>[...prev,{uid:"u"+Date.now(),...form,nameAr:form.name,uniqueRef:genId("USR"),password:"spco2026"}]);
        flash(t.created);
      }
      setTab("users");
    } else {
      const req = {
        reqId:genId("REQ"), empType:form.empType, name:form.name,
        displayName:form.displayName, empId:form.empId, mobile:form.mobile,
        email:form.email, dept:form.empType==="driver"?"Logistics":form.dept,
        role:form.role, location:locked.location||form.location,
        dc:locked.dc||form.dc, viewDC:form.viewDC,
        licNo:form.licNo, licExp:form.licExp,
        driverCard:form.driverCard, driverCardExp:form.driverCardExp,
        reason:form.reason, requestedBy:user.name,
        reqDate:new Date().toLocaleDateString(), status:"pending",
        submitterRole:user.role, submitterDC:user.dc||null
      };
      // Save to Firestore
      addDoc(collection(db, "requests"), req).catch(e=>console.error(e));
      setRequests(prev=>[...prev,req]);
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

  // ===== MAIN APPROVE FUNCTION — Firebase Auth + Firestore =====
  async function approveReq(reqId, approved) {
    const req = requests.find(r=>r.reqId===reqId);
    if (!approved || !req) {
      setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:"rejected",adminName:user.name,adminDate:new Date().toLocaleDateString()}:r));
      flash(t.rejectedMsg);
      return;
    }

    // Email check
    if (!req.email) {
      flash("❌ Email required to approve! Please edit request and add email first.");
      return;
    }

    setApproving(true);

    try {
      const defaultPassword = "spco2026";
      const uniqueRef = genId("USR");

      // Step 1 — Firebase Auth mein user banao
      const userCredential = await createUserWithEmailAndPassword(auth, req.email.trim().toLowerCase(), defaultPassword);
      const newUID = userCredential.user.uid;

      // Step 2 — Firestore users collection mein profile banao
      const profileData = {
        name: req.name,
        displayName: req.displayName || req.name,
        email: req.email.trim().toLowerCase(),
        mobile: req.mobile,
        empId: req.empId || "",
        role: req.role || "viewonly",
        dept: req.dept || "Logistics",
        dc: req.dc || "",
        location: req.location || "Head Office",
        status: "active",
        empType: req.empType || "systemuser",
        uniqueRef,
        approvedBy: user.name,
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        // Driver specific fields
        licNo: req.licNo || null,
        licExp: req.licExp || null,
        driverCard: req.driverCard || null,
        driverCardExp: req.driverCardExp || null,
      };
      await setDoc(doc(db, "users", newUID), profileData);

      // Step 3 — Request status update karo
      setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:"approved",adminName:user.name,adminDate:new Date().toLocaleDateString(),uniqueRef,firebaseUID:newUID}:r));

      // Step 4 — Local users state update karo
      setUsers(prev=>[...prev,{uid:newUID,...profileData,password:defaultPassword}]);

      // Step 5 — Credentials dikhao
      setIssuedCredentials({
        name: req.name,
        email: req.email,
        password: defaultPassword,
        role: getRoleLabel(req.role),
        dc: req.dc || "Head Office",
        ref: uniqueRef
      });

      flash(t.approvedMsg);
    } catch(e) {
      if (e.code === "auth/email-already-in-use") {
        flash("❌ Email already exists in Firebase! This user may already have an account.");
      } else {
        flash("❌ Error: " + e.message);
      }
    }
    setApproving(false);
    setEditReq(null);
    setReqEditForm(null);
  }

  function saveReqEdit() {
    if (!reqEditForm) return;
    setRequests(prev=>prev.map(r=>r.reqId===editReq?{...r,...reqEditForm}:r));
    flash(t.updated); setEditReq(null); setReqEditForm(null);
  }

  function handlePassword() {
    if (!passModal) return;
    if (passModal.mode==="reset") {
      setUsers(prev=>prev.map(u=>u.uid===passModal.uid?{...u,password:"spco2026"}:u));
      flash(t.passReset); setPassModal(null);
    } else {
      if (newPass!==confirmPass) { flash(t.passMismatch); return; }
      if (newPass.length<6) { flash("Password must be at least 6 characters"); return; }
      setUsers(prev=>prev.map(u=>u.uid===passModal.uid?{...u,password:newPass}:u));
      flash(t.passChanged); setPassModal(null); setNewPass(""); setConfirmPass("");
    }
  }

  function togglePerm(category,perm,role) {
    setPermissions(prev=>({...prev,[category]:{...prev[category],[perm]:{...prev[category][perm],[role]:!prev[category][perm][role]}}}));
  }

  function addRole() {
    if (!newRoleName.trim()) return;
    const roleKey = "custom_"+Date.now();
    setRoles(prev=>[...prev,roleKey]);
    setRoleLabels(prev=>({...prev,[roleKey]:newRoleName.trim()}));
    const updated={...permissions};
    Object.keys(updated).forEach(cat=>Object.keys(updated[cat]).forEach(perm=>{ updated[cat][perm][roleKey]=false; }));
    setPermissions(updated);
    setNewRoleName(""); setShowAddRole(false);
    flash(t.roleAdded);
  }

  function renameRole(roleKey,newName) {
    setRoleLabels(prev=>({...prev,[roleKey]:newName}));
    setEditRoleName(null); setEditRoleValue("");
  }

  function deleteRole(roleKey) {
    if (!window.confirm("Delete this authorization level?")) return;
    setRoles(prev=>prev.filter(r=>r!==roleKey));
    setRoleLabels(prev=>{const n={...prev};delete n[roleKey];return n;});
    const updated={...permissions};
    Object.keys(updated).forEach(cat=>Object.keys(updated[cat]).forEach(perm=>{ delete updated[cat][perm][roleKey]; }));
    setPermissions(updated);
    flash("Authorization level deleted.");
  }

  function saveMatrix() {
    try {
      localStorage.setItem("df_perms",JSON.stringify(permissions));
      localStorage.setItem("df_roles",JSON.stringify(roles));
      localStorage.setItem("df_roleLabels",JSON.stringify(roleLabels));
    } catch(e) {}
    flash(t.matrixSaved);
  }

  const isDriverForm = form.empType==="driver";
  const visibleRequests = isAdmin
    ? requests
    : requests.filter(r=>r.empType==="driver"&&r.submitterDC===user.dc||r.requestedBy===user.name);

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}

      {/* ===== ISSUED CREDENTIALS MODAL ===== */}
      {issuedCredentials&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:"white",borderRadius:16,padding:32,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:48,marginBottom:8 }}>🎉</div>
              <h3 style={{ margin:"0 0 4px",fontWeight:900,color:"#065f46",fontSize:20 }}>User Approved!</h3>
              <p style={{ color:"#64748b",fontSize:13,margin:0 }}>Login credentials issued — share with user</p>
            </div>
            <div style={{ background:"#f0fdf4",border:"2px solid #10b981",borderRadius:12,padding:20,marginBottom:20 }}>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>👤 NAME</div>
                <div style={{ fontWeight:700,fontSize:15,color:"#0f172a" }}>{issuedCredentials.name}</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>📧 LOGIN ID (EMAIL)</div>
                <div style={{ fontWeight:700,fontSize:15,color:"#1A3A5C",fontFamily:"monospace",background:"#e0f2fe",padding:"6px 10px",borderRadius:6 }}>{issuedCredentials.email}</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>🔑 DEFAULT PASSWORD</div>
                <div style={{ fontWeight:700,fontSize:20,color:"#7c3aed",fontFamily:"monospace",background:"#f3e8ff",padding:"6px 10px",borderRadius:6,letterSpacing:2 }}>{issuedCredentials.password}</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>🏢 ROLE & DC</div>
                <div style={{ fontWeight:600,fontSize:13,color:"#374151" }}>{issuedCredentials.role} — {issuedCredentials.dc}</div>
              </div>
              <div>
                <div style={{ fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2 }}>🔖 REFERENCE</div>
                <div style={{ fontWeight:600,fontSize:13,color:"#6366f1" }}>{issuedCredentials.ref}</div>
              </div>
            </div>
            <div style={{ background:"#fef3c7",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#92400e",marginBottom:16 }}>
              ⚠️ Please share these credentials with the user. They can change their password after first login.
            </div>
            <Btn onClick={()=>setIssuedCredentials(null)} style={{ width:"100%",padding:12 }} color="#1A3A5C">
              ✅ Done — Close
            </Btn>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passModal&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:"white",borderRadius:12,padding:28,width:"100%",maxWidth:380,boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin:"0 0 16px",fontWeight:800,color:"#0f172a" }}>
              {passModal.mode==="reset"?t.resetPass:t.changePass} — {passModal.name}
            </h3>
            {passModal.mode==="reset"?(
              <div style={{ background:"#fef3c7",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#92400e",marginBottom:16 }}>
                ⚠️ This will reset password to: <b>spco2026</b>
              </div>
            ):(
              <>
                <Input label={t.newPass} value={newPass} onChange={setNewPass} type="password" placeholder="Min 6 characters" />
                <Input label={t.confirmPass} value={confirmPass} onChange={setConfirmPass} type="password" placeholder="Repeat password" />
              </>
            )}
            <div style={{ display:"flex",gap:8 }}>
              <Btn onClick={handlePassword} color="#10b981" style={{ flex:1 }}>✅ {passModal.mode==="reset"?t.resetPass:t.save}</Btn>
              <Btn onClick={()=>{setPassModal(null);setNewPass("");setConfirmPass("");}} color="#64748b">{t.cancel}</Btn>
            </div>
          </div>
        </div>
      )}

      <TabBar tabs={tabs} active={tab} onChange={t2=>{setTab(t2);if(t2!=="add")resetForm();}} />

      {/* USER DIRECTORY */}
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
                    <div style={{ width:36,height:36,borderRadius:"50%",background:RC[role]||"#64748b",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:14,flexShrink:0 }}>{u.name.charAt(0)}</div>
                    <div style={{ flex:1,minWidth:160 }}>
                      <div style={{ fontWeight:600,fontSize:14 }}>{u.name} <span style={{ fontSize:12,color:"#94a3b8" }}>({u.displayName||u.name})</span></div>
                      <div style={{ fontSize:12,color:"#64748b" }}>{u.email} | {u.phone||u.mobile}</div>
                      <div style={{ fontSize:11,color:"#94a3b8" }}>{u.location} {u.dept&&"| "+u.dept} {u.uniqueRef&&"| "+u.uniqueRef}</div>
                      {u.licNo&&<div style={{ fontSize:11,color:"#6366f1" }}>📄 Lic: {u.licNo} | Exp: {u.licExp}</div>}
                    </div>
                    <span style={{ fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:u.status==="Active"||u.status==="active"?"#d1fae5":"#fee2e2",color:u.status==="Active"||u.status==="active"?"#065f46":"#991b1b" }}>{u.status||"Active"}</span>
                    <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                      <Btn small onClick={()=>startEdit(u)} color="#6366f1">✎ {t.edit}</Btn>
                      <Btn small onClick={()=>setPassModal({uid:u.uid,name:u.name,mode:"reset"})} color="#f59e0b">🔑</Btn>
                      <Btn small onClick={()=>toggleStatus(u.uid)} color={u.status==="Active"||u.status==="active"?"#ef4444":"#10b981"}>{u.status==="Active"||u.status==="active"?t.deactivate:t.activate}</Btn>
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
          {approving&&(
            <div style={{ background:"#dbeafe",borderRadius:8,padding:"12px 16px",marginBottom:12,fontSize:14,color:"#1e40af",fontWeight:600 }}>
              ⏳ {t.approving} Creating Firebase account...
            </div>
          )}
          {visibleRequests.length===0&&<Card><div style={{ textAlign:"center",padding:20,color:"#94a3b8" }}>{t.noPending}</div></Card>}
          {visibleRequests.map(req=>(
            <Card key={req.reqId} style={{ borderLeft:`4px solid ${req.status==="pending"?"#f59e0b":req.status==="approved"?"#10b981":"#ef4444"}` }}>
              {editReq===req.reqId&&reqEditForm?(
                <div>
                  <CardTitle>✎ Edit — {req.name}</CardTitle>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
                    <Input label={t.fullName} value={reqEditForm.name} onChange={v=>setReqEditForm({...reqEditForm,name:v})} />
                    <Input label={t.mobile} value={reqEditForm.mobile} onChange={v=>setReqEditForm({...reqEditForm,mobile:v})} />
                    <Input label={t.email+" *"} value={reqEditForm.email} onChange={v=>setReqEditForm({...reqEditForm,email:v})} />
                    <Input label={t.empId} value={reqEditForm.empId||""} onChange={v=>setReqEditForm({...reqEditForm,empId:v})} />
                    <Select label={t.location} value={reqEditForm.location||"Head Office"} onChange={v=>setReqEditForm({...reqEditForm,location:v})} options={LOCATIONS} />
                    <Select label={t.dept} value={reqEditForm.dept||""} onChange={v=>setReqEditForm({...reqEditForm,dept:v})} options={DEPARTMENTS} />
                    <Select label={t.role} value={reqEditForm.role||"viewonly"} onChange={v=>setReqEditForm({...reqEditForm,role:v})} options={roles.map(r=>({value:r,label:getRoleLabel(r)}))} />
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
                    {req.email&&<div style={{ fontSize:12,color:"#1A3A5C",fontWeight:600 }}>📧 {req.email}</div>}
                    {req.location&&<div style={{ fontSize:12,color:"#64748b" }}>📍 {req.location}</div>}
                    {req.licNo&&<div style={{ fontSize:12,color:"#6366f1" }}>📄 Lic: {req.licNo} | Exp: {req.licExp}</div>}
                    <div style={{ fontSize:13,color:"#374151",marginTop:4 }}>📝 {req.reason}</div>
                    <div style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>{t.requestedBy}: {req.requestedBy} | {req.reqDate} | {req.reqId}</div>
                    {req.uniqueRef&&<div style={{ fontSize:11,color:"#10b981",fontWeight:700 }}>✅ Ref: {req.uniqueRef} | Approved by: {req.adminName}</div>}
                  </div>
                  <div>
                    <span style={{ fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99,background:req.status==="pending"?"#fef3c7":req.status==="approved"?"#d1fae5":"#fee2e2",color:req.status==="pending"?"#92400e":req.status==="approved"?"#065f46":"#991b1b" }}>{req.status.toUpperCase()}</span>
                    {isAdmin&&(
                      <div style={{ display:"flex",gap:4,marginTop:8,flexWrap:"wrap" }}>
                        {req.status==="pending"&&(
                          <Btn small onClick={()=>{setEditReq(req.reqId);setReqEditForm({name:req.name,mobile:req.mobile,email:req.email||"",empId:req.empId||"",dept:req.dept||"",role:req.role||"viewonly",location:req.location||"Head Office",reason:req.reason||""});}} color="#6366f1">✎ {t.edit}</Btn>
                        )}
                        {req.status==="pending"&&<>
                          <Btn small onClick={()=>approveReq(req.reqId,true)} color="#10b981" disabled={approving}>
                            {approving?"⏳...":t.approve}
                          </Btn>
                          <Btn small onClick={()=>approveReq(req.reqId,false)} color="#ef4444" disabled={approving}>{t.reject}</Btn>
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

      {/* ADD / EDIT FORM */}
      {tab==="add"&&(
        <Card>
          <CardTitle>{editUser?t.edit+" "+editUser.name:isAdmin?t.newUser:t.myRequest}</CardTitle>

          {!isDriver&&(
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block" }}>{t.empType} *</label>
              <div style={{ display:"flex",gap:8 }}>
                {[["systemuser",t.systemUser],["driver",t.driverType]].map(([v,l])=>(
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
            {!isDriverForm&&<div style={{ gridColumn:"1/-1" }}><Input label={t.displayName} value={form.displayName} onChange={v=>F("displayName",v)} /></div>}
            <Input label={t.empId} value={form.empId} onChange={v=>F("empId",v)} placeholder="EMP-XXX" />
            <Input label={t.mobile+" *"} value={form.mobile} onChange={v=>F("mobile",v)} required />
            <div style={{ gridColumn:"1/-1" }}><Input label={t.email+" *"} value={form.email} onChange={v=>F("email",v)} type="email" /></div>

            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:5 }}>{t.location}</label>
              {locked.location&&!isAdmin?(
                <div style={{ background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,color:"#64748b" }}>
                  🔒 {locked.location}
                </div>
              ):(
                <select value={form.location} onChange={e=>F("location",e.target.value)}
                  style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                  {LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              )}
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:5 }}>{t.dept}</label>
              {isDriverForm?(
                <div style={{ background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,color:"#64748b" }}>
                  🔒 Logistics
                </div>
              ):(
                <select value={form.dept} onChange={e=>F("dept",e.target.value)}
                  style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                  {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>

            {isDriverForm?(
              <>
                <Input label={t.licNo+" *"} value={form.licNo} onChange={v=>F("licNo",v)} required />
                <Input label={t.licExp+" *"} value={form.licExp} onChange={v=>F("licExp",v)} type="date" required />
                <Input label={t.driverCard} value={form.driverCard} onChange={v=>F("driverCard",v)} />
                <Input label={t.driverCardExp} value={form.driverCardExp} onChange={v=>F("driverCardExp",v)} type="date" />
                <div style={{ gridColumn:"1/-1",background:"#f0f9ff",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#0369a1" }}>
                  🔒 DC: <b>{locked.dc||(isManager?user.dc:form.dc)||"Not set"}</b> | 🔒 Dept: Logistics
                </div>
              </>
            ):(
              <>
                {!isAdmin&&(
                  <div style={{ gridColumn:"1/-1",marginBottom:12 }}>
                    <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:5 }}>💡 {t.suggestRole}</label>
                    <select value={form.role} onChange={e=>F("role",e.target.value)}
                      style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                      {roles.map(r=>(<option key={r} value={r}>{getRoleLabel(r)}</option>))}
                    </select>
                    <div style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>Final approval by System Administrator</div>
                  </div>
                )}
                {isAdmin&&(
                  <div style={{ gridColumn:"1/-1" }}>
                    <Select label={t.role} value={form.role} onChange={v=>F("role",v)} options={roles.map(r=>({value:r,label:getRoleLabel(r)}))} />
                  </div>
                )}
              </>
            )}
            <div style={{ gridColumn:"1/-1" }}><Textarea label={t.reason} value={form.reason} onChange={v=>F("reason",v)} /></div>
          </div>

          {isAdmin&&<div style={{ background:"#f0f9ff",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#0369a1",marginBottom:16 }}>🔑 {t.defPass}</div>}

          {!isAdmin&&editUser?.uid===user.uid&&(
            <Btn onClick={()=>setPassModal({uid:user.uid,name:user.name,mode:"change"})} color="#f59e0b" style={{ width:"100%",marginBottom:12 }}>
              🔑 {t.changePass}
            </Btn>
          )}

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
                <Btn small onClick={saveMatrix} color="#10b981">💾 {t.saveMatrix}</Btn>
              </div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#1A3A5C" }}>
                    <th style={{ padding:"12px 14px",textAlign:"left",color:"white",fontWeight:700,minWidth:200,position:"sticky",left:0,background:"#1A3A5C" }}>{t.permission}</th>
                    {roles.map(r=>(
                      <th key={r} style={{ padding:"12px 10px",color:"white",fontWeight:700,textAlign:"center",minWidth:120 }}>
                        {editRoleName===r?(
                          <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                            <input value={editRoleValue} onChange={e=>setEditRoleValue(e.target.value)}
                              style={{ border:"none",borderRadius:4,padding:"3px 6px",fontSize:12,width:80 }}
                              onKeyDown={e=>e.key==="Enter"&&renameRole(r,editRoleValue)} />
                            <button onClick={()=>renameRole(r,editRoleValue)} style={{ background:"#10b981",border:"none",color:"white",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:11 }}>✓</button>
                            <button onClick={()=>setEditRoleName(null)} style={{ background:"#64748b",border:"none",color:"white",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:11 }}>✕</button>
                          </div>
                        ):(
                          <div>
                            <div>{getRoleLabel(r)}</div>
                            <div style={{ display:"flex",gap:4,justifyContent:"center",marginTop:4 }}>
                              <button onClick={()=>{setEditRoleName(r);setEditRoleValue(getRoleLabel(r));}}
                                style={{ background:"rgba(255,255,255,0.2)",border:"none",color:"white",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:10 }}>✎</button>
                              {!ROLES_ORDER.includes(r)&&(
                                <button onClick={()=>deleteRole(r)}
                                  style={{ background:"rgba(239,68,68,0.6)",border:"none",color:"white",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:10 }}>🗑</button>
                              )}
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissions).map(([category,perms])=>(
                    <React.Fragment key={"cat-"+category}>
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
        </div>
      )}
    </div>
  );
}
