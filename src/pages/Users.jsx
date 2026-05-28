import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, Modal, TabBar } from "../components/Shared.jsx";
import { DEPARTMENTS, ROLES, LOCATIONS, DCS, RC, RI, genId } from "../data/masterData.js";

export default function Users({ user, users, setUsers, requests, setRequests }) {
  const [tab, setTab] = useState("users");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [done, setDone] = useState("");
  const [form, setForm] = useState({
    empType:"authority", name:"", displayName:"", empId:"", mobile:"", email:"",
    dept:"", role:"viewonly", location:"Head Office", dc:"", viewDC:"all", reason:"",
    licNo:"", licExp:"", status:"Active"
  });

  const tabs = [["users","👥","All Users"],["requests","📝","Access Requests"],["form","➕","Add User"]];

  function save() {
    if(!form.name||!form.mobile||!form.dept) return;
    if(editUser) {
      setUsers(prev=>prev.map(u=>u.uid===editUser.uid?{...u,...form}:u));
      setDone("User updated!");
    } else {
      setUsers(prev=>[...prev,{ uid:`u${Date.now()}`, ...form, nameAr:form.name, uniqueRef:genId("USR") }]);
      setDone("User created!");
    }
    setShowForm(false); setEditUser(null);
    setTimeout(()=>setDone(""),3000);
  }

  function startEdit(u) {
    setEditUser(u);
    setForm({ empType:u.empType||"authority", name:u.name, displayName:u.displayName||"", empId:u.empId||"", mobile:u.phone||"", email:u.email||"", dept:u.dept||"", role:u.role, location:u.location||"", dc:u.dc||"", viewDC:u.viewDC||"all", reason:"", licNo:u.licNo||"", licExp:u.licExp||"", status:u.status||"Active" });
    setTab("form");
  }

  function toggleStatus(uid) {
    setUsers(prev=>prev.map(u=>u.uid===uid?{...u,status:u.status==="Active"?"Inactive":"Active"}:u));
  }

  function approveRequest(reqId, approved) {
    const req = requests.find(r=>r.reqId===reqId);
    if(approved && req) {
      const newUser = {
        uid:`u${Date.now()}`, name:req.name, displayName:req.displayName||req.name,
        empId:req.empId, phone:req.mobile, email:req.email, role:req.role,
        dept:req.dept, location:req.location||"Head Office", dc:req.dc||null,
        viewDC:req.viewDC||"all", status:"Active", licNo:req.licNo||null,
        licExp:req.licExp||null, uniqueRef:genId("USR")
      };
      setUsers(prev=>[...prev, newUser]);
    }
    setRequests(prev=>prev.map(r=>r.reqId===reqId?{
      ...r, status:approved?"approved":"rejected",
      adminApproval:approved?"approved":"rejected",
      adminName:user.name, adminDate:new Date().toLocaleDateString(),
      uniqueRef:approved?genId("USR"):null
    }:r));
    setDone(approved?"User approved and created!":"Request rejected.");
    setTimeout(()=>setDone(""),3000);
  }

  const pending = requests.filter(r=>r.status==="pending");

  return (
    <div>
      {done && <SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={t=>{setTab(t); if(t!=="form"){setEditUser(null); setForm({empType:"authority",name:"",displayName:"",empId:"",mobile:"",email:"",dept:"",role:"viewonly",location:"Head Office",dc:"",viewDC:"all",reason:"",licNo:"",licExp:"",status:"Active"});}}} />

      {/* USERS LIST */}
      {tab==="users" && (
        <div>
          {["admin","planning","manager","driver","viewonly"].map(role=>{
            const ru = users.filter(u=>u.role===role);
            if(!ru.length) return null;
            return (
              <Card key={role}>
                <CardTitle>{RI[role]} {role.charAt(0).toUpperCase()+role.slice(1)} ({ru.length})</CardTitle>
                {ru.map(u=>(
                  <div key={u.uid} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:RC[role],display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:14,flexShrink:0}}>{u.name.charAt(0)}</div>
                    <div style={{flex:1,minWidth:160}}>
                      <div style={{fontWeight:600,fontSize:14}}>{u.name} <span style={{fontSize:12,color:"#94a3b8"}}>({u.displayName||u.name})</span></div>
                      <div style={{fontSize:12,color:"#64748b"}}>{u.email} | {u.phone} {u.dc&&`| ${u.dc} DC`}</div>
                      <div style={{fontSize:11,color:"#94a3b8"}}>{u.dept} {u.empId&&`| ${u.empId}`} {u.uniqueRef&&`| ${u.uniqueRef}`}</div>
                    </div>
                    <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:u.status==="Active"?"#d1fae5":"#fee2e2",color:u.status==="Active"?"#065f46":"#991b1b"}}>{u.status||"Active"}</span>
                    <div style={{display:"flex",gap:6}}>
                      <Btn small onClick={()=>startEdit(u)} color="#6366f1">✎ Edit</Btn>
                      <Btn small onClick={()=>toggleStatus(u.uid)} color={u.status==="Active"?"#ef4444":"#10b981"}>{u.status==="Active"?"Deactivate":"Activate"}</Btn>
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {/* REQUESTS */}
      {tab==="requests" && (
        <div>
          {pending.length===0 && <Card><div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>No pending requests</div></Card>}
          {requests.map(req=>(
            <Card key={req.reqId} style={{borderLeft:`4px solid ${req.status==="pending"?"#f59e0b":req.status==="approved"?"#10b981":"#ef4444"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15}}>{req.name} <span style={{fontSize:12,color:"#64748b"}}>({req.empType})</span></div>
                  <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{req.dept} | {req.role} | {req.mobile}</div>
                  <div style={{fontSize:13,color:"#374151",marginTop:4}}>📝 {req.reason}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Requested by: {req.requestedBy} | Date: {req.reqDate} | Ref: {req.reqId}</div>
                  {req.dcManagerApproval && <div style={{fontSize:11,color:"#10b981"}}>✅ DC Manager: {req.dcManagerName} ({req.dcManagerDate})</div>}
                  {req.uniqueRef && <div style={{fontSize:11,color:"#6366f1",fontWeight:600}}>User Ref: {req.uniqueRef}</div>}
                </div>
                <div>
                  <span style={{fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99,background:req.status==="pending"?"#fef3c7":req.status==="approved"?"#d1fae5":"#fee2e2",color:req.status==="pending"?"#92400e":req.status==="approved"?"#065f46":"#991b1b"}}>{req.status.toUpperCase()}</span>
                  {req.status==="pending" && (
                    <div style={{display:"flex",gap:6,marginTop:8}}>
                      <Btn small onClick={()=>approveRequest(req.reqId,true)} color="#10b981">✅ Approve</Btn>
                      <Btn small onClick={()=>approveRequest(req.reqId,false)} color="#ef4444">❌ Reject</Btn>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FORM */}
      {tab==="form" && (
        <Card>
          <CardTitle>{editUser?"Edit User":"Add New User"}</CardTitle>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>Employee Type *</label>
            <div style={{display:"flex",gap:8}}>
              {[["authority","🏢 Authority"],["driver","🚚 Driver"]].map(([v,l])=>(
                <button key={v} onClick={()=>setForm({...form,empType:v,role:v==="driver"?"driver":"viewonly"})}
                  style={{flex:1,border:`2px solid ${form.empType===v?"#6366f1":"#e2e8f0"}`,background:form.empType===v?"#eef2ff":"white",borderRadius:8,padding:10,cursor:"pointer",fontSize:13,fontWeight:600,color:form.empType===v?"#4338ca":"#64748b"}}>{l}</button>
              ))}
            </div>
          </div>

          {form.empType==="authority" ? (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
              <div style={{gridColumn:"1/-1"}}><Input label="Full Name" value={form.name} onChange={v=>setForm({...form,name:v})} required /></div>
              <div style={{gridColumn:"1/-1"}}><Input label="Display Name in System" value={form.displayName} onChange={v=>setForm({...form,displayName:v})} placeholder="Short name shown in app" required /></div>
              <Input label="Employee ID" value={form.empId} onChange={v=>setForm({...form,empId:v})} placeholder="EMP-XXX" />
              <Input label="Mobile Number" value={form.mobile} onChange={v=>setForm({...form,mobile:v})} placeholder="05XXXXXXXX" required />
              <div style={{gridColumn:"1/-1"}}><Input label="Email Address" value={form.email} onChange={v=>setForm({...form,email:v})} type="email" /></div>
              <Select label="Department" value={form.dept} onChange={v=>setForm({...form,dept:v})} options={DEPARTMENTS} required />
              <Select label="Role" value={form.role} onChange={v=>setForm({...form,role:v})} options={["admin","planning","manager","viewonly"]} required />
              <Select label="Location" value={form.location} onChange={v=>setForm({...form,location:v})} options={LOCATIONS} />
              <Select label="DC Access" value={form.dc} onChange={v=>setForm({...form,dc:v})} options={["","Riyadh","Jeddah","Dammam"]} placeholder="All DCs" />
              <div style={{gridColumn:"1/-1"}}><Textarea label="Reason / Notes" value={form.reason} onChange={v=>setForm({...form,reason:v})} /></div>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
              <div style={{gridColumn:"1/-1"}}><Input label="Full Name" value={form.name} onChange={v=>setForm({...form,name:v})} required /></div>
              <Input label="Employee ID" value={form.empId} onChange={v=>setForm({...form,empId:v})} placeholder="DRV-XXX" />
              <Input label="Mobile Number" value={form.mobile} onChange={v=>setForm({...form,mobile:v})} required />
              <div style={{gridColumn:"1/-1"}}><Input label="Email" value={form.email} onChange={v=>setForm({...form,email:v})} type="email" /></div>
              <Select label="DC Assignment" value={form.dc} onChange={v=>setForm({...form,dc:v})} options={DCS} required />
              <Select label="Department" value={form.dept} onChange={v=>setForm({...form,dept:v})} options={DEPARTMENTS} required />
              <Input label="License Number" value={form.licNo} onChange={v=>setForm({...form,licNo:v})} required />
              <Input label="License Expiry" value={form.licExp} onChange={v=>setForm({...form,licExp:v})} type="date" required />
              <div style={{gridColumn:"1/-1"}}><Textarea label="Reason / Notes" value={form.reason} onChange={v=>setForm({...form,reason:v})} /></div>
            </div>
          )}

          <div style={{background:"#f0f9ff",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#0369a1",marginBottom:16}}>
            Default password: <b>spco2026</b> — User must change on first login
          </div>
          <Btn onClick={save} color="#10b981" style={{width:"100%"}}>✅ {editUser?"Update User":"Create User"}</Btn>
        </Card>
      )}
    </div>
  );
}
