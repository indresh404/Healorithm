// services/adminApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// HTTP client for the Healorithm Admin FastAPI backend (port 8000).
//
// IMPORTANT: Change BACKEND_URL to your machine's local IP when testing on a
// physical device.  'localhost' only works on emulators.
//
// Find your IP:  Windows → ipconfig  |  Mac → ifconfig | grep inet
// 
// FOR PHYSICAL DEVICE:
// Change this to: 'http://192.168.X.X:8000' (replace with your machine IP)
// FOR EMULATOR:
// Use: 'http://localhost:8000'
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️ CHANGE THIS TO YOUR MACHINE IP IF TESTING ON PHYSICAL DEVICE
export const BACKEND_URL = 'http://10.125.162.214:8000';

// Quick debug: log the URL being used
console.log('🔗 Admin API Backend:', BACKEND_URL);

const API = `${BACKEND_URL}/api/admin`;

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10-second timeout
  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('Backend unreachable — request timed out');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Types mirroring the backend responses ────────────────────────────────────

export interface PrioritizedPatient {
  visit_order: number;
  patient_id: string;
  name: string;
  phone?: string;
  village?: string;
  priority_score: number;
  risk_level: 'green' | 'yellow' | 'red';
  reason: string;
  days_overdue: number;
  adherence_rate: number;
  age?: number;
  emergency_flag: boolean;
}

export interface PrioritizedListResponse {
  success: boolean;
  worker_id: string;
  total_patients: number;
  prioritized_list: PrioritizedPatient[];
  generated_at: string;
}

export interface PatientProfileResponse {
  success: boolean;
  patient: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    phone?: string;
    village?: string;
    chronic_diseases: string[];
    allergies: string[];
    current_risk_score?: number;
    risk_level?: string;
    adherence_rate?: number;
    emergency_flag: boolean;
  };
  recent_vitals: any[];
  recent_consultations: any[];
  active_prescriptions: any[];
  last_visit_date?: string;
  days_since_visit?: number;
}

export interface StartVisitResponse {
  success: boolean;
  session_id: string;
  patient_name: string;
  patient_age?: number;
  emergency_flag: boolean;
  started_at: string;
}

export interface RecordVitalsResponse {
  success: boolean;
  session_id: string;
  is_emergency: boolean;
  emergency_details: string[];
  computed_risk_score: number;
  computed_risk_level: string;
  risk_factors: string[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const adminApi = {
  /** Health check — use to verify backend is reachable */
  health: async (): Promise<{ status: string }> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${BACKEND_URL}/health`, {
        signal: controller.signal,
        headers: { 'bypass-tunnel-reminder': 'true' },
      });
      return res.json();
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('Backend unreachable — request timed out');
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  },

  /** Login an admin/worker by phone + password */
  login: (phone: string, password: string) =>
    apiFetch<{ success: boolean; worker: { id: string; name: string; phone: string; role: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }
    ),

  /** Fetch AI-prioritized patient list for a worker */
  getPrioritizedList: (workerId: string): Promise<PrioritizedListResponse> =>
    apiFetch(`/patient/prioritized-list/${encodeURIComponent(workerId)}`),

  /** Look up a patient by QR code */
  scanPatient: (qrCode: string): Promise<PatientProfileResponse> =>
    apiFetch(`/patient/scan/${encodeURIComponent(qrCode)}`),

  /** Start a visit session */
  startVisit: (workerId: string, patientId: string): Promise<StartVisitResponse> =>
    apiFetch('/visit/start', {
      method: 'POST',
      body: JSON.stringify({ worker_id: workerId, patient_id: patientId }),
    }),

  /** Record vitals (triggers emergency detection + risk scoring) */
  recordVitals: (payload: {
    session_id: string;
    patient_id: string;
    worker_id: string;
    systolic_bp: number;
    diastolic_bp: number;
    spo2: number;
    temperature: number;
    heart_rate: number;
    notes?: string;
  }): Promise<RecordVitalsResponse> =>
    apiFetch('/visit/record-vitals', { method: 'POST', body: JSON.stringify(payload) }),

  /** Record symptoms */
  recordSymptoms: (payload: {
    session_id: string;
    patient_id: string;
    symptoms: string[];
    severity?: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }) => apiFetch('/visit/record-symptoms', { method: 'POST', body: JSON.stringify(payload) }),

  /** Add a prescription */
  addPrescription: (payload: {
    session_id: string;
    patient_id: string;
    worker_id: string;
    medicine_name: string;
    dosage: string;
    frequency: string;
    meal_timing?: string;
    duration_days?: number;
    notes?: string;
  }) => apiFetch('/visit/add-prescription', { method: 'POST', body: JSON.stringify(payload) }),

  /** End the visit */
  endVisit: (payload: {
    session_id: string;
    patient_id: string;
    worker_id: string;
    visit_type?: string;
    started_at?: string;
    outcome_notes?: string;
    follow_up_needed?: boolean;
    follow_up_days?: number;
    emergency_resolved?: boolean;
  }) => apiFetch('/visit/end', { method: 'POST', body: JSON.stringify(payload) }),

  /** Get past visit history for a patient */
  getVisitHistory: (patientId: string) =>
    apiFetch(`/visit/history/${encodeURIComponent(patientId)}`),
};
