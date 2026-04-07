import React, { useEffect, useRef, useState } from 'react';
import { Village, Worker, OutbreakAlert } from '../types';
import { Loader2, Map as MapIcon, AlertCircle, Users, Activity } from 'lucide-react';

declare const L: any;

export default function HealthMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [villages, setVillages] = useState<Village[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [outbreaks, setOutbreaks] = useState<OutbreakAlert[]>([]);
  const [layers, setLayers] = useState({
    outbreaks: true,
    workers: true,
    heatmap: true
  });

  const villageLayer = useRef<any>(null);
  const workerLayer = useRef<any>(null);
  const outbreakLayer = useRef<any>(null);
  const heatLayer = useRef<any>(null);

  // Fake Data for UI improvement as requested
  const FAKE_VILLAGES: Village[] = [
    { name: 'Alur', lat: 15.123, lng: 77.123, patient_count: 120, high_risk_count: 15, emergency_cases: 2, worker_count: 3, avg_risk_score: 45, last_activity: new Date().toISOString() },
    { name: 'Gooty', lat: 15.234, lng: 77.234, patient_count: 85, high_risk_count: 8, emergency_cases: 0, worker_count: 2, avg_risk_score: 32, last_activity: new Date().toISOString() },
    { name: 'Adoni', lat: 15.345, lng: 77.345, patient_count: 200, high_risk_count: 35, emergency_cases: 5, worker_count: 5, avg_risk_score: 68, last_activity: new Date().toISOString() },
    { name: 'Dhone', lat: 15.456, lng: 77.456, patient_count: 150, high_risk_count: 20, emergency_cases: 1, worker_count: 4, avg_risk_score: 52, last_activity: new Date().toISOString() },
    { name: 'Pattikonda', lat: 15.567, lng: 77.567, patient_count: 95, high_risk_count: 12, emergency_cases: 0, worker_count: 2, avg_risk_score: 41, last_activity: new Date().toISOString() },
  ];

  const FAKE_WORKERS: Worker[] = [
    { id: 'w1', name: 'Anitha K.', village: 'Alur', lat: 15.125, lng: 77.125, last_sync: new Date().toISOString(), status: 'Active', assigned_patients: 40, visits_this_week: 12, overdue_patients: 2 },
    { id: 'w2', name: 'Lakshmi P.', village: 'Adoni', lat: 15.348, lng: 77.348, last_sync: new Date().toISOString(), status: 'Active', assigned_patients: 45, visits_this_week: 15, overdue_patients: 5 },
    { id: 'w3', name: 'Rani M.', village: 'Dhone', lat: 15.458, lng: 77.458, last_sync: new Date().toISOString(), status: 'Idle', assigned_patients: 38, visits_this_week: 8, overdue_patients: 0 },
  ];

  const FAKE_OUTBREAKS: OutbreakAlert[] = [
    { id: 'o1', symptom: 'Fever', patient_count: 12, village_names: ['Adoni', 'Dhone'], center_lat: 15.400, center_lng: 77.400, radius_km: 15, severity: 'High', suggested_action: 'Immediate screening and water testing' },
  ];

  const fetchData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setVillages(FAKE_VILLAGES);
    setWorkers(FAKE_WORKERS);
    setOutbreaks(FAKE_OUTBREAKS);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkL = setInterval(() => {
      if (typeof L !== 'undefined') {
        clearInterval(checkL);
        if (!mapContainerRef.current || mapInstance.current) return;

        console.log('Initializing Leaflet map...');
        // Initialize map
        mapInstance.current = L.map(mapContainerRef.current).setView([15.3, 77.3], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        villageLayer.current = L.layerGroup().addTo(mapInstance.current);
        workerLayer.current = L.layerGroup().addTo(mapInstance.current);
        outbreakLayer.current = L.layerGroup().addTo(mapInstance.current);
        
        if (L.heatLayer) {
          console.log('Initializing Heatmap layer...');
          heatLayer.current = L.heatLayer([], { radius: 25, blur: 15, maxZoom: 17 }).addTo(mapInstance.current);
        } else {
          console.warn('L.heatLayer not found. Heatmap will not be displayed.');
        }

        // Fix map size issues
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        }, 500);
      }
    }, 100);

    return () => {
      clearInterval(checkL);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || loading) return;

    // Clear existing markers
    villageLayer.current.clearLayers();
    workerLayer.current.clearLayers();
    outbreakLayer.current.clearLayers();

    // Add Village Markers and Heatmap Data
    const heatPoints: any[] = [];
    villages.forEach(v => {
      const color = v.avg_risk_score >= 67 ? '#ef4444' : v.avg_risk_score >= 34 ? '#f59e0b' : '#10b981';
      const radius = 8 + (v.high_risk_count * 1.5);

      // Add to heatmap (weighted by high risk count)
      if (v.high_risk_count > 0) {
        heatPoints.push([v.lat, v.lng, v.high_risk_count / 10]);
      }

      const marker = L.circleMarker([v.lat, v.lng], {
        radius,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      marker.bindPopup(`
        <div class="p-2 min-w-[200px]">
          <h4 class="font-bold text-lg border-b mb-2">${v.name}</h4>
          <div class="space-y-1 text-sm">
            <p class="flex justify-between"><span>Patients:</span> <b>${v.patient_count}</b></p>
            <p class="flex justify-between text-red-600"><span>High Risk:</span> <b>${v.high_risk_count}</b></p>
            <p class="flex justify-between text-orange-600"><span>Emergencies:</span> <b>${v.emergency_cases}</b></p>
            <p class="flex justify-between"><span>Workers:</span> <b>${v.worker_count}</b></p>
            <p class="flex justify-between border-t pt-1 mt-1"><span>Avg Risk:</span> <b>${v.avg_risk_score.toFixed(1)}</b></p>
          </div>
        </div>
      `);

      marker.addTo(villageLayer.current);
    });

    if (heatLayer.current) {
      if (layers.heatmap) {
        heatLayer.current.setLatLngs(heatPoints);
        if (!mapInstance.current.hasLayer(heatLayer.current)) {
          heatLayer.current.addTo(mapInstance.current);
        }
      } else {
        mapInstance.current.removeLayer(heatLayer.current);
      }
    }

    // Add Worker Markers
    if (layers.workers) {
      workers.forEach(w => {
        if (!w.lat || !w.lng) return;
        
        const workerIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg">
                  <div class="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([w.lat, w.lng], { icon: workerIcon })
          .bindPopup(`<b>Worker: ${w.name}</b><br/>Status: ${w.status}<br/>Last Sync: ${new Date(w.last_sync).toLocaleString()}`)
          .addTo(workerLayer.current);
      });
    }

    // Add Outbreak Markers
    if (layers.outbreaks) {
      outbreaks.forEach(o => {
        const outbreakIcon = L.divIcon({
          className: 'outbreak-icon',
          html: `<div class="w-12 h-12 rounded-full bg-red-500/30 border-2 border-red-500 flex items-center justify-center animate-ping"></div>
                 <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-600 border-2 border-white"></div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        L.marker([o.center_lat, o.center_lng], { icon: outbreakIcon })
          .bindPopup(`
            <div class="p-2">
              <h4 class="font-bold text-red-600 uppercase text-xs tracking-widest mb-1">Outbreak Alert</h4>
              <p class="font-bold text-lg">${o.symptom}</p>
              <p class="text-sm">${o.patient_count} patients affected</p>
              <p class="text-xs text-slate-500 mt-2">Villages: ${o.village_names.join(', ')}</p>
              <div class="mt-3 bg-red-50 p-2 rounded border border-red-100 text-xs text-red-700">
                <b>Action:</b> ${o.suggested_action}
              </div>
            </div>
          `)
          .addTo(outbreakLayer.current);
      });
    }

    // Fit bounds if we have villages
    if (villages.length > 0) {
      const bounds = L.latLngBounds(villages.map(v => [v.lat, v.lng]));
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [villages, workers, outbreaks, layers, loading]);

  if (loading && villages.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 h-[600px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-lg">District Health Heatmap</h3>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={layers.heatmap}
              onChange={() => setLayers(l => ({ ...l, heatmap: !l.heatmap }))}
              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-xs font-bold text-slate-600 group-hover:text-orange-600 transition-colors flex items-center gap-1">
              <Activity className="w-3 h-3" /> Heatmap
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={layers.outbreaks}
              onChange={() => setLayers(l => ({ ...l, outbreaks: !l.outbreaks }))}
              className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-xs font-bold text-slate-600 group-hover:text-red-600 transition-colors flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Outbreak Alerts
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={layers.workers}
              onChange={() => setLayers(l => ({ ...l, workers: !l.workers }))}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors flex items-center gap-1">
              <Users className="w-3 h-3" /> Worker Locations
            </span>
          </label>
        </div>
      </div>
      <div className="relative">
        <div ref={mapContainerRef} className="h-[600px] w-full z-0" />
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl z-[1000] text-[10px] font-bold uppercase tracking-widest space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>High Risk (&gt;66)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Medium Risk (34-66)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Low Risk (&lt;34)</span>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <p className="text-slate-400 mb-1">Marker Size</p>
            <p className="normal-case font-medium text-slate-600 italic">Scales with High-Risk Patient Count</p>
          </div>
        </div>
      </div>
    </div>
  );
}
