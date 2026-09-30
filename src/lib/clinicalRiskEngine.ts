// src/lib/clinicalRiskEngine.ts

export interface ClinicalVitals {
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  temperature?: number;
  heart_rate?: number;
  blood_glucose?: number;
}

export interface RiskEvaluationResult {
  score: number;
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  factors: string[];
  missing_data_warnings: string[];
  is_emergency: boolean;
  emergency_reason?: string;
  recommended_specialty: string;
  target_response_time: string;
  priority: 'Emergency' | 'Urgent' | 'Routine';
}

/**
 * Deterministic On-Device Emergency Detection
 * Fixed medical criteria that never rely on an AI/ML guess.
 */
export function checkDeterministicEmergency(
  vitals: ClinicalVitals,
  symptoms: string[] = []
): { isEmergency: boolean; reason?: string } {
  const symLower = symptoms.map(s => s.toLowerCase());

  // 1. Hypertensive Crisis
  if ((vitals.systolic_bp && vitals.systolic_bp >= 180) || (vitals.diastolic_bp && vitals.diastolic_bp >= 120)) {
    return {
      isEmergency: true,
      reason: `Critical Blood Pressure: ${vitals.systolic_bp || '?'}/${vitals.diastolic_bp || '?'} mmHg (Hypertensive Urgency / Crisis)`
    };
  }

  // 2. Severe Hypoxia
  if (vitals.spo2 && vitals.spo2 < 90) {
    return {
      isEmergency: true,
      reason: `Severe Hypoxemia: SpO2 ${vitals.spo2}% is below 90% threshold`
    };
  }

  // 3. Acute Coronary Syndrome Warning (Chest pain + Breathlessness/Dizziness)
  const hasChestPain = symLower.some(s => s.includes('chest pain') || s.includes('chest tightness') || s.includes('angina'));
  const hasBreathlessness = symLower.some(s => s.includes('breath') || s.includes('dyspnea') || s.includes('shortness of breath'));
  if (hasChestPain && hasBreathlessness) {
    return {
      isEmergency: true,
      reason: `Acute Chest Pain paired with Shortness of Breath (Possible Acute Coronary Syndrome)`
    };
  }

  // 4. Critical Heart Rate
  if (vitals.heart_rate && (vitals.heart_rate > 140 || vitals.heart_rate < 45)) {
    return {
      isEmergency: true,
      reason: `Severe Tachycardia/Bradycardia: Heart Rate ${vitals.heart_rate} bpm`
    };
  }

  // 5. Critical Glycemic Danger
  if (vitals.blood_glucose && (vitals.blood_glucose > 380 || vitals.blood_glucose < 50)) {
    return {
      isEmergency: true,
      reason: `Severe Glycemic Excursion: Blood Glucose ${vitals.blood_glucose} mg/dL`
    };
  }

  return { isEmergency: false };
}

/**
 * 0 to 100 Explainable Clinical Risk Assessment
 */
