// src/data/masterData.js

export const DEMO_PW = "spco2026";

export const LOCATIONS = [
  "Distribution Center - Riyadh",
  "Distribution Center - Jeddah",
  "Distribution Center - Dammam",
  "Head Office"
];

export const DCS = ["Riyadh", "Jeddah", "Dammam"];

export const DEPARTMENTS = [
  "Logistics", "Planning", "Finance", "Sales", "Recovery",
  "IT", "HR", "Operations", "Quality", "Regulatory"
];

export const ROLES = ["admin", "planning", "manager", "driver", "viewonly"];

export const CITIES = [
  "Riyadh", "Jeddah", "Dammam", "Makkah", "Madinah",
  "Khobar", "Dhahran", "Jubail", "Tabuk", "Abha",
  "Hail", "Qassim", "Taif", "Yanbu", "Najran"
];

export const TRIP_DESTINATIONS = [
  { label: "Distribution Center - Riyadh", value: "DC-Riyadh", type: "dc" },
  { label: "Distribution Center - Jeddah", value: "DC-Jeddah", type: "dc" },
  { label: "Distribution Center - Dammam", value: "DC-Dammam", type: "dc" },
  { label: "Riyadh", value: "Riyadh", type: "city" },
  { label: "Jeddah", value: "Jeddah", type: "city" },
  { label: "Dammam", value: "Dammam", type: "city" },
  { label: "Makkah", value: "Makkah", type: "city" },
  { label: "Madinah", value: "Madinah", type: "city" },
  { label: "Khobar", value: "Khobar", type: "city" },
  { label: "Dhahran", value: "Dhahran", type: "city" },
  { label: "Jubail", value: "Jubail", type: "city" },
  { label: "Tabuk", value: "Tabuk", type: "city" },
  { label: "Abha", value: "Abha", type: "city" },
  { label: "Hail", value: "Hail", type: "city" },
  { label: "Taif", value: "Taif", type: "city" },
  { label: "Yanbu", value: "Yanbu", type: "city" },
];

export const STORAGE_CONDITIONS = [
  { name: "Ambient", range: "15-25\u00b0C", color: "#10b981" },
  { name: "Refrigerated", range: "2-8\u00b0C", color: "#3b82f6" },
  { name: "Cold Chain", range: "2-25\u00b0C", color: "#8b5cf6" },
  { name: "Frozen", range: "-18 to -20\u00b0C", color: "#0ea5e9" },
];

export const MAINTENANCE_TYPES = [
  "Scheduled Service", "Oil Change", "Tire Replacement",
  "Brake Service", "Engine Repair", "Electrical", "Body Work", "Other"
];

export const DC_GPS = {
  Riyadh:  { lat: "24.7136", lng: "46.6753" },
  Jeddah:  { lat: "21.4858", lng: "39.1925" },
  Dammam:  { lat: "26.4207", lng: "50.0888" },
};

export const DRIVERS_BY_DC = {
  Riyadh: ["Khaled Sharahili", "Abdul Rahman", "Ahmed Al-Nasr", "Yousef Al-Harbi", "Ali Al-Saeed"],
  Jeddah: ["Belkacem Al-Faqih", "Omar Al-Zahrani", "Faisal Al-Ghamdi"],
  Dammam: ["Saad Al-Dosari", "Ibrahim Al-Qatif"],
};

// Role Colors
export const RC = {
  admin:    "#1A3A5C",
  planning: "#7c3aed",
  manager:  "#0f766e",
  driver:   "#b45309",
  viewonly: "#475569",
};
export const RA = {
  admin:    "#2471A3",
  planning: "#9333ea",
  manager:  "#0d9488",
  driver:   "#d97706",
  viewonly: "#64748b",
};
export const RI = {
  admin: "\ud83d\udc51", planning: "\ud83d\udcc4",
  manager: "\ud83c\udfe2", driver: "\ud83d\ude9a", viewonly: "\ud83d\udc41\ufe0f"
};

