import { supabase } from "@/config/supabase";

export interface DbUser {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  phone: string;
  password: string | null;
  preferred_language: string | null;
  latitude: number | null;
  longitude: number | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAdmin {
  id: string;
  name: string | null;
  password: string | null;
  role: string | null;
  created_at: string;
  phone: string | null;
}

export interface DbVital {
  id: string;
  patient_id: string;
  recorded_by: string | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  notes: string | null;
  is_critical: boolean | null;
  recorded_at: string | null;
  created_at: string;
  updated_at: string;
}

export const loginUserByPhone = async (phones: string[], password: string) => {
  const candidates = phones.filter(Boolean);
  if (candidates.length === 0) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .in("phone", candidates)
    .eq("password", password)
    .maybeSingle();

  if (error) throw error;
  return data as DbUser | null;
};

export const loginAdminByPhone = async (phones: string[], password: string) => {
  const candidates = phones.filter(Boolean);
  if (candidates.length === 0) return null;

  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .in("phone", candidates)
    .eq("password", password)
    .maybeSingle();

  if (error) throw error;
  return data as DbAdmin | null;
};

export const getUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("*");

  if (error) throw error;
  return (data ?? []) as DbUser[];
};

export const getVitalsForPatients = async (patientIds: string[]) => {
  if (patientIds.length === 0) return [] as DbVital[];

  const { data, error } = await supabase
    .from("vitals")
    .select("*")
    .in("patient_id", patientIds);

  if (error) throw error;
  return (data ?? []) as DbVital[];
};

export const recordVitals = async (input: {
  patient_id: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  spo2: number;
  temperature: number;
  recorded_at?: string;
}) => {
  const { error } = await supabase
    .from("vitals")
    .insert({
      patient_id: input.patient_id,
      systolic_bp: input.systolic_bp,
      diastolic_bp: input.diastolic_bp,
      heart_rate: input.heart_rate,
      spo2: input.spo2,
      temperature: input.temperature,
      recorded_at: input.recorded_at ?? new Date().toISOString(),
    });

  if (error) throw error;
};
