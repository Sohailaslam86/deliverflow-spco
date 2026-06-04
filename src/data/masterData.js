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

// All roles including new ones
export const ROLES = ["admin", "planning", "manager", "logistic", "driver", "viewonly", "management"];

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
  { name: "Ambient", range: "15-25°C", color: "#10b981" },
  { name: "Refrigerated", range: "2-8°C", color: "#3b82f6" },
  { name: "Cold Chain", range: "2-25°C", color: "#8b5cf6" },
  { name: "Frozen", range: "-18 to -20°C", color: "#0ea5e9" },
];

export const MAINTENANCE_TYPES = [
  "Scheduled Service", "Oil Change", "Tire Replacement",
  "Brake Service", "Engine Repair", "Electrical", "Body Work", "Other"
];

// Failed delivery reasons — dropdown
export const FAILED_REASONS = [
  "Customer Postponed",
  "Customer Not Available",
  "Customer Refusal",
  "Wrong Address",
  "Order Duplication",
  "Insufficient Stock (System Mismatch)",
];

export const DC_GPS = {
  Riyadh:  { lat: "24.7136", lng: "46.6753" },
  Jeddah:  { lat: "21.4858", lng: "39.1925" },
  Dammam:  { lat: "26.4207", lng: "50.0888" },
};

export const DRIVERS_BY_DC = {
  Riyadh: [],
  Jeddah: [],
  Dammam: [],
};

// ── ROLE COLORS ──────────────────────────────────────────
// RC = sidebar background color
export const RC = {
  admin:      "#1A3A5C",
  planning:   "#7c3aed",
  manager:    "#0f766e",
  logistic:   "#b91c1c",   // dark red — fleet/fuel focus
  driver:     "#b45309",
  viewonly:   "#475569",
  management: "#1e3a5f",   // navy — read only
};

// RA = active nav item / accent color
export const RA = {
  admin:      "#2471A3",
  planning:   "#9333ea",
  manager:    "#0d9488",
  logistic:   "#dc2626",
  driver:     "#d97706",
  viewonly:   "#64748b",
  management: "#2563eb",
};

// RI = role icon
export const RI = {
  admin:      "👑",
  planning:   "📄",
  manager:    "🏢",
  logistic:   "🔧",
  driver:     "🚚",
  viewonly:   "👁️",
  management: "📊",
};

// Role display labels
export const ROLE_LABELS = {
  admin:      "System Administrator",
  planning:   "Planning",
  manager:    "Distribution Center Manager",
  logistic:   "Logistics Manager",
  driver:     "Delivery Partner",
  viewonly:   "View Only",
  management: "Management",
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
  pending:          { bg:"#fef3c7", c:"#92400e", label:"Pending",            icon:"⏳" },
  staged:           { bg:"#dbeafe", c:"#1e40af", label:"Staged for Dispatch", icon:"📦" },
  assigned:         { bg:"#dbeafe", c:"#1e40af", label:"Assigned",            icon:"👤" },
  delivered:        { bg:"#d1fae5", c:"#065f46", label:"Delivered",           icon:"✅" },
  failed:           { bg:"#fee2e2", c:"#991b1b", label:"Failed",              icon:"❌" },
  outstanding:      { bg:"#ffedd5", c:"#9a3412", label:"Outstanding",         icon:"⚠️" },
  scheduled:        { bg:"#f3e8ff", c:"#6b21a8", label:"Scheduled",           icon:"📅" },
  hold_await:       { bg:"#f3e8ff", c:"#6b21a8", label:"Awaiting Response",   icon:"📅" },
  hold_ship:        { bg:"#f3e8ff", c:"#6b21a8", label:"Pending Shipment",    icon:"📅" },
  intransit:        { bg:"#ede9fe", c:"#4c1d95", label:"In Transit",          icon:"🚚" },
  cancelled:        { bg:"#f1f5f9", c:"#475569", label:"Cancelled",           icon:"🚫" },
  to_be_assigned:   { bg:"#fef3c7", c:"#92400e", label:"To Be Assigned",      icon:"⏳" },
};