export function calculateClinicalRisk(data: {
  age: number;
  gender?: string;
  vitals: ClinicalVitals;
  symptoms: string[];
  chronic_conditions: string[];
  adherence_rate?: number;
  missed_followups?: number;
  family_history?: string[];
}): RiskEvaluationResult {
  let score = 0;
  const factors: string[] = [];
  const missing_data_warnings: string[] = [];

  // Check deterministic emergency first
  const emergencyCheck = checkDeterministicEmergency(data.vitals, data.symptoms);

  // Missing data checks
  if (data.vitals.systolic_bp === undefined) {
    missing_data_warnings.push('Blood Pressure not recorded');
  }
  if (data.vitals.spo2 === undefined) {
    missing_data_warnings.push('Oxygen Saturation (SpO2) not recorded');
  }
  if (data.vitals.blood_glucose === undefined) {
    missing_data_warnings.push('Blood Glucose not recorded');
  }
  if (data.adherence_rate === undefined) {
    missing_data_warnings.push('Medicine Adherence history missing');
  }

  // 1. Age Factor
  if (data.age >= 65) {
    score += 18;
    factors.push(`Elderly Age (${data.age} yrs) [+18 pts]`);
  } else if (data.age >= 50) {
    score += 10;
    factors.push(`Mature Age (${data.age} yrs) [+10 pts]`);
  }

  // 2. Chronic Conditions
  const conditions = data.chronic_conditions.map(c => c.toLowerCase());
  if (conditions.some(c => c.includes('cardiac') || c.includes('heart') || c.includes('cad'))) {
    score += 25;
    factors.push('Pre-existing Cardiac Disease [+25 pts]');
  }
  if (conditions.some(c => c.includes('hypertension') || c.includes('bp'))) {
    score += 15;
    factors.push('Chronic Hypertension [+15 pts]');
  }
  if (conditions.some(c => c.includes('diabetes') || c.includes('sugar'))) {
    score += 15;
    factors.push('Chronic Diabetes Mellitus [+15 pts]');
  }
  if (conditions.some(c => c.includes('kidney') || c.includes('renal') || c.includes('ckd'))) {
    score += 20;
    factors.push('Renal Comorbidity [+20 pts]');
  }

  // 3. Vitals Deviations
  if (data.vitals.systolic_bp) {
    if (data.vitals.systolic_bp >= 160) {
      score += 22;
      factors.push(`Stage 2 Hypertension (SBP ${data.vitals.systolic_bp} mmHg) [+22 pts]`);
    } else if (data.vitals.systolic_bp >= 140) {
      score += 12;
      factors.push(`Stage 1 Hypertension (SBP ${data.vitals.systolic_bp} mmHg) [+12 pts]`);
    }
  }

  if (data.vitals.spo2) {
    if (data.vitals.spo2 < 90) {
      score += 35;
      factors.push(`Critical Hypoxemia (SpO2 ${data.vitals.spo2}%) [+35 pts]`);
    } else if (data.vitals.spo2 <= 94) {
      score += 18;
      factors.push(`Low Oxygen Saturation (SpO2 ${data.vitals.spo2}%) [+18 pts]`);
    }
  }

  if (data.vitals.blood_glucose) {
    if (data.vitals.blood_glucose >= 250) {
      score += 20;
      factors.push(`Severe Hyperglycemia (${data.vitals.blood_glucose} mg/dL) [+20 pts]`);
    } else if (data.vitals.blood_glucose >= 180) {
      score += 10;
      factors.push(`Elevated Blood Glucose (${data.vitals.blood_glucose} mg/dL) [+10 pts]`);
    }
  }

  if (data.vitals.temperature && data.vitals.temperature >= 102) {
    score += 12;
    factors.push(`High Grade Fever (${data.vitals.temperature}°F) [+12 pts]`);
  }

  // 4. Medicine Adherence
  if (data.adherence_rate !== undefined) {
    if (data.adherence_rate < 50) {
      score += 18;
      factors.push(`Poor Medication Adherence (${data.adherence_rate}%) [+18 pts]`);
    } else if (data.adherence_rate < 75) {
      score += 8;
      factors.push(`Sub-optimal Adherence (${data.adherence_rate}%) [+8 pts]`);
    }
  }

  // 5. Missed Follow-ups
  if (data.missed_followups && data.missed_followups > 0) {
    const pts = Math.min(data.missed_followups * 6, 18);
    score += pts;
    factors.push(`${data.missed_followups} Missed Clinical Follow-up(s) [+${pts} pts]`);
  }

  // 6. Symptoms Severity
  const symLower = data.symptoms.map(s => s.toLowerCase());
  if (symLower.some(s => s.includes('chest pain') || s.includes('angina'))) {
    score += 25;
    factors.push('Symptom: Acute Chest Pain [+25 pts]');
  }
  if (symLower.some(s => s.includes('breath') || s.includes('suffocation'))) {
    score += 20;
    factors.push('Symptom: Severe Dyspnea [+20 pts]');
  }
  if (symLower.some(s => s.includes('dizz') || s.includes('faint') || s.includes('syncope'))) {
    score += 14;
    factors.push('Symptom: Dizziness / Syncope [+14 pts]');
  }
  if (symLower.some(s => s.includes('bleed') || s.includes('vomit blood'))) {
    score += 25;
    factors.push('Symptom: Active Bleeding [+25 pts]');
  }

  // Cap Score
  score = Math.min(Math.max(score, 0), 100);

  // If deterministic emergency fired, guarantee Critical/High
  if (emergencyCheck.isEmergency && score < 75) {
    score = Math.max(score, 85);
    factors.unshift(`EMERGENCY TRIGGER: ${emergencyCheck.reason}`);
  }

  // Determine Band
  let level: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  let priority: 'Emergency' | 'Urgent' | 'Routine' = 'Routine';
  let target_response_time = '< 7 Days (Routine Visit)';
  let recommended_specialty = 'General Physician';

  if (emergencyCheck.isEmergency || score >= 80) {
    level = 'Critical';
    priority = 'Emergency';
    target_response_time = 'Immediate (< 1 Hour)';
  } else if (score >= 60) {
    level = 'High';
    priority = 'Urgent';
    target_response_time = 'Within 24 Hours';
  } else if (score >= 35) {
    level = 'Moderate';
    priority = 'Urgent';
    target_response_time = 'Within 48-72 Hours';
  }

  // Suggest specialty based on dominant symptoms/conditions
  if (factors.some(f => f.toLowerCase().includes('cardiac') || f.toLowerCase().includes('chest pain') || f.toLowerCase().includes('hypertension'))) {
    recommended_specialty = 'Cardiology / Medicine';
  } else if (factors.some(f => f.toLowerCase().includes('hypoxemia') || f.toLowerCase().includes('dyspnea') || f.toLowerCase().includes('breath'))) {
    recommended_specialty = 'Pulmonology';
  } else if (factors.some(f => f.toLowerCase().includes('glucose') || f.toLowerCase().includes('diabetes'))) {
    recommended_specialty = 'Endocrinology / Diabetology';
  }

  return {
    score,
    level,
    factors: factors.length > 0 ? factors : ['Vitals within baseline limits', 'Good compliance with medication'],
    missing_data_warnings,
    is_emergency: emergencyCheck.isEmergency,
    emergency_reason: emergencyCheck.reason,
    recommended_specialty,
    target_response_time,
    priority
  };
}
