// src/types/index.ts

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface User {
  id: string;
  name: string;
  age: number;
  gender: string;
  preferred_language: string;
  phone: string;
  village?: string;
  household_id?: string;
  address?: string;
  blood_group?: string;
  emergency_contact?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  consent_status?: 'granted' | 'revoked' | 'pending';
  last_diary_sync?: string;
}

export interface MedicalRecord {
  id: string;
  user_id: string;
  patient_name: string;
  report_type: string;
  date: string;
  doctor: string;
  hospital: string;
  status: string;
  details: string;
  icon: string;
  symptoms?: string[];
  affected_body_zones?: string[];
  vitals?: {
    systolic_bp?: number;
    diastolic_bp?: number;
    spo2?: number;
    temperature?: number;
    heart_rate?: number;
    blood_glucose?: number;
  };
  provisional_diagnosis?: string;
  created_at: string;
  created_by?: string; // worker or doctor id
  sync_status?: 'synced' | 'pending' | 'conflict';
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

export interface DailyAdherenceEntry {
  date: string; // YYYY-MM-DD
  morning_taken: boolean;
  afternoon_taken: boolean;
  night_taken: boolean;
  symptoms_reported?: string[];
  sos_triggered?: boolean;
}

export interface ZeroSignalPacket {
  version: number;
  chunk_index: number;
  total_chunks: number;
  user_id: string;
  payload: string; // base64 / encrypted data
  checksum: string;
}

export interface ConflictRecord {
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

export interface HeatPoint {
  id: string;
  label: string;
  description: string;
  position: [number, number, number];
  color: string;
  intensity: number;
}