export function genId(prefix) {
  const d = new Date();
  const ds = d.getFullYear() + "-" +
    String(d.getMonth()+1).padStart(2,"0") + "-" +
    String(d.getDate()).padStart(2,"0");
  const rnd = String(Math.floor(1000+Math.random()*9000));
  return prefix + "-" + ds + "-" + rnd;
}

export const STATUS_STYLES = {
  pending:     { bg:"#fef3c7", c:"#92400e", label:"Pending",           icon:"\u23f3" },
  assigned:    { bg:"#dbeafe", c:"#1e40af", label:"Assigned",          icon:"\ud83d\udc64" },
  delivered:   { bg:"#d1fae5", c:"#065f46", label:"Delivered",         icon:"\u2705" },
  failed:      { bg:"#fee2e2", c:"#991b1b", label:"Failed",            icon:"\u274c" },
  outstanding: { bg:"#ffedd5", c:"#9a3412", label:"Outstanding",       icon:"\u26a0\ufe0f" },
  intransit:   { bg:"#e0e7ff", c:"#3730a3", label:"In Transit",        icon:"\ud83d\ude9a" },
  scheduled:   { bg:"#f3e8ff", c:"#6b21a8", label:"Scheduled",         icon:"\ud83d\udcc5" },
  hold_await:  { bg:"#fef9c3", c:"#854d0e", label:"Awaiting Response", icon:"\u23f3" },
  hold_ship:   { bg:"#e0f2fe", c:"#0369a1", label:"Pending Shipment",  icon:"\ud83d\udce6" },
};

export const DEMO_USERS = [
  { uid:"u1", name:"Sohail Aslam",       displayName:"Sohail",    email:"sohail@spco.sa",   phone:"0501111111", role:"admin",    location:"Head Office",                    dc:null,     viewDC:"all",    dept:"Logistics",  status:"Active" },
  { uid:"u2", name:"Muhammad Shakil",    displayName:"Shakil",    email:"shakil@spco.sa",   phone:"0502222222", role:"planning", location:"Head Office",                    dc:null,     viewDC:"all",    dept:"Planning",   status:"Active" },
  { uid:"u3", name:"Baber",              displayName:"Baber",     email:"baber@spco.sa",    phone:"0503333333", role:"planning", location:"Head Office",                    dc:null,     viewDC:"all",    dept:"Planning",   status:"Active" },
  { uid:"u4", name:"AlWaleed Qahtani",   displayName:"AlWaleed",  email:"waleed@spco.sa",   phone:"0504444444", role:"manager",  location:"Distribution Center - Riyadh",   dc:"Riyadh", viewDC:"Riyadh", dept:"Logistics",  status:"Active" },
  { uid:"u5", name:"Mansoor Khattaf",    displayName:"Mansoor",   email:"mansoor@spco.sa",  phone:"0505555555", role:"manager",  location:"Distribution Center - Riyadh",   dc:"Riyadh", viewDC:"Riyadh", dept:"Logistics",  status:"Active" },
  { uid:"u6", name:"Muhammad Anas",      displayName:"Anas",      email:"anas@spco.sa",     phone:"0506666666", role:"manager",  location:"Distribution Center - Jeddah",   dc:"Jeddah", viewDC:"Jeddah", dept:"Logistics",  status:"Active" },
  { uid:"u7", name:"Muhammad Saleh",     displayName:"Saleh",     email:"saleh@spco.sa",    phone:"0507777777", role:"manager",  location:"Distribution Center - Dammam",   dc:"Dammam", viewDC:"Dammam", dept:"Logistics",  status:"Active" },
  { uid:"u8", name:"Khaled Sharahili",   displayName:"Khaled",    email:"khaled@spco.sa",   phone:"0508888888", role:"driver",   location:"Distribution Center - Riyadh",   dc:"Riyadh", viewDC:"Riyadh", dept:"Logistics",  status:"Active", licNo:"DL-12345", licExp:"2027-01-01", driverCard:"DC-001", driverCardExp:"2027-06-01" },
  { uid:"u9", name:"Abdul Rahman",       displayName:"Rahman",    email:"rahman@spco.sa",   phone:"0509999999", role:"driver",   location:"Distribution Center - Riyadh",   dc:"Riyadh", viewDC:"Riyadh", dept:"Logistics",  status:"Active", licNo:"DL-12346", licExp:"2027-02-01", driverCard:"DC-002", driverCardExp:"2027-06-01" },
  { uid:"u10",name:"Belkacem Al-Faqih",  displayName:"Belkacem",  email:"belkacem@spco.sa", phone:"0500000001", role:"driver",   location:"Distribution Center - Jeddah",   dc:"Jeddah", viewDC:"Jeddah", dept:"Logistics",  status:"Active", licNo:"DL-12347", licExp:"2027-03-01", driverCard:"DC-003", driverCardExp:"2027-06-01" },
  { uid:"u11",name:"Muhammad Sabei",     displayName:"Sabei",     email:"sabei@spco.sa",    phone:"0500000002", role:"viewonly", location:"Distribution Center - Riyadh",   dc:null,     viewDC:"Riyadh", dept:"Sales",      status:"Active" },
  { uid:"u12",name:"Asim Ahmed",         displayName:"Asim",      email:"asim@spco.sa",     phone:"0500000003", role:"viewonly", location:"Head Office",                    dc:null,     viewDC:"all",    dept:"Finance",    status:"Active" },
  { uid:"u13",name:"Ali Raza",           displayName:"Ali",       email:"ali@spco.sa",      phone:"0500000004", role:"viewonly", location:"Head Office",                    dc:null,     viewDC:"all",    dept:"Finance",    status:"Active" },
  { uid:"u14",name:"Khalid B",           displayName:"Khalid",    email:"khalid@spco.sa",   phone:"0500000005", role:"viewonly", location:"Head Office",                    dc:null,     viewDC:"all",    dept:"Recovery",   status:"Active" },
];

