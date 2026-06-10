import { useState, useEffect, useRef } from "react";
import { Card, CardTitle, Btn, SuccessMsg, Badge } from "../components/Shared.jsx";
import CameraCapture from "../components/CameraCapture.jsx";
import { updateDoc, doc, addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { sendNotification } from "../notificationService.js";
import { useSettings } from "../context/SettingsContext.jsx";

const T = {
  en: {
    pending:"Staged for Dispatch", completed:"Completed Today", remaining:"Remaining",
    inCity:"In-City", outCity:"Out-City", startDelivery:"Start Delivery",
    gpsStep:"Step 1: Get GPS Location (Required)",
    podStep:"Step 2: Take POD Photo (Required)",
    markDelivered:"Mark Delivered", markFailed:"Mark Failed", cancel:"Cancel",
    getGPS:"Get My Location", gettingGPS:"Getting location...",
    allDone:"All deliveries completed! Great work.",
    podRequired:"Please take POD photo first",
    gpsRequired:"Please get GPS location first",
    vehicle:"Assigned Vehicle", vehicleAlerts:"Vehicle Alerts",
    maintenance:"Under Maintenance", lowFuel:"Low Fuel Warning",
    expirySoon:"Document Expiring Soon",
    startTrip:"Start Trip", endTrip:"End Trip", tripActive:"Trip Active",
    elapsed:"Elapsed", distance:"Distance",
    history:"Delivery History",
    histDate:"Date", histVehicle:"Vehicle #", histInvoices:"Invoices",
    histStatus:"Status", histDistance:"Distance (km)", histSuccess:"Success Rate",
    histType:"Type", noHistory:"No delivery history yet",
    tripStarted:"Trip started! Timer running.", tripEnded:"Trip ended.",
    failReason:"Reason for Failed Delivery *", failReasonPlaceholder:"Select reason...",
    failReasonRequired:"Please select reason for failed delivery",
    fuelInsufficient:"Cannot end trip — fuel insufficient. Please add fuel entry first.",
    halfDay:"Half Day recorded", fullDay:"Full Day recorded",
    kmCovered:"KM Covered", fuelDeducted:"Fuel Deducted",
    tripSaved:"Trip saved to records!",
    odometerRequired:"Odometer photo and reading are required to end trip",
    odometerPhoto:"Odometer Photo *", odometerReading:"Current Odometer Reading (KM) *",
    odometerPlaceholder:"e.g. 45230", confirmEndTrip:"Confirm End Trip",
    odometerStep:"Step: Take Odometer Photo & Enter Reading",
    cancelEndTrip:"Cancel — Continue Trip",
    kmMismatch:"Warning: GPS distance and odometer difference is more than 20%. Please verify.",
    fuelTab:"Fuel Entry", fuelVehicle:"Vehicle *", fuelLiters:"Liters Added *",
    fuelSAR:"Cost (SAR) *", fuelStation:"Station / Supplier", fuelReceiptNo:"Receipt No.",
    fuelOdometer:"Current Odometer (KM)", fuelNotes:"Notes",
    fuelSubmit:"Submit Fuel Entry", fuelSubmitting:"Submitting...",
    fuelPending:"Pending Approval", fuelApproved:"Approved", fuelRejected:"Rejected",
    fuelSubmitted:"Fuel entry submitted — pending manager approval ✅",
    fuelNoVehicle:"No vehicle assigned to you today",
    fuelHistory:"My Fuel Entries",
  },
  ar: {
    pending:"مرحلة الإرسال", completed:"مكتملة اليوم", remaining:"المتبقي",
    inCity:"داخل المدينة", outCity:"خارج المدينة", startDelivery:"بدء التسليم",
    gpsStep:"الخطوة 1: تحديد الموقع (مطلوب)",
    podStep:"الخطوة 2: صورة إثبات التسليم (مطلوبة)",
    markDelivered:"تسليم ناجح", markFailed:"تسليم فاشل", cancel:"إلغاء",
    getGPS:"تحديد موقعي", gettingGPS:"جاري تحديد الموقع...",
    allDone:"تم إكمال جميع التسليمات!",
    podRequired:"يرجى التقاط صورة أولاً",
    gpsRequired:"يرجى تحديد الموقع أولاً",
    vehicle:"المركبة المخصصة", vehicleAlerts:"تنبيهات المركبة",
    maintenance:"تحت الصيانة", lowFuel:"وقود منخفض",
    expirySoon:"وثيقة ستنتهي قريباً",
    startTrip:"بدء الرحلة", endTrip:"إنهاء الرحلة", tripActive:"الرحلة نشطة",
    elapsed:"الوقت المنقضي", distance:"المسافة",
    history:"سجل التسليم",
    histDate:"التاريخ", histVehicle:"رقم المركبة", histInvoices:"الفواتير",
    histStatus:"الحالة", histDistance:"المسافة (كم)", histSuccess:"معدل النجاح",
    histType:"النوع", noHistory:"لا يوجد سجل تسليم",
    tripStarted:"بدأت الرحلة!", tripEnded:"انتهت الرحلة.",
    failReason:"سبب فشل التسليم *", failReasonPlaceholder:"اختر السبب...",
    failReasonRequired:"يرجى اختيار سبب فشل التسليم",
    fuelInsufficient:"لا يمكن إنهاء الرحلة — الوقود غير كافٍ. يرجى إضافة وقود أولاً.",
    halfDay:"تم تسجيل نصف يوم", fullDay:"تم تسجيل يوم كامل",
    kmCovered:"كم مقطوعة", fuelDeducted:"وقود مستهلك",
    tripSaved:"تم حفظ الرحلة في السجلات!",
    odometerRequired:"صورة العداد والقراءة مطلوبة لإنهاء الرحلة",
    odometerPhoto:"صورة عداد المسافة *", odometerReading:"قراءة العداد الحالية (كم) *",
    odometerPlaceholder:"مثال: 45230", confirmEndTrip:"تأكيد إنهاء الرحلة",
    odometerStep:"الخطوة: التقط صورة العداد وأدخل القراءة",
    cancelEndTrip:"إلغاء — متابعة الرحلة",
    kmMismatch:"تحذير: الفرق بين المسافة عبر GPS وقراءة العداد أكثر من 20%. يرجى التحقق.",
    fuelTab:"إدخال وقود", fuelVehicle:"المركبة *", fuelLiters:"اللترات المضافة *",
    fuelSAR:"التكلفة (ريال) *", fuelStation:"المحطة / المورد", fuelReceiptNo:"رقم الإيصال",
    fuelOdometer:"قراءة العداد الحالية (كم)", fuelNotes:"ملاحظات",
    fuelSubmit:"إرسال إدخال الوقود", fuelSubmitting:"جاري الإرسال...",
    fuelPending:"في انتظار الموافقة", fuelApproved:"موافق عليه", fuelRejected:"مرفوض",
    fuelSubmitted:"تم إرسال إدخال الوقود — في انتظار موافقة المدير ✅",
    fuelNoVehicle:"لا توجد مركبة مخصصة لك اليوم",
    fuelHistory:"سجل الوقود",
  }
};

// Calculate distance between 2 GPS points (Haversine formula)
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function Driver({ user, invoices, setInvoices, vehicles, lang }) {
  const [active, setActive] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [gps, setGps] = useState(null);
  const [locating, setLocating] = useState(false);
  const [pod, setPod] = useState(null);
  const [done, setDone] = useState("");
  const [failReason, setFailReason] = useState("");
  const [showFailForm, setShowFailForm] = useState(false);

  // Odometer state — shown before trip end
  const [showOdometerForm, setShowOdometerForm] = useState(false);
  const [odometerPhoto, setOdometerPhoto] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [odometerWarning, setOdometerWarning] = useState("");

  // Trip tracking
  const [tripStarted, setTripStarted] = useState(false);
  const [tripStartTime, setTripStartTime] = useState(null);
  const [tripStartGPS, setTripStartGPS] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [totalKM, setTotalKM] = useState(0);
  const [lastGPS, setLastGPS] = useState(null);
  const [view, setView] = useState("deliveries");
  const timerRef = useRef(null);
  const gpsWatchRef = useRef(null);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("driver_history_"+user.uid)||"[]"); } catch { return []; }
  });

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const { failedReasons } = useSettings();

  // ── Fuel Entry state ──
  const [fuelForm, setFuelForm] = useState({ liters:"", sar:"", station:"", receiptNo:"", odometer:"", notes:"" });
  const [fuelSubmitting, setFuelSubmitting] = useState(false);
  const [myFuelEntries, setMyFuelEntries] = useState([]);
  const [fuelLoaded, setFuelLoaded] = useState(false);

  const allMyInv = invoices.filter(i=>i.driverId===user.uid);
  const myInv = allMyInv.filter(i=>i.status==="assigned"); // pending delivery
  const deliveredInv = allMyInv.filter(i=>i.status==="delivered");
  const failedInv = allMyInv.filter(i=>i.status==="failed");
  const pending = myInv.filter(i=>!completed.includes(i.id));
  const doneList = myInv.filter(i=>completed.includes(i.id));
  const inCity = pending.filter(i=>i.dtype==="incity");
  const outCity = pending.filter(i=>i.dtype==="outcity");

  const assignedVehiclePlate = myInv.length>0?myInv[0].vehicle:null;
  const assignedVehicle = assignedVehiclePlate&&vehicles?vehicles.find(v=>v.plate===assignedVehiclePlate):null;

  const vAlerts = [];
  if (assignedVehicle) {
    if (assignedVehicle.status==="Maintenance") vAlerts.push({type:"error",msg:t.maintenance});
    if ((assignedVehicle.fuelLevel||0)/(assignedVehicle.fuelCapacity||80)<0.25) vAlerts.push({type:"warning",msg:t.lowFuel+": "+(assignedVehicle.fuelLevel||0)+"L"});
    if (assignedVehicle.fahas&&Math.ceil((new Date(assignedVehicle.fahas)-new Date())/(1000*60*60*24))<=30) vAlerts.push({type:"warning",msg:"Fahas "+t.expirySoon});
  }

  // Timer
  useEffect(() => {
    if (tripStarted) {
      timerRef.current = setInterval(() => setElapsed(prev=>prev+1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [tripStarted]);

  // GPS watch during trip — real distance tracking
  useEffect(() => {
    if (tripStarted && navigator.geolocation) {
      gpsWatchRef.current = navigator.geolocation.watchPosition(
        pos => {
          const newGPS = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLastGPS(prev => {
            if (prev) {
              const km = calcDistance(prev.lat, prev.lng, newGPS.lat, newGPS.lng);
              if (km > 0.01) { // ignore tiny movements
                setTotalKM(d => Math.round((d + km) * 10) / 10);
              }
            }
            return newGPS;
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    } else {
      if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);
    }
    return () => { if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current); };
  }, [tripStarted]);

  function formatTime(secs) {
    const h = Math.floor(secs/3600);
    const m = Math.floor((secs%3600)/60);
    const s = secs%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  function startTrip() {
    // Get start GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => {
          const startGPS = { lat: p.coords.latitude, lng: p.coords.longitude };
          setTripStartGPS(startGPS);
          setLastGPS(startGPS);
        },
        () => {}
      );
    }
    setTripStarted(true);
    setTripStartTime(new Date());
    setElapsed(0);
    setTotalKM(0);
    setDone(t.tripStarted);
    setTimeout(()=>setDone(""),3000);
  }

  // Step 1: Show odometer form when End Trip clicked
  function handleEndTripClick() {
    if (!tripStarted) return;
    setShowOdometerForm(true);
    setOdometerWarning("");
  }

  // Step 2: Validate odometer and end trip
  async function endTrip() {
    if (!odometerPhoto) { setOdometerWarning(t.odometerRequired); return; }
    if (!odometerReading || isNaN(Number(odometerReading)) || Number(odometerReading) <= 0) {
      setOdometerWarning(t.odometerRequired); return;
    }

    // KM mismatch warning (GPS vs Odometer)
    const odomKM = Number(odometerReading);
    const prevKM = assignedVehicle?.totalKM || 0;
    const odomTripKM = odomKM - prevKM;
    if (odomTripKM > 0 && totalKM > 0) {
      const diff = Math.abs(odomTripKM - totalKM) / Math.max(odomTripKM, totalKM);
      if (diff > 0.2) setOdometerWarning(t.kmMismatch);
      else setOdometerWarning("");
    }

    setShowOdometerForm(false);
    setTripStarted(false);
    if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);

    const endTime = new Date();
    const startDate = tripStartTime ? tripStartTime.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const endDate = endTime.toISOString().split("T")[0];
    const endHour = endTime.getHours();

    const isHalfDay = endDate === startDate && endHour < 12;
    const isMultiDay = endDate !== startDate;
    const daysActive = isMultiDay
      ? ((endTime - tripStartTime) / (1000*60*60*24))
      : isHalfDay ? 0.5 : 1.0;

    const totalInv = doneList.length + pending.length;
    const successRate = totalInv>0?Math.round(doneList.length/totalInv*100):0;
    const mileage = assignedVehicle?.mileage || 12;
    const fuelUsed = totalKM > 0 ? Math.round((totalKM / mileage) * 10) / 10 : 0;

    // Fuel validation — agar fuel insufficient ho toh trip end nahi hogi
    const currentFuel = assignedVehicle?.fuelLevel || 0;
    if (fuelUsed > currentFuel) {
      setOdometerWarning(t.fuelInsufficient);
      return;
    }

    const entry = {
      driverId: user.uid,
      driverName: user.name,
      dc: user.dc,
      vehiclePlate: assignedVehiclePlate || "-",
      startDate, endDate,
      startTime: tripStartTime?.toLocaleTimeString() || "-",
      endTime: endTime.toLocaleTimeString(),
      totalKM, fuelUsed,
      odometerReading: Number(odometerReading),
      odometerPhotoUrl: odometerPhoto,
      invoices: totalInv,
      delivered: doneList.length,
      failed: pending.length,
      successRate,
      inCity: myInv.filter(i=>i.dtype==="incity").length,
      outCity: myInv.filter(i=>i.dtype==="outcity").length,
      duration: formatTime(elapsed),
      isHalfDay, isMultiDay, daysActive,
      createdAt: new Date().toISOString()
    };

    try { await addDoc(collection(db, "tripLogs"), entry); }
    catch(e) { console.error("TripLog save error:", e); }

    // Update vehicle — totalKM from odometer reading + fuelLevel
    if (assignedVehicle?.firestoreId) {
      try {
        const newFuel = Math.max(0, (assignedVehicle.fuelLevel||0) - fuelUsed);
        await updateDoc(doc(db,"vehicles",assignedVehicle.firestoreId), {
          totalKM: Number(odometerReading),
          fuelLevel: newFuel,
          lastOdometerPhoto: odometerPhoto
        });
      } catch(e) { console.error("Vehicle update error:", e); }
    }

    // Save to local history
    const histEntry = {
      date: startDate, vehicle: assignedVehiclePlate||"-",
      invoices: totalInv, delivered: doneList.length,
      distance: totalKM, odometerReading: Number(odometerReading),
      successRate,
      inCity: myInv.filter(i=>i.dtype==="incity").length,
      outCity: myInv.filter(i=>i.dtype==="outcity").length,
      duration: formatTime(elapsed),
      startTime: tripStartTime?.toLocaleTimeString()||"-",
      endTime: endTime.toLocaleTimeString(),
      fuelUsed, isHalfDay, daysActive
    };
    const newHistory = [histEntry,...history].slice(0,30);
    setHistory(newHistory);
    try { localStorage.setItem("driver_history_"+user.uid, JSON.stringify(newHistory)); } catch{}

    // Reset odometer state
    setOdometerPhoto("");
    setOdometerReading("");
    setOdometerWarning("");

    const dayMsg = isHalfDay ? t.halfDay : t.fullDay;
    setDone(`🏁 ${t.tripEnded} ${totalKM} ${t.kmCovered} | ⛽ ${fuelUsed}L ${t.fuelDeducted} | ${dayMsg}`);
    setTimeout(()=>setDone(""),6000);
  }

  function getGPS() {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p=>{setGps({lat:p.coords.latitude,lng:p.coords.longitude});setLocating(false);},
        ()=>{setGps({lat:24.7136,lng:46.6753});setLocating(false);}
      );
    } else { setGps({lat:24.7136,lng:46.6753}); setLocating(false); }
  }

  async function submit(inv, status) {
    if (status==="delivered" && !pod) { alert(t.podRequired); return; }
    if (status==="delivered" && !gps) { alert(t.gpsRequired); return; }
    if (status==="failed" && !failReason.trim()) { alert(t.failReasonRequired); return; }

    const updateData = {
      status,
      podImage: pod || null,
      gps: gps || null,
      deliveredAt: new Date().toLocaleString(),
      attempts: (inv.attempts||0)+1,
      failReason: status==="failed" ? failReason : null,
      driverName: user.name
    };

    if (inv.firestoreId) {
      try { await updateDoc(doc(db,"invoices",inv.firestoreId), updateData); } catch(e) { console.error(e); }
    }
    setInvoices(prev=>prev.map(i=>i.id===inv.id?{...i,...updateData}:i));
    setCompleted(p=>[...p,inv.id]);

    // Notification to DC Manager
    if (status==="delivered") {
      await sendNotification({
        toRole: "manager", toDC: inv.dc,
        type: "delivered",
        title: "Invoice Delivered ✅",
        message: `Invoice ${inv.id} (${inv.customer}) successfully delivered by ${user.name}.`,
      });
      await sendNotification({
        toRole: "logistic", toDC: inv.dc,
        type: "delivered",
        title: "Invoice Delivered ✅",
        message: `Invoice ${inv.id} (${inv.customer}) delivered by ${user.name}.`,
      });
    } else if (status==="failed") {
      await sendNotification({
        toRole: "manager", toDC: inv.dc,
        type: "failed",
        title: "Invoice Delivery Failed ❌",
        message: `Invoice ${inv.id} (${inv.customer}) failed by ${user.name}. Reason: ${failReason}. Please re-assign.`,
      });
      await sendNotification({
        toRole: "logistic", toDC: inv.dc,
        type: "failed",
        title: "Invoice Delivery Failed ❌",
        message: `Invoice ${inv.id} (${inv.customer}) failed. Reason: ${failReason}.`,
      });
    }

    setDone(status==="delivered"?"✅ "+inv.id+" delivered!":"❌ "+inv.id+" failed — "+failReason);
    setActive(null); setPod(null); setGps(null); setFailReason(""); setShowFailForm(false);
    setTimeout(()=>setDone(""),3000);
  }

  function InvCard({ inv }) {
    return (
      <Card>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6 }}>
          <span style={{ fontWeight:700,fontSize:15,color:"#6366f1" }}>{inv.id}</span>
          <span style={{ fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:6,background:inv.dtype==="incity"?"#dbeafe":"#fef3c7",color:inv.dtype==="incity"?"#1e40af":"#92400e" }}>
            {inv.dtype==="incity"?"🏙️ "+t.inCity:"🛣️ "+t.outCity}
          </span>
        </div>
        <div style={{ fontWeight:700,fontSize:16,color:"#0f172a",marginBottom:4 }}>{inv.customer}</div>
        <div style={{ fontSize:14,color:"#64748b",marginBottom:4 }}>📍 {inv.city} | 🌡️ {inv.storage}</div>
        {inv.vehicle&&<div style={{ fontSize:14,color:"#64748b",marginBottom:4 }}>🚗 {inv.vehicle}</div>}

        {active?.id===inv.id?(
          <div style={{ marginTop:14,border:"1px solid #e2e8f0",borderRadius:10,padding:16,background:"#f8fafc" }}>

            {/* Step 1 — GPS */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700,fontSize:15,marginBottom:8,color:"#1A3A5C" }}>{t.gpsStep}</div>
              <button onClick={getGPS} disabled={locating}
                style={{ background:gps?"#10b981":"#0ea5e9",color:"white",border:"none",padding:"12px 16px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14,width:"100%" }}>
                {locating?t.gettingGPS:gps?"✅ GPS: "+gps.lat.toFixed(4)+", "+gps.lng.toFixed(4):"📍 "+t.getGPS}
              </button>
            </div>

            {/* Step 2 — POD Photo */}
            {!showFailForm&&(
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:15,marginBottom:8,color:"#1A3A5C" }}>{t.podStep}</div>
                <CameraCapture
                  label=""
                  value={pod||""}
                  onChange={url=>setPod(url)}
                  folder="pod"
                  lang={lang}
                  required
                />
              </div>
            )}

            {/* Failed Reason — dropdown */}
            {showFailForm&&(
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:15,marginBottom:8,color:"#ef4444" }}>{t.failReason}</div>
                <select
                  value={failReason}
                  onChange={e=>setFailReason(e.target.value)}
                  style={{ width:"100%",border:"1.5px solid #fca5a5",borderRadius:8,padding:"11px 12px",fontSize:14,outline:"none",boxSizing:"border-box",background:"white" }}
                >
                  <option value="">{t.failReasonPlaceholder}</option>
                  {(failedReasons.length?failedReasons:["Customer Absent","Address Not Found","Refused Delivery","Damaged Goods","Wrong Item","Rescheduled by Customer","Other"]).map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {!showFailForm?(
                <>
                  <button onClick={()=>submit(inv,"delivered")}
                    style={{ flex:1,background:"#10b981",color:"white",border:"none",padding:"12px 0",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>
                    ✅ {t.markDelivered}
                  </button>
                  <button onClick={()=>setShowFailForm(true)}
                    style={{ flex:1,background:"#ef4444",color:"white",border:"none",padding:"12px 0",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>
                    ❌ {t.markFailed}
                  </button>
                </>
              ):(
                <>
                  <button onClick={()=>submit(inv,"failed")}
                    style={{ flex:1,background:"#ef4444",color:"white",border:"none",padding:"12px 0",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>
                    ❌ {t.markFailed}
                  </button>
                  <button onClick={()=>setShowFailForm(false)}
                    style={{ background:"#f1f5f9",border:"none",padding:"12px 16px",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14,color:"#64748b" }}>
                    ← Back
                  </button>
                </>
              )}
              <button onClick={()=>{setActive(null);setPod(null);setGps(null);setFailReason("");setShowFailForm(false);}}
                style={{ background:"#f1f5f9",border:"none",padding:"12px 16px",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14,color:"#64748b" }}>
                {t.cancel}
              </button>
            </div>
          </div>
        ):(
          <button onClick={()=>{setActive(inv);setGps(null);setPod(null);setFailReason("");setShowFailForm(false);}}
            style={{ background:"#1A3A5C",color:"white",border:"none",padding:"12px 20px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14,marginTop:8,width:"100%" }}>
            {t.startDelivery} →
          </button>
        )}
      </Card>
    );
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}

      {/* Tabs */}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
        {[
          ["deliveries","📦",`Staged for Dispatch (${pending.length})`],
          ["delivered","✅",`Delivered (${deliveredInv.length})`],
          ["failed","❌",`Failed (${failedInv.length})`],
          ["history","📊","Trip History"],
          ["fuel","⛽",t.fuelTab]
        ].map(([v,icon,label])=>(
          <button key={v} onClick={()=>setView(v)}
            style={{ padding:"10px 18px",borderRadius:8,border:"none",
              background:view===v?"#1A3A5C":"#f1f5f9",
              color:view===v?"white":"#374151",
              cursor:"pointer",fontSize:14,fontWeight:600 }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {view==="deliveries"&&(
        <div>
          {/* Trip Timer */}
          <Card style={{ borderTop:"4px solid #6366f1" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
              <div>
                <div style={{ fontSize:14,color:"#64748b",marginBottom:2 }}>{t.tripActive}</div>
                <div style={{ fontSize:28,fontWeight:900,color:"#6366f1",fontFamily:"monospace" }}>{formatTime(elapsed)}</div>
                {tripStarted&&(
                  <div style={{ fontSize:14,color:"#64748b",marginTop:2 }}>
                    📍 {totalKM} km | ⛽ ~{Math.round(totalKM/(assignedVehicle?.mileage||12)*10)/10}L
                  </div>
                )}
              </div>
              <div style={{ display:"flex",gap:8 }}>
                {!tripStarted
                  ? <Btn onClick={startTrip} color="#10b981" style={{ padding:"12px 20px",fontSize:14 }}>🚀 {t.startTrip}</Btn>
                  : <Btn onClick={handleEndTripClick} color="#ef4444" style={{ padding:"12px 20px",fontSize:14 }}>🏁 {t.endTrip}</Btn>
                }
              </div>
            </div>
          </Card>

          {/* ODOMETER FORM MODAL — shown when End Trip clicked */}
          {showOdometerForm&&(
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
              <div style={{ background:"white", borderRadius:16, padding:24, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ fontWeight:800, fontSize:17, color:"#1A3A5C", marginBottom:4 }}>🏁 {t.endTrip}</div>
                <div style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>{t.odometerStep}</div>

                {/* Odometer Photo */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#1A3A5C", marginBottom:8 }}>{t.odometerPhoto}</div>
                  <CameraCapture
                    label=""
                    value={odometerPhoto}
                    onChange={url=>setOdometerPhoto(url)}
                    folder="odometer"
                    lang={lang}
                    required
                  />
                </div>

                {/* Manual KM Reading */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontWeight:700, fontSize:14, color:"#1A3A5C", display:"block", marginBottom:6 }}>{t.odometerReading}</label>
                  <input
                    type="number"
                    value={odometerReading}
                    onChange={e=>setOdometerReading(e.target.value)}
                    placeholder={t.odometerPlaceholder}
                    style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:16, outline:"none", boxSizing:"border-box" }}
                  />
                  {totalKM > 0 && (
                    <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>
                      GPS measured distance this trip: {totalKM} km
                    </div>
                  )}
                </div>

                {/* Warning */}
                {odometerWarning&&(
                  <div style={{ background:"#fef3c7", border:"1px solid #fbbf24", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#92400e", marginBottom:12 }}>
                    ⚠️ {odometerWarning}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display:"flex", gap:8 }}>
                  <Btn onClick={endTrip} color="#ef4444" style={{ flex:1, padding:12 }}>
                    🏁 {t.confirmEndTrip}
                  </Btn>
                  <Btn onClick={()=>{setShowOdometerForm(false);setTripStarted(true);setOdometerWarning("");}} color="#64748b">
                    {t.cancelEndTrip}
                  </Btn>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Alerts */}
          {vAlerts.length>0&&(
            <Card style={{ border:"1px solid #fbbf24" }}>
              <CardTitle>⚠️ {t.vehicleAlerts} — {assignedVehiclePlate}</CardTitle>
              {vAlerts.map((a,i)=>(
                <div key={i} style={{ fontSize:14,fontWeight:600,color:a.type==="error"?"#991b1b":"#92400e",padding:"5px 0" }}>
                  {a.type==="error"?"🔴":"🟡"} {a.msg}
                </div>
              ))}
            </Card>
          )}

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16 }}>
            <div style={{ background:"white",borderRadius:10,padding:14,textAlign:"center",borderTop:"4px solid #f59e0b",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:28,fontWeight:900,color:"#f59e0b" }}>{pending.length}</div>
              <div style={{ fontSize:13,color:"#64748b" }}>{t.remaining}</div>
            </div>
            <div style={{ background:"white",borderRadius:10,padding:14,textAlign:"center",borderTop:"4px solid #10b981",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:28,fontWeight:900,color:"#10b981" }}>{doneList.length}</div>
              <div style={{ fontSize:13,color:"#64748b" }}>{t.completed}</div>
            </div>
            <div style={{ background:"white",borderRadius:10,padding:14,textAlign:"center",borderTop:"4px solid #6366f1",boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:28,fontWeight:900,color:"#6366f1" }}>{myInv.length}</div>
              <div style={{ fontSize:13,color:"#64748b" }}>{t.pending}</div>
            </div>
          </div>

          {pending.length===0&&myInv.length>0&&(
            <Card style={{ textAlign:"center",padding:32 }}>
              <div style={{ fontSize:48,marginBottom:12 }}>🎉</div>
              <div style={{ fontWeight:700,fontSize:18,color:"#10b981" }}>{t.allDone}</div>
            </Card>
          )}

          {pending.length===0&&myInv.length===0&&(
            <Card style={{ textAlign:"center",padding:32 }}>
              <div style={{ fontSize:48,marginBottom:12 }}>📦</div>
              <div style={{ fontWeight:600,fontSize:16,color:"#94a3b8" }}>No invoices assigned yet</div>
            </Card>
          )}

          {inCity.length>0&&(
            <div>
              <div style={{ fontWeight:700,fontSize:16,color:"#1e40af",marginBottom:8 }}>🏙️ {t.inCity} ({inCity.length})</div>
              {inCity.map(inv=><InvCard key={inv.id} inv={inv} />)}
            </div>
          )}
          {outCity.length>0&&(
            <div>
              <div style={{ fontWeight:700,fontSize:16,color:"#92400e",marginBottom:8 }}>🛣️ {t.outCity} ({outCity.length})</div>
              {outCity.map(inv=><InvCard key={inv.id} inv={inv} />)}
            </div>
          )}
        </div>
      )}

      {/* DELIVERED TAB */}
      {view==="delivered"&&(
        <div>
          {deliveredInv.length===0&&(
            <Card><div style={{ textAlign:"center",padding:32,color:"#94a3b8",fontSize:15 }}>No delivered invoices yet.</div></Card>
          )}
          {deliveredInv.map(inv=>(
            <Card key={inv.id||inv.firestoreId}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6 }}>
                <span style={{ fontWeight:700,fontSize:15,color:"#10b981" }}>✅ {inv.id}</span>
                <span style={{ fontSize:12,color:"#64748b" }}>{inv.deliveredAt}</span>
              </div>
              <div style={{ fontWeight:600,fontSize:15,color:"#0f172a",marginBottom:4 }}>{inv.customer}</div>
              <div style={{ fontSize:13,color:"#64748b",marginBottom:6 }}>📍 {inv.city} | 🚗 {inv.vehicle}</div>
              {inv.podImage&&inv.podImage!=="demo_pod"&&(
                <img src={inv.podImage} alt="POD" style={{ width:80,height:60,objectFit:"cover",borderRadius:6,border:"1px solid #e2e8f0" }} />
              )}
            </Card>
          ))}
        </div>
      )}

      {/* FAILED TAB */}
      {view==="failed"&&(
        <div>
          {failedInv.length===0&&(
            <Card><div style={{ textAlign:"center",padding:32,color:"#94a3b8",fontSize:15 }}>No failed invoices.</div></Card>
          )}
          {failedInv.map(inv=>(
            <Card key={inv.id||inv.firestoreId} style={{ borderLeft:"4px solid #ef4444" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6 }}>
                <span style={{ fontWeight:700,fontSize:15,color:"#ef4444" }}>❌ {inv.id}</span>
                <span style={{ fontSize:12,color:"#64748b" }}>{inv.deliveredAt}</span>
              </div>
              <div style={{ fontWeight:600,fontSize:15,color:"#0f172a",marginBottom:4 }}>{inv.customer}</div>
              <div style={{ fontSize:13,color:"#64748b",marginBottom:4 }}>📍 {inv.city} | 🚗 {inv.vehicle}</div>
              {inv.failReason&&(
                <div style={{ background:"#fee2e2",borderRadius:6,padding:"6px 10px",fontSize:13,color:"#991b1b" }}>
                  📝 Reason: {inv.failReason}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {view==="history"&&(
        <Card>
          <CardTitle>📊 {t.history}</CardTitle>
          {history.length===0&&<div style={{ textAlign:"center",padding:32,color:"#94a3b8",fontSize:15 }}>{t.noHistory}</div>}
          {history.map((h,i)=>(
            <div key={i} style={{ border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4 }}>
                <span style={{ fontWeight:700,fontSize:15 }}>📅 {h.date}</span>
                <span style={{ fontWeight:700,fontSize:15,color:h.successRate>=80?"#10b981":h.successRate>=60?"#f59e0b":"#ef4444" }}>{h.successRate}% success</span>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:6,fontSize:13,color:"#64748b" }}>
                <span>🚗 {h.vehicle}</span>
                <span>📋 {h.delivered}/{h.invoices} delivered</span>
                <span>📍 {h.distance} km</span>
                <span>⏱️ {h.duration}</span>
                <span>⛽ {h.fuelUsed||0}L used</span>
                <span>{h.isHalfDay?"⏰ Half Day":"✅ Full Day"}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── FUEL ENTRY TAB ── */}
      {view==="fuel"&&(
        <FuelEntryTab
          user={user} t={t} lang={lang}
          assignedVehicle={assignedVehicle}
          assignedVehiclePlate={assignedVehiclePlate}
          fuelForm={fuelForm} setFuelForm={setFuelForm}
          fuelSubmitting={fuelSubmitting} setFuelSubmitting={setFuelSubmitting}
          myFuelEntries={myFuelEntries} setMyFuelEntries={setMyFuelEntries}
          fuelLoaded={fuelLoaded} setFuelLoaded={setFuelLoaded}
          setDone={setDone}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// FUEL ENTRY TAB COMPONENT
// Same data saved to fuelLogs collection — exact same schema as Fuel.jsx
// Manager approves from Fuel Tracking screen — no change to that flow
// ─────────────────────────────────────────────
function FuelEntryTab({ user, t, lang, assignedVehicle, assignedVehiclePlate, fuelForm, setFuelForm, fuelSubmitting, setFuelSubmitting, myFuelEntries, setMyFuelEntries, fuelLoaded, setFuelLoaded, setDone }) {
  const [localDone, setLocalDone] = useState("");

  useEffect(() => {
    if (!fuelLoaded) loadMyFuelEntries();
  }, []);

  async function loadMyFuelEntries() {
    try {
      const snap = await getDocs(collection(db, "fuelLogs"));
      const mine = snap.docs
        .map(d=>({id:d.id,...d.data()}))
        .filter(l=>l.driverId===user.uid)
        .sort((a,b)=>b.date?.localeCompare(a.date||""));
      setMyFuelEntries(mine);
      setFuelLoaded(true);
    } catch(e) { console.error(e); }
  }

  async function submitFuelEntry() {
    if (!fuelForm.liters || !fuelForm.sar) {
      setLocalDone("❌ Liters and cost are required");
      setTimeout(()=>setLocalDone(""),3000);
      return;
    }
    if (!assignedVehiclePlate) {
      setLocalDone("❌ "+t.fuelNoVehicle);
      setTimeout(()=>setLocalDone(""),3000);
      return;
    }
    setFuelSubmitting(true);
    try {
      const entry = {
        // Exact same schema as Fuel.jsx entries — reports will pick these up
        date:        new Date().toISOString().split("T")[0],
        vehicle:     assignedVehiclePlate,
        vehiclePlate: assignedVehiclePlate,
        driver:      user.name,
        driverId:    user.uid,
        dc:          user.dc,
        liters:      Number(fuelForm.liters),
        sar:         Number(fuelForm.sar),
        tripKM:      Number(fuelForm.odometer)||0,
        station:     fuelForm.station||"",
        receiptNo:   fuelForm.receiptNo||"",
        notes:       fuelForm.notes||"",
        // kmplAtTime: snapshot of vehicle KMPL at submission — accurate historical reporting
        kmplAtTime:  assignedVehicle?.mileage || assignedVehicle?.kmpl || null,
        // FIXED: must be "pending_approval" to match Fuel.jsx approval queue filter
        status:      "pending_approval",
        submittedAt: new Date().toISOString(),
        submittedBy: user.name,
        source:      "driver_entry",   // so Fuel.jsx can show driver-submitted entries
      };
      const docRef = await addDoc(collection(db, "fuelLogs"), entry);
      setMyFuelEntries(prev=>[{id:docRef.id,...entry},...prev]);
      // Notify manager to approve
      const { sendNotification } = await import("../notificationService.js");
      await sendNotification({
        toRole:"manager", toDC:user.dc,
        type:"activity_request",
        data:{ driverName:user.name, purpose:"Fuel Entry", destination:fuelForm.station||"" }
      });
      setFuelForm({ liters:"", sar:"", station:"", receiptNo:"", odometer:"", notes:"" });
      setDone(t.fuelSubmitted);
      setTimeout(()=>setDone(""),5000);
    } catch(e) {
      setLocalDone("❌ Error: "+e.message);
      setTimeout(()=>setLocalDone(""),4000);
    }
    setFuelSubmitting(false);
  }

  const statusColor = { pending_approval:"#f59e0b", approved:"#10b981", rejected:"#ef4444" };
  const statusBg    = { pending_approval:"#fef3c7", approved:"#d1fae5", rejected:"#fee2e2" };
  const statusText  = { pending_approval:t.fuelPending, approved:t.fuelApproved, rejected:t.fuelRejected };

  return (
    <div>
      {localDone&&(
        <div style={{ background:localDone.startsWith("❌")?"#fee2e2":"#d1fae5", color:localDone.startsWith("❌")?"#991b1b":"#065f46", borderRadius:8, padding:"12px 16px", marginBottom:12, fontWeight:600, fontSize:14 }}>
          {localDone}
        </div>
      )}

      {/* Vehicle info */}
      {assignedVehicle ? (
        <Card style={{ borderTop:"4px solid #f59e0b", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>⛽ {assignedVehiclePlate}</div>
              <div style={{ fontSize:13, color:"#64748b" }}>{assignedVehicle.type} — {assignedVehicle.brand} {assignedVehicle.model}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:13, color:"#64748b" }}>Current Fuel</div>
              <div style={{ fontWeight:800, fontSize:20, color:(assignedVehicle.fuelLevel||0)/(assignedVehicle.fuelCapacity||80)<0.25?"#ef4444":"#10b981" }}>
                {assignedVehicle.fuelLevel||0}L / {assignedVehicle.fuelCapacity||80}L
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ textAlign:"center", padding:24, color:"#94a3b8" }}>
          🚗 {t.fuelNoVehicle}
        </Card>
      )}

      {/* Fuel Entry Form */}
      <Card style={{ borderLeft:"4px solid #f59e0b" }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:14, color:"#92400e" }}>⛽ {t.fuelTab}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.fuelLiters}</label>
            <input type="number" value={fuelForm.liters} onChange={e=>setFuelForm({...fuelForm,liters:e.target.value})}
              placeholder="e.g. 45" min="1" max="200"
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.fuelSAR}</label>
            <input type="number" value={fuelForm.sar} onChange={e=>setFuelForm({...fuelForm,sar:e.target.value})}
              placeholder="e.g. 270"
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.fuelStation}</label>
            <input type="text" value={fuelForm.station} onChange={e=>setFuelForm({...fuelForm,station:e.target.value})}
              placeholder="e.g. ARAMCO Station, Riyadh"
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.fuelReceiptNo}</label>
            <input type="text" value={fuelForm.receiptNo} onChange={e=>setFuelForm({...fuelForm,receiptNo:e.target.value})}
              placeholder="e.g. REC-00123"
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.fuelOdometer}</label>
            <input type="number" value={fuelForm.odometer} onChange={e=>setFuelForm({...fuelForm,odometer:e.target.value})}
              placeholder="e.g. 45230"
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.fuelNotes}</label>
            <input type="text" value={fuelForm.notes} onChange={e=>setFuelForm({...fuelForm,notes:e.target.value})}
              placeholder="Optional"
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>

        <div style={{ background:"#fef3c7", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#92400e", marginBottom:14 }}>
          ℹ️ Entry will be sent to your manager for approval. Fuel level updates after approval.
        </div>

        <button onClick={submitFuelEntry} disabled={fuelSubmitting}
          style={{ width:"100%", background:fuelSubmitting?"#94a3b8":"#f59e0b", color:"white", border:"none", padding:"14px", borderRadius:8, fontWeight:700, cursor:fuelSubmitting?"not-allowed":"pointer", fontSize:15 }}>
          {fuelSubmitting?t.fuelSubmitting:"⛽ "+t.fuelSubmit}
        </button>
      </Card>

      {/* My fuel entry history */}
      {myFuelEntries.length>0&&(
        <Card style={{ marginTop:16 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:12, color:"#374151" }}>📋 {t.fuelHistory}</div>
          {myFuelEntries.slice(0,20).map(e=>(
            <div key={e.id} style={{ padding:"10px 0", borderBottom:"1px solid #f8fafc", fontSize:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, flexWrap:"wrap", gap:6 }}>
                <span style={{ fontWeight:700 }}>📅 {e.date} — ⛽ {e.liters}L</span>
                <span style={{ fontSize:12, fontWeight:600, padding:"2px 10px", borderRadius:99,
                  background:statusBg[e.status]||"#f1f5f9",
                  color:statusColor[e.status]||"#374151" }}>
                  {statusText[e.status]||e.status}
                </span>
              </div>
              <div style={{ fontSize:13, color:"#64748b" }}>
                🚗 {e.vehicle} | 💰 SAR {e.sar} | 🏪 {e.station||"—"}
                {e.receiptNo&&<span> | 🧾 {e.receiptNo}</span>}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
