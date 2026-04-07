import React, { useEffect, useState } from 'react';
import { UserCheck, Search, Send, AlertCircle, CheckCircle, Clock, Loader2, MoreVertical, Mail } from 'lucide-react';
import { Worker } from '../types';

export default function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const FAKE_WORKERS: Worker[] = [
    { id: 'w1', name: 'Anitha K.', village: 'Alur', last_sync: new Date().toISOString(), status: 'Active', assigned_patients: 40, visits_this_week: 12, overdue_patients: 2, lat: 15.125, lng: 77.125 },
    { id: 'w2', name: 'Lakshmi P.', village: 'Adoni', last_sync: new Date().toISOString(), status: 'Active', assigned_patients: 45, visits_this_week: 15, overdue_patients: 5, lat: 15.348, lng: 77.348 },
    { id: 'w3', name: 'Rani M.', village: 'Dhone', last_sync: new Date(Date.now() - 3600000).toISOString(), status: 'Idle', assigned_patients: 38, visits_this_week: 8, overdue_patients: 0, lat: 15.458, lng: 77.458 },
    { id: 'w4', name: 'Saritha B.', village: 'Gooty', last_sync: new Date(Date.now() - 86400000).toISOString(), status: 'Offline', assigned_patients: 42, visits_this_week: 0, overdue_patients: 12, lat: 15.234, lng: 77.234 },
    { id: 'w5', name: 'Kavitha S.', village: 'Pattikonda', last_sync: new Date().toISOString(), status: 'Active', assigned_patients: 35, visits_this_week: 10, overdue_patients: 1, lat: 15.567, lng: 77.567 },
  ];

  const fetchData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setWorkers(FAKE_WORKERS);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.village.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBroadcast = () => {
    // Simulate broadcast
    alert(`Alert sent to ${filteredWorkers.length} workers: ${alertMessage}`);
    setShowAlertModal(false);
    setAlertMessage('');
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
          <UserCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Worker Management & Performance</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search workers or villages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button
            onClick={() => setShowAlertModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Broadcast Alert
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Workers" value={workers.length} icon={UserCheck} color="blue" />
        <SummaryCard label="Active Now" value={workers.filter(w => w.status === 'Active').length} icon={CheckCircle} color="green" />
        <SummaryCard label="Idle / Offline" value={workers.filter(w => w.status !== 'Active').length} icon={Clock} color="orange" />
        <SummaryCard label="Overdue Cases" value={workers.reduce((acc, w) => acc + w.overdue_patients, 0)} icon={AlertCircle} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Worker Name</th>
                <th className="px-6 py-4">Village</th>
                <th className="px-6 py-4">Assigned Patients</th>
                <th className="px-6 py-4">Visits (This Week)</th>
                <th className="px-6 py-4">Overdue</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Sync</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {worker.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{worker.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{worker.village}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{worker.assigned_patients}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{worker.visits_this_week}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${worker.overdue_patients > 5 ? 'text-red-600' : 'text-slate-600'}`}>
                      {worker.overdue_patients}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      worker.status === 'Active' ? 'bg-emerald-100 text-emerald-600' :
                      worker.status === 'Idle' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {worker.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(worker.last_sync).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAlertModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h4 className="text-xl font-bold text-slate-900 mb-2">Broadcast Alert</h4>
            <p className="text-sm text-slate-500 mb-6">Send a priority message to all filtered workers.</p>
            
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder="Enter your message here..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 resize-none"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                disabled={!alertMessage.trim()}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function SummaryCard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      orange: 'bg-yellow-50 text-yellow-600 border-yellow-100',
      red: 'bg-red-50 text-red-600 border-red-100'
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