export const INITIAL_INVOICES = [
  { id:"INV-6032151001", customer:"King Abdullah Medical City",       inst:"Government", dc:"Riyadh", city:"Riyadh", status:"delivered",   driverId:"u8",  vehicle:"Dyna 5784", storage:"Ambient (15-25\u00b0C)",      dtype:"incity",  date:"2026-05-27", uploadBatch:"UPLOAD-2026-05-27-0001", podImage:"demo_pod", gps:{lat:24.7136,lng:46.6753}, deliveredAt:"2026-05-27 10:30", attempts:1 },
  { id:"INV-6032151002", customer:"Dr Sulaiman Al Habib - Riyadh",    inst:"Private",    dc:"Riyadh", city:"Riyadh", status:"assigned",    driverId:"u9",  vehicle:"BUS 2632",  storage:"Refrigerated (2-8\u00b0C)",   dtype:"incity",  date:"2026-05-27", uploadBatch:"UPLOAD-2026-05-27-0001", podImage:null, gps:null, deliveredAt:null, attempts:0 },
  { id:"INV-6032151003", customer:"National Guard Hospital",           inst:"Government", dc:"Riyadh", city:"Riyadh", status:"pending",     driverId:null,  vehicle:null,        storage:"Ambient (15-25\u00b0C)",      dtype:"incity",  date:"2026-05-26", uploadBatch:"UPLOAD-2026-05-26-0001", podImage:null, gps:null, deliveredAt:null, attempts:0 },
  { id:"INV-6032151004", customer:"King Fahd Medical City",           inst:"Government", dc:"Riyadh", city:"Riyadh", status:"outstanding", driverId:"u8",  vehicle:"Dyna 5784", storage:"Ambient (15-25\u00b0C)",      dtype:"outcity", date:"2026-05-25", uploadBatch:"UPLOAD-2026-05-25-0001", podImage:null, gps:null, deliveredAt:null, attempts:2 },
  { id:"INV-6032151005", customer:"Mouwasat Hospital",                inst:"Private",    dc:"Riyadh", city:"Khobar", status:"scheduled",   driverId:null,  vehicle:null,        storage:"Ambient (15-25\u00b0C)",      dtype:"outcity", date:"2026-05-27", uploadBatch:"UPLOAD-2026-05-27-0001", podImage:null, gps:null, deliveredAt:null, attempts:0, holdType:"confirmed", holdDate:"2026-06-15", holdReason:"Customer requested delivery after Eid" },
  { id:"INV-6032151006", customer:"King Faisal Specialist Hospital",  inst:"Government", dc:"Jeddah", city:"Jeddah", status:"pending",     driverId:null,  vehicle:null,        storage:"Refrigerated (2-8\u00b0C)",   dtype:"incity",  date:"2026-05-27", uploadBatch:"UPLOAD-2026-05-27-0002", podImage:null, gps:null, deliveredAt:null, attempts:0 },
  { id:"INV-6032151007", customer:"Saudi German Hospital Jeddah",     inst:"Private",    dc:"Jeddah", city:"Jeddah", status:"delivered",   driverId:"u10", vehicle:"Dyna 1217", storage:"Ambient (15-25\u00b0C)",      dtype:"incity",  date:"2026-05-27", uploadBatch:"UPLOAD-2026-05-27-0002", podImage:"demo_pod", gps:{lat:21.4858,lng:39.1925}, deliveredAt:"2026-05-27 14:00", attempts:1 },
  { id:"INV-6032151008", customer:"Dammam Central Hospital",          inst:"Government", dc:"Dammam", city:"Dammam", status:"pending",     driverId:null,  vehicle:null,        storage:"Ambient (15-25\u00b0C)",      dtype:"incity",  date:"2026-05-27", uploadBatch:"UPLOAD-2026-05-27-0003", podImage:null, gps:null, deliveredAt:null, attempts:0 },
  { id:"INV-6032151009", customer:"King Abdulaziz Hospital Jeddah",   inst:"Government", dc:"Jeddah", city:"Jeddah", status:"hold_ship",   driverId:null,  vehicle:null,        storage:"Ambient (15-25\u00b0C)",      dtype:"incity",  date:"2026-05-26", uploadBatch:"UPLOAD-2026-05-26-0002", podImage:null, gps:null, deliveredAt:null, attempts:0, holdType:"hold_ship", holdOrigin:"Riyadh", holdReason:"Goods in Riyadh warehouse" },
  { id:"INV-6032151010", customer:"Al Hamadi Hospital",               inst:"Private",    dc:"Riyadh", city:"Riyadh", status:"hold_await",  driverId:null,  vehicle:null,        storage:"Refrigerated (2-8\u00b0C)",   dtype:"incity",  date:"2026-05-25", uploadBatch:"UPLOAD-2026-05-25-0001", podImage:null, gps:null, deliveredAt:null, attempts:0, holdType:"hold_await", holdEstDate:"2026-06-10", holdReason:"Email sent, awaiting customer response", holdRaisedDate:"2026-05-25" },
  { id:"INV-6032151011", customer:"Riyadh Care Hospital",             inst:"Private",    dc:"Riyadh", city:"Riyadh", status:"intransit",   driverId:null,  vehicle:"BUS 2629",  storage:"Ambient (15-25\u00b0C)",      dtype:"outcity", date:"2026-05-26", uploadBatch:"UPLOAD-2026-05-26-0001", podImage:null, gps:null, deliveredAt:null, attempts:0, tripId:"TRIP-2026-001" },
];

