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

export interface DbMedicalRecord {
  id: string;
  patient_id: string;
  type: string | null;
  title: string | null;
  description: string | null;
  file_url: string | null;
  created_at: string;
}

export interface DbAIConsultation {
  id: string;
  patient_id: string;
  summary: string | null;
  risk_level: string | null;
  recommendations: string | null;
  created_at: string;
}

export interface DbPrescription {
  id: string;
  patient_id: string;
  medication: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  created_at: string;
}

export interface PatientFullData {
  success: boolean;
  error?: string;
  user?: DbUser;
  vitals?: DbVital[];
  medical_records?: DbMedicalRecord[];
  ai_consultations?: DbAIConsultation[];
  prescriptions?: DbPrescription[];
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
  recorded_by?: string;
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
      ...(input.recorded_by ? { recorded_by: input.recorded_by } : {}),
    });

  if (error) throw error;
};

/**
 * Fetch complete patient data using QR code (RPC function)
 * This is the primary method - uses the database RPC function
 */
export const getPatientByQRCode = async (qrCode: string): Promise<PatientFullData> => {
  try {
    const { data, error } = await supabase.rpc("get_patient_full_data", {
      p_qr_code: qrCode,
    });

    if (error) throw error;
    if (!data) {
      return {
        success: false,
        error: "Patient not found",
      };
    }

    return data as PatientFullData;
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch patient data",
    };
  }
};

/**
 * Fallback method: Fetch patient data using multiple queries
 * Use if RPC is not available
 */
export const getPatientByQRCodeFallback = async (
  qrCode: string
): Promise<PatientFullData> => {
  try {
    // Step 1: Get user by QR code
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (userError || !user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Step 2: Fetch all related data in parallel
    const [vitalsRes, recordsRes, aiRes, prescriptionsRes] = await Promise.all([
      supabase
        .from("vitals")
        .select("*")
        .eq("patient_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(50),
      supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("ai_consultations")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      success: true,
      user: user as DbUser,
      vitals: (vitalsRes.data ?? []) as DbVital[],
      medical_records: (recordsRes.data ?? []) as DbMedicalRecord[],
      ai_consultations: (aiRes.data ?? []) as DbAIConsultation[],
      prescriptions: (prescriptionsRes.data ?? []) as DbPrescription[],
    };
  } catch (error) {
    console.error("Error fetching patient data (fallback):", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch patient data",
    };
  }
};
