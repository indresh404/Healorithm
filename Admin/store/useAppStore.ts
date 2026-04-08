import { create } from 'zustand';
import { Patient, VitalParams } from '../constants/mockData';
import { THRESHOLDS } from '../constants/thresholds';
import { getUsers, getVitalsForPatients, recordVitals, type DbVital, type DbAIConsultation } from '../services/supabase.service';

interface Worker {
  id: string;
  name: string;
  username: string;
  zone: string;
  since: string;
  phone: string;
}

export interface SyncItem {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  value: string;
  time: string;
  village: string;
  resolved: boolean;
}

interface AppState {
  isLoggedIn: boolean;
  currentWorker: Worker | null;
  currentPatient: Patient | null;
  patients: Patient[];
  syncQueue: SyncItem[];
  alerts: Alert[];
  lastSyncTime: Date | null;
  login: (worker: Worker) => void;
  logout: () => void;
  setCurrentPatient: (patientData: any) => void;
  loadPatientsFromDb: () => Promise<void>;
  updatePatientVitals: (patientId: string, vitals: Omit<VitalParams, 'id'>) => Promise<void>;
  addToSyncQueue: (item: Omit<SyncItem, 'id' | 'timestamp'>) => void;
  markSynced: (itemId: string) => void;
  simulateSync: () => Promise<void>;
  resolveAlert: (alertId: string) => void;
}

const isHighRisk = (v: VitalParams) => {
  const [sys, dia] = v.bp.split('/').map(Number);
  if (sys > THRESHOLDS.BP_SYSTOLIC_MAX || dia > THRESHOLDS.BP_DIASTOLIC_MAX) return true;
  if (v.spo2 < THRESHOLDS.SPO2_MIN) return true;
  if (v.temp > THRESHOLDS.TEMP_MAX) return true;
  if (v.hr > THRESHOLDS.HR_MAX || v.hr < THRESHOLDS.HR_MIN) return true;
  return false;
};