export const INITIAL_VEHICLES = [
  { plate:"Dyna 5784", type:"Dyna", dc:"Riyadh", brand:"Toyota", model:"Dyna 300", chassis:"JK8AB59E90K012345", year:"2020", fahas:"2026-08-15", istimara:"2026-09-01", insurance:"2026-12-31", fuelCapacity:80, fuelLevel:45, mileage:12, totalKM:45230, nextOilKM:47000, nextOilDate:"2026-07-01", status:"Active", maintHistory:[], photos:[] },
  { plate:"BUS 2632",  type:"Bus",  dc:"Riyadh", brand:"Toyota", model:"Coaster",  chassis:"JK8AB59E90K012346", year:"2019", fahas:"2026-07-20", istimara:"2026-08-15", insurance:"2026-11-30", fuelCapacity:100,fuelLevel:70, mileage:10, totalKM:62100, nextOilKM:63000, nextOilDate:"2026-06-15", status:"Active", maintHistory:[], photos:[] },
  { plate:"BUS 2630",  type:"Bus",  dc:"Riyadh", brand:"Toyota", model:"Coaster",  chassis:"JK8AB59E90K012347", year:"2019", fahas:"2026-09-10", istimara:"2026-10-01", insurance:"2027-01-31", fuelCapacity:100,fuelLevel:90, mileage:10, totalKM:55400, nextOilKM:57000, nextOilDate:"2026-08-01", status:"Active", maintHistory:[], photos:[] },
  { plate:"BUS 2629",  type:"Bus",  dc:"Riyadh", brand:"Toyota", model:"Coaster",  chassis:"JK8AB59E90K012348", year:"2018", fahas:"2026-06-30", istimara:"2026-07-15", insurance:"2026-10-31", fuelCapacity:100,fuelLevel:30, mileage:10, totalKM:78900, nextOilKM:80000, nextOilDate:"2026-06-30", status:"Maintenance", maintHistory:[{type:"Brake Service",date:"2026-05-20",startDate:"2026-05-20",returnDate:"2026-05-27",cost:"3200",notes:"Front brake pads replaced",addedBy:"AlWaleed Qahtani"}], photos:[] },
  { plate:"Dyna 5789", type:"Dyna", dc:"Jeddah", brand:"Toyota", model:"Dyna 200", chassis:"JK8AB59E90K012349", year:"2021", fahas:"2026-11-01", istimara:"2026-12-01", insurance:"2027-03-31", fuelCapacity:80, fuelLevel:60, mileage:12, totalKM:31200, nextOilKM:33000, nextOilDate:"2026-09-01", status:"Active", maintHistory:[], photos:[] },
  { plate:"Dyna 1217", type:"Dyna", dc:"Jeddah", brand:"Toyota", model:"Dyna 200", chassis:"JK8AB59E90K012350", year:"2020", fahas:"2026-10-15", istimara:"2026-11-01", insurance:"2027-02-28", fuelCapacity:80, fuelLevel:55, mileage:12, totalKM:38700, nextOilKM:40000, nextOilDate:"2026-08-15", status:"Active", maintHistory:[], photos:[] },
  { plate:"BUS 4472",  type:"Bus",  dc:"Dammam", brand:"Toyota", model:"Coaster",  chassis:"JK8AB59E90K012351", year:"2022", fahas:"2026-12-01", istimara:"2027-01-01", insurance:"2027-06-30", fuelCapacity:100,fuelLevel:80, mileage:11, totalKM:18500, nextOilKM:20000, nextOilDate:"2026-10-01", status:"Active", maintHistory:[], photos:[] },
];

