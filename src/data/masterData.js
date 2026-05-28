// src/data/masterData.js
// DeliverFlow — SPCO Master Data

export const DEMO_PW = "spco2026";
export const ROLES = ["admin","planning","manager","driver","viewonly"];
export const DEPARTMENTS = ["Administration","Planning & Logistics","Distribution - Riyadh","Distribution - Jeddah","Distribution - Dammam","Sales","Finance","Recovery","IT","HR","Operations"];
export const DCS = ["Riyadh","Jeddah","Dammam"];
export const LOCATIONS = ["Head Office","Riyadh DC","Jeddah DC","Dammam DC"];
export const STORAGE_CONDITIONS = [
  { name:"Ambient",      range:"15°C to 25°C",   color:"#10b981" },
  { name:"Refrigerated", range:"2°C to 8°C",     color:"#3b82f6" },
  { name:"Cold Chain",   range:"2°C to 25°C",    color:"#f59e0b" },
  { name:"Frozen",       range:"-18°C to -20°C", color:"#6366f1" },
];
export const CITIES = ["Riyadh","Jeddah","Dammam","Makkah","Madinah","Tabuk","Khobar","Jubail","Yanbu","Abha","Hail","Qassim"];
export const ALERT_DISMISS_REASONS = ["Under Investigation","Driver Contacted — In Progress","Customer Rescheduled","Route Delay — Traffic","Vehicle Issue — Being Resolved","Weekend / Holiday","Awaiting Customer Confirmation","Transferred to Another Driver","Delayed by DC Manager","Other (Manual Reason)"];
export const MAINTENANCE_TYPES = ["Scheduled Service","Oil Change","Tyre Change","Battery Change","Brake Service","AC Service","Engine Repair","Accident Repair","Annual Inspection","Other"];

export const DEMO_USERS = [
  { uid:"u1",  name:"Sohail Aslam",      displayName:"Sohail A.",   empId:"EMP-001", email:"sohail@spco.sa",   phone:"0501111111", role:"admin",    dept:"Administration",        location:"Head Office", dc:null,     status:"Active", licNo:null,       licExp:null,         viewDC:"all" },
  { uid:"u2",  name:"Muhammad Shakil",   displayName:"M. Shakil",   empId:"EMP-002", email:"shakil@spco.sa",   phone:"0502222222", role:"planning", dept:"Planning & Logistics",  location:"Head Office", dc:null,     status:"Active", licNo:null,       licExp:null,         viewDC:"all" },
  { uid:"u3",  name:"Baber",             displayName:"Baber",       empId:"EMP-003", email:"baber@spco.sa",    phone:"0503333333", role:"planning", dept:"Planning & Logistics",  location:"Head Office", dc:null,     status:"Active", licNo:null,       licExp:null,         viewDC:"all" },
  { uid:"u4",  name:"AlWaleed Qahtani",  displayName:"AlWaleed Q.", empId:"EMP-004", email:"waleed@spco.sa",   phone:"0504444444", role:"manager",  dept:"Distribution - Riyadh", location:"Riyadh DC",   dc:"Riyadh", status:"Active", licNo:null,       licExp:null,         viewDC:"Riyadh" },
  { uid:"u5",  name:"Mansoor Khattaf",   displayName:"Mansoor K.",  empId:"EMP-005", email:"mansoor@spco.sa",  phone:"0505555555", role:"manager",  dept:"Distribution - Riyadh", location:"Riyadh DC",   dc:"Riyadh", status:"Active", licNo:null,       licExp:null,         viewDC:"Riyadh" },
  { uid:"u6",  name:"Muhammad Anas",     displayName:"M. Anas",     empId:"EMP-006", email:"anas@spco.sa",     phone:"0506666666", role:"manager",  dept:"Distribution - Jeddah", location:"Jeddah DC",   dc:"Jeddah", status:"Active", licNo:null,       licExp:null,         viewDC:"Jeddah" },
  { uid:"u7",  name:"Muhammad Saleh",    displayName:"M. Saleh",    empId:"EMP-007", email:"saleh@spco.sa",    phone:"0507777777", role:"manager",  dept:"Distribution - Dammam", location:"Dammam DC",   dc:"Dammam", status:"Active", licNo:null,       licExp:null,         viewDC:"Dammam" },
  { uid:"u8",  name:"Khaled Sharahili",  displayName:"Khaled S.",   empId:"DRV-001", email:"khaled@spco.sa",   phone:"0508881111", role:"driver",   dept:"Distribution - Riyadh", location:"Riyadh DC",   dc:"Riyadh", status:"Active", licNo:"SA123456", licExp:"2027-03-15", viewDC:"Riyadh" },
  { uid:"u9",  name:"Abdul Rahman",      displayName:"Abdul R.",    empId:"DRV-002", email:"rahman@spco.sa",   phone:"0508882222", role:"driver",   dept:"Distribution - Riyadh", location:"Riyadh DC",   dc:"Riyadh", status:"Active", licNo:"SA234567", licExp:"2026-08-20", viewDC:"Riyadh" },
  { uid:"u10", name:"Belkacem Al-Faqih", displayName:"Belkacem F.", empId:"DRV-003", email:"belkacem@spco.sa", phone:"0508883333", role:"driver",   dept:"Distribution - Jeddah", location:"Jeddah DC",   dc:"Jeddah", status:"Active", licNo:"SA345678", licExp:"2027-06-10", viewDC:"Jeddah" },
  { uid:"u11", name:"Muhammad Sabei",    displayName:"M. Sabei",    empId:"EMP-008", email:"sabei@spco.sa",    phone:"0509991111", role:"viewonly", dept:"Sales",                 location:"Head Office", dc:null,     status:"Active", licNo:null,       licExp:null,         viewDC:"Riyadh" },
  { uid:"u12", name:"Asim Ahmed",        displayName:"Asim A.",     empId:"EMP-009", email:"asim@spco.sa",     phone:"0509992222", role:"viewonly", dept:"Finance",               location:"Head Office", dc:null,     status:"Active", licNo:null,       licExp:null,         viewDC:"all" },
  { uid:"u13", name:"Ali Raza",          displayName:"Ali R.",      empId:"EMP-010", email:"ali@spco.sa",      phone:"0509993333", role:"viewonly", dept:"Finance",               location:"Head Office", dc:null,     status:"Active", licNo:null,       licExp:null,         viewDC:"all" },
  { uid:"u14", name:"Khalid B",          displayName:"Khalid B.",   empId:"EMP-011", email:"khalid@spco.sa",   phone:"0509994444", role:"viewonly", dept:"Recovery",              location:"Head Office", dc:null,     status:"Active", licNo:null,       licExp:null,         viewDC:"all" },
];

