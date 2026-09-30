// App/src/pages/worker/WorkerPatientProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { store } from '../../lib/storage';
import {
  ArrowLeft, User, Phone, MapPin, Activity, ShieldAlert,
  ShieldCheck, Calendar, Pill, AlertTriangle, Clock,
  FileText, TrendingUp, Volume2, CheckCircle2, Heart
} from 'lucide-react';
import { playVoicePrompt } from '@shared/translations';

export default function WorkerPatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());

  useEffect(() => {
    return store.subscribe(() => setSnapshot({ ...store.getSnapshot() }));
  }, []);

  // Look up patient by ID from URL, or fall back to active patient
  const patient = snapshot.users.find((u) => u.id === id) ||
                  snapshot.users.find((u) => u.id === snapshot.activePatientId) ||
                  snapshot.users[0];

  const analytics = snapshot.analytics.find((a) => a.user_id === patient?.id);
  const records = snapshot.records.filter((r) => r.user_id === patient?.id);
  const prescriptions = snapshot.prescriptions.filter((p) => p.user_id === patient?.id);
  const adherenceLogs = snapshot.patientAdherenceLogs?.[patient?.id] || [];

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <User className="w-12 h-12 mb-3" />
        <p className="font-bold text-lg text-slate-600">Patient not found</p>
        <p className="text-sm mt-1">Please select a patient from the dashboard.</p>
        <Link to="/worker" className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const riskColorClass =
    analytics?.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
    analytics?.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
    analytics?.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
    'bg-emerald-100 text-emerald-700';

  const adherenceRate = adherenceLogs.length > 0
    ? Math.round(
        adherenceLogs.reduce((acc, log) =>
          acc + ([log.morning_taken, log.afternoon_taken, log.night_taken].filter(Boolean).length / 3),
          0
        ) / adherenceLogs.length * 100
      )
    : analytics?.adherence_rate || 85;

  function handleReadProfile() {
    const text = `Patient ${patient.name}, age ${patient.age}, from ${patient.village || 'Adoni'}. 
Risk level: ${analytics?.risk_level || 'Low'}, score ${analytics?.risk_score || 20} out of 100.
Blood pressure: ${analytics?.systolic_bp || 120} over ${analytics?.diastolic_bp || 80} mmHg.
Oxygen saturation: ${analytics?.spo2 || 98} percent.
Medicine adherence: ${adherenceRate} percent.`;
    playVoicePrompt(text, snapshot.selectedLanguage);
  }

  return (
    <div className="space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${riskColorClass}`}>
                {analytics?.risk_level || 'Low'} Risk ({analytics?.risk_score || 20}/100)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {patient.age} yrs • {patient.gender} • {patient.village || 'Adoni'} • ID: {patient.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReadProfile}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl transition-colors"
            title="Read profile aloud"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
          </button>
          <Link
            to="/worker/vitals"
            onClick={() => store.setActivePatient(patient.id)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Record Visit</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Demographics card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Demographics</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-600">Blood Group</span>
                  <p className="text-slate-900">{patient.blood_group || 'B+'}</p>
                </div>
              </div>
              {patient.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-600">Phone</span>
                    <p className="text-slate-900">{patient.phone}</p>
                  </div>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-600">Address</span>
                    <p className="text-slate-900">{patient.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-600">Enrolled</span>
                  <p className="text-slate-900">
                    {patient.created_at ? new Date(patient.created_at).toLocaleDateString('en-IN') : 'Not recorded'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chronic Conditions */}
          {(analytics?.has_diabetes || analytics?.has_hypertension || analytics?.has_cardiac_history) && (
            <div className="bg-red-50 p-5 rounded-3xl border border-red-200 shadow-xs">
              <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Chronic Conditions
              </h3>
              <div className="space-y-1.5 text-xs font-semibold text-red-700">
                {analytics?.has_diabetes && <p>• Diabetes Mellitus (Type 2)</p>}
                {analytics?.has_hypertension && <p>• Hypertension</p>}
                {analytics?.has_cardiac_history && <p>• Cardiac History</p>}
                {(analytics?.other_chronic_conditions || []).map((c: string, i: number) => (
                  <p key={i}>• {c}</p>
                ))}
              </div>
            </div>
          )}

          {/* Next Appointment */}
          {analytics?.next_appointment_date && (
            <div className="bg-blue-50 p-5 rounded-3xl border border-blue-200">
              <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Next Appointment
              </h3>
              <p className="text-xs font-bold text-blue-900">{analytics.next_appointment_date}</p>
              <p className="text-xs text-blue-700 mt-0.5">{analytics.next_appointment_doctor}</p>
            </div>
          )}
        </div>

        {/* Middle Column — Vitals + Risk */}
        <div className="space-y-6">
          {/* Vitals Grid */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Latest Vitals</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Blood Pressure', value: analytics?.systolic_bp ? `${analytics.systolic_bp}/${analytics.diastolic_bp}` : '120/80', unit: 'mmHg', warn: analytics?.systolic_bp && analytics.systolic_bp >= 140 },
                { label: 'SpO2', value: `${analytics?.spo2 || 98}`, unit: '%', warn: analytics?.spo2 && analytics.spo2 < 90 },
                { label: 'Heart Rate', value: `${analytics?.heart_rate || 78}`, unit: 'bpm', warn: false },
                { label: 'Blood Glucose', value: `${analytics?.blood_glucose || 110}`, unit: 'mg/dL', warn: analytics?.blood_glucose && analytics.blood_glucose > 200 },
              ].map((v) => (
                <div key={v.label} className={`p-3 rounded-2xl border ${v.warn ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{v.label}</span>
                  <p className={`text-base font-bold mt-0.5 ${v.warn ? 'text-red-700' : 'text-slate-900'}`}>
                    {v.value} <span className="text-[10px] font-normal text-slate-400">{v.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Risk Factors
            </h3>
            {analytics?.risks && analytics.risks.length > 0 ? (
              <div className="space-y-1.5">
                {analytics.risks.map((r: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-700 font-medium">{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No significant risk factors recorded.</p>
            )}
          </div>

          {/* Medicine Adherence */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-500" />
              Adherence ({adherenceRate}%)
            </h3>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${adherenceRate >= 80 ? 'bg-emerald-500' : adherenceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${adherenceRate}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Based on last {adherenceLogs.length} days of dose tracking
            </p>
          </div>
        </div>

        {/* Right Column — Visit History */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Visit History
              </h3>
              <span className="text-xs font-bold text-slate-400">{records.length} encounters</span>
            </div>
            {records.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No recorded visits yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {records.map((rec) => (
                  <div key={rec.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                        {rec.report_type}
                      </span>
                      <span className="text-[10px] text-slate-400">{rec.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{rec.details}</p>
                    {rec.vitals && (
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-500">
                        {rec.vitals.systolic_bp && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                            BP {rec.vitals.systolic_bp}/{rec.vitals.diastolic_bp}
                          </span>
                        )}
                        {rec.vitals.spo2 && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                            SpO2 {rec.vitals.spo2}%
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {rec.sync_status === 'synced' ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Synced
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">⏳ Pending sync</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-500" />
                  Active Prescriptions
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {prescriptions.slice(0, 4).map((rx) => (
                  <div key={rx.id} className="p-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rx.medicine_name}</p>
                      <p className="text-[10px] text-slate-500">{rx.dosage} • {rx.timing}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      rx.generic_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {rx.generic_status || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
