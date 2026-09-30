import {
  User,
  MedicalRecord,
  HealthAnalytics,
  Prescription,
  Referral,
  Village,
  Worker,
  OutbreakAlert,
  PredictedOutbreak,
  CareCoordinationTask,
  ConflictRecord,
  DailyAdherenceEntry,
  LanguageCode
} from '@shared/types';
import {
  INITIAL_USERS,
  INITIAL_RECORDS,
  INITIAL_ANALYTICS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_REFERRALS,
  INITIAL_VILLAGES,
  INITIAL_WORKERS,
  INITIAL_OUTBREAKS,
  INITIAL_PREDICTIONS,
  INITIAL_CARE_TASKS,
  INITIAL_CONFLICTS
} from '@shared/mockData';
import { calculateClinicalRisk } from '@shared/clinicalRiskEngine';

export type NetworkStatus = 'online' | 'offline' | '2g_poor' | 'syncing';

interface HealorithmStore {
  users: User[];
  records: MedicalRecord[];
  analytics: HealthAnalytics[];
  prescriptions: Prescription[];
  referrals: Referral[];
  villages: Village[];
  workers: Worker[];
  outbreaks: OutbreakAlert[];
  predictions: PredictedOutbreak[];
  careTasks: CareCoordinationTask[];
  conflicts: ConflictRecord[];
  outbox: Array<{
    id: string;
    type: 'new_patient' | 'vitals_entry' | 'prescription' | 'diary_sync';
    payload: any;
    timestamp: string;
  }>;
  networkStatus: NetworkStatus;
  selectedLanguage: LanguageCode;
  workerSession: {
    isUnlocked: boolean;
    workerId: string;
    workerName: string;
    assignedVillage: string;
  };
  activePatientId: string;
  patientAdherenceLogs: Record<string, DailyAdherenceEntry[]>;
}

const STORAGE_KEY = 'healorithm_v2_local_db';

function getInitialStore(): HealorithmStore {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse local storage, initializing default', e);
    }
  }

  // Prepopulate 7 days adherence log for default patient u-101
  const defaultAdherence: Record<string, DailyAdherenceEntry[]> = {
    'u-101': [
      { date: '2026-09-24', morning_taken: true, afternoon_taken: true, night_taken: true, symptoms_reported: [], sos_triggered: false },
      { date: '2026-09-25', morning_taken: true, afternoon_taken: true, night_taken: false, symptoms_reported: ['Headache'], sos_triggered: false },
      { date: '2026-09-26', morning_taken: true, afternoon_taken: true, night_taken: true, symptoms_reported: [], sos_triggered: false },
      { date: '2026-09-27', morning_taken: true, afternoon_taken: false, night_taken: true, symptoms_reported: [], sos_triggered: false },
      { date: '2026-09-28', morning_taken: true, afternoon_taken: true, night_taken: true, symptoms_reported: [], sos_triggered: false },
      { date: '2026-09-29', morning_taken: true, afternoon_taken: true, night_taken: true, symptoms_reported: ['Dizziness'], sos_triggered: false },
      { date: '2026-09-30', morning_taken: true, afternoon_taken: false, night_taken: false, symptoms_reported: [], sos_triggered: false },
    ],
    'u-103': [
      { date: '2026-09-28', morning_taken: true, afternoon_taken: true, night_taken: true, symptoms_reported: ['Chest tightness'], sos_triggered: false },
      { date: '2026-09-29', morning_taken: true, afternoon_taken: true, night_taken: false, symptoms_reported: ['Severe shortness of breath'], sos_triggered: true },
      { date: '2026-09-30', morning_taken: false, afternoon_taken: false, night_taken: false, symptoms_reported: ['SpO2 88%'], sos_triggered: true },
    ]
  };

  return {
    users: INITIAL_USERS,
    records: INITIAL_RECORDS,
    analytics: INITIAL_ANALYTICS,
    prescriptions: INITIAL_PRESCRIPTIONS,
    referrals: INITIAL_REFERRALS,
    villages: INITIAL_VILLAGES,
    workers: INITIAL_WORKERS,
    outbreaks: INITIAL_OUTBREAKS,
    predictions: INITIAL_PREDICTIONS,
    careTasks: INITIAL_CARE_TASKS,
    conflicts: INITIAL_CONFLICTS,
    outbox: [],
    networkStatus: 'online',
    selectedLanguage: 'en',
    workerSession: {
      isUnlocked: true,
      workerId: 'w2',
      workerName: 'Lakshmi P.',
      assignedVillage: 'Adoni'
    },
    activePatientId: 'u-101',
    patientAdherenceLogs: defaultAdherence
  };
}