export const useAppStore = create<AppState>((set, get) => ({
  isLoggedIn: false,
  currentWorker: null,
  currentPatient: null,
  patients: [],
  syncQueue: [],
  alerts: [],
  lastSyncTime: null,
  
  login: (worker) => set({ isLoggedIn: true, currentWorker: worker }),
  logout: () => set({ isLoggedIn: false, currentWorker: null }),
  
  setCurrentPatient: (patientData) => {
    // Transform patient data from QR scan into Patient format
    const vitalsHistory: VitalParams[] = (patientData.vitals || []).map((v: DbVital) => {
      const systolic = typeof v.systolic_bp === 'number' ? v.systolic_bp : 0;
      const diastolic = typeof v.diastolic_bp === 'number' ? v.diastolic_bp : 0;
      const bp = `${systolic}/${diastolic}`;
      const entry: VitalParams = {
        id: v.id,
        date: v.recorded_at ?? v.created_at,
        bp,
        spo2: v.spo2 ?? 0,
        temp: v.temperature ?? 0,
        hr: v.heart_rate ?? 0,
      };
      entry.isHighRisk = isHighRisk(entry);
      return entry;
    });

    const latestVital = vitalsHistory[0];
    const latestAI = (patientData.aiConsultations || [])[0] as DbAIConsultation | undefined;
    
    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (latestAI?.risk_level === 'HIGH') riskLevel = 'HIGH';
    else if (latestAI?.risk_level === 'MEDIUM') riskLevel = 'MEDIUM';

    const patient: Patient = {
      id: patientData.id,
      name: patientData.name,
      age: patientData.age || 0,
      gender: patientData.gender || 'Unknown',
      village: 'Unknown',
      conditions: [],
      riskLevel,
      riskScore: riskLevel === 'HIGH' ? 85 : riskLevel === 'MEDIUM' ? 50 : 20,
      emergencyFlag: riskLevel === 'HIGH',
      lastVisited: latestVital?.date ?? new Date().toISOString(),
      overdue: false,
      adherencePercentage: 0,
      adherenceLog: ['none', 'none', 'none', 'none', 'none', 'none', 'none'],
      vitalsHistory,
      prescriptions: (patientData.prescriptions || []).map((p: any) => `${p.medication} ${p.dosage}`),
      notes: latestAI?.summary || '',
    };

    set({ currentPatient: patient });
  },
  
  loadPatientsFromDb: async () => {
    const users = await getUsers();
    const vitals = await getVitalsForPatients(users.map(u => u.id));
    const vitalsByPatient = new Map<string, VitalParams[]>();

    vitals.forEach((v) => {
      const systolic = typeof v.systolic_bp === 'number' ? v.systolic_bp : null;
      const diastolic = typeof v.diastolic_bp === 'number' ? v.diastolic_bp : null;
      const bp = systolic !== null && diastolic !== null ? `${systolic}/${diastolic}` : 'N/A';
      const entry: VitalParams = {
        id: v.id,
        date: v.recorded_at ?? v.created_at,
        bp,
        spo2: v.spo2 ?? 0,
        temp: v.temperature ?? 0,
        hr: v.heart_rate ?? 0,
      };
      entry.isHighRisk = isHighRisk(entry);

      const list = vitalsByPatient.get(v.patient_id) ?? [];
      list.push(entry);
      vitalsByPatient.set(v.patient_id, list);
    });

    for (const [, list] of vitalsByPatient) {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const patients: Patient[] = users.map((u) => {
      const history = vitalsByPatient.get(u.id) ?? [];
      const latest = history[0];
      const highRisk = latest?.isHighRisk ?? false;
      const riskLevel = highRisk ? 'HIGH' : 'LOW';
      const riskScore = highRisk ? 85 : 20;
      const lastVisited = latest?.date ?? u.updated_at ?? u.created_at ?? new Date().toISOString();

      return {
        id: u.id,
        name: u.name,
        age: u.age ?? 0,
        gender: u.gender ?? 'Unknown',
        village: 'Unknown',
        conditions: [],
        riskLevel,
        riskScore,
        emergencyFlag: highRisk,
        lastVisited,
        overdue: false,
        adherencePercentage: 0,
        adherenceLog: ['none', 'none', 'none', 'none', 'none', 'none', 'none'],
        vitalsHistory: history,
        prescriptions: [],
        notes: '',
      };
    });

    set({ patients });
  },

  updatePatientVitals: async (patientId, vitals) => {
    await recordVitals({
      patient_id: patientId,
      systolic_bp: Number(vitals.bp.split('/')[0]),
      diastolic_bp: Number(vitals.bp.split('/')[1]),
      heart_rate: vitals.hr,
      spo2: vitals.spo2,
      temperature: vitals.temp,
      recorded_at: vitals.date,
    });

    let alertCreated = false;
    let alertDetails: any = null;

    // Check thresholds
    const isEmergency = () => {
      const { bp, spo2, temp, hr } = vitals;
      if (bp) {
        const [sys, dia] = bp.split('/').map(Number);
        if (sys > THRESHOLDS.BP_SYSTOLIC_MAX || dia > THRESHOLDS.BP_DIASTOLIC_MAX) {
          alertDetails = { type: 'HIGH BP DETECTED', value: `BP: ${bp} mmHg` };
          return true;
        }
      }
      if (spo2 && spo2 < THRESHOLDS.SPO2_MIN) {
        alertDetails = { type: 'LOW SpO2', value: `SpO2: ${spo2}%` };
        return true;
      }
      if (temp && temp > THRESHOLDS.TEMP_MAX) {
        alertDetails = { type: 'HIGH FEVER', value: `Temp: ${temp} C` };
        return true;
      }
      if (hr && (hr > THRESHOLDS.HR_MAX || hr < THRESHOLDS.HR_MIN)) {
        alertDetails = { type: 'ABNORMAL HEART RATE', value: `HR: ${hr} bpm` };
        return true;
      }
      return false;
    };

    const emergency = isEmergency();
    const newVital: VitalParams = {
      id: Math.random().toString(),
      isHighRisk: emergency,
      ...vitals,
    };

    set((state) => {
      const newPatients = state.patients.map((p) => {
        if (p.id === patientId) {
          p.vitalsHistory = [newVital, ...p.vitalsHistory];
          if (emergency) {
            p.riskLevel = 'HIGH';
            p.emergencyFlag = true;
          }
          return p;
        }
        return p;
      });
      
      const newAlerts = [...state.alerts];
      if (emergency) {
        const patient = newPatients.find(p => p.id === patientId);
        if (patient) {
          newAlerts.unshift({
            id: Math.random().toString(),
            patientId,
            patientName: patient.name,
            type: alertDetails?.type || 'EMERGENCY',
            value: alertDetails?.value || '',
            time: vitals.date,
            village: patient.village,
            resolved: false
          });
        }
      }

      return { patients: newPatients, alerts: newAlerts };
    });

    get().addToSyncQueue({ type: 'VITALS_UPDATE', data: { patientId, vitals } });
  },

  addToSyncQueue: (item) => {
    set((state) => ({
      syncQueue: [...state.syncQueue, { ...item, id: Math.random().toString(), timestamp: new Date().toISOString() }],
    }));
  },

  markSynced: (itemId) => {
    set((state) => ({
      syncQueue: state.syncQueue.filter((i) => i.id !== itemId),
    }));
  },

  simulateSync: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        set({ syncQueue: [], lastSyncTime: new Date() });
        resolve();
      }, 2000);
    });
  },

  resolveAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a)
    }));
  }
}));
