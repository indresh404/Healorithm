// App/src/risk/useRisk.ts
import { useMemo } from 'react';
import { calculateClinicalRisk, RiskEvaluationResult } from '@shared/clinicalRiskEngine';
import { Patient, Vitals } from '@shared/types';

/**
 * React Hook for Real-Time Offline Explainable Risk Computation
 */
export function useClinicalRisk(patient?: Partial<Patient>, vitals?: Partial<Vitals>, symptoms: string[] = []): RiskEvaluationResult {
  return useMemo(() => {
    return calculateClinicalRisk({
      age: patient?.age || 45,
      gender: patient?.gender,
      vitals: vitals || {},
      symptoms: symptoms || [],
      chronic_conditions: []
    });
  }, [patient, vitals, symptoms]);
}