export const DRIVERS_BY_DC = {
  Riyadh: ["Khaled Sharahili","Abdul Rahman Al-Qarni","Mohamed Al-Harithi","Turki Al-Ahmad","Abdul Rahman Al-Sultan","Abdul Mohsen Al-Dosari","Abdullah Ahmed","Mufarreh Al-Maliki","Mishaan bin Naif Al-Anzi","Nayef Al-Alawi","Muhammad Al-Mubaraki","Sharid Al-Dosari","Belkacem Al-Faqih"],
  Jeddah: ["Belkacem Al-Faqih","Abdullah Ahmed","Ahmed Al Alawi","Ayman Al-Maliki","Nayef Al-Alawi","Mufarreh Al-Maliki","Muhammad Al-Mubaraki","Talal bin Abdullah","Sharid Al-Dosari","Abdul Rahman Al-Qarni","Mohamed Al-Harithi","Abdul Mohsen Al-Dosari"],
  Dammam: ["Mishaan bin Naif Al-Anzi","Talal bin Abdullah","Ali bin Hassan"],
};

export const INITIAL_VEHICLES = [
  { plate:"Dyna 5784", type:"Dyna", dc:"Riyadh", status:"Active",      brand:"Toyota", model:"Dyna 300", chassis:"TY123456", year:"2022", fahas:"2026-12-01", istimara:"2026-11-15", insurance:"2026-10-30", fuelCapacity:80,  fuelLevel:45, mileage:12, totalKM:45230, nextOilKM:50000, nextOilDate:"2026-12-01", maintHistory:[] },
  { plate:"BUS 2632",  type:"Bus",  dc:"Riyadh", status:"Active",      brand:"Hino",   model:"Bus 700",  chassis:"HN789012", year:"2021", fahas:"2026-08-01", istimara:"2026-07-15", insurance:"2026-09-30", fuelCapacity:120, fuelLevel:80, mileage:8,  totalKM:78450, nextOilKM:80000, nextOilDate:"2026-09-01", maintHistory:[] },
  { plate:"BUS 2630",  type:"Bus",  dc:"Riyadh", status:"Maintenance", brand:"Hino",   model:"Bus 300",  chassis:"HN456789", year:"2020", fahas:"2026-06-15", istimara:"2026-05-30", insurance:"2026-07-01", fuelCapacity:100, fuelLevel:30, mileage:9,  totalKM:92100, nextOilKM:95000, nextOilDate:"2026-08-01", maintHistory:[{type:"Scheduled Service",startDate:"2026-05-20",returnDate:"2026-05-28",cost:1200,notes:"Full service"}] },
  { plate:"BUS 2631",  type:"Bus",  dc:"Jeddah", status:"Active",      brand:"Hino",   model:"Bus 700",  chassis:"HN345678", year:"2022", fahas:"2027-01-01", istimara:"2026-12-15", insurance:"2027-01-30", fuelCapacity:120, fuelLevel:95, mileage:8,  totalKM:34200, nextOilKM:35000, nextOilDate:"2027-01-15", maintHistory:[] },
  { plate:"Dyna 1217", type:"Dyna", dc:"Jeddah", status:"Active",      brand:"Toyota", model:"Dyna 200", chassis:"TY567890", year:"2023", fahas:"2027-03-01", istimara:"2027-02-15", insurance:"2027-03-30", fuelCapacity:80,  fuelLevel:60, mileage:13, totalKM:18900, nextOilKM:20000, nextOilDate:"2027-02-01", maintHistory:[] },
  { plate:"BUS 4472",  type:"Bus",  dc:"Dammam", status:"Active",      brand:"Hino",   model:"Bus 500",  chassis:"HN901234", year:"2021", fahas:"2026-09-01", istimara:"2026-08-15", insurance:"2026-10-01", fuelCapacity:110, fuelLevel:40, mileage:9,  totalKM:56780, nextOilKM:60000, nextOilDate:"2026-10-01", maintHistory:[] },
  { plate:"Dyna 5789", type:"Dyna", dc:"Riyadh", status:"Active",      brand:"Toyota", model:"Dyna 300", chassis:"TY901234", year:"2023", fahas:"2027-03-15", istimara:"2027-02-28", insurance:"2027-04-01", fuelCapacity:80,  fuelLevel:70, mileage:12, totalKM:12400, nextOilKM:15000, nextOilDate:"2026-12-15", maintHistory:[] },
];

