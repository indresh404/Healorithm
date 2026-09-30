// src/components/body/Interactive3DBody.tsx
import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Activity, ShieldAlert, CheckCircle2, RotateCw, AlertTriangle } from 'lucide-react';

export interface BodyZone {
  id: string;
  name: string;
  label: string;
  position: [number, number, number];
  color: string;
  symptoms: string[];
  severity: 'normal' | 'moderate' | 'high' | 'critical';
}

const DEFAULT_BODY_ZONES: BodyZone[] = [
  { id: 'head', name: 'Head & CNS', label: 'Head / Brain', position: [0, 1.45, 0], color: '#ef4444', symptoms: ['Headache', 'Dizziness', 'High Fever'], severity: 'moderate' },
  { id: 'chest', name: 'Cardiovascular / Heart', label: 'Chest / Heart', position: [0, 0.85, 0.15], color: '#dc2626', symptoms: ['Chest Pain', 'Angina', 'Palpitations'], severity: 'critical' },
  { id: 'lungs', name: 'Respiratory / Lungs', label: 'Lungs', position: [0.25, 0.85, 0.1], color: '#f59e0b', symptoms: ['Shortness of Breath', 'Cough', 'Wheezing'], severity: 'high' },
  { id: 'abdomen', name: 'Gastrointestinal', label: 'Abdomen / Stomach', position: [0, 0.35, 0.15], color: '#10b981', symptoms: ['Nausea', 'Vomiting', 'Abdominal Pain'], severity: 'normal' },
  { id: 'joints', name: 'Musculoskeletal / Joints', label: 'Knees / Joints', position: [0.3, -0.65, 0.1], color: '#f59e0b', symptoms: ['Joint Stiffness', 'Arthralgia'], severity: 'moderate' },
  { id: 'extremities', name: 'Peripheral Circulation', label: 'Feet / Peripheral', position: [0.25, -1.35, 0.1], color: '#ef4444', symptoms: ['Tingling in Feet', 'Diabetic Neuropathy', 'Cold Extremities'], severity: 'high' }
];

