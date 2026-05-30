import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { DEPARTMENTS, RC, RI, genId } from "../data/masterData.js";

const LOCATIONS = ["Distribution Center - Riyadh","Distribution Center - Jeddah","Distribution Center - Dammam","Head Office"];
const LOCATION_TO_DC = { "Distribution Center - Riyadh":"Riyadh","Distribution Center - Jeddah":"Jeddah","Distribution Center - Dammam":"Dammam","Head Office":null };

const ROLE_LABELS = {
  en:{ admin:"System Administrator",planning:"Planning",manager:"Distribution Center Manager",driver:"Delivery Driver",viewonly:"View Only" },
  ar:{ admin:"مدير النظام",planning:"التخطيط",manager:"مدير مركز التوزيع",driver:"سائق التسليم",viewonly:"عرض فقط" }
};

const T = {
  en:{
    userDir:"User Directory",accessReq:"Access Requests",newUser:"New User",myRequest:"Submit Request",
    empType:"Employee Type",systemUser:"🏢 System User",driver:"🚚 Delivery Driver",
    fullName:"Full Name",displayName:"Display Name in System",empId:"Employee ID",
    mobile:"Mobile Number",email:"Email Address",location:"Location",dept:"Department",role:"Role",
    licNo:"License Number",licExp:"License Expiry",driverCard:"Driver Card Number",driverCardExp:"Driver Card Expiry",
    reason:"Reason / Notes",edit:"Edit",activate:"Activate",deactivate:"Deactivate",
    save:"Save Changes",create:"Create User",cancel:"Cancel",
    approve:"✅ Approve",reject:"❌ Reject",noPending:"No pending requests",
    requestedBy:"Requested by",requestSent:"Request submitted!",defPass:"Default password: spco2026",
    updated:"User updated!",created:"User created!",approvedMsg:"User approved!",rejectedMsg:"Request rejected."
  },
  ar:{
    userDir:"دليل المستخدمين",accessReq:"طلبات الوصول",newUser:"مستخدم جديد",myRequest:"تقديم طلب",
    empType:"نوع الموظف",systemUser:"🏢 مستخدم النظام",driver:"🚚 سائق التسليم",
    fullName:"الاسم الكامل",displayName:"اسم العرض في النظام",empId:"رقم الموظف",
    mobile:"رقم الجوال",email:"البريد الإلكتروني",location:"الموقع",dept:"القسم",role:"الدور",
    licNo:"رقم الرخصة",licExp:"انتهاء الرخصة",driverCard:"رقم بطاقة السائق",driverCardExp:"انتهاء بطاقة السائق",
    reason:"السبب",edit:"تعديل",activate:"تفعيل",deactivate:"تعطيل",
    save:"حفظ التغييرات",create:"إنشاء مستخدم",cancel:"إلغاء",
    approve:"موافقة",reject:"رفض",noPending:"لا توجد طلبات معلقة",
    requestedBy:"طلب بواسطة",requestSent:"تم إرسال الطلب!",defPass:"كلمة المرور: spco2026",
    updated:"تم التحديث",created:"تم الإنشاء",approvedMsg:"تمت الموافقة",rejectedMsg:"تم الرفض"
  }
};

const EMPTY_FORM = { empType:"systemuser",name:"",displayName:"",empId:"",mobile:"",email:"",location:"Head Office",dept:"",role:"viewonly",dc:"",viewDC:"all",reason:"",licNo:"",licExp:"",driverCard:"",driverCardExp:"",status:"Active" };

