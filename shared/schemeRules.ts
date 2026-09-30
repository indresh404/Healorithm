// shared/schemeRules.ts
import { GovernmentScheme, User, HealthAnalytics } from './types';
import { GOVERNMENT_SCHEMES } from './janAushadhiCatalog';

export interface SchemeEvaluation {
  scheme: GovernmentScheme;
  isEligible: boolean;
  qualificationNote: string;
  actionRequired: string;
}

/**
 * Offline rule-based scheme eligibility evaluation.
 * Results are always marked "may qualify, verify at health center" to ensure clinician/official verification.
 */
export function evaluateSchemeEligibility(patient: {
  age: number;
  gender: string;
  has_hypertension?: boolean;
  has_diabetes?: boolean;
  is_pregnant?: boolean;
  income_tier?: 'BPL' | 'Low' | 'General';
}): SchemeEvaluation[] {
  const evaluations: SchemeEvaluation[] = [];

  // 1. Ayushman Bharat - PM-JAY
  const pmjay = GOVERNMENT_SCHEMES.find(s => s.id === 'sch-pmjay') || GOVERNMENT_SCHEMES[0];
  const pmjayEligible = patient.income_tier === 'BPL' || patient.income_tier === 'Low' || patient.age >= 60;
  evaluations.push({
    scheme: pmjay,
    isEligible: pmjayEligible,
    qualificationNote: pmjayEligible 
      ? 'Patient meets demographic/income criteria for PM-JAY (SECC low-income / senior tier).'
      : 'Requires Ration Card / SECC entitlement verification at District Kendra.',
    actionRequired: 'May qualify for up to ₹5 Lakh cashless coverage. Verify at nearest Ayushman Mitra kiosk / CHC.'
  });

  // 2. PMSMA (Pregnant women)
  const pmsma = GOVERNMENT_SCHEMES.find(s => s.id === 'sch-pmsma');
  if (pmsma) {
    const isFemaleRepro = patient.gender.toLowerCase() === 'female' && patient.age >= 18 && patient.age <= 45;
    evaluations.push({
      scheme: pmsma,
      isEligible: isFemaleRepro,
      qualificationNote: isFemaleRepro 
        ? 'Eligible for comprehensive antenatal checkup on the 9th of every month at PHC.'
        : 'Applicable to pregnant women in second/third trimester.',
      actionRequired: 'Free diagnostic screening & supplementary generic iron/calcium provisioning.'
    });
  }

  // 3. National Programme for Prevention & Control of NCDs
  const ncd = GOVERNMENT_SCHEMES.find(s => s.id === 'sch-ncd');
  if (ncd) {
    const hasNCD = patient.has_hypertension || patient.has_diabetes || patient.age >= 30;
    evaluations.push({
      scheme: ncd,
      isEligible: hasNCD,
      qualificationNote: hasNCD
        ? 'Diagnosed or high-risk NCD profile (Hypertension/Diabetes screening enrolled).'
        : 'Universal screening for population age 30+.',
      actionRequired: 'Entitled to 100% free monthly generic maintenance medications at Sub-center / HWCs.'
    });
  }

  // 4. PMBJP Jan Aushadhi
  const pmbjp = GOVERNMENT_SCHEMES.find(s => s.id === 'sch-pmbjp');
  if (pmbjp) {
    evaluations.push({
      scheme: pmbjp,
      isEligible: true,
      qualificationNote: 'Universal entitlement across all Indian citizens with doctor prescription.',
      actionRequired: 'Purchase doctor-approved generic substitutes at PMBJP Kendra for up to 90% savings.'
    });
  }

  return evaluations;
}
