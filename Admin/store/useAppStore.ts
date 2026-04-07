import { create } from 'zustand';
import { Patient, MOCK_PATIENTS, VitalParams } from '../constants/mockData';
import { THRESHOLDS } from '../constants/thresholds';

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
  patients: Patient[];
  syncQueue: SyncItem[];
  alerts: Alert[];
  lastSyncTime: Date | null;
  login: (worker: Worker) => void;
  logout: () => void;
  updatePatientVitals: (patientId: string, vitals: Omit<VitalParams, 'id'>) => void;
  addToSyncQueue: (item: Omit<SyncItem, 'id' | 'timestamp'>) => void;
  markSynced: (itemId: string) => void;
  simulateSync: () => Promise<void>;
  resolveAlert: (alertId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoggedIn: false,
  currentWorker: null,
  patients: MOCK_PATIENTS,
  syncQueue: [],
  alerts: [],
  lastSyncTime: null,
  
  login: (worker) => set({ isLoggedIn: true, currentWorker: worker }),
  logout: () => set({ isLoggedIn: false, currentWorker: null }),
  
  updatePatientVitals: (patientId, vitals) => {
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
