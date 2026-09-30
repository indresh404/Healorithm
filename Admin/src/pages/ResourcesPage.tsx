// src/pages/admin/ResourcesPage.tsx
import React, { useState } from 'react';
import { Package, AlertCircle, Plus, CheckCircle2, TrendingDown, Truck } from 'lucide-react';

interface MedicineStock {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  monthlyUsage: number;
  unit: string;
  status: 'Adequate' | 'Low' | 'Critical';
}

const INITIAL_STOCK: MedicineStock[] = [
  { id: 'm1', name: 'Paracetamol 650mg (Generic Jan Aushadhi)', category: 'Analgesic', currentStock: 4200, minThreshold: 2000, monthlyUsage: 3100, unit: 'Tablets', status: 'Adequate' },
  { id: 'm2', name: 'ORS Packets (Oral Rehydration Salts)', category: 'Gastroenteritis', currentStock: 450, minThreshold: 800, monthlyUsage: 900, unit: 'Sachets', status: 'Low' },
  { id: 'm3', name: 'Telmisartan 40mg', category: 'Hypertension NCD', currentStock: 1800, minThreshold: 1500, monthlyUsage: 1400, unit: 'Tablets', status: 'Adequate' },
  { id: 'm4', name: 'Metformin 500mg', category: 'Diabetes NCD', currentStock: 320, minThreshold: 1200, monthlyUsage: 1600, unit: 'Tablets', status: 'Critical' },
  { id: 'm5', name: 'Amoxicillin + Clavulanic 625mg', category: 'Antibiotic', currentStock: 980, minThreshold: 600, monthlyUsage: 500, unit: 'Tablets', status: 'Adequate' },
  { id: 'm6', name: 'Dengue NS1 Antigen Rapid Test Kits', category: 'Diagnostic', currentStock: 45, minThreshold: 150, monthlyUsage: 120, unit: 'Kits', status: 'Critical' },
];

export default function ResourcesPage() {
  const [stocks, setStocks] = useState<MedicineStock[]>(INITIAL_STOCK);
  const [reordered, setReordered] = useState<Record<string, boolean>>({});

  const handleReorder = (id: string) => {
    setReordered(prev => ({ ...prev, [id]: true }));
    setStocks(prev => prev.map(s => s.id === id ? { ...s, currentStock: s.currentStock + 1500, status: 'Adequate' } : s));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">District Medical Supplies & Resource Planning</h2>
          <p className="text-sm text-slate-500 mt-1">Predictive stock replenishment for rural sub-centers and Jan Aushadhi Kendras</p>
        </div>
      </div>

      {/* Resource Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Essential Formulary Inventory</h3>
          <span className="text-xs font-bold text-slate-500">6 Monitored Key Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 pl-6">Medicine / Supply Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Monthly Demand</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stocks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 pl-6 font-bold text-slate-900">
                    {item.name}
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    {item.category}
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800">
                    {item.currentStock.toLocaleString()} {item.unit}
                  </td>
                  <td className="p-4 text-slate-600">
                    {item.monthlyUsage.toLocaleString()} / mo
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      item.status === 'Critical' ? 'bg-red-100 text-red-700' :
                      item.status === 'Low' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {item.status !== 'Adequate' ? (
                      <button
                        onClick={() => handleReorder(item.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 ml-auto transition-all shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Stock</span>
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Stock Balanced</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