class StoreManager {
  private store: HealorithmStore;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.store = getInitialStore();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
    } catch (e) {
      console.error('Storage quota exceeded or error saving:', e);
    }
    this.listeners.forEach(cb => cb());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getSnapshot(): HealorithmStore {
    return this.store;
  }

  public setNetworkStatus(status: NetworkStatus) {
    this.store.networkStatus = status;
    this.save();
  }

  public setLanguage(lang: LanguageCode) {
    this.store.selectedLanguage = lang;
    this.save();
  }

  public setWorkerUnlock(unlocked: boolean) {
    this.store.workerSession.isUnlocked = unlocked;
    this.save();
  }

  public setActivePatient(id: string) {
    this.store.activePatientId = id;
    this.save();
  }

  public registerPatient(user: Omit<User, 'id' | 'created_at'>): User {
    const newUser: User = {
      ...user,
      id: `u-${Date.now()}`,
      created_at: new Date().toISOString(),
      consent_status: 'granted',
      last_diary_sync: new Date().toISOString()
    };

    this.store.users.unshift(newUser);

    // Create baseline analytics
    const newAnalytics: HealthAnalytics = {
      id: `a-${Date.now()}`,
      user_id: newUser.id,
      vaccination_status: 'Completed',
      vaccination_label: 'Registered at Sub-Center',
      medicine_tracker: 'Taking Daily',
      medicine_percent: '100%',
      medicine_progress: 100,
      last_checkup_date: new Date().toISOString().split('T')[0],
      last_checkup_status: 'Baseline Enrollment',
      next_appointment_doctor: 'Dr. Arvind Sharma (CHC Adoni)',
      next_appointment_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      risk_score: 20,
      risk_level: 'Low',
      risks: ['Baseline entry'],
      systolic_bp: 120,
      diastolic_bp: 80,
      spo2: 98,
      heart_rate: 74,
      blood_glucose: 100,
      adherence_rate: 100,
      missed_followups: 0,
      has_diabetes: false,
      has_hypertension: false,
      has_cardiac_history: false,
      other_chronic_conditions: [],
      emergency_flag: false,
      created_at: new Date().toISOString()
    };
    this.store.analytics.unshift(newAnalytics);

    // Queue in Outbox if offline
    this.store.outbox.push({
      id: `outbox-${Date.now()}`,
      type: 'new_patient',
      payload: newUser,
      timestamp: new Date().toISOString()
    });

    this.save();
    return newUser;
  }

  public addVitalsAndRecord(data: {
    userId: string;
    symptoms: string[];
    bodyZones: string[];
    vitals: {
      systolic_bp?: number;
      diastolic_bp?: number;
      spo2?: number;
      temperature?: number;
      heart_rate?: number;
      blood_glucose?: number;
    };
    provisional_diagnosis?: string;
    workerId: string;
  }) {
    const user = this.store.users.find(u => u.id === data.userId);
    if (!user) return;

    // Calculate deterministic clinical risk
    const existingAnalytics = this.store.analytics.find(a => a.user_id === data.userId);
    const chronic = existingAnalytics?.other_chronic_conditions || [];

    const riskResult = calculateClinicalRisk({
      age: user.age,
      gender: user.gender,
      vitals: data.vitals,
      symptoms: data.symptoms,
      chronic_conditions: chronic,
      adherence_rate: existingAnalytics?.adherence_rate || 85,
      missed_followups: existingAnalytics?.missed_followups || 0
    });

    const newRecord: MedicalRecord = {
      id: `rec-${Date.now()}`,
      user_id: data.userId,
      patient_name: user.name,
      report_type: 'Field Vitals & Symptom Evaluation',
      date: new Date().toISOString().split('T')[0],
      doctor: 'Assigned CHC Physician',
      hospital: `CHC ${user.village || 'Adoni'}`,
      status: riskResult.is_emergency ? 'Emergency Triggered' : 'Field Recorded',
      details: data.provisional_diagnosis || `Symptoms: ${data.symptoms.join(', ') || 'None noted'}`,
      icon: riskResult.is_emergency ? 'healing' : 'medical_services',
      symptoms: data.symptoms,
      affected_body_zones: data.bodyZones,
      vitals: data.vitals,
      provisional_diagnosis: data.provisional_diagnosis,
      created_at: new Date().toISOString(),
      created_by: data.workerId,
      sync_status: this.store.networkStatus === 'online' ? 'synced' : 'pending'
    };

    this.store.records.unshift(newRecord);

    // Update or create analytics
    if (existingAnalytics) {
      existingAnalytics.risk_score = riskResult.score;
      existingAnalytics.risk_level = riskResult.level;
      existingAnalytics.risks = riskResult.factors;
      if (data.vitals.systolic_bp) existingAnalytics.systolic_bp = data.vitals.systolic_bp;
      if (data.vitals.diastolic_bp) existingAnalytics.diastolic_bp = data.vitals.diastolic_bp;
      if (data.vitals.spo2) existingAnalytics.spo2 = data.vitals.spo2;
      if (data.vitals.heart_rate) existingAnalytics.heart_rate = data.vitals.heart_rate;
      if (data.vitals.blood_glucose) existingAnalytics.blood_glucose = data.vitals.blood_glucose;
      existingAnalytics.emergency_flag = riskResult.is_emergency;
      existingAnalytics.emergency_reason = riskResult.emergency_reason;
      existingAnalytics.last_checkup_date = new Date().toISOString().split('T')[0];
      existingAnalytics.updated_at = new Date().toISOString();
    }

    // Auto-create Referral if Moderate / High / Emergency
    if (riskResult.score >= 35 || riskResult.is_emergency) {
      const newReferral: Referral = {
        id: `ref-${Date.now()}`,
        user_id: user.id,
        patient_name: user.name,
        village: user.village || 'Adoni',
        priority: riskResult.priority,
        specialty: riskResult.recommended_specialty,
        target_response_time: riskResult.target_response_time,
        risk_score: riskResult.score,
        top_factors: riskResult.factors.slice(0, 3),
        status: 'Created',
        worker_name: this.store.workerSession.workerName,
        created_at: new Date().toISOString()
      };
      this.store.referrals.unshift(newReferral);
    }

    // Trigger Care Coordination Agent logic if missing data or high risk
    if (riskResult.missing_data_warnings.length > 0 || riskResult.score >= 60) {
      const newTask: CareCoordinationTask = {
        id: `task-agent-${Date.now()}`,
        user_id: user.id,
        patient_name: user.name,
        village: user.village || 'Adoni',
        priority: riskResult.priority === 'Emergency' ? 'High' : 'Moderate',
        missing_data_fields: riskResult.missing_data_warnings,
        reason: riskResult.is_emergency 
          ? `EMERGENCY: ${riskResult.emergency_reason}` 
          : `Risk score elevated (${riskResult.score}/100) with key factors: ${riskResult.factors.slice(0, 2).join('; ')}`,
        recommended_action: riskResult.missing_data_warnings.length > 0 
          ? `Collect missing fields: ${riskResult.missing_data_warnings.join(', ')} on next visit.` 
          : `Fast-track patient to ${riskResult.recommended_specialty} clinic.`,
        assigned_worker: this.store.workerSession.workerName,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      this.store.careTasks.unshift(newTask);
    }

    this.store.outbox.push({
      id: `outbox-${Date.now()}`,
      type: 'vitals_entry',
      payload: newRecord,
      timestamp: new Date().toISOString()
    });

    this.save();
  }

  public updatePrescriptionGenericStatus(prescriptionId: string, status: 'approved' | 'kept_brand' | 'not_available', brandReason?: string) {
    const rx = this.store.prescriptions.find(p => p.id === prescriptionId);
    if (rx) {
      rx.generic_status = status;
      if (brandReason) rx.brand_reason = brandReason;
      this.save();
    }
  }

  public addPrescription(rx: Omit<Prescription, 'id' | 'created_at'>) {
    const newRx: Prescription = {
      ...rx,
      id: `rx-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.store.prescriptions.unshift(newRx);
    this.save();
  }

  public toggleAdherenceDose(userId: string, date: string, dose: 'morning' | 'afternoon' | 'night') {
    if (!this.store.patientAdherenceLogs[userId]) {
      this.store.patientAdherenceLogs[userId] = [];
    }

    const list = this.store.patientAdherenceLogs[userId];
    let entry = list.find(e => e.date === date);

    if (!entry) {
      entry = {
        date,
        morning_taken: false,
        afternoon_taken: false,
        night_taken: false,
        symptoms_reported: [],
        sos_triggered: false
      };
      list.push(entry);
    }

    if (dose === 'morning') entry.morning_taken = !entry.morning_taken;
    if (dose === 'afternoon') entry.afternoon_taken = !entry.afternoon_taken;
    if (dose === 'night') entry.night_taken = !entry.night_taken;

    this.save();
  }

  public syncOutbox(): Promise<number> {
    const count = this.store.outbox.length;
    this.store.networkStatus = 'syncing';
    this.save();

    return new Promise((resolve) => {
      setTimeout(() => {
        this.store.outbox = [];
        this.store.records.forEach(r => { r.sync_status = 'synced'; });
        this.store.networkStatus = 'online';
        this.save();
        resolve(count);
      }, 1500);
    });
  }

  public resolveConflict(conflictId: string, resolvedValue: string) {
    const cnf = this.store.conflicts.find(c => c.id === conflictId);
    if (cnf) {
      cnf.status = 'resolved';
      cnf.resolved_value = resolvedValue;
      this.save();
    }
  }

  public resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    this.store = getInitialStore();
    this.save();
  }
}

export const store = new StoreManager();