export const INITIAL_INVOICES = [
  { id:"INV-6032151025", customer:"National Guards Hospital Al-Hasa", inst:"Government", dc:"Riyadh", city:"Riyadh",  status:"pending",    driverId:null,  vehicle:null,        storage:"Refrigerated (2-8°C)", dtype:"incity",  date:"2026-05-26", uploadBatch:"UPLOAD-2026-05-26-001", remarks:"Handle with care",    podImage:null,     gps:null,                         assignedAt:null,            deliveredAt:null,            failReason:null,              attempts:0 },
  { id:"INV-6032151026", customer:"Al-Hammadi Hospital",              inst:"Private",    dc:"Riyadh", city:"Riyadh",  status:"assigned",   driverId:"u8",  vehicle:"Dyna 5784", storage:"Ambient (15-25°C)",    dtype:"incity",  date:"2026-05-26", uploadBatch:"UPLOAD-2026-05-26-001", remarks:"",                    podImage:null,     gps:null,                         assignedAt:"2026-05-26 08:30", deliveredAt:null,            failReason:null,              attempts:0 },
  { id:"INV-6032151027", customer:"King Fahd Medical City",           inst:"Government", dc:"Jeddah", city:"Jeddah",  status:"delivered",  driverId:"u10", vehicle:"BUS 2631",  storage:"Ambient (15-25°C)",    dtype:"incity",  date:"2026-05-25", uploadBatch:"UPLOAD-2026-05-25-001", remarks:"",                    podImage:"demo_pod",gps:{lat:21.4858,lng:39.1925},   assignedAt:"2026-05-25 09:00", deliveredAt:"2026-05-25 14:30",failReason:null,              attempts:1 },
  { id:"INV-6032151028", customer:"MOH Hospital Dammam",              inst:"Government", dc:"Dammam", city:"Dammam",  status:"failed",     driverId:"u7",  vehicle:"BUS 4472",  storage:"Cold Chain (2-25°C)",  dtype:"outcity", date:"2026-05-25", uploadBatch:"UPLOAD-2026-05-25-001", remarks:"",                    podImage:null,     gps:null,                         assignedAt:"2026-05-25 09:30", deliveredAt:null,            failReason:"Customer not available",attempts:1 },
  { id:"INV-6032151029", customer:"Bugshan Hospital",                 inst:"Private",    dc:"Jeddah", city:"Jeddah",  status:"outstanding",driverId:"u10", vehicle:"BUS 2631",  storage:"Ambient (15-25°C)",    dtype:"incity",  date:"2026-05-24", uploadBatch:"UPLOAD-2026-05-24-001", remarks:"2nd attempt",         podImage:null,     gps:null,                         assignedAt:"2026-05-24 10:00", deliveredAt:null,            failReason:"Address incorrect",attempts:2 },
  { id:"INV-6032151030", customer:"King Salman Hospital",             inst:"Government", dc:"Riyadh", city:"Riyadh",  status:"pending",    driverId:null,  vehicle:null,        storage:"Frozen (-18 to -20°C)",dtype:"incity",  date:"2026-05-26", uploadBatch:"UPLOAD-2026-05-26-001", remarks:"Urgent — keep frozen",podImage:null,     gps:null,                         assignedAt:null,            deliveredAt:null,            failReason:null,              attempts:0 },
  { id:"INV-6032151031", customer:"Saudi German Hospital",            inst:"Private",    dc:"Jeddah", city:"Makkah",  status:"intransit",  driverId:"u10", vehicle:"BUS 2631",  storage:"Refrigerated (2-8°C)", dtype:"outcity", date:"2026-05-26", uploadBatch:"UPLOAD-2026-05-26-001", remarks:"",                    podImage:null,     gps:null,                         assignedAt:"2026-05-26 07:00", deliveredAt:null,            failReason:null,              attempts:0 },
  { id:"INV-6032151032", customer:"Dr Sulaiman Al Habib Hospital",    inst:"Private",    dc:"Riyadh", city:"Riyadh",  status:"delivered",  driverId:"u8",  vehicle:"Dyna 5784", storage:"Ambient (15-25°C)",    dtype:"incity",  date:"2026-05-26", uploadBatch:"UPLOAD-2026-05-26-001", remarks:"",                    podImage:"demo_pod",gps:{lat:24.7136,lng:46.6753},   assignedAt:"2026-05-26 08:30", deliveredAt:"2026-05-26 13:15",failReason:null,              attempts:1 },
  { id:"INV-6032151033", customer:"Dammam Medical Tower",             inst:"Private",    dc:"Dammam", city:"Dammam",  status:"pending",    driverId:null,  vehicle:null,        storage:"Ambient (15-25°C)",    dtype:"incity",  date:"2026-05-23", uploadBatch:"UPLOAD-2026-05-23-001", remarks:"",                    podImage:null,     gps:null,                         assignedAt:null,            deliveredAt:null,            failReason:null,              attempts:0 },
];

