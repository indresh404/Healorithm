import React, { useEffect, useState } from 'react';
import { Package, Search, Download, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface MedicineDemand {
  name: string;
  active_patients: number;
  avg_cycle_days: number;
  projected_refills_4w: number;
  stock_status: 'Critical' | 'Low' | 'Stable';
  last_procurement: string;
}

export default function ResourcePlanning() {
  const [demands, setDemands] = useState<MedicineDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const FAKE_DEMANDS: MedicineDemand[] = [
    { name: 'Metformin 500mg', active_patients: 150, avg_cycle_days: 30, projected_refills_4w: 180, stock_status: 'Stable', last_procurement: '2026-03-01' },
    { name: 'Amlodipine 5mg', active_patients: 120, avg_cycle_days: 30, projected_refills_4w: 140, stock_status: 'Low', last_procurement: '2026-02-15' },
    { name: 'Atorvastatin 10mg', active_patients: 85, avg_cycle_days: 30, projected_refills_4w: 100, stock_status: 'Stable', last_procurement: '2026-03-10' },
    { name: 'Losartan 50mg', active_patients: 60, avg_cycle_days: 30, projected_refills_4w: 75, stock_status: 'Critical', last_procurement: '2026-01-20' },
    { name: 'Gliclazide 80mg', active_patients: 45, avg_cycle_days: 30, projected_refills_4w: 55, stock_status: 'Stable', last_procurement: '2026-03-05' },
    { name: 'Hydrochlorothiazide 12.5mg', active_patients: 30, avg_cycle_days: 30, projected_refills_4w: 40, stock_status: 'Low', last_procurement: '2026-02-28' },
  ];

  const fetchData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setDemands(FAKE_DEMANDS);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDemands = demands.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSV = () => {
    const headers = ['Medicine Name', 'Active Patients', 'Avg Cycle (Days)', 'Projected Refills (4W)', 'Stock Status', 'Last Procurement'];
    const rows = demands.map(d => [d.name, d.active_patients, d.avg_cycle_days, d.projected_refills_4w, d.stock_status, d.last_procurement]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `resource_planning_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Resource Planning & Demand Forecasting</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          label="Critical Shortage" 
          value={demands.filter(d => d.stock_status === 'Critical').length} 
          icon={AlertCircle} 
          color="red" 
        />
        <SummaryCard 
          label="Low Stock Alert" 
          value={demands.filter(d => d.stock_status === 'Low').length} 
          icon={Clock} 
          color="orange" 
        />
        <SummaryCard 
          label="Stable Inventory" 
          value={demands.filter(d => d.stock_status === 'Stable').length} 
          icon={CheckCircle} 
          color="green" 
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Medicine Name</th>
                <th className="px-6 py-4">Active Patients</th>
                <th className="px-6 py-4">Avg Cycle</th>
                <th className="px-6 py-4">Projected Refills (4W)</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4">Last Procurement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDemands.map((demand, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{demand.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{demand.active_patients}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{demand.avg_cycle_days} days</td>
                  <td className="px-6 py-4 font-bold text-blue-600">{demand.projected_refills_4w}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      demand.stock_status === 'Critical' ? 'bg-red-100 text-red-600' :
                      demand.stock_status === 'Low' ? 'bg-orange-100 text-orange-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {demand.stock_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(demand.last_procurement).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  function SummaryCard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
    const colors = {
      red: 'bg-red-50 text-red-600 border-red-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-100',
      green: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return (
      <div className={`p-6 rounded-2xl border ${colors[color as keyof typeof colors]}`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5 opacity-60" />
          <span className="text-3xl font-bold">{value}</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-60">{label}</p>
      </div>
    );
  }
}
