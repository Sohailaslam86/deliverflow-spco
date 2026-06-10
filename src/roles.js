// src/constants/roles.js
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all role strings in DeliverFlow SPCO.
//
// RULE: NEVER hardcode role strings anywhere in the app.
//   ✅ CORRECT:  if (user.role === ROLES.DRIVER)
//   ❌ WRONG:    if (user.role === "driver")
//   ❌ WRONG:    if (user.role === "Delivery Partner")  ← UI label, not a role value
//
// NOTE: Firestore always stores the ROLES value (e.g. "driver").
//       UI always displays the ROLE_LABELS value (e.g. "Delivery Partner").
//       These are intentionally different — do not mix them up.
// ─────────────────────────────────────────────────────────────────────────────

export const ROLES = {
  ADMIN:       "admin",
  MANAGER:     "manager",     // DC Manager
  LOGISTIC:    "logistic",
  PLANNING:    "planning",
  DRIVER:      "driver",      // Stored in Firestore as "driver" — shown in UI as "Delivery Partner"
  MANAGEMENT:  "management",
  VIEW_ONLY:   "viewOnly",
};

// UI display labels — used in components for rendering only, never for logic checks
export const ROLE_LABELS = {
  [ROLES.ADMIN]:      "Admin",
  [ROLES.MANAGER]:    "DC Manager",
  [ROLES.LOGISTIC]:   "Logistic",
  [ROLES.PLANNING]:   "Planning",
  [ROLES.DRIVER]:     "Delivery Partner",  // ← renamed from "Driver"
  [ROLES.MANAGEMENT]: "Management",
  [ROLES.VIEW_ONLY]:  "View Only",
};

// Roles that can approve fuel entries
export const FUEL_APPROVER_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.LOGISTIC];

// Roles that can add fuel entries directly (no approval needed)
export const FUEL_DIRECT_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.LOGISTIC];

// Roles with cross-DC access (intentional — see Handover v7.0 Section 2)
// NOTE: Logistic cross-DC access is screen-specific, NOT universal.
//       Logistic fuel scope = Riyadh DC only (see Handover v8.0 correction).
export const CROSS_DC_ROLES = [ROLES.ADMIN, ROLES.LOGISTIC, ROLES.PLANNING, ROLES.MANAGEMENT];

// Helper: get UI label for a role value
export function getRoleLabel(roleValue) {
  return ROLE_LABELS[roleValue] || roleValue;
}
