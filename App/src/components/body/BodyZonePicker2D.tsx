// App/src/components/body/BodyZonePicker2D.tsx
import React, { useState } from 'react';
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface BodyZone2D {
  id: string;
  name: string;
  label: string;
  color: string;
  symptoms: string[];
  severity: 'normal' | 'moderate' | 'high' | 'critical';
}

export const BODY_ZONES_2D: BodyZone2D[] = [
  { id: 'head', name: 'Head & CNS', label: 'Head / Eyes', color: '#ef4444', symptoms: ['Headache', 'Dizziness', 'High Fever'], severity: 'moderate' },
  { id: 'chest', name: 'Cardiovascular / Heart', label: 'Chest / Heart', color: '#dc2626', symptoms: ['Chest Pain', 'Angina', 'Palpitations'], severity: 'critical' },
  { id: 'lungs', name: 'Respiratory / Lungs', label: 'Lungs / Breath', color: '#f59e0b', symptoms: ['Shortness of Breath', 'Cough', 'Wheezing'], severity: 'high' },
  { id: 'abdomen', name: 'Gastrointestinal', label: 'Abdomen / Stomach', color: '#10b981', symptoms: ['Nausea', 'Vomiting', 'Abdominal Pain'], severity: 'normal' },
  { id: 'joints', name: 'Musculoskeletal', label: 'Knees & Joints', color: '#f59e0b', symptoms: ['Joint Stiffness', 'Arthralgia'], severity: 'moderate' },
  { id: 'extremities', name: 'Peripheral Circulation', label: 'Feet & Extremities', color: '#ef4444', symptoms: ['Tingling in Feet', 'Diabetic Neuropathy', 'Cold Extremities'], severity: 'high' }
];

interface BodyZonePicker2DProps {
  selectedZoneId?: string | null;
  onZoneSelect?: (zone: BodyZone2D) => void;
  activeSymptoms?: string[];
}

export default function BodyZonePicker2D({
  selectedZoneId = null,
  onZoneSelect,
  activeSymptoms = []
}: BodyZonePicker2DProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(selectedZoneId || 'chest');

  const currentZone = BODY_ZONES_2D.find(z => z.id === (selectedZoneId || internalSelected)) || BODY_ZONES_2D[1];

  const handleSelect = (zone: BodyZone2D) => {
    setInternalSelected(zone.id);
    if (onZoneSelect) onZoneSelect(zone);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Anatomical Symptom Picker</h3>
            <p className="text-[11px] text-slate-500">Tap body zone to isolate and tag symptoms</p>
          </div>
        </div>
      </div>

      {/* Grid of 2D Body Zone Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BODY_ZONES_2D.map((zone) => {
          const isSelected = (selectedZoneId || internalSelected) === zone.id;

          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => handleSelect(zone)}
              className={`p-3 rounded-2xl border text-left transition-all text-xs font-bold flex items-center justify-between ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-emerald-50/50 text-slate-800 border-slate-200'
              }`}
            >
              <span>{zone.label}</span>
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-white' : ''}`}
                style={{ backgroundColor: isSelected ? '#ffffff' : zone.color }}
              />
            </button>
          );
        })}
      </div>

      {/* Selected Zone Info Box */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">{currentZone.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
            currentZone.severity === 'critical' ? 'bg-red-100 text-red-700' :
            currentZone.severity === 'high' ? 'bg-orange-100 text-orange-700' :
            currentZone.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {currentZone.severity}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {currentZone.symptoms.map((s, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700"
            >
              + {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