export const INITIAL_TRIPS = [
  { id:"TRIP-001", date:"2026-05-26", fromDC:"Riyadh", toCity:"Jeddah", driver:"Khaled Sharahili", vehicle:"Dyna 5784", storage:"Refrigerated (2-8°C)", status:"dispatched", invoiceIds:["INV-6032151031"], notes:"Morning trip", createdBy:"AlWaleed Qahtani", startKM:45230, endKM:null, startFuel:45, endFuel:null },
];

export const INITIAL_FUEL_LOGS = [
  { id:"FUEL-001", date:"2026-05-25", vehicle:"Dyna 5784", dc:"Riyadh", driver:"Khaled Sharahili",  liters:45, sar:90,  tripKM:350, addedBy:"AlWaleed Qahtani" },
  { id:"FUEL-002", date:"2026-05-24", vehicle:"BUS 2631",  dc:"Jeddah", driver:"Belkacem Al-Faqih", liters:60, sar:120, tripKM:420, addedBy:"Muhammad Anas" },
];

export const INITIAL_UPLOADS = [
  { batchId:"UPLOAD-2026-05-26-001", date:"2026-05-26", time:"07:45", uploadedBy:"Muhammad Shakil", postedBy:"Muhammad Shakil", postedAt:"2026-05-26 08:00", status:"posted", invoiceCount:5, notes:"" },
  { batchId:"UPLOAD-2026-05-25-001", date:"2026-05-25", time:"08:00", uploadedBy:"Baber",           postedBy:"Baber",           postedAt:"2026-05-25 08:15", status:"posted", invoiceCount:3, notes:"" },
  { batchId:"UPLOAD-2026-05-24-001", date:"2026-05-24", time:"07:30", uploadedBy:"Muhammad Shakil", postedBy:"Muhammad Shakil", postedAt:"2026-05-24 07:45", status:"posted", invoiceCount:4, notes:"" },
];