function MannequinMesh({
  selectedZone,
  onSelectZone,
  activeSymptoms = []
}: {
  selectedZone: string | null;
  onSelectZone: (zone: BodyZone) => void;
  activeSymptoms: string[];
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.45;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Head */}
      <mesh 
        position={[0, 1.45, 0]} 
        onClick={(e) => { e.stopPropagation(); onSelectZone(DEFAULT_BODY_ZONES[0]); }}
      >
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial 
          color={selectedZone === 'head' ? '#ef4444' : '#f8fafc'} 
          roughness={0.3} 
          metalness={0.1}
          emissive={selectedZone === 'head' ? '#ef4444' : '#000000'}
          emissiveIntensity={selectedZone === 'head' ? 0.6 : 0}
        />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.16, 24]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>

      {/* Torso / Upper Chest */}
      <mesh 
        position={[0, 0.78, 0]} 
        onClick={(e) => { e.stopPropagation(); onSelectZone(DEFAULT_BODY_ZONES[1]); }}
      >
        <boxGeometry args={[0.72, 0.55, 0.34]} />
        <meshStandardMaterial 
          color={selectedZone === 'chest' || selectedZone === 'lungs' ? '#dc2626' : '#f8fafc'} 
          roughness={0.3} 
          metalness={0.1}
          emissive={selectedZone === 'chest' ? '#dc2626' : '#000000'}
          emissiveIntensity={selectedZone === 'chest' ? 0.7 : 0}
        />
      </mesh>

      {/* Abdomen / Lower Torso */}
      <mesh 
        position={[0, 0.32, 0]} 
        onClick={(e) => { e.stopPropagation(); onSelectZone(DEFAULT_BODY_ZONES[3]); }}
      >
        <cylinderGeometry args={[0.32, 0.28, 0.42, 24]} />
        <meshStandardMaterial 
          color={selectedZone === 'abdomen' ? '#10b981' : '#f8fafc'} 
          roughness={0.4} 
        />
      </mesh>

      {/* Pelvis */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.55, 0.22, 0.32]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.48, 0.6, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.09, 0.08, 0.52, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[-0.56, 0.12, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.075, 0.065, 0.48, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.48, 0.6, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.09, 0.08, 0.52, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[0.56, 0.12, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.075, 0.065, 0.48, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {/* Left Leg & Knee */}
      <mesh 
        position={[-0.18, -0.4, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectZone(DEFAULT_BODY_ZONES[4]); }}
      >
        <cylinderGeometry args={[0.11, 0.09, 0.62, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh 
        position={[-0.18, -0.98, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectZone(DEFAULT_BODY_ZONES[5]); }}
      >
        <cylinderGeometry args={[0.085, 0.07, 0.58, 16]} />
        <meshStandardMaterial 
          color={selectedZone === 'extremities' ? '#ef4444' : '#f8fafc'} 
          roughness={0.4} 
        />
      </mesh>

      {/* Right Leg & Knee */}
      <mesh 
        position={[0.18, -0.4, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectZone(DEFAULT_BODY_ZONES[4]); }}
      >
        <cylinderGeometry args={[0.11, 0.09, 0.62, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh 
        position={[0.18, -0.98, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectZone(DEFAULT_BODY_ZONES[5]); }}
      >
        <cylinderGeometry args={[0.085, 0.07, 0.58, 16]} />
        <meshStandardMaterial 
          color={selectedZone === 'extremities' ? '#ef4444' : '#f8fafc'} 
          roughness={0.4} 
        />
      </mesh>

      {/* Interactive Pulsing Hotspot Markers */}
      {DEFAULT_BODY_ZONES.map((zone) => (
        <mesh
          key={zone.id}
          position={zone.position}
          onClick={(e) => {
            e.stopPropagation();
            onSelectZone(zone);
          }}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={zone.color} />
        </mesh>
      ))}
    </group>
  );
}

interface Interactive3DBodyProps {
  selectedZoneId?: string | null;
  onZoneSelect?: (zone: BodyZone) => void;
  activeSymptoms?: string[];
  patientRiskLevel?: 'Low' | 'Moderate' | 'High' | 'Critical';
  compact?: boolean;
}

export default function Interactive3DBody({
  selectedZoneId = null,
  onZoneSelect,
  activeSymptoms = [],
  patientRiskLevel = 'High',
  compact = false
}: Interactive3DBodyProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(selectedZoneId || 'chest');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const currentZone = useMemo(() => {
    return DEFAULT_BODY_ZONES.find(z => z.id === (selectedZoneId || internalSelected)) || DEFAULT_BODY_ZONES[1];
  }, [selectedZoneId, internalSelected]);

  const handleSelect = (zone: BodyZone) => {
    setInternalSelected(zone.id);
    if (onZoneSelect) onZoneSelect(zone);
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Anatomical Symptom Mapping</h3>
            <p className="text-xs text-slate-500">Interactive 3D Physiological Triage</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{viewMode === '3d' ? '2D Zones' : '3D View'}</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-center">
        <div className="md:col-span-7 relative h-72 sm:h-80 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
          {viewMode === '3d' ? (
            <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }}>
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 10, 5]} intensity={1.2} />
              <pointLight position={[-5, -5, -5]} color="#38bdf8" intensity={0.8} />
              <MannequinMesh 
                selectedZone={selectedZoneId || internalSelected} 
                onSelectZone={handleSelect}
                activeSymptoms={activeSymptoms}
              />
            </Canvas>
          ) : (
            /* 2D Anatomical Zone Fallback & Fast Touch Picker */
            <div className="w-full h-full p-4 flex flex-col justify-between">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Tap any body zone to isolate symptoms</p>
              <div className="grid grid-cols-2 gap-2 my-auto">
                {DEFAULT_BODY_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => handleSelect(zone)}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs font-semibold flex items-center justify-between ${
                      (selectedZoneId || internalSelected) === zone.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>{zone.label}</span>
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: zone.color }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sci-Fi Overlay Badges */}
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300 font-mono">
            LIVE 3D MODEL
          </div>
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SENSOR READY</span>
          </div>
        </div>

        {/* Zone Details Panel */}
        <div className="md:col-span-5 space-y-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Zone</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                currentZone.severity === 'critical' ? 'bg-red-100 text-red-700' :
                currentZone.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                currentZone.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {currentZone.severity}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900">{currentZone.name}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {currentZone.id === 'chest' ? 'High triage priority. Key target for ECG, SpO2 continuous monitoring & BP stabilization.' :
               currentZone.id === 'head' ? 'Primary focus for neurological exam, fever screening, and meningeal signs.' :
               currentZone.id === 'lungs' ? 'Auscultation recommended for crepitations, wheezing, and hypoxemia index.' :
               currentZone.id === 'extremities' ? 'Monitor for diabetic neuropathy, peripheral pulse & edema.' :
               'Routine examination indicated.'}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Flagged Clinical Symptoms</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {currentZone.symptoms.map((sym, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium border border-slate-200"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Select Quick Chips */}
          <div className="flex flex-wrap gap-1">
            {DEFAULT_BODY_ZONES.map((z) => (
              <button
                key={z.id}
                onClick={() => handleSelect(z)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  (selectedZoneId || internalSelected) === z.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {z.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
