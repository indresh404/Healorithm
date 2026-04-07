import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, Calendar, Filter, Loader2 } from 'lucide-react';

declare const Chart: any;

export default function HealthTrends() {
  const chartRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const chartInstances = useRef<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    village: 'All',
    disease: 'All',
    ageGroup: 'All'
  });

  // Fake Data for UI improvement as requested
  const FAKE_TRENDS = {
    weeklyNewCases: [12, 18, 15, 22, 30, 28, 35, 42, 38, 45, 50, 48],
    avgRiskScore: [35, 38, 42, 40, 45, 48, 52, 50, 55, 58, 62, 60],
    adherenceRate: [85, 82, 88, 84, 90, 86, 92, 88, 94, 90, 96, 92],
    emergencyEvents: [2, 5, 3, 8, 4, 10, 6, 12, 8, 15, 10, 18]
  };

  const fetchData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (loading) return;

    const labels = Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`);

    const createChart = (id: string, label: string, data: number[], color: string, suggestedMax?: number) => {
      if (chartInstances.current[id]) {
        chartInstances.current[id].destroy();
      }

      const ctx = chartRefs.current[id]?.getContext('2d');
      if (!ctx) return;

      chartInstances.current[id] = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label,
            data,
            borderColor: color,
            backgroundColor: `${color}20`,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: '#1e293b',
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 8
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax,
              grid: { color: '#f1f5f9' },
              ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }
            }
          }
        }
      });
    };

    createChart('cases', 'Weekly New Cases', FAKE_TRENDS.weeklyNewCases, '#3b82f6');
    createChart('risk', 'Avg Risk Score', FAKE_TRENDS.avgRiskScore, '#ef4444', 100);
    createChart('adherence', 'Medicine Adherence %', FAKE_TRENDS.adherenceRate, '#10b981', 100);
    createChart('emergency', 'Emergency Events', FAKE_TRENDS.emergencyEvents, '#f59e0b');

    return () => {
      Object.values(chartInstances.current).forEach((chart: any) => chart?.destroy());
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">District Health Trends</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filters.village}
              onChange={(e) => setFilters(f => ({ ...f, village: e.target.value }))}
              className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
            >
              <option value="All">All Villages</option>
              <option value="Alur">Alur</option>
              <option value="Adoni">Adoni</option>
              <option value="Dhone">Dhone</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select 
              value={filters.ageGroup}
              onChange={(e) => setFilters(f => ({ ...f, ageGroup: e.target.value }))}
              className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
            >
              <option value="All">All Ages</option>
              <option value="0-18">0-18</option>
              <option value="19-60">19-60</option>
              <option value="60+">60+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TrendCard title="Weekly New Cases" id="cases" color="blue" />
        <TrendCard title="District Average Risk Score" id="risk" color="red" />
        <TrendCard title="Medicine Adherence Rate (%)" id="adherence" color="green" />
        <TrendCard title="Emergency Events per Week" id="emergency" color="yellow" />
      </div>
    </div>
  );

  function TrendCard({ title, id, color }: { title: string, id: string, color: string }) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h4>
        <div className="h-64">
          <canvas ref={(el) => (chartRefs.current[id] = el)} />
        </div>
      </div>
    );
  }
}
