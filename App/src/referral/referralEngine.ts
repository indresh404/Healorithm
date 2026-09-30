// App/src/referral/referralEngine.ts
import { RiskResult, Referral } from '@shared/types';

/**
 * Deterministic Referral Tier Calculator
 */
export function generateReferralRecommendation(
  patientId: string,
  riskResult: RiskResult,
  notes: string = ''
): Partial<Referral> {
  let priority: 'Emergency' | 'Urgent' | 'Routine' = 'Routine';
  let targetFacility = 'Primary Health Centre (PHC)';

  if (riskResult.is_emergency) {
    priority = 'Emergency';
    targetFacility = 'Community Health Centre (CHC) / District Hospital';
  } else if (riskResult.score >= 50) {
    priority = 'Urgent';
    targetFacility = 'Community Health Centre (CHC)';
  }

  return {
    patient_id: patientId,
    target_facility: targetFacility,
    priority,
    specialty_required: riskResult.recommended_specialty,
    reason: riskResult.factors.join(', ') || 'Routine health surveillance review',
    status: 'pending',
    created_at: new Date().toISOString()
  };
}
