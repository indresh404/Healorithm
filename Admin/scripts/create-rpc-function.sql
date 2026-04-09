-- Run this SQL in Supabase SQL Editor.
-- Creates/updates RPC used by Admin QR scanner.

DROP FUNCTION IF EXISTS public.get_patient_full_data(TEXT);

CREATE OR REPLACE FUNCTION public.get_patient_full_data(p_qr_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  SELECT id INTO v_user_id
  FROM public.users
  WHERE qr_code = p_qr_code
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with this QR code'
    );
  END IF;

  SELECT json_build_object(
    'success', true,
    'user', (
      SELECT row_to_json(u)
      FROM (
        SELECT
          id,
          name,
          age,
          gender,
          phone,
          preferred_language,
          latitude,
          longitude,
          qr_code,
          created_at,
          updated_at
        FROM public.users
        WHERE id = v_user_id
      ) u
    ),
    'vitals', COALESCE(
      (
        SELECT json_agg(v)
        FROM (
          SELECT
            id,
            patient_id,
            recorded_by,
            systolic_bp,
            diastolic_bp,
            heart_rate,
            spo2,
            temperature,
            notes,
            is_critical,
            recorded_at,
            created_at,
            updated_at
          FROM public.vitals
          WHERE patient_id = v_user_id
          ORDER BY recorded_at DESC
          LIMIT 50
        ) v
      ),
      '[]'::json
    ),
    'medical_records', COALESCE(
      (
        SELECT json_agg(m)
        FROM (
          SELECT
            id,
            patient_id,
            recorded_by,
            diagnosis,
            description,
            vaccine_name,
            vaccine_date,
            visit_type,
            visit_date,
            created_at,
            updated_at
          FROM public.medical_records
          WHERE patient_id = v_user_id
          ORDER BY created_at DESC
          LIMIT 100
        ) m
      ),
      '[]'::json
    ),
    'ai_consultations', COALESCE(
      (
        SELECT json_agg(a)
        FROM (
          SELECT
            id,
            patient_id,
            summary,
            symptoms,
            risk_level,
            recommendation,
            created_at
          FROM public.ai_consultations
          WHERE patient_id = v_user_id
          ORDER BY created_at DESC
          LIMIT 50
        ) a
      ),
      '[]'::json
    ),
    'prescriptions', COALESCE(
      (
        SELECT json_agg(p)
        FROM (
          SELECT
            id,
            patient_id,
            medical_record_id,
            prescribed_by,
            medicine_name,
            dosage,
            timing,
            duration,
            meal_timing,
            notes,
            start_date,
            end_date,
            is_active,
            created_at,
            updated_at
          FROM public.prescriptions
          WHERE patient_id = v_user_id
          ORDER BY created_at DESC
          LIMIT 50
        ) p
      ),
      '[]'::json
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
