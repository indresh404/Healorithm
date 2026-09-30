// src/pages/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  ChevronRight, 
  AlertTriangle, 
  Activity, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp,
  Bot,
  Pill,
  ArrowUpRight,
  CheckCircle2,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { store } from '../lib/storage';
import { calculateTotalPrescriptionSavings } from '@shared/janAushadhiCatalog';

interface StatCardProps {
  icon: any;
  label: string;
  value: number | string;
  color: 'blue' | 'red' | 'yellow' | 'green' | 'purple';
  subtext?: string;
}

function StatCard({ icon: Icon, label, value, color, subtext }: StatCardProps) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    red: 'text-red-600 bg-red-50 border-red-100',
    yellow: 'text-amber-600 bg-amber-50 border-amber-100',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100'
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  const totalUsers = snapshot.users.length;
  const highRisk = snapshot.analytics.filter(a => a.risk_level === 'High' || a.risk_level === 'Critical').length;
  const medRisk = snapshot.analytics.filter(a => a.risk_level === 'Moderate').length;
  const emergencies = snapshot.analytics.filter(a => a.emergency_flag).length;
  const pendingVisits = snapshot.referrals.filter(r => r.status === 'Created' || r.status === 'Synced').length;
  const activeWorkers = snapshot.workers.filter(w => w.status === 'Active').length;

  const totalPrescriptions = snapshot.prescriptions;
  const savingsData = calculateTotalPrescriptionSavings(totalPrescriptions);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">District Epidemiological & Clinical Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time health intelligence from 5 rural village clusters • Kurnool North</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/agent"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-blue-200 flex items-center gap-2 transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>Care Agent Queue ({snapshot.careTasks.filter(t => t.status === 'pending').length})</span>
          </Link>
          <Link
            to="/admin/map"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Live Health Map</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Clinical Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={totalUsers}
          color="blue"
          subtext="5 Village Sub-centers"
        />
        <StatCard
          icon={ShieldAlert}
          label="High / Critical"
          value={highRisk}
          color="red"
          subtext="Priority Referrals"
        />
        <StatCard
          icon={AlertTriangle}
          label="Moderate Risk"
          value={medRisk}
          color="yellow"
          subtext="Follow-up Required"
        />
        <StatCard
          icon={Clock}
          label="Pending Queue"
          value={pendingVisits}
          color="blue"
          subtext="Awaiting Action"
        />
        <StatCard
          icon={Activity}
          label="Emergencies"
          value={emergencies}
          color="red"
          subtext="Deterministic Triggers"
        />
        <StatCard
          icon={UserCheck}
          label="Active ASHA"
          value={activeWorkers}
          color="green"
          subtext="Field Sync Active"
        />
      </div>

      {/* Main Grid: District Outbreak Overview & Care Coordination Agent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left 2 Cols: Outbreak & Jan Aushadhi Section */}
        <div className="xl:col-span-2 space-y-8">
          {/* Outbreak Alert & District Surveillance */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">District Outbreak Surveillance</h3>
                <p className="text-xs text-slate-500">DBSCAN Spatio-temporal cluster detection (8 or more patients in 48h)</p>
              </div>
              <Link to="/admin/outbreaks" className="text-blue-600 text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                <span>View Outbreaks</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snapshot.outbreaks.map((ob) => (
                <div key={ob.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700">
                        {ob.severity} Severity
                      </span>
                      <span className="text-xs font-bold text-slate-500">{ob.time_window}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">{ob.symptom}</h4>
                    <p className="text-xs text-slate-600 mb-3">{ob.suggested_action}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{ob.patient_count} Cases Cluster</span>
                    <span className="text-blue-600 font-bold">{ob.village_names.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Jan Aushadhi Cost Savings Real-Time Tracker */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Jan Aushadhi Generic Medicine Impact</h3>
                  <p className="text-xs text-slate-500">Doctor-confirmed generic substitution savings across district</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase">Branded Cost</span>
                <p className="text-xl font-bold text-slate-900 mt-1">₹{savingsData.totalBrand}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-700 uppercase">Jan Aushadhi Price</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">₹{savingsData.totalGeneric}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-xs font-bold text-blue-700 uppercase">Total Patient Savings</span>
                <p className="text-xl font-bold text-blue-700 mt-1">₹{savingsData.totalSavings} ({savingsData.percentage}%)</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Every prescription entered by field doctors automatically presents Jan Aushadhi bio-equivalent alternatives. The clinician approves line-by-line before the official printable report syncs to the patient app.
            </p>
          </section>

          {/* High Priority Ranked Referral Queue */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Ranked Referral Triage Queue</h3>
                <p className="text-xs text-slate-500">Prioritized on-device by explainable risk score & danger signs</p>
              </div>
              <Link to="/admin/users" className="text-blue-600 text-xs font-bold uppercase tracking-widest hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {snapshot.referrals.slice(0, 4).map((ref) => (
                <div key={ref.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        ref.priority === 'Emergency' ? 'bg-red-100 text-red-700' :
                        ref.priority === 'Urgent' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ref.priority}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{ref.patient_name}</h4>
                      <span className="text-xs text-slate-500">• {ref.village}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Specialty:</strong> {ref.specialty} • <strong>Target:</strong> {ref.target_response_time}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      <strong>Factors:</strong> {ref.top_factors.join('; ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/users/${ref.user_id}`}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Review Case
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Col: Care Coordination Agent Widget & Village Health Overview */}
        <div className="space-y-8">
          {/* Care Coordination Agent Widget */}
          <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Care Coordination Agent</h3>
                <p className="text-xs text-slate-400">Automated Case Pre-Review & Triage</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              The agent observes incoming sync records, identifies missing vitals, flags overdue follow-ups, and prepares doctor handoffs. It never diagnoses.
            </p>

            {/* Agent Stat Summary Table */}
            <div className="space-y-2.5 mb-6">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                <span className="text-slate-300">New cases reviewed today</span>
                <span className="font-bold text-white">12</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                <span className="text-slate-300">Missing-data tasks queued</span>
                <span className="font-bold text-amber-400">{snapshot.careTasks.length}</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                <span className="text-slate-300">High-priority handoffs prepared</span>
                <span className="font-bold text-red-400">2</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                <span className="text-slate-300">Referrals awaiting doctor action</span>
                <span className="font-bold text-blue-400">{pendingVisits}</span>
              </div>
            </div>

            <Link
              to="/admin/agent"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>Open Care Coordination Console</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </section>

          {/* Village Risk Heatmap Summary */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Village Risk Density</h3>
              <Link to="/admin/map" className="text-blue-600 text-xs font-bold hover:underline">Map</Link>
            </div>

            <div className="space-y-3">
              {snapshot.villages.map((v) => (
                <div key={v.name} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{v.name}</h4>
                    <p className="text-[11px] text-slate-500">{v.patient_count} Patients • {v.worker_count} ASHA</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      v.avg_risk_score >= 60 ? 'bg-red-100 text-red-700' :
                      v.avg_risk_score >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      Avg Risk: {v.avg_risk_score}
                    </span>
                    {v.emergency_cases > 0 && (
                      <p className="text-[10px] font-bold text-red-600 mt-1">{v.emergency_cases} Emergency Flag</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
