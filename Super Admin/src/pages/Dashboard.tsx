import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, HealthAnalytics } from '../types';
import { Users, ChevronRight, Loader2, AlertTriangle, Activity, Clock, UserCheck, ShieldAlert, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [users, setUsers] = useState<(User & { analytics?: HealthAnalytics })[]>([]);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalRecords: 0,
    highRisk: 0,
    medRisk: 0,
    pendingFollowUps: 0,
    emergencies: 0,
    activeWorkers: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString();
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last48Hours = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const [
        usersRes, 
        recordsRes, 
        analyticsRes,
        highRiskRes,
        medRiskRes,
        pendingFollowUpsRes,
        emergenciesRes,
        workersRes
      ] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('medical_records').select('id', { count: 'exact' }),
        supabase.from('health_analytics').select('*'),
        supabase.from('health_analytics').select('id', { count: 'exact', head: true }).eq('risk_level', 'High'),
        supabase.from('health_analytics').select('id', { count: 'exact', head: true }).eq('risk_level', 'Moderate'),
        supabase.from('medical_records').select('id', { count: 'exact', head: true }).gt('follow_up_date', today),
        supabase.from('health_analytics').select('id', { count: 'exact', head: true }).eq('emergency_flag', true).gte('updated_at', last7Days),
        supabase.from('workers').select('id', { count: 'exact', head: true }).gte('last_sync', last48Hours)
      ]);

      if (usersRes.data) {
        const usersWithAnalytics = usersRes.data.map(user => ({
          ...user,
          analytics: analyticsRes.data?.find(a => a.user_id === user.id)
        }));
        setUsers(usersWithAnalytics);
      }

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalRecords: recordsRes.count || 0,
        highRisk: highRiskRes.count || 0,
        medRisk: medRiskRes.count || 0,
        pendingFollowUps: pendingFollowUpsRes.count || 0,
        emergencies: emergenciesRes.count || 0,
        activeWorkers: workersRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
          <p className="text-slate-500">Welcome back, here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          icon={ShieldAlert}
          label="High Risk"
          value={stats.highRisk}
          color="red"
        />
        <StatCard
          icon={AlertTriangle}
          label="Medium Risk"
          value={stats.medRisk}
          color="yellow"
        />
        <StatCard
          icon={Clock}
          label="Pending Visits"
          value={stats.pendingFollowUps}
          color="blue"
        />
        <StatCard
          icon={Activity}
          label="7D Emergencies"
          value={stats.emergencies}
          color="red"
        />
        <StatCard
          icon={UserCheck}
          label="Active Workers"
          value={stats.activeWorkers}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">District Overview</h3>
              <Link to="/map" className="text-blue-600 text-xs font-bold uppercase tracking-widest hover:underline">View Map</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Active Outbreaks</p>
                <div className="flex items-center justify-between">
                  <h4 className="text-3xl font-bold text-red-600">3</h4>
                  <Link to="/outbreaks" className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Resource Status</p>
                <div className="flex items-center justify-between">
                  <h4 className="text-3xl font-bold text-orange-600">Low Stock</h4>
                  <Link to="/resources" className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Field Performance</h3>
              <Link to="/workers" className="text-blue-600 text-xs font-bold uppercase tracking-widest hover:underline">Manage Workers</Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    84%
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Visit Completion Rate</p>
                    <p className="text-xs text-slate-500">Target: 90%</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Recent Patients</h3>
              </div>
              <Link to="/users" className="text-blue-600 text-xs font-bold uppercase tracking-widest hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Risk</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.slice(0, 6).map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.analytics?.risk_score !== undefined ? (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            user.analytics.risk_level === 'Low' ? 'bg-emerald-100 text-emerald-600' :
                            user.analytics.risk_level === 'Moderate' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {user.analytics.risk_score}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/user/${user.id}`}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold">System Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-sm text-slate-400 font-medium">Database Sync</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-sm text-slate-400 font-medium">Worker Connectivity</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">98% Online</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-sm text-slate-400 font-medium">AI Analysis Engine</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Operational</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number | string, color: 'blue' | 'red' | 'yellow' | 'green' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <div className={`p-4 rounded-2xl border ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
