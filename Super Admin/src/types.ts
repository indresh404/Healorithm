export interface User {
  id: string;
  name: string;
  age: number;
  gender: string;
  preferred_language: string;
  phone: string;
  village?: string;
  lat?: number;
  lng?: number;
  created_at: string;
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
  created_at: string;
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
  blood_glucose?: number;
  adherence_rate?: number;
  missed_followups?: number;
  has_diabetes?: boolean;
  has_hypertension?: boolean;
  other_chronic_conditions?: string[];
  created_at: string;
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
  created_at: string;
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
