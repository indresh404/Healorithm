// src/pages/admin/OutbreaksPage.tsx
import React, { useState } from 'react';
import { store } from '../../lib/storage';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Activity, 
  Users, 
  MapPin, 
  ArrowRight,
  Send
} from 'lucide-react';

export default function OutbreaksPage() {
  const [snapshot] = useState(store.getSnapshot());
  const [containmentDispatched, setContainmentDispatched] = useState<Record<string, boolean>>({});

  const handleDispatch = (id: string) => {
    setContainmentDispatched(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Disease Outbreak Detection & Containment</h2>
        <p className="text-sm text-slate-500 mt-1">DBSCAN spatial clustering (8 or more patients with matching symptoms within 48-72h)</p>
      </div>

      {/* Active Outbreak Alerts */}
      <div className="space-y-4">
        {snapshot.outbreaks.map((ob) => {
          const isDispatched = containmentDispatched[ob.id];

          return (
            <div key={ob.id} className="bg-white p-6 rounded-3xl border border-red-200 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700">
                        {ob.severity} Severity Alert
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ob.time_window || 'Last 48 Hours'}</span>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{ob.symptom}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{ob.patient_count}</p>
                    <p className="text-[11px] text-slate-500 uppercase font-bold">Clustered Cases</p>
                  </div>
                  <button
                    onClick={() => handleDispatch(ob.id)}
                    disabled={isDispatched}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                      isDispatched 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    }`}
                  >
                    {isDispatched ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Response Team Dispatched</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Deploy Containment Protocol</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Affected Villages & Spatial Spread</span>
                  </h4>
                  <p className="text-sm font-bold text-slate-900">{ob.village_names.join(', ')} ({ob.radius_km} km radius)</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-red-600" />
                    <span>Recommended District Clinical Action</span>
                  </h4>
                  <p className="text-sm text-slate-800 font-medium">{ob.suggested_action}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Outbreak Predictions Section */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Predictive Spike Surveillance (Next 7-14 Days)</h3>
              <p className="text-xs text-slate-500">Early warning derived from rising symptom velocity and ASHA field visit logs</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snapshot.predictions.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-200 text-purple-800">
                    {p.confidence}% AI Confidence
                  </span>
                  <span className="text-xs font-bold text-purple-900">Est. {p.estimated_cases} Cases</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">{p.disease}</h4>
                <p className="text-xs text-slate-600 mb-3">
                  <strong>Villages:</strong> {p.village_names.join(', ')}
                </p>

                <div className="space-y-1 mb-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Detection Signals</p>
                  {p.signals.map((sig, idx) => (
                    <p key={idx} className="text-xs text-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                      <span>{sig}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-purple-100 text-xs text-purple-950 font-medium">
                <strong>Preventive Action:</strong> {p.suggested_action}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
