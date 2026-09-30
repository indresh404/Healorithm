// Admin/src/api/endpoints.ts
import { apiClient } from './client';
import { Patient, Visit, Referral, RiskResult, JanAushadhiReport } from '@shared/types';

export const API = {
  // Auth
  login: (credentials: { username: string; pin: string }) => apiClient.post('/auth/login', credentials),
  
  // Patients & Surveillance
  getPatients: () => apiClient.get<Patient[]>('/patients'),
  getPatientById: (id: string) => apiClient.get<Patient>(`/patients/${id}`),
  
  // Sync
  pushSyncDeltas: (deltas: any) => apiClient.post('/sync/push', deltas),
  pullSyncDeltas: (since: string) => apiClient.get(`/sync/pull?since=${encodeURIComponent(since)}`),

  // Referrals
  getReferrals: () => apiClient.get<Referral[]>('/referrals'),
  updateReferralStatus: (id: string, status: string) => apiClient.patch(`/referrals/${id}`, { status }),

  // Prescriptions & Jan Aushadhi
  confirmGenericPrescription: (data: any) => apiClient.post('/prescriptions/confirm-generic', data),

  // Care Coordination Agent
  getAgentTasks: () => apiClient.get('/agent/tasks'),
  dispatchAgentAction: (taskId: string, action: any) => apiClient.post(`/agent/tasks/${taskId}/dispatch`, action),
};
