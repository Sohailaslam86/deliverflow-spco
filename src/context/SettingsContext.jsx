// src/context/SettingsContext.jsx
// Loads all dynamic settings from Firestore on app start.
// Provides shifts, failedReasons, activityPurposes, cities, storageConditions
// and a getShiftForDCAndDate() helper used by Reports.jsx and Driver.jsx.

import { createContext, useContext, useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  FAILED_REASONS,
  ADDITIONAL_ACTIVITY_PURPOSES,
  CITIES,
  STORAGE_CONDITIONS,
} from "../data/masterData.js";

const SettingsContext = createContext(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

// Default shift when nothing is configured in Firestore
const DEFAULT_SHIFT = { name: "Standard", start: "08:00", end: "16:00", hours: 8 };

export function SettingsProvider({ children }) {
  const [shifts, setShifts] = useState([]);
  const [failedReasons, setFailedReasons] = useState(FAILED_REASONS);
  const [activityPurposes, setActivityPurposes] = useState(ADDITIONAL_ACTIVITY_PURPOSES);
  const [cities, setCities] = useState([...CITIES]);
  const [storageConditions, setStorageConditions] = useState([...STORAGE_CONDITIONS]);
  const [loading, setLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false); // true = Firestore failed, using fallback

  useEffect(() => {
    loadAllSettings();
  }, []);

  async function loadAllSettings() {
    try {
      // Load shifts
      const shiftSnap = await getDocs(collection(db, "shifts"));
      const fsShifts = shiftSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (fsShifts.length > 0) setShifts(fsShifts);

      // Load app settings (failedReasons + activityPurposes)
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "app_settings"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.failedReasons && data.failedReasons.length > 0) {
            setFailedReasons(data.failedReasons);
          }
          if (data.activityPurposes && data.activityPurposes.length > 0) {
            setActivityPurposes(data.activityPurposes);
          }
        }
      } catch (e) {
        console.error("Settings load error:", e);
      }

      // Load cities
      const citiesSnap = await getDocs(collection(db, "cities"));
      const fsCities = citiesSnap.docs.map(d => d.data().name || d.data()).filter(c => typeof c === "string");
      if (fsCities.length > 0) setCities(fsCities);

      // Load storage conditions
      const storageSnap = await getDocs(collection(db, "storage"));
      const fsStorage = storageSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (fsStorage.length > 0) setStorageConditions(fsStorage);

      setSettingsError(false); // Firestore loaded successfully
    } catch (e) {
      console.error("SettingsContext load error:", e);
      setSettingsError(true); // Using masterData.js fallback values
    }
    setLoading(false);
  }

  /**
   * getShiftForDCAndDate(dc, date)
   * Returns the shift object applicable for a given DC and date string (YYYY-MM-DD).
   *
   * Priority:
   *   1. DC-specific shift  (applyTo="selected" AND dc is in selectedDCs AND date in range)
   *   2. All-DC shift       (applyTo="all" AND date in range)
   *   3. Default shift      { start:"08:00", end:"16:00", hours:8 }
   */
  function getShiftForDCAndDate(dc, date) {
    if (!date) return DEFAULT_SHIFT;

    // Priority 1 — DC-specific shift
    const dcSpecific = shifts.find(s =>
      s.applyTo === "selected" &&
      Array.isArray(s.selectedDCs) &&
      s.selectedDCs.includes(dc) &&
      (!s.validFrom || date >= s.validFrom) &&
      (!s.validTo || date <= s.validTo)
    );
    if (dcSpecific) return enrichShift(dcSpecific);

    // Priority 2 — All-DC shift
    const allDC = shifts.find(s =>
      s.applyTo === "all" &&
      (!s.validFrom || date >= s.validFrom) &&
      (!s.validTo || date <= s.validTo)
    );
    if (allDC) return enrichShift(allDC);

    // Priority 3 — Default
    return DEFAULT_SHIFT;
  }

  /** Calculate hours from start/end if not already stored */
  function enrichShift(shift) {
    if (shift.hours) return shift;
    if (shift.start && shift.end) {
      const [sh, sm] = shift.start.split(":").map(Number);
      const [eh, em] = shift.end.split(":").map(Number);
      const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      return { ...shift, hours: Math.max(0, Math.round(hours * 10) / 10) };
    }
    return { ...shift, hours: 8 };
  }

  // Reload function so MasterData.jsx can trigger a refresh after saving
  async function reloadSettings() {
    await loadAllSettings();
  }

  return (
    <SettingsContext.Provider value={{
      shifts,
      setShifts,
      failedReasons,
      setFailedReasons,
      activityPurposes,
      setActivityPurposes,
      cities,
      setCities,
      storageConditions,
      setStorageConditions,
      getShiftForDCAndDate,
      reloadSettings,
      loading,
      settingsError, // consumers can show offline warning banner if true
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