export const INITIAL_TRIPS = [
  { id:"TRIP-2026-001", tripNumber:"TRIP-2026-001", date:"2026-05-26", fromDC:"Riyadh", toCity:"DC-Jeddah", toCityLabel:"Distribution Center - Jeddah", driver:"Khaled Sharahili", vehicle:"BUS 2629", storage:"Ambient (15-25\u00b0C)", status:"dispatched", invoiceIds:["INV-6032151011"], notes:"Cross-DC shipment", createdBy:"AlWaleed Qahtani", createdAt:"2026-05-26 08:00" },
];

export const INITIAL_FUEL_LOGS = [
  { id:"FUEL-2026-05-27-0001", date:"2026-05-27", vehicle:"Dyna 5784", driver:"Khaled Sharahili",  liters:45, sar:90,  tripKM:350, dc:"Riyadh" },
  { id:"FUEL-2026-05-26-0001", date:"2026-05-26", vehicle:"BUS 2632",  driver:"Abdul Rahman",      liters:60, sar:120, tripKM:420, dc:"Riyadh" },
  { id:"FUEL-2026-05-25-0001", date:"2026-05-25", vehicle:"Dyna 5789", driver:"Belkacem Al-Faqih", liters:40, sar:80,  tripKM:310, dc:"Jeddah" },
  { id:"FUEL-2026-05-24-0001", date:"2026-05-24", vehicle:"BUS 4472",  driver:"Saad Al-Dosari",    liters:55, sar:110, tripKM:280, dc:"Dammam" },
];

