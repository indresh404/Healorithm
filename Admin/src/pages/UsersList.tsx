// src/pages/admin/UsersList.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../lib/storage';
import { Users, Search, Filter, ChevronRight, Phone, ShieldAlert, Activity } from 'lucide-react';

export default function UsersList() {
  const [snapshot] = useState(store.getSnapshot());
  const [search, setSearch] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');

  const filteredUsers = snapshot.users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.phone.includes(search) || 
                          (u.village && u.village.toLowerCase().includes(search.toLowerCase()));
    const matchesVillage = villageFilter === 'all' || u.village === villageFilter;
    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registered Rural Patients</h2>
          <p className="text-sm text-slate-500 mt-1">Cross-village clinical records and risk assessments</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, phone, or village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Villages</option>
            {snapshot.villages.map(v => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 pl-6">Patient Name</th>
                <th className="p-4">Demographics</th>
                <th className="p-4">Village</th>
                <th className="p-4">Risk Level</th>
                <th className="p-4">Vitals Summary</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.map((user) => {
                const an = snapshot.analytics.find(a => a.user_id === user.id);
                const isHigh = an?.risk_level === 'High' || an?.risk_level === 'Critical';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{user.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {user.age} yrs • {user.gender}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {user.village || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        an?.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                        an?.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                        an?.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {an?.risk_level || 'Low'} ({an?.risk_score || 20})
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {an?.systolic_bp ? (
                        <span>BP: <strong>{an.systolic_bp}/{an.diastolic_bp || 80}</strong> • SpO2: <strong>{an.spo2 || 98}%</strong></span>
                      ) : (
                        <span className="text-slate-400">Baseline pending</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold rounded-xl text-xs inline-flex items-center gap-1 transition-all"
                      >
                        <span>Open Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
