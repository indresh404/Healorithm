// src/pages/admin/TrendsPage.tsx
import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { TrendingUp, Activity, Filter, AlertTriangle } from 'lucide-react';

const WEEKLY_DATA = [
  { week: 'Wk 35', fever: 12, gastro: 8, hypertension: 24, respiratory: 10 },
  { week: 'Wk 36', fever: 15, gastro: 11, hypertension: 28, respiratory: 14 },
  { week: 'Wk 37', fever: 22, gastro: 19, hypertension: 26, respiratory: 18 },
  { week: 'Wk 38', fever: 48, gastro: 24, hypertension: 31, respiratory: 25 }, // Spike!
  { week: 'Wk 39', fever: 62, gastro: 35, hypertension: 33, respiratory: 30 },
  { week: 'Wk 40 (Current)', fever: 54, gastro: 28, hypertension: 35, respiratory: 22 },
];

const ADHERENCE_TREND = [
  { village: 'Alur', adherence: 68, highRiskRate: 22 },
  { village: 'Gooty', adherence: 84, highRiskRate: 12 },
  { village: 'Adoni', adherence: 61, highRiskRate: 35 },
  { village: 'Dhone', adherence: 76, highRiskRate: 18 },
  { village: 'Pattikonda', adherence: 72, highRiskRate: 20 },
];

export default function TrendsPage() {
  const [selectedMetric, setSelectedMetric] = useState<'symptoms' | 'adherence'>('symptoms');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">District Health Trends & Spike Detection</h2>
          <p className="text-sm text-slate-500 mt-1">Rolling 6-week epidemiological surveillance with 2x historical anomaly detection</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMetric('symptoms')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              selectedMetric === 'symptoms' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Symptom Velocity
          </button>
          <button
            onClick={() => setSelectedMetric('adherence')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              selectedMetric === 'adherence' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Village Adherence Correlation
          </button>
        </div>
      </div>

      {/* Anomaly Detection Banner */}
      <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Epidemiological Alert: 2.4x Anomaly Spike Detected in Week 38-39</h4>
          <p className="text-xs text-amber-800 mt-0.5">
            Acute febrile illness reports in Adoni and Dhone sub-centers exceeded twice the 4-week baseline average. Correlates with post-monsoon water logging.
          </p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Disease & Symptom Velocity Area Chart */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Incident Clusters (Cases)</h3>
              <p className="text-xs text-slate-500">Trends across 5 village primary health centers</p>
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase">Live Delta</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="feverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gastroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="hypGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="fever" name="Febrile / Fever" stroke="#ef4444" fillOpacity={1} fill="url(#feverGrad)" />
                <Area type="monotone" dataKey="gastro" name="Gastroenteritis" stroke="#f59e0b" fillOpacity={1} fill="url(#gastroGrad)" />
                <Area type="monotone" dataKey="hypertension" name="Hypertension" stroke="#3b82f6" fillOpacity={1} fill="url(#hypGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Village Adherence vs Risk Bar Chart */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Adherence vs High-Risk Patient Ratio</h3>
              <p className="text-xs text-slate-500">Correlation between medicine compliance and clinical risk</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ADHERENCE_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="village" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="adherence" name="Medicine Adherence %" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="highRiskRate" name="High Risk Ratio %" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