export const INITIAL_UPLOADS = [
  { batchId:"UPLOAD-2026-05-27-0001", date:"2026-05-27", time:"08:00", uploadedBy:"Muhammad Shakil", postedBy:"Muhammad Shakil", postedAt:"2026-05-27 08:05", status:"posted", invoiceCount:5, dc:"Riyadh", notes:"" },
  { batchId:"UPLOAD-2026-05-27-0002", date:"2026-05-27", time:"08:15", uploadedBy:"Baber",           postedBy:"Baber",           postedAt:"2026-05-27 08:20", status:"posted", invoiceCount:2, dc:"Jeddah", notes:"" },
  { batchId:"UPLOAD-2026-05-27-0003", date:"2026-05-27", time:"09:00", uploadedBy:"Muhammad Shakil", postedBy:"Muhammad Shakil", postedAt:"2026-05-27 09:05", status:"posted", invoiceCount:1, dc:"Dammam", notes:"" },
  { batchId:"UPLOAD-2026-05-26-0001", date:"2026-05-26", time:"07:45", uploadedBy:"Baber",           postedBy:"Baber",           postedAt:"2026-05-26 07:50", status:"posted", invoiceCount:3, dc:"Riyadh", notes:"" },
  { batchId:"UPLOAD-2026-05-26-0002", date:"2026-05-26", time:"08:30", uploadedBy:"Muhammad Shakil", postedBy:"Muhammad Shakil", postedAt:"2026-05-26 08:35", status:"posted", invoiceCount:1, dc:"Jeddah", notes:"" },
  { batchId:"UPLOAD-2026-05-25-0001", date:"2026-05-25", time:"08:00", uploadedBy:"Muhammad Shakil", postedBy:"Muhammad Shakil", postedAt:"2026-05-25 08:10", status:"posted", invoiceCount:2, dc:"Riyadh", notes:"" },
];

export const INITIAL_USER_REQUESTS = [
  { reqId:"USR-2026-05-20-0001", empType:"authority", name:"Test User", displayName:"Test", empId:"EMP-999", mobile:"0500000099", email:"test@spco.sa", dept:"Finance", role:"viewonly", location:"Head Office", dc:"", viewDC:"all", reason:"Need access for audit", requestedBy:"Muhammad Shakil", reqDate:"2026-05-20", status:"pending", dcManagerApproval:null, adminApproval:null, uniqueRef:null },
];

export const INITIAL_ALERTS = [
  { id:"ALT-001", type:"vehicle",  dc:"Riyadh", title:"Fahas Expiring Soon",       desc:"BUS 2629 Fahas expires 2026-06-30",           status:"active", date:"2026-05-27", days:2, action:null },
  { id:"ALT-002", type:"vehicle",  dc:"Riyadh", title:"Low Fuel Alert",             desc:"BUS 2629 fuel at 30% (30L/100L)",             status:"active", date:"2026-05-27", days:1, action:null },
  { id:"ALT-003", type:"delivery", dc:"Riyadh", title:"Outstanding Invoice",        desc:"INV-6032151004 — 2 failed attempts",          status:"active", date:"2026-05-25", days:3, action:null },
  { id:"ALT-004", type:"delivery", dc:"Riyadh", title:"Awaiting Customer Response", desc:"INV-6032151010 — No response for 2 days",     status:"active", date:"2026-05-25", days:3, action:null },
];
