-- Run this SQL on Supabase to create the RPC function
-- This fetches complete patient data from a single QR code lookup

CREATE OR REPLACE FUNCTION get_patient_full_data(p_qr_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Step 1: Find user by QR code
  SELECT id INTO v_user_id
  FROM public.users
  WHERE qr_code = p_qr_code
  LIMIT 1;

  -- If user not found, return error
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with this QR code'
    );
  END IF;

  -- Step 2: Build complete patient data object
  SELECT json_build_object(
    'success', true,
    'user', (
      SELECT json_build_object(
        'id', id,
        'name', name,
        'age', age,
        'gender', gender,
        'phone', phone,
        'preferred_language', preferred_language,
        'latitude', latitude,
        'longitude', longitude,
        'qr_code', qr_code,
        'created_at', created_at,
        'updated_at', updated_at
      )
      FROM public.users
      WHERE id = v_user_id
    ),
    'vitals', COALESCE(
      (
        SELECT JSON_AGG(
          json_build_object(
            'id', id,
            'patient_id', patient_id,
            'recorded_by', recorded_by,
            'systolic_bp', systolic_bp,
            'diastolic_bp', diastolic_bp,
            'heart_rate', heart_rate,
            'spo2', spo2,
            'temperature', temperature,
            'notes', notes,
            'is_critical', is_critical,
            'recorded_at', recorded_at,
            'created_at', created_at
          )
        )
        FROM public.vitals
        WHERE patient_id = v_user_id
        ORDER BY recorded_at DESC
        LIMIT 50
      ),
      '[]'::JSON
    ),
    'medical_records', COALESCE(
      (
        SELECT JSON_AGG(
          json_build_object(
            'id', id,
            'patient_id', patient_id,
            'type', type,
            'title', title,
            'description', description,
            'file_url', file_url,
            'created_at', created_at
          )
        )
        FROM public.medical_records
        WHERE patient_id = v_user_id
        ORDER BY created_at DESC
        LIMIT 100
      ),
      '[]'::JSON
    ),
    'ai_consultations', COALESCE(
      (
        SELECT JSON_AGG(
          json_build_object(
            'id', id,
            'patient_id', patient_id,
            'summary', summary,
            'risk_level', risk_level,
            'recommendations', recommendations,
            'created_at', created_at
          )
        )
        FROM public.ai_consultations
        WHERE patient_id = v_user_id
        ORDER BY created_at DESC
        LIMIT 50
      ),
      '[]'::JSON
    ),
    'prescriptions', COALESCE(
      (
        SELECT JSON_AGG(
          json_build_object(
            'id', id,
            'patient_id', patient_id,
            'medication', medication,
            'dosage', dosage,
            'frequency', frequency,
            'duration', duration,
            'created_at', created_at
          )
        )
        FROM public.prescriptions
        WHERE patient_id = v_user_id
        ORDER BY created_at DESC
        LIMIT 50
      ),
      '[]'::JSON
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;