export default function Users({ user, users, setUsers, requests, setRequests, lang }) {
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const rl = ROLE_LABELS[lang]||ROLE_LABELS.en;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";

  const adminTabs = [["users","👥",t.userDir],["requests","📝",t.accessReq],["add","➕",t.newUser]];
  const managerTabs = [["requests","📝",t.accessReq],["add","➕",t.myRequest]];
  const otherTabs = [["add","➕",t.myRequest]];
  const tabs = isAdmin?adminTabs:isManager?managerTabs:otherTabs;

  const [tab, setTab] = useState(tabs[0][0]);
  const [editUser, setEditUser] = useState(null);
  const [editReq, setEditReq] = useState(null);
  const [done, setDone] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [reqEditForm, setReqEditForm] = useState(null);

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),3000); }
  function resetForm() { setForm(EMPTY_FORM); setEditUser(null); }

  function F(key,val) {
    const updated = {...form,[key]:val};
    if (key==="location") { const dc=LOCATION_TO_DC[val]||""; updated.dc=dc; updated.viewDC=dc||"all"; }
    if (key==="empType"&&val==="driver"&&isManager) { updated.dc=user.dc||""; updated.location=user.location||"Head Office"; }
    setForm(updated);
  }

  function save() {
    if (!form.name||!form.mobile) return;
    if (isAdmin) {
      if (editUser) { setUsers(prev=>prev.map(u=>u.uid===editUser.uid?{...u,...form}:u)); flash(t.updated); }
      else { setUsers(prev=>[...prev,{uid:"u"+Date.now(),...form,nameAr:form.name,uniqueRef:genId("USR")}]); flash(t.created); }
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
    const req = requests.find(r=>r.reqId===reqId);
    if (approved&&req) setUsers(prev=>[...prev,{uid:"u"+Date.now(),name:req.name,displayName:req.displayName||req.name,empId:req.empId,phone:req.mobile,email:req.email,role:req.role,dept:req.dept,location:req.location||"Head Office",dc:req.dc||null,viewDC:req.viewDC||"all",status:"Active",licNo:req.licNo||null,licExp:req.licExp||null,driverCard:req.driverCard||null,driverCardExp:req.driverCardExp||null,uniqueRef:genId("USR")}]);
    setRequests(prev=>prev.map(r=>r.reqId===reqId?{...r,status:approved?"approved":"rejected",adminName:user.name,adminDate:new Date().toLocaleDateString(),uniqueRef:approved?genId("USR"):null}:r));
    flash(approved?t.approvedMsg:t.rejectedMsg);
    setEditReq(null); setReqEditForm(null);
  }

  function saveReqEdit() {
    if (!reqEditForm) return;
    setRequests(prev=>prev.map(r=>r.reqId===editReq?{...r,...reqEditForm}:r));
    flash(t.updated);
    setEditReq(null); setReqEditForm(null);
  }

  const isDriver = form.empType==="driver";

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={t2=>{setTab(t2);if(t2!=="add")resetForm();}} />

      {/* USER DIRECTORY */}
      {tab==="users"&&isAdmin&&(
        <div>
          {["admin","planning","manager","driver","viewonly"].map(role=>{
            const ru=users.filter(u=>u.role===role);
            if(!ru.length) return null;
            return (
              <Card key={role}>
                <CardTitle>{RI[role]} {rl[role]} ({ru.length})</CardTitle>
                {ru.map(u=>(
                  <div key={u.uid} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap" }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:RC[role],display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:14,flexShrink:0 }}>{u.name.charAt(0)}</div>
                    <div style={{ flex:1,minWidth:160 }}>
                      <div style={{ fontWeight:600,fontSize:14 }}>{u.name} <span style={{ fontSize:12,color:"#94a3b8" }}>({u.displayName||u.name})</span></div>
                      <div style={{ fontSize:12,color:"#64748b" }}>{u.email} | {u.phone||u.mobile}</div>
                      <div style={{ fontSize:11,color:"#94a3b8" }}>{u.location} {u.dept&&"| "+u.dept} {u.uniqueRef&&"| "+u.uniqueRef}</div>
                      {u.licNo&&<div style={{ fontSize:11,color:"#6366f1" }}>📄 Lic: {u.licNo} | Exp: {u.licExp}</div>}
                      {u.driverCard&&<div style={{ fontSize:11,color:"#0891b2" }}>📷 Card: {u.driverCard} | Exp: {u.driverCardExp}</div>}
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
                  <CardTitle>✎ Edit Request — {req.name}</CardTitle>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
                    <Input label={t.fullName} value={reqEditForm.name} onChange={v=>setReqEditForm({...reqEditForm,name:v})} />
                    <Input label={t.mobile} value={reqEditForm.mobile} onChange={v=>setReqEditForm({...reqEditForm,mobile:v})} />
                    <Input label={t.email} value={reqEditForm.email} onChange={v=>setReqEditForm({...reqEditForm,email:v})} />
                    <Input label={t.empId} value={reqEditForm.empId||""} onChange={v=>setReqEditForm({...reqEditForm,empId:v})} />
                    <Select label={t.location} value={reqEditForm.location||"Head Office"} onChange={v=>setReqEditForm({...reqEditForm,location:v})} options={LOCATIONS} />
                    <Select label={t.dept} value={reqEditForm.dept||""} onChange={v=>setReqEditForm({...reqEditForm,dept:v})} options={DEPARTMENTS} />
                    <Select label={t.role} value={reqEditForm.role||"viewonly"} onChange={v=>setReqEditForm({...reqEditForm,role:v})} options={[{value:"admin",label:rl.admin},{value:"planning",label:rl.planning},{value:"manager",label:rl.manager},{value:"driver",label:rl.driver},{value:"viewonly",label:rl.viewonly}]} />
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
                    <div style={{ fontSize:13,color:"#64748b",marginTop:2 }}>{req.dept} | {rl[req.role]||req.role} | {req.mobile}</div>
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

      {/* ADD / EDIT FORM */}
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
            <Input label={t.mobile+" *"} value={form.mobile} onChange={v=>F("mobile",v)} placeholder="05XXXXXXXX" required />
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
              isAdmin&&<Select label={t.role} value={form.role} onChange={v=>F("role",v)} options={[{value:"admin",label:rl.admin},{value:"planning",label:rl.planning},{value:"manager",label:rl.manager},{value:"viewonly",label:rl.viewonly}]} />
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
    </div>
  );
}
