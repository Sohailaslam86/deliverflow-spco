// src/pages/Driver.jsx
// Updated: Additional Activity feature + Operational Hours auto-calc on trip end

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
    addActivity:"+ Additional Activity",
    activityPurpose:"Purpose *", activityDest:"Destination *", activityVehicle:"Vehicle *",
    activityNotes:"Notes", activityOtherNotes:"Notes (Required for 'Other') *",
    activitySubmit:"Submit for Approval",
    activitySubmitted:"Activity request submitted!",
    markComplete:"Mark Complete",
    activityApproved:"Activity approved — start trip when ready.",
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
    addActivity:"+ نشاط إضافي",
    activityPurpose:"الغرض *", activityDest:"الوجهة *", activityVehicle:"المركبة *",
    activityNotes:"ملاحظات", activityOtherNotes:"ملاحظات (مطلوبة لـ 'أخرى') *",
    activitySubmit:"إرسال للموافقة",
    activitySubmitted:"تم إرسال طلب النشاط!",
    markComplete:"تم الإنجاز",
    activityApproved:"تمت الموافقة على النشاط — ابدأ الرحلة عندما تكون مستعداً.",
  }
};

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function Driver({ user, invoices, setInvoices, vehicles, lang }) {
  const { failedReasons, activityPurposes } = useSettings();

  const [active, setActive] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [gps, setGps] = useState(null);
  const [locating, setLocating] = useState(false);
  const [pod, setPod] = useState(null);
  const [done, setDone] = useState("");
  const [failReason, setFailReason] = useState("");
  const [showFailForm, setShowFailForm] = useState(false);

  // Odometer state
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

  // Additional Activity state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ purpose:"", destination:"", vehiclePlate:"", notes:"" });
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [approvedActivities, setApprovedActivities] = useState([]);
  const [activeActivity, setActiveActivity] = useState(null); // currently executing activity
  const [activityTripStarted, setActivityTripStarted] = useState(false);
  const [activityTripStartTime, setActivityTripStartTime] = useState(null);
  const [showActivityOdometer, setShowActivityOdometer] = useState(false);
  const [activityOdometerPhoto, setActivityOdometerPhoto] = useState("");
  const [activityOdometerReading, setActivityOdometerReading] = useState("");
  const [activityElapsed, setActivityElapsed] = useState(0);
  const [activityKM, setActivityKM] = useState(0);
  const activityTimerRef = useRef(null);

  const [dcVehicles, setDcVehicles] = useState([]);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("driver_history_"+user.uid)||"[]"); } catch { return []; }
  });

  const rtl = lang==="ar";
  const t = T[lang]||T.en;

  const allMyInv = invoices.filter(i=>i.driverId===user.uid);
  const myInv = allMyInv.filter(i=>i.status==="assigned");
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

  // Load DC vehicles for activity form
  useEffect(() => {
    async function loadVehicles() {
      try {
        const snap = await getDocs(collection(db, "vehicles"));
        const all = snap.docs.map(d=>({firestoreId:d.id,...d.data()}));
        setDcVehicles(all.filter(v=>v.dc===user.dc&&v.status==="Active"));
      } catch(e) {}
    }
    loadVehicles();
  }, [user.dc]);

  // Load pending/approved activities for this driver
  useEffect(() => {
    async function loadActivities() {
      try {
        const snap = await getDocs(collection(db, "additionalActivities"));
        const all = snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>a.driverId===user.uid);
        setPendingActivities(all.filter(a=>a.status==="pending_approval"));
        setApprovedActivities(all.filter(a=>a.status==="approved"&&!a.completed));
      } catch(e) {}
    }
    loadActivities();
  }, [user.uid]);

  // Delivery trip timer
  useEffect(() => {
    if (tripStarted) {
      timerRef.current = setInterval(() => setElapsed(prev=>prev+1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [tripStarted]);

  // Activity trip timer
  useEffect(() => {
    if (activityTripStarted) {
      activityTimerRef.current = setInterval(() => setActivityElapsed(prev=>prev+1), 1000);
    } else {
      clearInterval(activityTimerRef.current);
    }
    return () => clearInterval(activityTimerRef.current);
  }, [activityTripStarted]);

  // GPS watch during delivery trip
  useEffect(() => {
    if (tripStarted && navigator.geolocation) {
      gpsWatchRef.current = navigator.geolocation.watchPosition(
        pos => {
          const newGPS = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLastGPS(prev => {
            if (prev) {
              const km = calcDistance(prev.lat, prev.lng, newGPS.lat, newGPS.lng);
              if (km > 0.01) { setTotalKM(d => Math.round((d + km) * 10) / 10); }
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => { const sg={lat:p.coords.latitude,lng:p.coords.longitude}; setTripStartGPS(sg); setLastGPS(sg); },
        () => {}
      );
    }
    setTripStarted(true);
    setTripStartTime(new Date());
    setElapsed(0);
    setTotalKM(0);
    setDone(t.tripStarted);
  }

  function handleEndTripClick() {
    if (!tripStarted) return;
    setShowOdometerForm(true);
    setOdometerWarning("");
  }

  // Auto-calculate operationalHours = (endTime - startTime) in hours
  function calcOperationalHours(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    const diff = (endTime - startTime) / (1000 * 60 * 60); // hours
    return Math.round(diff * 100) / 100;
  }

  async function endTrip() {
    if (!odometerPhoto) { setOdometerWarning(t.odometerRequired); return; }
    if (!odometerReading || isNaN(Number(odometerReading)) || Number(odometerReading) <= 0) {
      setOdometerWarning(t.odometerRequired); return;
    }

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

    const currentFuel = assignedVehicle?.fuelLevel || 0;
    if (fuelUsed > currentFuel) {
      setOdometerWarning(t.fuelInsufficient);
      return;
    }

    // Operational Hours — auto-calculated
    const operationalHours = calcOperationalHours(tripStartTime, endTime);

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
      operationalHours,  // TASK 4B — auto-calculated
      type: "invoice_delivery",
      createdAt: new Date().toISOString()
    };

    try { await addDoc(collection(db, "tripLogs"), entry); }
    catch(e) { console.error("TripLog save error:", e); }

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
      fuelUsed, isHalfDay, daysActive, operationalHours
    };
    const newHistory = [histEntry,...history].slice(0,30);
    setHistory(newHistory);
    try { localStorage.setItem("driver_history_"+user.uid, JSON.stringify(newHistory)); } catch{}

    setOdometerPhoto("");
    setOdometerReading("");
    setOdometerWarning("");

    const dayMsg = isHalfDay ? t.halfDay : t.fullDay;
    setDone(`🏁 ${t.tripEnded} ${totalKM} ${t.kmCovered} | ⛽ ${fuelUsed}L ${t.fuelDeducted} | ${dayMsg} | ⏱️ ${operationalHours}h Operational`);
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
      status, podImage: pod || null, gps: gps || null,
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

    if (status==="delivered") {
      await sendNotification({ toRole:"manager", toDC:inv.dc, type:"delivered", title:"Invoice Delivered ✅", message:`Invoice ${inv.id} (${inv.customer}) successfully delivered by ${user.name}.` });
      await sendNotification({ toRole:"logistic", toDC:inv.dc, type:"delivered", title:"Invoice Delivered ✅", message:`Invoice ${inv.id} (${inv.customer}) delivered by ${user.name}.` });
    } else if (status==="failed") {
      await sendNotification({ toRole:"manager", toDC:inv.dc, type:"failed", title:"Invoice Delivery Failed ❌", message:`Invoice ${inv.id} (${inv.customer}) failed by ${user.name}. Reason: ${failReason}.` });
      await sendNotification({ toRole:"logistic", toDC:inv.dc, type:"failed", title:"Invoice Delivery Failed ❌", message:`Invoice ${inv.id} (${inv.customer}) failed. Reason: ${failReason}.` });
    }

    setDone(status==="delivered"?"✅ "+inv.id+" delivered!":"❌ "+inv.id+" failed — "+failReason);
    setActive(null); setPod(null); setGps(null); setFailReason(""); setShowFailForm(false);
    setTimeout(()=>setDone(""),3000);
  }

  // ── ADDITIONAL ACTIVITY FUNCTIONS ──────────────────────────────────────────
  async function submitActivity() {
    const { purpose, destination, vehiclePlate, notes } = activityForm;
    if (!purpose || !destination || !vehiclePlate) { setDone("❌ Purpose, Destination, and Vehicle are required"); return; }
    if (purpose==="Other (specify in notes)" && !notes.trim()) { setDone("❌ Notes are required when Purpose is 'Other'"); return; }
    setActivitySubmitting(true);
    try {
      const data = {
        driverId: user.uid,
        driverName: user.name,
        dc: user.dc,
        purpose, destination, vehiclePlate, notes,
        status: "pending_approval",
        submittedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "additionalActivities"), data);
      setPendingActivities(prev=>[...prev, { id:docRef.id, ...data }]);
      await sendNotification({ toRole:"manager", toDC:user.dc, type:"activity_request", title:"Additional Activity Request", message:`${user.name} submitted an additional activity: ${purpose} to ${destination}.` });
      await sendNotification({ toRole:"logistic", toDC:user.dc, type:"activity_request", title:"Additional Activity Request", message:`${user.name}: ${purpose} → ${destination}. Awaiting approval.` });
      setDone(t.activitySubmitted);
      setActivityForm({ purpose:"", destination:"", vehiclePlate:"", notes:"" });
      setShowActivityForm(false);
    } catch(e) { setDone("❌ "+e.message); }
    setActivitySubmitting(false);
  }

  function startActivityTrip(activity) {
    setActiveActivity(activity);
    setActivityTripStarted(true);
    setActivityTripStartTime(new Date());
    setActivityElapsed(0);
    setActivityKM(0);
    setDone(t.tripStarted);
  }

  function handleActivityEndClick() {
    if (!activityTripStarted) return;
    setShowActivityOdometer(true);
  }

  async function endActivityTrip() {
    if (!activityOdometerPhoto || !activityOdometerReading || isNaN(Number(activityOdometerReading))) {
      setDone("❌ Odometer photo and reading are required");
      return;
    }
    setShowActivityOdometer(false);
    setActivityTripStarted(false);

    const endTime = new Date();
    const startDate = activityTripStartTime ? activityTripStartTime.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const operationalHours = calcOperationalHours(activityTripStartTime, endTime);
    const mileage = vehicles?.find(v=>v.plate===activeActivity.vehiclePlate)?.mileage || 12;
    const odomKM = Number(activityOdometerReading);
    const fuelUsed = activityKM > 0 ? Math.round((activityKM / mileage) * 10) / 10 : 0;
    const isHalfDay = endTime.getHours() < 12;
    const daysActive = isHalfDay ? 0.5 : 1.0;

    const tripLogEntry = {
      driverId: user.uid,
      driverName: user.name,
      dc: user.dc,
      vehiclePlate: activeActivity.vehiclePlate,
      type: "additional_activity",
      purpose: activeActivity.purpose,
      destination: activeActivity.destination,
      approvedBy: activeActivity.approvedBy || "Manager",
      startDate, endDate: endTime.toISOString().split("T")[0],
      startTime: activityTripStartTime?.toLocaleTimeString() || "-",
      endTime: endTime.toLocaleTimeString(),
      operationalHours,
      totalKM: odomKM,
      fuelUsed,
      odometerReading: odomKM,
      odometerPhotoUrl: activityOdometerPhoto,
      isHalfDay, daysActive,
      invoices: 0, delivered: 0, failed: 0, successRate: 0,
      notes: activeActivity.notes,
      createdAt: new Date().toISOString()
    };

    try { await addDoc(collection(db, "tripLogs"), tripLogEntry); } catch(e) { console.error(e); }

    // Mark activity as completed
    try {
      await updateDoc(doc(db, "additionalActivities", activeActivity.id), { completed: true, completedAt: new Date().toISOString() });
      setApprovedActivities(prev=>prev.filter(a=>a.id!==activeActivity.id));
    } catch(e) { console.error(e); }

    // Save to local history
    const histEntry = {
      date: startDate, vehicle: activeActivity.vehiclePlate,
      type: "Additional Activity", purpose: activeActivity.purpose,
      destination: activeActivity.destination,
      invoices: 0, delivered: 0, distance: activityKM,
      odometerReading: odomKM, successRate: 0,
      duration: formatTime(activityElapsed),
      startTime: activityTripStartTime?.toLocaleTimeString()||"-",
      endTime: endTime.toLocaleTimeString(),
      fuelUsed, operationalHours, isHalfDay, daysActive
    };
    const newHistory = [histEntry,...history].slice(0,30);
    setHistory(newHistory);
    try { localStorage.setItem("driver_history_"+user.uid, JSON.stringify(newHistory)); } catch{}

    setActiveActivity(null);
    setActivityOdometerPhoto("");
    setActivityOdometerReading("");
    setDone(`🏁 Activity completed! ⏱️ ${operationalHours}h Operational | ⛽ ${fuelUsed}L`);
    setTimeout(()=>setDone(""),5000);
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
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700,fontSize:15,marginBottom:8,color:"#1A3A5C" }}>{t.gpsStep}</div>
              <button onClick={getGPS} disabled={locating}
                style={{ background:gps?"#10b981":"#0ea5e9",color:"white",border:"none",padding:"12px 16px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14,width:"100%" }}>
                {locating?t.gettingGPS:gps?"✅ GPS: "+gps.lat.toFixed(4)+", "+gps.lng.toFixed(4):"📍 "+t.getGPS}
              </button>
            </div>
            {!showFailForm&&(
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:15,marginBottom:8,color:"#1A3A5C" }}>{t.podStep}</div>
                <CameraCapture label="" value={pod||""} onChange={url=>setPod(url)} folder="pod" lang={lang} required />
              </div>
            )}
            {showFailForm&&(
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700,fontSize:15,marginBottom:8,color:"#ef4444" }}>{t.failReason}</div>
                <select value={failReason} onChange={e=>setFailReason(e.target.value)}
                  style={{ width:"100%",border:"1.5px solid #fca5a5",borderRadius:8,padding:"11px 12px",fontSize:14,outline:"none",boxSizing:"border-box",background:"white" }}>
                  <option value="">{t.failReasonPlaceholder}</option>
                  {failedReasons.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {!showFailForm?(
                <>
                  <button onClick={()=>submit(inv,"delivered")} style={{ flex:1,background:"#10b981",color:"white",border:"none",padding:"12px 0",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>✅ {t.markDelivered}</button>
                  <button onClick={()=>setShowFailForm(true)} style={{ flex:1,background:"#ef4444",color:"white",border:"none",padding:"12px 0",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>❌ {t.markFailed}</button>
                </>
              ):(
                <>
                  <button onClick={()=>submit(inv,"failed")} style={{ flex:1,background:"#ef4444",color:"white",border:"none",padding:"12px 0",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>❌ {t.markFailed}</button>
                  <button onClick={()=>setShowFailForm(false)} style={{ background:"#f1f5f9",border:"none",padding:"12px 16px",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14,color:"#64748b" }}>← Back</button>
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

      {/* TABS */}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
        {[
          ["deliveries","📦",`Staged for Dispatch (${pending.length + approvedActivities.length})`],
          ["delivered","✅",`Delivered (${deliveredInv.length})`],
          ["failed","❌",`Failed (${failedInv.length})`],
          ["history","📊","Trip History"]
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

          {/* Additional Activity Button */}
          <div style={{ marginBottom:12 }}>
            <Btn onClick={()=>setShowActivityForm(!showActivityForm)} color="#7c3aed" small>
              {t.addActivity}
            </Btn>
          </div>

          {/* Additional Activity Form */}
          {showActivityForm&&(
            <Card style={{ borderLeft:"4px solid #7c3aed", marginBottom:16 }}>
              <CardTitle>🗂️ Additional Activity Request</CardTitle>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.activityPurpose}</label>
                <select value={activityForm.purpose} onChange={e=>setActivityForm({...activityForm,purpose:e.target.value})}
                  style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                  <option value="">Select purpose...</option>
                  {activityPurposes.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.activityDest}</label>
                <input value={activityForm.destination} onChange={e=>setActivityForm({...activityForm,destination:e.target.value})}
                  placeholder="Enter destination address / location"
                  style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box" }} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{t.activityVehicle}</label>
                <select value={activityForm.vehiclePlate} onChange={e=>setActivityForm({...activityForm,vehiclePlate:e.target.value})}
                  style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                  <option value="">Select vehicle...</option>
                  {dcVehicles.map(v=><option key={v.plate} value={v.plate}>{v.plate} — {v.type}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>
                  {activityForm.purpose==="Other (specify in notes)" ? t.activityOtherNotes : t.activityNotes}
                </label>
                <textarea value={activityForm.notes} onChange={e=>setActivityForm({...activityForm,notes:e.target.value})}
                  rows={2} placeholder="Notes..."
                  style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit" }} />
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <Btn onClick={submitActivity} color="#7c3aed" style={{ flex:1 }} disabled={activitySubmitting}>
                  {activitySubmitting?"Submitting...":"📤 "+t.activitySubmit}
                </Btn>
                <Btn onClick={()=>setShowActivityForm(false)} color="#64748b">{t.cancel}</Btn>
              </div>
            </Card>
          )}

          {/* Pending activities (awaiting approval) */}
          {pendingActivities.length>0&&(
            <Card style={{ borderLeft:"4px solid #f59e0b", marginBottom:12 }}>
              <CardTitle>⏳ Pending Activity Approval ({pendingActivities.length})</CardTitle>
              {pendingActivities.map(a=>(
                <div key={a.id} style={{ padding:"10px 0",borderBottom:"1px solid #f1f5f9",fontSize:14 }}>
                  <div style={{ fontWeight:700 }}>🗂️ {a.purpose}</div>
                  <div style={{ color:"#64748b",fontSize:13 }}>📍 {a.destination} | 🚗 {a.vehiclePlate}</div>
                  {a.notes&&<div style={{ color:"#94a3b8",fontSize:12 }}>📝 {a.notes}</div>}
                  <span style={{ fontSize:12,fontWeight:600,padding:"2px 8px",borderRadius:6,background:"#fef3c7",color:"#92400e" }}>⏳ Awaiting Approval</span>
                </div>
              ))}
            </Card>
          )}

          {/* Approved activities — can start */}
          {approvedActivities.length>0&&(
            <Card style={{ borderLeft:"4px solid #7c3aed", marginBottom:12 }}>
              <CardTitle>✅ Approved Activities ({approvedActivities.length})</CardTitle>
              {approvedActivities.map(a=>(
                <div key={a.id} style={{ padding:"12px 0",borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ fontWeight:700,fontSize:14 }}>🗂️ {a.purpose}</div>
                  <div style={{ color:"#64748b",fontSize:13 }}>📍 {a.destination} | 🚗 {a.vehiclePlate}</div>
                  {a.approvedBy&&<div style={{ fontSize:12,color:"#10b981" }}>✅ Approved by: {a.approvedBy}</div>}
                  {activeActivity?.id===a.id?(
                    <div style={{ marginTop:10 }}>
                      <div style={{ fontSize:24,fontWeight:900,color:"#7c3aed",fontFamily:"monospace",marginBottom:6 }}>{formatTime(activityElapsed)}</div>
                      <Btn onClick={handleActivityEndClick} color="#ef4444" small>🏁 End Activity Trip</Btn>
                    </div>
                  ):(
                    <Btn onClick={()=>startActivityTrip(a)} color="#7c3aed" small style={{ marginTop:8 }}>🚀 Start Trip</Btn>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Activity trip odometer modal */}
          {showActivityOdometer&&(
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
              <div style={{ background:"white",borderRadius:16,padding:24,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ fontWeight:800,fontSize:17,color:"#7c3aed",marginBottom:4 }}>🏁 End Activity Trip</div>
                <div style={{ fontSize:13,color:"#64748b",marginBottom:16 }}>Take odometer photo and enter reading to complete</div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontWeight:700,fontSize:14,color:"#1A3A5C",marginBottom:8 }}>{t.odometerPhoto}</div>
                  <CameraCapture label="" value={activityOdometerPhoto} onChange={url=>setActivityOdometerPhoto(url)} folder="odometer" lang={lang} required />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontWeight:700,fontSize:14,color:"#1A3A5C",display:"block",marginBottom:6 }}>{t.odometerReading}</label>
                  <input type="number" value={activityOdometerReading} onChange={e=>setActivityOdometerReading(e.target.value)}
                    placeholder={t.odometerPlaceholder}
                    style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:16,outline:"none",boxSizing:"border-box" }} />
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <Btn onClick={endActivityTrip} color="#7c3aed" style={{ flex:1,padding:12 }}>🏁 {t.markComplete}</Btn>
                  <Btn onClick={()=>setShowActivityOdometer(false)} color="#64748b">{t.cancel}</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ODOMETER FORM MODAL — delivery trip */}
          {showOdometerForm&&(
            <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
              <div style={{ background:"white",borderRadius:16,padding:24,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ fontWeight:800,fontSize:17,color:"#1A3A5C",marginBottom:4 }}>🏁 {t.endTrip}</div>
                <div style={{ fontSize:13,color:"#64748b",marginBottom:16 }}>{t.odometerStep}</div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontWeight:700,fontSize:14,color:"#1A3A5C",marginBottom:8 }}>{t.odometerPhoto}</div>
                  <CameraCapture label="" value={odometerPhoto} onChange={url=>setOdometerPhoto(url)} folder="odometer" lang={lang} required />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontWeight:700,fontSize:14,color:"#1A3A5C",display:"block",marginBottom:6 }}>{t.odometerReading}</label>
                  <input type="number" value={odometerReading} onChange={e=>setOdometerReading(e.target.value)}
                    placeholder={t.odometerPlaceholder}
                    style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:16,outline:"none",boxSizing:"border-box" }} />
                  {totalKM > 0 && (<div style={{ fontSize:12,color:"#64748b",marginTop:4 }}>GPS measured distance this trip: {totalKM} km</div>)}
                </div>
                {odometerWarning&&(
                  <div style={{ background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#92400e",marginBottom:12 }}>
                    ⚠️ {odometerWarning}
                  </div>
                )}
                <div style={{ display:"flex",gap:8 }}>
                  <Btn onClick={endTrip} color="#ef4444" style={{ flex:1,padding:12 }}>🏁 {t.confirmEndTrip}</Btn>
                  <Btn onClick={()=>{setShowOdometerForm(false);setTripStarted(true);setOdometerWarning("");}} color="#64748b">{t.cancelEndTrip}</Btn>
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

          {pending.length===0&&myInv.length===0&&approvedActivities.length===0&&(
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
          {deliveredInv.length===0&&(<Card><div style={{ textAlign:"center",padding:32,color:"#94a3b8",fontSize:15 }}>No delivered invoices yet.</div></Card>)}
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
          {failedInv.length===0&&(<Card><div style={{ textAlign:"center",padding:32,color:"#94a3b8",fontSize:15 }}>No failed invoices.</div></Card>)}
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

      {/* TRIP HISTORY TAB */}
      {view==="history"&&(
        <Card>
          <CardTitle>📊 {t.history}</CardTitle>
          {history.length===0&&<div style={{ textAlign:"center",padding:32,color:"#94a3b8",fontSize:15 }}>{t.noHistory}</div>}
          {history.map((h,i)=>(
            <div key={i} style={{ border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4 }}>
                <span style={{ fontWeight:700,fontSize:15 }}>📅 {h.date}</span>
                {h.type==="Additional Activity"?(
                  <span style={{ fontSize:12,fontWeight:600,padding:"3px 8px",borderRadius:6,background:"#f3e8ff",color:"#7c3aed" }}>🗂️ Additional Activity</span>
                ):(
                  <span style={{ fontWeight:700,fontSize:15,color:h.successRate>=80?"#10b981":h.successRate>=60?"#f59e0b":"#ef4444" }}>{h.successRate}% success</span>
                )}
              </div>
              {h.type==="Additional Activity"?(
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:6,fontSize:13,color:"#64748b" }}>
                  <span>🗂️ {h.purpose}</span>
                  <span>📍 {h.destination}</span>
                  <span>🚗 {h.vehicle}</span>
                  <span>📍 {h.distance} km</span>
                  <span>⏱️ {h.duration}</span>
                  <span>⛽ {h.fuelUsed||0}L</span>
                  {h.operationalHours&&<span>🕐 {h.operationalHours}h Op</span>}
                </div>
              ):(
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:6,fontSize:13,color:"#64748b" }}>
                  <span>🚗 {h.vehicle}</span>
                  <span>📋 {h.delivered}/{h.invoices} delivered</span>
                  <span>📍 {h.distance} km</span>
                  <span>⏱️ {h.duration}</span>
                  <span>⛽ {h.fuelUsed||0}L used</span>
                  {h.operationalHours&&<span>🕐 {h.operationalHours}h Op</span>}
                  <span>{h.isHalfDay?"⏰ Half Day":"✅ Full Day"}</span>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
