// src/pages/worker/WorkerDirectory.tsx
import React from 'react';
import { PhoneCall, MapPin, ShieldAlert, Heart, Building, Phone } from 'lucide-react';

const EMERGENCY_CONTACTS = [
  { name: '108 Ambulance Emergency Response', role: 'National Emergency Service', phone: '108', available: '24/7 Toll-Free', priority: true },
  { name: '104 Medical Advice Helpline', role: 'State Health Tele-Advisory', phone: '104', available: '24/7 Toll-Free', priority: true },
  { name: 'Community Health Center (CHC) Adoni', role: 'Secondary Hospital & ICU', phone: '+91 8512 252100', available: '24/7 Emergency Ward', priority: false },
  { name: 'Primary Health Center (PHC) Alur', role: 'Sub-district Primary Health Unit', phone: '+91 8512 254220', available: '8:00 AM - 8:00 PM', priority: false },
  { name: 'Dr. Arvind Sharma (Medical Officer)', role: 'Chief Medical Officer CHC', phone: '+91 98450 12345', available: 'On-Call', priority: false },
  { name: 'District Malaria & Vector Officer', role: 'District Epidemic Control', phone: '+91 8518 220044', available: 'Office Hours', priority: false },
  { name: 'Jan Aushadhi Kendra (Adoni Main)', role: 'Generic Medicines Pharmacy', phone: '+91 94401 55667', available: '9:00 AM - 9:00 PM', priority: false },
];

export default function WorkerDirectory() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cached Offline Emergency Directory</h2>
        <p className="text-xs text-slate-500 mt-0.5">Stored locally on device for one-tap voice calling without internet signal</p>
      </div>

      <div className="space-y-3">
        {EMERGENCY_CONTACTS.map((item, idx) => (
          <div 
            key={idx} 
            className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.priority ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                item.priority ? 'bg-red-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {item.priority ? <ShieldAlert className="w-6 h-6" /> : <Building className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500">{item.role} • {item.available}</p>
              </div>
            </div>

            <a
              href={`tel:${item.phone}`}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
                item.priority 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call {item.phone}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