export const DEMO_USERS = [];

export const INITIAL_INVOICES = [];
export const INITIAL_VEHICLES = [
  { plate:"Dyna 5784", type:"Dyna", dc:"Riyadh", brand:"Toyota", model:"Dyna 300", chassis:"JK8AB59E90K012345", year:"2020", fahas:"2026-08-15", istimara:"2026-09-01", insurance:"2026-12-31", fuelCapacity:80, fuelLevel:45, mileage:12, totalKM:45230, nextOilKM:47000, nextOilDate:"2026-07-01", status:"Active", maintHistory:[], photos:[] },
  { plate:"BUS 2632",  type:"Bus",  dc:"Riyadh", brand:"Toyota", model:"Coaster",  chassis:"JK8AB59E90K012346", year:"2019", fahas:"2026-07-20", istimara:"2026-08-15", insurance:"2026-11-30", fuelCapacity:100,fuelLevel:70, mileage:10, totalKM:62100, nextOilKM:63000, nextOilDate:"2026-06-15", status:"Active", maintHistory:[], photos:[] },
  { plate:"BUS 2630",  type:"Bus",  dc:"Riyadh", brand:"Toyota", model:"Coaster",  chassis:"JK8AB59E90K012347", year:"2019", fahas:"2026-09-10", istimara:"2026-10-01", insurance:"2027-01-31", fuelCapacity:100,fuelLevel:90, mileage:10, totalKM:55400, nextOilKM:57000, nextOilDate:"2026-08-01", status:"Active", maintHistory:[], photos:[] },
  { plate:"BUS 2629",  type:"Bus",  dc:"Riyadh", brand:"Toyota", model:"Coaster",  chassis:"JK8AB59E90K012348", year:"2018", fahas:"2026-06-30", istimara:"2026-07-15", insurance:"2026-10-31", fuelCapacity:100,fuelLevel:30, mileage:10, totalKM:78900, nextOilKM:80000, nextOilDate:"2026-06-30", status:"Maintenance", maintHistory:[{type:"Brake Service",date:"2026-05-20",startDate:"2026-05-20",returnDate:"2026-05-27",cost:"3200",notes:"Front brake pads replaced",addedBy:"AlWaleed Qahtani"}], photos:[] },
  { plate:"Dyna 5789", type:"Dyna", dc:"Jeddah", brand:"Toyota", model:"Dyna 200", chassis:"JK8AB59E90K012349", year:"2021", fahas:"2026-11-01", istimara:"2026-12-01", insurance:"2027-03-31", fuelCapacity:80, fuelLevel:60, mileage:12, totalKM:31200, nextOilKM:33000, nextOilDate:"2026-09-01", status:"Active", maintHistory:[], photos:[] },
  { plate:"Dyna 1217", type:"Dyna", dc:"Jeddah", brand:"Toyota", model:"Dyna 200", chassis:"JK8AB59E90K012350", year:"2020", fahas:"2026-10-15", istimara:"2026-11-01", insurance:"2027-02-28", fuelCapacity:80, fuelLevel:55, mileage:12, totalKM:38700, nextOilKM:40000, nextOilDate:"2026-08-15", status:"Active", maintHistory:[], photos:[] },
  { plate:"BUS 4472",  type:"Bus",  dc:"Dammam", brand:"Toyota", model:"Coaster",  chassis:"JK8AB59E90K012351", year:"2022", fahas:"2026-12-01", istimara:"2027-01-01", insurance:"2027-06-30", fuelCapacity:100,fuelLevel:80, mileage:11, totalKM:18500, nextOilKM:20000, nextOilDate:"2026-10-01", status:"Active", maintHistory:[], photos:[] },
];
export const INITIAL_TRIPS = [];
export const INITIAL_FUEL_LOGS = [];
export const INITIAL_UPLOADS = [];
export const INITIAL_USER_REQUESTS = [];
export const INITIAL_ALERTS = [];
