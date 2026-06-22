import React from "react";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { doc, setDoc, collection, addDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import CameraCapture from "../components/CameraCapture.jsx";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { uploadImage } from "../cloudinaryService.js";
import { DEPARTMENTS, RC, RI, genId } from "../data/masterData.js";
import { sendNotification } from "../notificationService.js";

// Secondary Firebase app — Admin ka session safe rahe
const FIREBASE_CONFIG = { apiKey:"AIzaSyBg1IKFOcpRKJBOwIqiUh2oevdT6oqpYpU", authDomain:"deliverflow-spco.firebaseapp.com", projectId:"deliverflow-spco" };
function getSecondaryAuth() { const ex=getApps().find(a=>a.name==="secondary"); const app=ex||initializeApp(FIREBASE_CONFIG,"secondary"); return getAuth(app); }

const LOCATIONS = ["Distribution Center - Riyadh","Distribution Center - Jeddah","Distribution Center - Dammam","Head Office"];
const LOCATION_TO_DC = { "Distribution Center - Riyadh":"Riyadh","Distribution Center - Jeddah":"Jeddah","Distribution Center - Dammam":"Dammam","Head Office":"Head Office" };
const SPCO_DOMAIN = "@spco.sa";

const ROLE_LABELS = {
  en:{ admin:"System Administrator",planning:"Planning",manager:"DC Manager",logistic:"Logistic",driver:"Delivery Partner",management:"Management",viewonly:"View Only" },
  ar:{ admin:"مدير النظام",planning:"التخطيط",manager:"مدير مركز التوزيع",logistic:"اللوجستي",driver:"سائق التسليم",management:"الإدارة",viewonly:"عرض فقط" }
};

const DEFAULT_PERMISSIONS = {
  "Data Entry":{
    "Upload Invoice CSV":{ admin:true,planning:true,manager:false,logistic:false,driver:false,management:false,viewonly:false },
    "View All DC Invoices":{ admin:true,planning:true,manager:false,logistic:true,driver:false,management:true,viewonly:true },
    "View Own DC Invoices":{ admin:true,planning:true,manager:true,logistic:true,driver:false,management:true,viewonly:true },
    "Search Invoice / Customer":{ admin:true,planning:true,manager:true,logistic:true,driver:true,management:true,viewonly:true },
    "View Own Assigned Invoices":{ admin:false,planning:false,manager:false,logistic:false,driver:true,management:false,viewonly:false },
  },
  "Assignment":{
    "Assign Driver to Invoice":{ admin:true,planning:false,manager:true,logistic:false,driver:false,management:false,viewonly:false },
    "Assign Vehicle to Invoice":{ admin:true,planning:false,manager:true,logistic:false,driver:false,management:false,viewonly:false },
    "Select Delivery City":{ admin:true,planning:false,manager:true,logistic:false,driver:false,management:false,viewonly:false },
    "Re-assign Failed Invoice":{ admin:true,planning:false,manager:true,logistic:false,driver:false,management:false,viewonly:false },
    "Schedule Hold on Invoice":{ admin:true,planning:false,manager:true,logistic:false,driver:false,management:false,viewonly:false },
  },
  "Trip Management":{
    "Create Trip":{ admin:true,planning:false,manager:true,logistic:false,driver:false,management:false,viewonly:false },
    "Receive Relay Trip + POD":{ admin:true,planning:false,manager:true,logistic:false,driver:false,management:false,viewonly:false },
  },
  "POD Management":{
    "Upload POD (Own Invoices)":{ admin:false,planning:false,manager:false,logistic:false,driver:true,management:false,viewonly:false },
    "Upload POD on Driver Behalf":{ admin:true,planning:false,manager:true,logistic:false,driver:false,management:false,viewonly:false },
    "View POD Image":{ admin:true,planning:true,manager:true,logistic:true,driver:true,management:true,viewonly:true },
    "Bulk Download POD":{ admin:true,planning:true,manager:true,logistic:false,driver:false,management:false,viewonly:false },
  },
  "Fleet Management":{
    "Mark Vehicle in Maintenance":{ admin:true,planning:false,manager:true,logistic:true,driver:false,management:false,viewonly:false },
    "Upload Fuel Fill Record":{ admin:true,planning:false,manager:true,logistic:true,driver:true,management:false,viewonly:false },
    "Upload Odometer Photo":{ admin:false,planning:false,manager:false,logistic:false,driver:true,management:false,viewonly:false },
  },
  "User Management":{
    "Submit User / Driver Request":{ admin:true,planning:true,manager:true,logistic:true,driver:false,management:false,viewonly:false },
    "Approve / Reject Requests":{ admin:true,planning:false,manager:false,logistic:false,driver:false,management:false,viewonly:false },
    "Edit User Role / DC":{ admin:true,planning:false,manager:false,logistic:false,driver:false,management:false,viewonly:false },
  },
  "Reports":{
    "Daily Delivery Status":{ admin:true,planning:true,manager:true,logistic:true,driver:false,management:true,viewonly:true },
    "Driver Performance":{ admin:true,planning:false,manager:true,logistic:true,driver:false,management:true,viewonly:false },
    "Vehicle Utilization":{ admin:true,planning:false,manager:true,logistic:true,driver:false,management:true,viewonly:false },
    "Monthly Closing":{ admin:true,planning:false,manager:false,logistic:false,driver:false,management:true,viewonly:false },
  },
};

const ROLES_ORDER = ["admin","planning","manager","logistic","driver","management","viewonly"];

const T = {
  en:{
    userDir:"User Directory", accessReq:"Access Requests", authMatrix:"Authorization Matrix",
    empType:"Employee Type", systemUser:"🏢 System User", driverType:"🚚 Delivery Partner",
    fullName:"Full Name *", empId:"Employee ID (Optional)",
    mobile:"Mobile Number *", loginId:"Login ID *", location:"Location *",
    dept:"Department *", role:"Role *", licNo:"License Number *",
    licExp:"License Expiry *", licPic:"License Photo *",
    driverCard:"Driver Card Number *", driverCardExp:"Driver Card Expiry *",
    driverCardPic:"Driver Card Photo *", reason:"Notes",
    approve:"✅ Approve", reject:"❌ Reject", edit:"✎ Edit",
    cancel:"Cancel", save:"Save Changes", submit:"Submit Request",
    activate:"Activate", deactivate:"Deactivate",
    noPending:"No pending requests", requestSent:"✅ Request submitted!",
    approvedMsg:"✅ User approved! Credentials issued.",
    rejectedMsg:"Request rejected.", updated:"✅ User updated!",
    uploading:"Uploading...", approving:"Creating account...",
    loginIdHint:"Username only — @spco.sa added automatically",
    newRequest:"+ New Request", pendingReqs:"Pending Requests",
    approvedReqs:"Approved Requests", rejectedReqs:"Rejected Requests",
    previousReqs:"Previous Requests", noRequests:"No requests yet",
    editUser:"Edit User", saveMatrix:"Save Matrix", matrixSaved:"✅ Matrix saved!",
    addRole:"+ Add Role", permission:"Permission",
    newRolePlaceholder:"e.g. Supervisor...",
    dcLabel:"Distribution Center", statusLabel:"Status",
  },
  ar:{
    userDir:"دليل المستخدمين", accessReq:"طلبات الوصول", authMatrix:"مصفوفة التفويض",
    empType:"نوع الموظف", systemUser:"🏢 مستخدم النظام", driverType:"🚚 سائق التسليم",
    fullName:"الاسم الكامل *", empId:"رقم الموظف (اختياري)",
    mobile:"رقم الجوال *", loginId:"معرف الدخول *", location:"الموقع *",
    dept:"القسم *", role:"الدور *", licNo:"رقم الرخصة *",
    licExp:"انتهاء الرخصة *", licPic:"صورة الرخصة *",
    driverCard:"رقم بطاقة السائق *", driverCardExp:"انتهاء البطاقة *",
    driverCardPic:"صورة البطاقة *", reason:"ملاحظات",
    approve:"✅ موافقة", reject:"❌ رفض", edit:"✎ تعديل",
    cancel:"إلغاء", save:"حفظ التغييرات", submit:"إرسال الطلب",
    activate:"تفعيل", deactivate:"تعطيل",
    noPending:"لا توجد طلبات", requestSent:"✅ تم إرسال الطلب!",
    approvedMsg:"✅ تمت الموافقة!", rejectedMsg:"تم الرفض",
    updated:"✅ تم التحديث!", uploading:"جاري الرفع...",
    approving:"جاري إنشاء الحساب...",
    loginIdHint:"أدخل اسم المستخدم فقط",
    newRequest:"+ طلب جديد", pendingReqs:"الطلبات المعلقة",
    approvedReqs:"الطلبات الموافق عليها", rejectedReqs:"الطلبات المرفوضة",
    previousReqs:"الطلبات السابقة", noRequests:"لا توجد طلبات",
    editUser:"تعديل المستخدم", saveMatrix:"حفظ المصفوفة",
    matrixSaved:"✅ تم الحفظ!", addRole:"+ إضافة دور",
    permission:"الصلاحية", newRolePlaceholder:"مثال: مشرف...",
    dcLabel:"المركز", statusLabel:"الحالة",
  }
};

const EMPTY_FORM = {
  empType:"systemuser", name:"", empId:"", mobile:"", loginId:"",
  location:"Head Office", dept:"", role:"viewonly", dc:"Head Office",
  reason:"", licNo:"", licExp:"", licPicUrl:"",
  driverCard:"", driverCardExp:"", driverCardPicUrl:""
};

export default function Users({ user, users, setUsers, requests, setRequests, lang }) {
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const rl = ROLE_LABELS[lang]||ROLE_LABELS.en;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";
  const isPlanning = user.role==="planning";
  const isLogistic = user.role==="logistic";
  const canSubmit = isAdmin||isManager||isPlanning||isLogistic;

  const adminTabs = [["users","👥",t.userDir],["requests","📝",t.accessReq],["matrix","🔐",t.authMatrix]];
  const otherTabs = [["requests","📝",t.accessReq]];
  const tabs = isAdmin?adminTabs:otherTabs;

  const [tab, setTab] = useState(tabs[0][0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [done, setDone] = useState("");
  const [approving, setApproving] = useState(false);

  // Firestore se users aur requests load karo
  useEffect(() => {
    loadUsersFromFirestore();
    loadRequestsFromFirestore();
    loadMatrixFromFirestore();
  }, []);

  async function loadUsersFromFirestore() {
    try {
      const snap = await getDocs(collection(db, "users"));
      const fsUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      if (fsUsers.length > 0) setUsers(fsUsers);
    } catch(e) { console.error("Users load error:", e); }
  }

  async function loadRequestsFromFirestore() {
    try {
      const snap = await getDocs(collection(db, "requests"));
      const fsReqs = snap.docs.map(d => ({ ...d.data(), firestoreId: d.id }));
      if (fsReqs.length > 0) setRequests(fsReqs);
    } catch(e) { console.error("Requests load error:", e); }
  }

  async function loadMatrixFromFirestore() {
    try {
      const snap = await getDocs(collection(db, "authMatrix"));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data.permissions) setPermissions(data.permissions);
        // Merge saved roles with ROLES_ORDER — ensures Logistic+Management always appear
        if (data.roles) {
          const merged = [...new Set([...ROLES_ORDER, ...data.roles])];
          setRoles(merged);
        }
        if (data.roleLabels) setRoleLabels(data.roleLabels);
      }
    } catch(e) { console.error("Matrix load error:", e); }
  }

  async function saveMatrixToFirestore() {
    try {
      const snap = await getDocs(collection(db, "authMatrix"));
      const matrixData = { permissions, roles, roleLabels, updatedBy: user.name, updatedAt: new Date().toISOString() };
      if (!snap.empty) {
        await updateDoc(doc(db, "authMatrix", snap.docs[0].id), matrixData);
      } else {
        await addDoc(collection(db, "authMatrix"), matrixData);
      }
      flash(t.matrixSaved);
    } catch(e) { flash("❌ Error saving matrix: "+e.message); }
  }
  const [uploading, setUploading] = useState(false);
  const [editReqId, setEditReqId] = useState(null);
  const [editReqForm, setEditReqForm] = useState(null);
  const [issuedCredentials, setIssuedCredentials] = useState(null);

  // Edit user state
  const [editUserId, setEditUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState(null);
  const [savingUser, setSavingUser] = useState(false);

  // Matrix state
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
    if (key==="location") updated.dc = LOCATION_TO_DC[val]||"Head Office";
    if (key==="empType"&&val==="driver"&&isManager) {
      updated.location = user.location||"Head Office";
      updated.dc = user.dc||"";
    }
    setForm(updated);
  }

  async function handleImageUpload(file, field) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "drivers");
      setForm(prev=>({...prev,[field]:url}));
      flash("✅ Photo uploaded!");
    } catch(e) { flash("❌ Upload failed: "+e.message); }
    setUploading(false);
  }

  async function submitRequest() {
    const email = form.loginId.trim().toLowerCase()+SPCO_DOMAIN;
    if (!form.name||!form.mobile||!form.loginId) { flash("❌ Fill all required fields!"); return; }
    if (form.empType==="driver") {
      if (!form.licNo||!form.licExp||!form.licPicUrl) { flash("❌ License details + photo required!"); return; }
      if (!form.driverCard||!form.driverCardExp||!form.driverCardPicUrl) { flash("❌ Driver card details + photo required!"); return; }
    } else {
      if (!form.dept||!form.role) { flash("❌ Fill all required fields!"); return; }
    }
    const req = {
      reqId:genId("REQ"), empType:form.empType, name:form.name,
      empId:form.empId||"", mobile:form.mobile, email, loginId:form.loginId.trim().toLowerCase(),
      location:isManager?(user.location||form.location):form.location,
      dc:isManager?(user.dc||form.dc):form.dc,
      dept:form.empType==="driver"?"Logistics":form.dept,
      role:form.empType==="driver"?"driver":form.role,
      reason:form.reason, licNo:form.licNo||"", licExp:form.licExp||"",
      licPicUrl:form.licPicUrl||"", driverCard:form.driverCard||"",
      driverCardExp:form.driverCardExp||"", driverCardPicUrl:form.driverCardPicUrl||"",
      requestedBy:user.name, requestedByRole:user.role, requestedByDC:user.dc||"",
      reqDate:new Date().toLocaleDateString(), status:"pending",
    };
    try { await addDoc(collection(db, "requests"), req); } catch(e) { console.error(e); }

    // Notify Admin
    await sendNotification({
      toRole: "admin",
      type: "request",
      title: "New Access Request",
      message: `${user.name} has submitted a new access request for ${req.name} (${req.role} — ${req.dc}).`,
    });

    setRequests(prev=>[...prev,req]);
    flash(t.requestSent);
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  async function approveReq(reqId) {
    const req = requests.find(r=>r.reqId===reqId);
    if (!req) return;
    setApproving(true);
    try {
      const defaultPassword = "spco2026";
      const uniqueRef = genId("USR");
      const secondaryAuth = getSecondaryAuth();
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, req.email, defaultPassword);
      const newUID = userCredential.user.uid;
      const profileData = {
        name:req.name, email:req.email, mobile:req.mobile, empId:req.empId||"",
        role:req.role, dept:req.dept, dc:LOCATION_TO_DC[req.location]||LOCATION_TO_DC[req.dc]||req.dc||"Head Office", location:req.location,
        status:"active", empType:req.empType, uniqueRef,
        approvedBy:user.name, approvedAt:new Date().toISOString(),
        createdAt:new Date().toISOString(),
        licNo:req.licNo||null, licExp:req.licExp||null, licPicUrl:req.licPicUrl||null,
        driverCard:req.driverCard||null, driverCardExp:req.driverCardExp||null,
        driverCardPicUrl:req.driverCardPicUrl||null,
      };
      // Firestore mein user save karo
      await setDoc(doc(db,"users",newUID), profileData);
      // Request ka status Firestore mein update karo
      if (req.firestoreId) {
        await updateDoc(doc(db,"requests",req.firestoreId), {
          status:"approved", uniqueRef, firebaseUID:newUID, approvedBy:user.name, approvedAt:new Date().toISOString()
        });
      }
      // Local state update karo
      setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:"approved",uniqueRef,firebaseUID:newUID,approvedBy:user.name}:r));
      setUsers(prev=>[...prev,{uid:newUID,...profileData}]);
      setIssuedCredentials({name:req.name,email:req.email,password:defaultPassword,role:getRoleLabel(req.role),dc:req.dc,ref:uniqueRef});

      // Notify requester
      const requester = (await loadUsersFromFirestore_silent()).find(u=>u.name===req.requestedBy);
      if (requester?.uid) {
        await sendNotification({
          toUserId: requester.uid,
          type: "request_action",
          title: "Access Request Approved ✅",
          message: `Your request for ${req.name} (${getRoleLabel(req.role)} — ${req.dc}) has been approved by ${user.name}. Login: ${req.email}`,
        });
      }

      flash(t.approvedMsg);
      await loadUsersFromFirestore();
    } catch(e) {
      if (e.code==="auth/email-already-in-use") {
        try {
          const allUsers = await loadUsersFromFirestore_silent();
          const existingUser = allUsers.find(u=>u.email===req.email);
          const existingUID = existingUser?.uid||null;
          const uniqueRef = existingUser?.uniqueRef||genId("USR");
          if (req.firestoreId) {
            await updateDoc(doc(db,"requests",req.firestoreId), {
              status:"approved", uniqueRef, firebaseUID:existingUID, approvedBy:user.name, approvedAt:new Date().toISOString()
            });
          }
          setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:"approved",uniqueRef,firebaseUID:existingUID,approvedBy:user.name}:r));
          setIssuedCredentials({name:req.name,email:req.email,password:"spco2026",role:getRoleLabel(req.role),dc:req.dc,ref:uniqueRef});
          flash(t.approvedMsg);
          await loadUsersFromFirestore();
        } catch(e2) { flash("❌ Error: "+e2.message); }
      } else {
        flash("❌ Error: "+e.message);
      }
    }
    setApproving(false);
  }

  async function loadUsersFromFirestore_silent() {
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    } catch(e) { return []; }
  }

  async function rejectReq(reqId) {
    const req = requests.find(r=>r.reqId===reqId);
    if (req?.firestoreId) {
      try {
        await updateDoc(doc(db,"requests",req.firestoreId), { status:"rejected", rejectedBy:user.name });
      } catch(e) { console.error(e); }
    }

    // Notify requester
    const allUsers = await loadUsersFromFirestore_silent();
    const requester = allUsers.find(u=>u.name===req?.requestedBy);
    if (requester?.uid) {
      await sendNotification({
        toUserId: requester.uid,
        type: "request_action",
        title: "Access Request Rejected ❌",
        message: `Your request for ${req.name} (${req.role} — ${req.dc}) has been rejected by ${user.name}.`,
      });
    }

    setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:"rejected",rejectedBy:user.name}:r));
    flash(t.rejectedMsg);
  }

  function saveReqEdit() {
    if (!editReqForm) return;
    const email = (editReqForm.loginId||"").trim().toLowerCase()+SPCO_DOMAIN;
    setRequests(prev=>prev.map(r=>r.reqId===editReqId?{...r,...editReqForm,email}:r));
    flash(t.updated); setEditReqId(null); setEditReqForm(null);
  }

  // Edit User — Firestore update
  function startEditUser(u) {
    setEditUserId(u.uid);
    setEditUserForm({ name:u.name, role:u.role, dc:u.dc, location:u.location, dept:u.dept||"", status:u.status||"active", mobile:u.mobile||"" });
  }

  async function saveUserEdit() {
    if (!editUserForm||!editUserId) return;
    setSavingUser(true);
    try {
      // Always normalize dc from location before saving
      const normalizedEdit = {
        ...editUserForm,
        dc: LOCATION_TO_DC[editUserForm.location] || editUserForm.dc || "Head Office",
      };
      await updateDoc(doc(db,"users",editUserId), normalizedEdit);
      setUsers(prev=>prev.map(u=>u.uid===editUserId?{...u,...editUserForm}:u));
      flash(t.updated);
      setEditUserId(null);
      setEditUserForm(null);
    } catch(e) { flash("❌ Error: "+e.message); }
    setSavingUser(false);
  }

  async function toggleUserStatus(u) {
    const newStatus = u.status==="active"?"inactive":"active";
    try {
      await updateDoc(doc(db,"users",u.uid),{status:newStatus});
      setUsers(prev=>prev.map(usr=>usr.uid===u.uid?{...usr,status:newStatus}:usr));
      flash(t.updated);
    } catch(e) { flash("❌ Error: "+e.message); }
  }

  async function deleteUser(u) {
    if (!window.confirm("Delete "+u.name+"? This cannot be undone!")) return;
    try {
      await deleteDoc(doc(db,"users",u.uid));
      setUsers(prev=>prev.filter(usr=>usr.uid!==u.uid));
      flash("🗑️ "+u.name+" deleted!");
    } catch(e) { flash("❌ Error: "+e.message); }
  }

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

  // Har user sirf apni khud ki requests dekhe
  const visibleRequests = isAdmin ? requests : requests.filter(r=>r.requestedBy===user.name);
  const pendingRequests = visibleRequests.filter(r=>r.status==="pending");
  const approvedRequests = visibleRequests.filter(r=>r.status==="approved");
  const rejectedRequests = visibleRequests.filter(r=>r.status==="rejected");
  const isDriverForm = form.empType==="driver";

  return (
    <div style={{direction:rtl?"rtl":"ltr"}}>
      {done&&<SuccessMsg msg={done}/>}

      {/* CREDENTIALS MODAL */}
      {issuedCredentials&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,padding:32,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:8}}>🎉</div>
              <h3 style={{margin:"0 0 4px",fontWeight:900,color:"#065f46",fontSize:20}}>Account Created!</h3>
              <p style={{color:"#64748b",fontSize:13,margin:0}}>Share via WhatsApp</p>
            </div>
            <div style={{background:"#f0fdf4",border:"2px solid #10b981",borderRadius:12,padding:20,marginBottom:16}}>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2}}>👤 NAME</div>
                <div style={{fontWeight:700,fontSize:15}}>{issuedCredentials.name}</div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2}}>📧 LOGIN ID</div>
                <div style={{fontWeight:700,fontSize:14,color:"#1A3A5C",fontFamily:"monospace",background:"#e0f2fe",padding:"6px 10px",borderRadius:6}}>{issuedCredentials.email}</div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2}}>🔑 PASSWORD</div>
                <div style={{fontWeight:700,fontSize:22,color:"#7c3aed",fontFamily:"monospace",background:"#f3e8ff",padding:"6px 10px",borderRadius:6,letterSpacing:2}}>{issuedCredentials.password}</div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2}}>🏢 ROLE & DC</div>
                <div style={{fontWeight:600,fontSize:13}}>{issuedCredentials.role} — {issuedCredentials.dc}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:2}}>🔖 REF</div>
                <div style={{fontWeight:600,fontSize:13,color:"#6366f1"}}>{issuedCredentials.ref}</div>
              </div>
            </div>
            <div style={{background:"#fef3c7",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#92400e",marginBottom:16}}>
              ⚠️ User should change password after first login.
            </div>
            <Btn onClick={()=>setIssuedCredentials(null)} style={{width:"100%",padding:12}} color="#1A3A5C">✅ Done — Close</Btn>
          </div>
        </div>
      )}

      <TabBar tabs={tabs} active={tab} onChange={t2=>{setTab(t2);setShowForm(false);setEditUserId(null);}}/>

      {/* USER DIRECTORY */}
      {tab==="users"&&isAdmin&&(
        <div>
          {["admin","planning","manager","logistic","driver","management","viewonly",...roles.filter(r=>!ROLES_ORDER.includes(r))].map(role=>{
            const ru=users.filter(u=>u.role===role);
            if (!ru.length) return null;
            return (
              <Card key={role} style={{marginBottom:12}}>
                <CardTitle>{RI[role]||"👤"} {getRoleLabel(role)} ({ru.length})</CardTitle>
                {ru.map(u=>(
                  <div key={u.uid}>
                    {editUserId===u.uid&&editUserForm?(
                      /* EDIT USER FORM */
                      <div style={{background:"#f8fafc",borderRadius:10,padding:16,marginBottom:8,border:"2px solid #6366f1"}}>
                        <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:"#6366f1"}}>✎ {t.editUser}: {u.name}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 8px"}}>
                          <Input label="Full Name" value={editUserForm.name} onChange={v=>setEditUserForm({...editUserForm,name:v})}/>
                          <Input label="Mobile" value={editUserForm.mobile||""} onChange={v=>setEditUserForm({...editUserForm,mobile:v})}/>

                          {/* Role */}
                          <div style={{marginBottom:12}}>
                            <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>🎭 {t.role}</label>
                            <select value={editUserForm.role} onChange={e=>setEditUserForm({...editUserForm,role:e.target.value})}
                              style={{width:"70%",border:"1.5px solid #6366f1",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box">}
                              {["admin","planning","manager","logistic","driver","management","viewonly",...roles.filter(r=>!ROLES_ORDER.includes(r))].map(r=>(
                                <option key={r} value={r}>{getRoleLabel(r)}</option>
                              ))}
                            </select>
                          </div>

                          {/* DC */}
                          <div style={{marginBottom:12}}>
                            <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>📍 {t.dcLabel}</label>
                            <select value={editUserForm.location||"Head Office"} onChange={e=>setEditUserForm({...editUserForm,location:e.target.value,dc:LOCATION_TO_DC[e.target.value]||"Head Office"})}
                              style={{width:"70%",border:"1.5px solid #6366f1",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box">}
                              {LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>

                          {/* Department */}
                          <div style={{marginBottom:12}}>
                            <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>🏢 {t.dept}</label>
                            <select value={editUserForm.dept||""} onChange={e=>setEditUserForm({...editUserForm,dept:e.target.value})}
                              style={{width:"70%",border:"1.5px solid #6366f1",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box">}
                              <option value="">Select...</option>
                              {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>

                          {/* Status */}
                          <div style={{marginBottom:12}}>
                            <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>🔘 {t.statusLabel}</label>
                            <select value={editUserForm.status||"active"} onChange={e=>setEditUserForm({...editUserForm,status:e.target.value})}
                              style={{width:"70%",border:"1.5px solid #6366f1",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box">}
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <Btn onClick={saveUserEdit} color="#10b981" style={{flex:1}} disabled={savingUser}>
                            {savingUser?"Saving...":"💾 "+t.save}
                          </Btn>
                          <Btn onClick={()=>{setEditUserId(null);setEditUserForm(null);}} color="#64748b">{t.cancel}</Btn>
                        </div>
                      </div>
                    ):(
                      /* USER ROW */
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:RC[role]||"#64748b",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:15,flexShrink:0}}>
                          {u.name?.charAt(0)||"?"}
                        </div>
                        <div style={{flex:1,minWidth:180}}>
                          <div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{u.name}</div>
                          <div style={{fontSize:12,color:"#64748b"}}>{u.email} | {u.mobile}</div>
                          <div style={{fontSize:11,color:"#94a3b8"}}>{u.location||u.dc} | {u.dept} {u.uniqueRef&&"| "+u.uniqueRef}</div>
                          {u.licNo&&<div style={{fontSize:11,color:"#6366f1"}}>📄 Lic: {u.licNo} exp: {u.licExp}</div>}
                          {u.driverCard&&<div style={{fontSize:11,color:"#6366f1"}}>🪪 Card: {u.driverCard} exp: {u.driverCardExp}</div>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:u.status==="active"?"#d1fae5":"#fee2e2",color:u.status==="active"?"#065f46":"#991b1b"}}>
                            {u.status||"active"}
                          </span>
                          <Btn small onClick={()=>startEditUser(u)} color="#6366f1">✎ {t.edit}</Btn>
                          <Btn small onClick={()=>toggleUserStatus(u)} color={u.status==="active"?"#ef4444":"#10b981"}>
                            {u.status==="active"?t.deactivate:t.activate}
                          </Btn>
                          <Btn small onClick={()=>deleteUser(u)} color="#dc2626">🗑️</Btn>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {/* ACCESS REQUESTS */}
      {tab==="requests"&&canSubmit&&(
        <div>
          {!showForm&&(
            <div style={{marginBottom:16}}>
              <Btn onClick={()=>setShowForm(true)} color="#1A3A5C" style={{padding:"8px 18px"}}>
                {t.newRequest}
              </Btn>
            </div>
          )}

          {/* REQUEST FORM */}
          {showForm&&(
            <Card style={{borderTop:"4px solid #1A3A5C",marginBottom:12}}>
              <CardTitle>📝 New Access Request</CardTitle>

              {/* Employee Type */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:4,display:"block"}}>{t.empType} *</label>
                <div style={{display:"flex",gap:8}}>
                  {[["systemuser",t.systemUser],...(!isPlanning?[["driver",t.driverType]]:[])].map(([v,l])=>isLogistic&&v==="systemuser"?null:(
                    <button key={v} onClick={()=>F("empType",v)}
                      style={{flex:1,border:`2px solid ${form.empType===v?"#6366f1":"#e2e8f0"}`,background:form.empType===v?"#eef2ff":"white",borderRadius:8,padding:6,cursor:"pointer",fontSize:13,fontWeight:600,color:form.empType===v?"#4338ca":"#64748b"}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 8px"}}>
                <div style={{gridColumn:"span 3"}}>
                  <Input label={t.fullName} value={form.name} onChange={v=>F("name",v)}/>
                </div>

                {/* Login ID */}
                <div style={{gridColumn:"1/-1",marginBottom:8}}>
                  <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{t.loginId}</label>
                  <div style={{display:"flex",alignItems:"center"}}>
                    <input value={form.loginId} onChange={e=>F("loginId",e.target.value.replace(/\s/g,"").toLowerCase())}
                      placeholder="e.g. waleed.alqahtani"
                      style={{flex:1,border:"1.5px solid #e2e8f0",borderRight:"none",maxWidth:"60%",borderRadius:"8px 0 0 8px",padding:"6px 10px",fontSize:14,outline:"none"}}/>
                    <div style={{background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderLeft:"none",borderRadius:"0 8px 8px 0",padding:"6px 10px",fontSize:14,color:"#64748b",fontWeight:600,whiteSpace:"nowrap"}}>
                      @spco.sa
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{t.loginIdHint}</div>
                </div>

                <Input label={t.mobile} value={form.mobile} onChange={v=>F("mobile",v)}/>
                <Input label={t.empId} value={form.empId} onChange={v=>F("empId",v)}/>

                {/* Location */}
                {isManager?(
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>📍 Location</label>
                    <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:14,color:"#64748b"}}>
                      🔒 {user.location||user.dc}
                    </div>
                  </div>
                ):(
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>📍 {t.location}</label>
                    <select value={form.location} onChange={e=>F("location",e.target.value)}
                      style={{width:"70%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box">}
                      {LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}

                {isDriverForm?(
                  <>
                    <Input label={t.licNo} value={form.licNo} onChange={v=>F("licNo",v)}/>
                    <div style={{marginBottom:12}}>
                      <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{t.licExp}</label>
                      <input type="date" value={form.licExp} onChange={e=>F("licExp",e.target.value)}
                        style={{width:"70%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <div style={{gridColumn:"span 3"}}>
                      <CameraCapture
                        label={t.licPic}
                        value={form.licPicUrl}
                        onChange={url=>F("licPicUrl",url)}
                        folder="drivers"
                        lang={lang}
                        required
                      />
                    </div>
                    <Input label={t.driverCard} value={form.driverCard} onChange={v=>F("driverCard",v)}/>
                    <div style={{marginBottom:12}}>
                      <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{t.driverCardExp}</label>
                      <input type="date" value={form.driverCardExp} onChange={e=>F("driverCardExp",e.target.value)}
                        style={{width:"70%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <div style={{gridColumn:"span 3"}}>
                      <CameraCapture
                        label={t.driverCardPic}
                        value={form.driverCardPicUrl}
                        onChange={url=>F("driverCardPicUrl",url)}
                        folder="drivers"
                        lang={lang}
                        required
                      />
                    </div>
                  </>
                ):(
                  <>
                    <div style={{marginBottom:12}}>
                      <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{t.dept}</label>
                      <select value={form.dept} onChange={e=>F("dept",e.target.value)}
                        style={{width:"70%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box">}
                        <option value="">Select...</option>
                        {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div style={{marginBottom:12}}>
                      <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>{t.role}</label>
                      <select value={form.role} onChange={e=>F("role",e.target.value)}
                        style={{width:"70%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box">}
                        {(isAdmin?["admin","planning","manager","driver","viewonly"]:["planning","manager","driver","viewonly"]).map(r=>(
                          <option key={r} value={r}>{getRoleLabel(r)}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div style={{gridColumn:"span 3"}}>
                  <Textarea label={t.reason} value={form.reason} onChange={v=>F("reason",v)}/>
                </div>
              </div>

              <div style={{display:"flex",gap:8}}>
                <Btn onClick={submitRequest} color="#10b981" style={{flex:1,padding:12}} disabled={uploading}>
                  ✅ {t.submit}
                </Btn>
                <Btn onClick={()=>{setShowForm(false);setForm(EMPTY_FORM);}} color="#64748b">{t.cancel}</Btn>
              </div>
            </Card>
          )}

          {/* PENDING REQUESTS */}
          {approving&&(
            <div style={{background:"#dbeafe",borderRadius:8,padding:"12px 16px",marginBottom:12,fontSize:14,color:"#1e40af",fontWeight:600}}>
              ⏳ {t.approving}
            </div>
          )}

          <div style={{fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:8}}>
            ⏳ {t.pendingReqs} ({pendingRequests.length})
          </div>

          {pendingRequests.length===0&&(
            <Card><div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>{t.noRequests}</div></Card>
          )}

          {pendingRequests.map(req=>(
            <Card key={req.reqId} style={{borderLeft:"4px solid #f59e0b"}}>
              {editReqId===req.reqId&&editReqForm?(
                <div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:"#6366f1"}}>✎ Edit Request</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 8px"}}>
                    <Input label="Full Name" value={editReqForm.name} onChange={v=>setEditReqForm({...editReqForm,name:v})}/>
                    <Input label="Mobile" value={editReqForm.mobile||""} onChange={v=>setEditReqForm({...editReqForm,mobile:v})}/>
                    <div style={{marginBottom:12}}>
                      <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Login ID</label>
                      <div style={{display:"flex",alignItems:"center"}}>
                        <input value={editReqForm.loginId||""} onChange={e=>setEditReqForm({...editReqForm,loginId:e.target.value})}
                          style={{flex:1,border:"1.5px solid #e2e8f0",borderRight:"none",maxWidth:"60%",borderRadius:"8px 0 0 8px",padding:"6px 10px",fontSize:14,outline:"none"}}/>
                        <div style={{background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderLeft:"none",borderRadius:"0 8px 8px 0",padding:"6px 10px",fontSize:14,color:"#64748b",fontWeight:600}}>@spco.sa</div>
                      </div>
                    </div>
                    {req.empType!=="driver"&&(
                      <div style={{marginBottom:12}}>
                        <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>{t.role}</label>
                        <select value={editReqForm.role} onChange={e=>setEditReqForm({...editReqForm,role:e.target.value})}
                          style={{width:"70%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box">}
                          {["admin","planning","manager","driver","viewonly"].map(r=>(
                            <option key={r} value={r}>{getRoleLabel(r)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <Btn onClick={saveReqEdit} color="#10b981">✅ {t.save}</Btn>
                    <Btn onClick={()=>{setEditReqId(null);setEditReqForm(null);}} color="#64748b">{t.cancel}</Btn>
                  </div>
                </div>
              ):(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:15}}>{req.name}
                        <span style={{fontSize:12,color:"#64748b",marginLeft:8,fontWeight:400}}>({req.empType==="driver"?"Driver":"System User"})</span>
                      </div>
                      <div style={{fontSize:13,color:"#1A3A5C",fontWeight:600}}>📧 {req.email}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>📱 {req.mobile} | 📍 {req.dc} | {getRoleLabel(req.role)}</div>
                      {req.licNo&&<div style={{fontSize:12,color:"#6366f1"}}>📄 Lic: {req.licNo} | {req.licExp}</div>}
                      {req.driverCard&&<div style={{fontSize:12,color:"#6366f1"}}>🪪 Card: {req.driverCard} | {req.driverCardExp}</div>}
                      <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                        {req.licPicUrl&&<img src={req.licPicUrl} alt="Lic" style={{width:60,height:40,objectFit:"cover",borderRadius:4,border:"1px solid #e2e8f0"}}/>}
                        {req.driverCardPicUrl&&<img src={req.driverCardPicUrl} alt="Card" style={{width:60,height:40,objectFit:"cover",borderRadius:4,border:"1px solid #e2e8f0"}}/>}
                      </div>
                      <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>By: {req.requestedBy} | {req.reqDate} | {req.reqId}</div>
                    </div>
                  </div>
                  {isAdmin&&(
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <Btn small onClick={()=>{setEditReqId(req.reqId);setEditReqForm({name:req.name,mobile:req.mobile,loginId:req.loginId||"",email:req.email,role:req.role});}} color="#6366f1">✎ {t.edit}</Btn>
                      <Btn small onClick={()=>approveReq(req.reqId)} color="#10b981" disabled={approving}>{t.approve}</Btn>
                      <Btn small onClick={()=>rejectReq(req.reqId)} color="#ef4444">{t.reject}</Btn>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}

          {/* APPROVED REQUESTS */}
          {approvedRequests.length>0&&(
            <div style={{marginTop:24}}>
              <div style={{fontWeight:700,fontSize:15,color:"#065f46",marginBottom:8}}>✅ {t.approvedReqs} ({approvedRequests.length})</div>
              {approvedRequests.map(req=>(
                <Card key={req.reqId} style={{borderLeft:"4px solid #10b981"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{req.name}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{req.email} | {req.dc} | {getRoleLabel(req.role)}</div>
                      <div style={{fontSize:11,color:"#94a3b8"}}>{req.reqId} | {req.reqDate}</div>
                      {req.uniqueRef&&<div style={{fontSize:11,color:"#10b981",fontWeight:700}}>✅ Ref: {req.uniqueRef} | Approved by: {req.approvedBy}</div>}
                    </div>
                    <span style={{fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99,background:"#d1fae5",color:"#065f46"}}>
                      ✅ APPROVED
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* REJECTED REQUESTS */}
          {rejectedRequests.length>0&&(
            <div style={{marginTop:24}}>
              <div style={{fontWeight:700,fontSize:15,color:"#991b1b",marginBottom:8}}>❌ {t.rejectedReqs} ({rejectedRequests.length})</div>
              {rejectedRequests.map(req=>(
                <Card key={req.reqId} style={{borderLeft:"4px solid #ef4444"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{req.name}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{req.email} | {req.dc} | {getRoleLabel(req.role)}</div>
                      <div style={{fontSize:11,color:"#94a3b8"}}>{req.reqId} | {req.reqDate}</div>
                    </div>
                    <span style={{fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99,background:"#fee2e2",color:"#991b1b"}}>
                      ❌ REJECTED
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUTHORIZATION MATRIX */}
      {tab==="matrix"&&isAdmin&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <CardTitle style={{margin:0}}>🔐 {t.authMatrix}</CardTitle>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {showAddRole?(
                <>
                  <input value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} placeholder={t.newRolePlaceholder}
                    style={{border:"1.5px solid #6366f1",borderRadius:8,padding:"6px 12px",fontSize:13,outline:"none",minWidth:150}}/>
                  <Btn small onClick={addRole} color="#6366f1">✅ Add</Btn>
                  <Btn small onClick={()=>{setShowAddRole(false);setNewRoleName("");}} color="#64748b">{t.cancel}</Btn>
                </>
              ):(
                <Btn small onClick={()=>setShowAddRole(true)} color="#6366f1">{t.addRole}</Btn>
              )}
              <Btn small onClick={saveMatrixToFirestore} color="#10b981">💾 {t.saveMatrix}</Btn>
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#1A3A5C"}}>
                  <th style={{padding:"8px 10px",textAlign:"left",color:"white",fontWeight:700,minWidth:200,position:"sticky",left:0,background:"#1A3A5C"}}>{t.permission}</th>
                  {roles.map(r=>(
                    <th key={r} style={{padding:"8px 8px",color:"white",fontWeight:700,textAlign:"center",minWidth:110}}>
                      {editRoleName===r?(
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          <input value={editRoleValue} onChange={e=>setEditRoleValue(e.target.value)}
                            style={{border:"none",borderRadius:4,padding:"3px 6px",fontSize:12,width:80}}/>
                          <button onClick={()=>{setRoleLabels(p=>({...p,[r]:editRoleValue}));setEditRoleName(null);}}
                            style={{background:"#10b981",border:"none",color:"white",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:11}}>✓</button>
                        </div>
                      ):(
                        <div>
                          <div>{getRoleLabel(r)}</div>
                          <button onClick={()=>{setEditRoleName(r);setEditRoleValue(getRoleLabel(r));}}
                            style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:10,marginTop:4}}>✎</button>
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
                      <td colSpan={roles.length+1} style={{padding:"7px 10px",background:"#f0f4ff",fontWeight:700,fontSize:13,color:"#1A3A5C",borderTop:"2px solid #e2e8f0"}}>
                        — {category}
                      </td>
                    </tr>
                    {Object.entries(perms).map(([perm,rolePerms],i)=>(
                      <tr key={perm} style={{background:i%2===0?"white":"#f8fafc"}}>
                        <td style={{padding:"7px 10px",color:"#374151",position:"sticky",left:0,background:i%2===0?"white":"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>{perm}</td>
                        {roles.map(r=>(
                          <td key={r} style={{padding:"6px",textAlign:"center",borderBottom:"1px solid #f1f5f9"}}>
                            <input type="checkbox" checked={rolePerms[r]||false} onChange={()=>togglePerm(category,perm,r)}
                              style={{width:18,height:18,cursor:"pointer",accentColor:"#1A3A5C"}}/>
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