export const INITIAL_USER_REQUESTS = [
  { reqId:"REQ-2026-001", empType:"authority", name:"Omar Faisal", displayName:"Omar F.", empId:"EMP-015", mobile:"0501234567", email:"omar@spco.sa", dept:"Sales", role:"viewonly", location:"Riyadh DC", viewDC:"Riyadh", reason:"Need to track Riyadh deliveries for sales coordination", requestedBy:"Muhammad Sabei", requestedByRole:"viewonly", dcManagerApproval:null, dcManagerName:null, dcManagerDate:null, adminApproval:null, adminName:null, adminDate:null, status:"pending", reqDate:"2026-05-25", uniqueRef:null },
];

export const INITIAL_ALERTS = [
  { id:"ALT-001", dc:"Riyadh", type:"undelivered",   invoiceId:"INV-6032151026", message:"INV-6032151026 assigned but not delivered — Al-Hammadi Hospital",  raisedAt:"2026-05-26 18:00", status:"active", dismissedBy:null, dismissReason:null, manualReason:null, dismissedAt:null, adminApproved:null },
  { id:"ALT-002", dc:"Riyadh", type:"license_expiry", invoiceId:null,            message:"Driver Abdul Rahman — License expires 2026-08-20 (85 days)",        raisedAt:"2026-05-26 08:00", status:"active", dismissedBy:null, dismissReason:null, manualReason:null, dismissedAt:null, adminApproved:null },
  { id:"ALT-003", dc:"Riyadh", type:"fahas",          invoiceId:null,            message:"Vehicle BUS 2630 — Fahas expired 2026-06-15",                       raisedAt:"2026-05-26 08:00", status:"active", dismissedBy:null, dismissReason:null, manualReason:null, dismissedAt:null, adminApproved:null },
  { id:"ALT-004", dc:"Jeddah", type:"undelivered",   invoiceId:"INV-6032151029", message:"INV-6032151029 outstanding 2 days — Bugshan Hospital",               raisedAt:"2026-05-24 18:00", status:"active", dismissedBy:null, dismissReason:null, manualReason:null, dismissedAt:null, adminApproved:null },
  { id:"ALT-005", dc:"Riyadh", type:"oil_change",    invoiceId:null,            message:"Vehicle Dyna 5784 — Oil change due at 50,000 KM (current: 45,230)", raisedAt:"2026-05-26 08:00", status:"active", dismissedBy:null, dismissReason:null, manualReason:null, dismissedAt:null, adminApproved:null },
];

export const RC = { admin:"#1A3A5C", planning:"#0F3460", manager:"#1B4332", driver:"#7B2D00", viewonly:"#2D2D2D" };
export const RA = { admin:"#2471A3", planning:"#2980B9", manager:"#27AE60", driver:"#E85D04", viewonly:"#888888" };
export const RI = { admin:"⚙️", planning:"📋", manager:"🏭", driver:"🚚", viewonly:"👁️" };

export const STATUS_STYLES = {
  pending:     { bg:"#fef3c7", c:"#92400e", icon:"⏳", label:"Pending" },
  assigned:    { bg:"#dbeafe", c:"#1e40af", icon:"🔵", label:"Assigned" },
  delivered:   { bg:"#d1fae5", c:"#065f46", icon:"✅", label:"Delivered" },
  failed:      { bg:"#fee2e2", c:"#991b1b", icon:"❌", label:"Failed" },
  outstanding: { bg:"#ffedd5", c:"#9a3412", icon:"🟠", label:"Outstanding" },
  intransit:   { bg:"#ede9fe", c:"#5b21b6", icon:"🔄", label:"In Transit" },
};

export function daysSince(dateStr) {
  if(!dateStr)return 0;
  return Math.floor((new Date()-new Date(dateStr))/(1000*60*60*24));
}

export function agingColor(days) {
  if(days<=1)return{bg:"#d1fae5",c:"#065f46",label:"Fresh"};
  if(days<=3)return{bg:"#fef3c7",c:"#92400e",label:"Aging"};
  return{bg:"#fee2e2",c:"#991b1b",label:"Critical"};
}

export function genId(prefix) {
  const d=new Date();
  const date=d.toISOString().split("T")[0];
  const seq=String(Math.floor(Math.random()*9000)+1000);
  return `${prefix}-${date}-${seq}`;
}

export function haversineKM(lat1,lon1,lat2,lon2) {
  const R=6371;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

export const DC_GPS = {
  Riyadh: { lat:24.7136, lng:46.6753 },
  Jeddah: { lat:21.4858, lng:39.1925 },
  Dammam: { lat:26.4207, lng:50.0888 },
};
