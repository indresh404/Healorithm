import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, HealthAnalytics } from '../types';
import { Search, Filter, ChevronRight, Loader2, MoreVertical, Phone, Mail, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function UsersList() {
  const [users, setUsers] = useState<(User & { analytics?: HealthAnalytics })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data: usersData } = await supabase.from('users').select('*').order('name');
        if (usersData) {
          const { data: analyticsData } = await supabase.from('health_analytics').select('*');
          const usersWithAnalytics = usersData.map(user => ({
            ...user,
            analytics: analyticsData?.find(a => a.user_id === user.id)
          }));
          setUsers(usersWithAnalytics);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patient Directory</h2>
          <p className="text-slate-500">Manage and view all registered patients in the system.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all w-64"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button className="text-slate-300 hover:text-slate-600 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold border border-blue-100">
                {user.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{user.name}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{user.gender}, {user.age} yrs</p>
                  {user.analytics?.risk_level && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      user.analytics.risk_level === 'Low' ? 'bg-emerald-50 text-emerald-600' :
                      user.analytics.risk_level === 'Moderate' ? 'bg-yellow-50 text-yellow-600' :
                      user.analytics.risk_level === 'High' ? 'bg-orange-50 text-orange-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {user.analytics.risk_level} Risk
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-sm font-medium">{user.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-sm font-medium">{(user.name || '').toLowerCase().replace(/\s+/g, '.')}@example.com</span>
              </div>
            </div>

            <Link
              to={`/user/${user.id}`}
              className="w-full py-3 bg-slate-50 text-slate-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
            >
              View Full Profile
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-400 font-medium">No patients found matching your search.</p>
        </div>
      )}
    </div>
  );
}
