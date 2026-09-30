// src/pages/admin/HealthMapPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { store } from '../../lib/storage';
import { 
  Map as MapIcon, 
  Layers, 
  AlertTriangle, 
  Users, 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  Compass, 
  CheckCircle2 
} from 'lucide-react';

const DISTRICT_CENTER: [number, number] = [15.34, 77.34];

export default function HealthMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [snapshot] = useState(store.getSnapshot());
  const [activeView, setActiveView] = useState<'current' | 'prediction'>('current');
  const [layers, setLayers] = useState({
    villages: true,
    workers: true,
    outbreaks: true,
    predictions: true,
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current).setView(DISTRICT_CENTER, 10);
    mapInstanceRef.current = map;

    // Add Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // 1. Village Markers & Risk Radii
    snapshot.villages.forEach((v) => {
      const color = v.avg_risk_score >= 60 ? '#dc2626' : v.avg_risk_score >= 40 ? '#d97706' : '#059669';
      
      L.circle([v.lat, v.lng], {
        radius: 2800,
        color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map).bindPopup(`
        <div style="font-family:sans-serif; min-width:180px;">
          <h4 style="margin:0 0 4px 0; font-weight:bold; font-size:14px; color:#0f172a;">Village: ${v.name}</h4>
          <p style="margin:0 0 2px 0; font-size:12px; color:#475569;">Patients: <strong>${v.patient_count}</strong></p>
          <p style="margin:0 0 2px 0; font-size:12px; color:#475569;">High Risk: <strong>${v.high_risk_count}</strong></p>
          <p style="margin:0 0 2px 0; font-size:12px; color:#475569;">Avg Risk Score: <strong>${v.avg_risk_score}/100</strong></p>
          <p style="margin:0; font-size:12px; color:${color}; font-weight:bold;">Emergency Cases: ${v.emergency_cases}</p>
        </div>
      `);
    });

    // 2. Field Worker Markers
    snapshot.workers.forEach((w) => {
      if (!w.lat || !w.lng) return;
      const workerIcon = L.divIcon({
        className: 'custom-worker-pin',
        html: `
          <div style="background-color:#2563eb; color:#ffffff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-weight:bold; font-size:11px;">
            ASHA
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([w.lat, w.lng], { icon: workerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif; min-width:160px;">
            <h4 style="margin:0 0 4px 0; font-weight:bold; font-size:13px; color:#0f172a;">${w.name} (ASHA)</h4>
            <p style="margin:0 0 2px 0; font-size:11px; color:#475569;">Assigned: <strong>${w.assigned_patients} Patients</strong></p>
            <p style="margin:0 0 2px 0; font-size:11px; color:#475569;">Visits this week: <strong>${w.visits_this_week}</strong></p>
            <p style="margin:0; font-size:11px; color:#059669; font-weight:bold;">Status: ${w.status}</p>
          </div>
        `);
    });

    // 3. Outbreak Clusters
    snapshot.outbreaks.forEach((ob) => {
      L.circle([ob.center_lat, ob.center_lng], {
        radius: ob.radius_km * 800,
        color: '#b91c1c',
        fillColor: '#ef4444',
        fillOpacity: 0.25,
        weight: 3,
        dashArray: '6, 6'
      }).addTo(map).bindPopup(`
        <div style="font-family:sans-serif; min-width:200px;">
          <span style="background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; text-transform:uppercase;">Outbreak Cluster</span>
          <h4 style="margin:6px 0 4px 0; font-weight:bold; font-size:14px; color:#0f172a;">${ob.symptom}</h4>
          <p style="margin:0 0 4px 0; font-size:12px; color:#475569;">Cluster Cases: <strong>${ob.patient_count}</strong></p>
          <p style="margin:0 0 4px 0; font-size:11px; color:#64748b;">Villages: <strong>${ob.village_names.join(', ')}</strong></p>
          <p style="margin:0; font-size:11px; color:#0f172a;"><em>${ob.suggested_action}</em></p>
        </div>
      `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [snapshot]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">District Epidemiological GIS Map</h2>
          <p className="text-sm text-slate-500">Live spatial mapping of village clusters, active outbreaks & field worker routes</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('current')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeView === 'current' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Live Surveillance
          </button>
          <button
            onClick={() => setActiveView('prediction')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'prediction' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Predictive Risk Map</span>
          </button>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs relative">
        <div ref={mapContainerRef} className="w-full h-[620px] rounded-2xl z-0" />

        {/* Floating Map Legend Overlay */}
        <div className="absolute bottom-8 left-8 z-[500] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg text-xs space-y-2.5 max-w-xs">
          <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-2">
            <span>District Map Legend</span>
            <Compass className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block" />
            <span className="text-slate-700 font-medium">High Risk Village / Emergencies</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-700 font-medium">Moderate Risk Village</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block" />
            <span className="text-slate-700 font-medium">Low Risk Baseline Village</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block" />
            <span className="text-slate-700 font-medium">Active ASHA Field Worker</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-dashed border-red-700 rounded-full inline-block" />
            <span className="text-slate-700 font-medium">DBSCAN Outbreak Zone (48h)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
