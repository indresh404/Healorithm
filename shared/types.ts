// shared/types.ts

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface Patient {
  id: string; // client UUID or u-xxx
  qr_id: string; // scanned QR payload (matches id or short token)
  name: string;
  age: number;
  gender: string;
  preferred_language: string;
  phone: string;
  village: string;
  household_id?: string;
  address?: string;
  blood_group?: string;
  emergency_contact?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at?: string;
  consent_status?: 'granted' | 'revoked' | 'pending';
  last_diary_sync?: string;
}

// Backward-compatible alias
export type User = Patient;

export interface Vitals {
  id?: string;
  patient_id: string;
  visit_id?: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  temperature?: number;
  heart_rate?: number;
  blood_glucose?: number;
  recorded_at: string;
  recorded_by: string; // worker or doctor id
  is_emergency?: boolean;
  emergency_reason?: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  patient_name: string;
  visit_date: string;
  worker_id: string;
  worker_name: string;
  village: string;
  report_type: string;
  provisional_diagnosis?: string;
  details: string;
  symptoms: string[];
  affected_body_zones: string[];
  vitals?: Vitals;
  sync_status: 'synced' | 'pending' | 'conflict';
  created_at: string;
}

// Backward-compatible alias
export type MedicalRecord = Visit;

export interface RiskResult {
  score: number; // 0 - 100
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  factors: string[];
  missing_data_warnings: string[];
  is_emergency: boolean;
  emergency_reason?: string;
  recommended_specialty: string;
  target_response_time: string;
  priority: 'Emergency' | 'Urgent' | 'Routine';
  computed_at?: string;
}

export interface HealthAnalytics {
  id: string;
  user_id: string;
  vaccination_status: string;
  vaccination_label: string;
  medicine_tracker: string;
  medicine_percent: string;
  medicine_progress: number;
  last_checkup_date: string;
  last_checkup_status: string;
  next_appointment_doctor: string;
  next_appointment_date: string;
  risk_score?: number;
  risk_level?: 'Low' | 'Moderate' | 'High' | 'Critical';
  risks?: string[];
  weekly_summary?: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  heart_rate?: number;
  blood_glucose?: number;
  adherence_rate?: number;
  missed_followups?: number;
  has_diabetes?: boolean;
  has_hypertension?: boolean;
  has_cardiac_history?: boolean;
  other_chronic_conditions?: string[];
  emergency_flag?: boolean;
  emergency_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface Prescription {
  id: string;
  user_id: string;
  medical_record_id: string;
  medicine_name: string;
  dosage: string;
  timing: string;
  meal_timing?: string;
  duration: string;
  generic_name?: string;
  generic_status?: 'approved' | 'kept_brand' | 'not_available' | 'pending';
  brand_price?: number;
  generic_price?: number;
  savings?: number;
  brand_reason?: string;
  created_at: string;
}

export interface JanAushadhiReport {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  doctor_id: string;
  date_issued: string;
  price_table_version: string; // e.g. "PMBJP-2026.1"
  items: Array<{
    medicine_name: string;
    generic_name: string;
    dosage: string;
    brand_price: number;
    generic_price: number;
    status: 'approved' | 'kept_brand' | 'not_available';
    reason?: string;
  }>;
  total_brand_cost: number;
  total_generic_cost: number;
  total_savings: number;
  savings_percentage: number;
  delivery_status: 'confirmed' | 'delivered_to_patient' | 'seen_by_patient';
  delivery_timestamp?: string;
  version: number;
}

export interface JanAushadhiItem {
  id: string;
  brand_name: string;
  generic_name: string;
  category: string;
  dosage: string;
  brand_price: number;
  generic_price: number;
  savings_percentage: number;
  indications: string[];
}

export interface GovernmentScheme {
  id: string;
  name: string;
  short_code: string;
  description: string;
  coverage_amount: string;
  eligibility_criteria: string[];
  portal_url: string;
}

export interface Referral {
  id: string;
  user_id: string;
  patient_name: string;
  village: string;
  priority: 'Emergency' | 'Urgent' | 'Routine';
  specialty: string;
  target_response_time: string;
  risk_score: number;
  top_factors: string[];
  status: 'Created' | 'Synced' | 'Accepted' | 'Completed' | 'Rejected';
  worker_name: string;
  created_at: string;
  doctor_notes?: string;
}

export interface Village {
  name: string;
  lat: number;
  lng: number;
  patient_count: number;
  high_risk_count: number;
  worker_count: number;
  last_activity: string;
  emergency_cases: number;
  avg_risk_score: number;
}

export interface Worker {
  id: string;
  name: string;
  village: string;
  phone: string;
  assigned_patients: number;
  visits_this_week: number;
  overdue_patients: number;
  emergencies_handled_30d?: number;
  last_sync: string;
  status: 'Active' | 'Idle' | 'Offline';
  lat?: number;
  lng?: number;
}

export interface OutbreakAlert {
  id: string;
  symptom: string;
  patient_count: number;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  severity: 'Low' | 'Moderate' | 'High';
  village_names: string[];
  time_window?: string;
  suggested_action: string;
  created_at?: string;
}

export interface PredictedOutbreak {
  id: string;
  disease: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  severity: 'Low' | 'Moderate' | 'High';
  confidence: number;
  estimated_cases: number;
  village_names: string[];
  signals: string[];
  suggested_action: string;
  basis: 'ai_model' | 'fallback';
}

export interface CareCoordinationTask {
  id: string;
  user_id: string;
  patient_name: string;
  village: string;
  priority: 'High' | 'Moderate' | 'Routine';
  missing_data_fields: string[];
  reason: string;
  recommended_action: string;
  assigned_worker: string;
  status: 'pending' | 'delivered_to_worker' | 'completed' | 'doctor_reviewed';
  created_at: string;
}

// Backward-compatible alias
export type CareTask = CareCoordinationTask;

export interface OutboxItem {
  id: string; // UUID
  table_name: 'patients' | 'visits' | 'vitals' | 'prescriptions' | 'diary';
  record_id: string;
  action: 'insert' | 'update' | 'append';
  payload_cipher: string; // Encrypted or plain JSON delta
  status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  priority: 'emergency' | 'high' | 'normal';
  timestamp: string;
  attempts: number;
  last_error?: string;
}

export interface Conflict {
  id: string;
  user_id: string;
  patient_name: string;
  field_name: string;
  local_value: string;
  remote_value: string;
  local_source: string;
  remote_source: string;
  local_timestamp: string;
  remote_timestamp: string;
  status: 'unresolved' | 'resolved';
  resolved_value?: string;
}

// Backward-compatible alias
export type ConflictRecord = Conflict;

export interface ConsentRecord {
  id: string;
  patient_id: string;
  actor_id: string; // worker or doctor id
  actor_role: 'worker' | 'doctor' | 'admin';
  action: 'granted' | 'revoked';
  purpose: 'triage' | 'prescription' | 'referral' | 'telemedicine';
  timestamp: string;
}

export interface DailyAdherenceEntry {
  date: string;
  morning_taken: boolean;
  afternoon_taken: boolean;
  night_taken: boolean;
  symptoms_reported?: string[];
  sos_triggered?: boolean;
}

export interface ZeroSignalPacket {
  seq: number;
  total: number;
  uid: string;
  chk: string;
  payload: string;
}

export interface HeatPoint {
  id: string;
  label: string;
  description: string;
  position: [number, number, number];
  color: string;
  intensity: number;
}
