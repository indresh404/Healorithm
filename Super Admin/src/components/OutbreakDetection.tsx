import React, { useEffect, useState } from 'react';
import { OutbreakAlert } from '../types';
import { AlertTriangle, MapPin, Users, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function OutbreakDetection() {
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const FAKE_ALERTS: OutbreakAlert[] = [
    {
      id: 'o1',
      symptom: 'Fever & Chills',
      patient_count: 15,
      village_names: ['Adoni', 'Dhone'],
      center_lat: 15.4,
      center_lng: 77.4,
      radius_km: 12,
      severity: 'High',
      suggested_action: 'Deploy mobile testing unit and initiate water source chlorination immediately.'
    },
    {
      id: 'o2',
      symptom: 'Acute Diarrhea',
      patient_count: 8,
      village_names: ['Alur'],
      center_lat: 15.1,
      center_lng: 77.1,
      radius_km: 5,
      severity: 'Moderate',
      suggested_action: 'Distribute ORS packets and conduct community hygiene awareness session.'
    },
    {
      id: 'o3',
      symptom: 'Skin Rash',
      patient_count: 22,
      village_names: ['Pattikonda', 'Gooty'],
      center_lat: 15.3,
      center_lng: 77.3,
      radius_km: 20,
      severity: 'High',
      suggested_action: 'Investigate potential environmental allergens and provide topical treatments.'
    }
  ];

  const detectOutbreaks = async () => {
    // Simulate detection logic with fake data
    await new Promise(resolve => setTimeout(resolve, 800));
    setAlerts(FAKE_ALERTS);
    setLoading(false);
  };

  useEffect(() => {
    detectOutbreaks();
    const interval = setInterval(detectOutbreaks, 300000); // 5-minute polling
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-slate-900">Active Outbreak Alerts</h3>
        </div>
        <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest">
          {alerts.length} Detected
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border-2 ${
              alert.severity === 'High' ? 'border-red-100 bg-red-50/30' : 'border-orange-100 bg-orange-50/30'
            } relative overflow-hidden group`}
          >
            <div className={`absolute top-0 right-0 p-3 ${
              alert.severity === 'High' ? 'text-red-600' : 'text-orange-600'
            }`}>
              <AlertTriangle className="w-6 h-6 opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="space-y-4">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                  alert.severity === 'High' ? 'text-red-500' : 'text-orange-500'
                }`}>
                  {alert.severity} Severity Cluster
                </p>
                <h4 className="text-xl font-bold text-slate-900">{alert.symptom}</h4>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{alert.patient_count} Patients</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{alert.village_names.length} Villages</span>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Affected Areas</p>
                <p className="text-xs text-slate-600 font-medium">{alert.village_names.join(', ')}</p>
              </div>

              <div className={`p-4 rounded-xl border ${
                alert.severity === 'High' ? 'bg-red-600 text-white border-red-700' : 'bg-orange-600 text-white border-orange-700'
              }`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Suggested Action</p>
                <p className="text-xs font-medium leading-relaxed">{alert.suggested_action}</p>
              </div>

              <button className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                View Detailed Cluster Map
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
