import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, MedicalRecord, HealthAnalytics, Prescription } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  ArrowLeft, 
  Calendar, 
  User as UserIcon, 
  Phone, 
  Globe, 
  Clock, 
  ShieldCheck, 
  Stethoscope,
  Activity,
  Loader2,
  Syringe,
  FlaskConical,
  Heart,
  FileText,
  Bandage,
  ChevronRight,
  Plus,
  X,
  Pill,
  Timer,
  Info,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Brain,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

const iconMap: Record<string, any> = {
  medical_services: Stethoscope,
  vaccines: Syringe,
  science: FlaskConical,
  favorite: Heart,
  description: FileText,
  healing: Bandage,
};

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [analytics, setAnalytics] = useState<HealthAnalytics | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includePrescription, setIncludePrescription] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const generateAIAnalysis = async (userData: User, userRecords: MedicalRecord[], userAnalytics: HealthAnalytics | null, userPrescriptions: Prescription[]) => {
    if (cooldown > 0) return;
    setIsAnalyzing(true);
    try {
      const prompt = `
        Analyze the following patient data and provide a health risk assessment.
        
        Patient: ${userData.name}, Age: ${userData.age}, Gender: ${userData.gender}
        
        Recent Medical Records:
        ${userRecords.slice(0, 5).map(r => `- ${r.date}: ${r.report_type} - ${r.details}`).join('\n')}
        
        Current Analytics:
        - Systolic BP: ${userAnalytics?.systolic_bp || 'N/A'}
        - Blood Glucose: ${userAnalytics?.blood_glucose || 'N/A'}
        - Adherence Rate: ${userAnalytics?.adherence_rate || 'N/A'}%
        - Chronic Conditions: ${userAnalytics?.other_chronic_conditions?.join(', ') || 'None'}
        
        Prescriptions:
        ${userPrescriptions.map(p => `- ${p.medicine_name} (${p.dosage})`).join('\n')}
        
        Return a JSON object with the following structure:
        {
          "risk_score": number (0-100),
          "risk_level": "Low" | "Moderate" | "High" | "Critical",
          "risks": string[] (list of specific risk factors with point impact, e.g. ["Age (+20)", "High BP (+15)"]),
          "summary": string (brief summary of findings),
          "suggested_action": string (recommended next step)
        }
      `;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI Analysis Error (${response.status}): ${errorData.error || response.statusText || 'Unknown Error'}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      // Update analytics in state and Supabase
      if (userAnalytics) {
        const updatedAnalytics = {
          ...userAnalytics,
          risk_score: analysis.risk_score,
          risk_level: analysis.risk_level,
          risks: analysis.risks,
          weekly_summary: `${analysis.summary} Suggested action: ${analysis.suggested_action}`
        };
        
        const { error: updateError } = await supabase.from('health_analytics').update({
          risk_score: analysis.risk_score,
          risk_level: analysis.risk_level,
          risks: analysis.risks,
          weekly_summary: updatedAnalytics.weekly_summary
        }).eq('id', userAnalytics.id);

        if (updateError) {
          console.error('Supabase Update Error:', updateError);
        }
        
        setAnalytics(updatedAnalytics);
        setCooldown(30); 
      }
    } catch (error: any) {
      console.error('Analysis Error:', error);
      alert(error.message || 'Failed to generate AI analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [newRecord, setNewRecord] = useState({
    report_type: '',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    doctor: '',
    hospital: '',
    status: 'Active',
    details: '',
    icon: 'medical_services'
  });

  const [newPrescription, setNewPrescription] = useState({
    medicine_name: '',
    dosage: '',
    timing: 'After Meal',
    meal_timing: 'Breakfast',
    duration: ''
  });

  const fetchUserData = async () => {
    if (!id) return;
    
    try {
      // Fetch User and Analytics first (essential)
      const [userRes, analyticsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', id).single(),
        supabase.from('health_analytics').select('*').eq('user_id', id).single()
      ]);

      if (userRes.data) setUser(userRes.data);
      if (analyticsRes.data) setAnalytics(analyticsRes.data);

      // Fetch Records and Prescriptions (might fail if tables aren't created yet)
      const recordsRes = await supabase.from('medical_records').select('*').eq('user_id', id).order('created_at', { ascending: false });
      if (recordsRes.data) setRecords(recordsRes.data);

      const prescriptionsRes = await supabase.from('prescriptions').select('*').eq('user_id', id).order('created_at', { ascending: false });
      if (prescriptionsRes.data) setPrescriptions(prescriptionsRes.data);
      
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;

    setIsSubmitting(true);
    try {
      // 1. Insert Medical Record
      const { data: recordData, error: recordError } = await supabase.from('medical_records').insert([
        {
          user_id: id,
          patient_name: user.name,
          ...newRecord
        }
      ]).select().single();

      if (recordError) {
        console.error('Supabase Medical Record Error:', recordError);
        throw new Error(`Medical Record Error: ${recordError.message}`);
      }

      // 2. Insert Prescription if included
      if (includePrescription && recordData) {
        const { error: presError } = await supabase.from('prescriptions').insert([
          {
            user_id: id,
            medical_record_id: recordData.id,
            ...newPrescription
          }
        ]);
        if (presError) {
          console.error('Supabase Prescription Error:', presError);
          throw new Error(`Prescription Error: ${presError.message}`);
        }
      }

      setShowAddModal(false);
      // ... reset state ...
      setNewRecord({
        report_type: '',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        doctor: '',
        hospital: '',
        status: 'Active',
        details: '',
        icon: 'medical_services'
      });
      setNewPrescription({
        medicine_name: '',
        dosage: '',
        timing: 'After Meal',
        meal_timing: 'Breakfast',
        duration: ''
      });
      setIncludePrescription(false);
      fetchUserData();
    } catch (error: any) {
      console.error('Full Error Object:', error);
      alert(error.message || 'An unknown error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900">User Not Found</h2>
        <p className="text-slate-500 mt-2">The patient ID provided does not exist in our records.</p>
        <Link to="/" className="mt-6 inline-block text-blue-600 font-semibold hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patient Profile</h2>
          <p className="text-slate-500">Detailed medical overview for {user.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Health Assessment Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Brain className="w-64 h-64" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">AI Health Risk Assessment</h3>
                    <p className="text-slate-400">Advanced analysis of patient medical history and real-time data</p>
                  </div>
                </div>
                <button 
                  onClick={() => user && generateAIAnalysis(user, records, analytics, prescriptions)}
                  disabled={isAnalyzing || cooldown > 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : cooldown > 0 ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <TrendingUp className="w-5 h-5" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : cooldown > 0 ? `Wait ${cooldown}s` : (analytics?.risk_score ? 'Refresh Analysis' : 'Generate Analysis')}
                </button>
              </div>

              {analytics?.risk_score !== undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Risk Score</p>
                    <div className="flex items-end gap-2">
                      <span className="text-6xl font-bold">{analytics.risk_score}</span>
                      <span className="text-slate-400 mb-2 font-bold">/ 100</span>
                    </div>
                    <div className="mt-4 w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          analytics.risk_score >= 67 ? 'bg-red-500' :
                          analytics.risk_score >= 34 ? 'bg-yellow-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${analytics.risk_score}%` }}
                      ></div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        analytics.risk_level === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                        analytics.risk_level === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                        analytics.risk_level === 'High' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {analytics.risk_level} Risk
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        Score Breakdown
                      </p>
                      <div className="space-y-2">
                        {analytics.risks && analytics.risks.length > 0 ? (
                          analytics.risks.map((risk, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                              <span className="text-slate-300">{risk.split(' (+')[0]}</span>
                              <span className="text-blue-400 font-bold">+{risk.split(' (+')[1]?.replace(')', '') || '0'}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-300 text-sm leading-relaxed">
                            No significant risk factors identified.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-400" />
                        Summary & Suggested Action
                      </p>
                      <div className="space-y-4">
                        <p className="text-slate-200 text-sm leading-relaxed italic">
                          "{analytics.weekly_summary?.split(' Suggested action: ')[0] || 'No summary generated yet.'}"
                        </p>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Suggested Action</p>
                          <p className="text-white font-semibold">
                            {analytics.weekly_summary?.split(' Suggested action: ')[1] || 'Routine check next scheduled visit'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-dashed border-white/20 rounded-3xl p-12 text-center">
                  <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Click the button above to generate a comprehensive AI health risk assessment for this patient.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* User Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <div className="bg-blue-600 p-8 text-white relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 border border-white/30">
              {user.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-bold">{user.name}</h3>
            <p className="text-blue-100 flex items-center gap-2 mt-1">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Patient ID</span>
              <span className="text-xs font-mono opacity-80">{user.id.slice(0, 8)}...</span>
            </p>
          </div>
          <div className="p-8 space-y-6">
            <ProfileItem icon={UserIcon} label="Age & Gender" value={`${user.age} years, ${user.gender}`} />
            <ProfileItem icon={Phone} label="Phone Number" value={user.phone} />
            <ProfileItem icon={Globe} label="Preferred Language" value={user.preferred_language} />
            <ProfileItem icon={Clock} label="Member Since" value={new Date(user.created_at).toLocaleDateString()} />
          </div>
          
          {/* Active Prescriptions Sidebar Section */}
          {prescriptions.length > 0 && (
            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Pill className="w-3 h-3 text-blue-600" />
                Active Prescriptions
              </h4>
              <div className="space-y-4">
                {prescriptions.slice(0, 3).map((pres) => (
                  <div key={pres.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-900">{pres.medicine_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                      <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{pres.dosage}</span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-2.5 h-2.5" />
                        {pres.timing}
                      </span>
                      {pres.meal_timing && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {pres.meal_timing}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Duration: {pres.duration}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Health Analytics Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="text-blue-600 w-6 h-6" />
              Health Analytics
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time Data</span>
          </div>

          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Vaccination Status</p>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-emerald-900 font-bold">{analytics.vaccination_status}</p>
                      <p className="text-emerald-600 text-xs font-medium">{analytics.vaccination_label}</p>
                    </div>
                    <ShieldCheck className="text-emerald-500 w-8 h-8" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Medicine Tracker</p>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-blue-900 font-bold">{analytics.medicine_tracker}</p>
                      <p className="text-blue-600 font-bold">{analytics.medicine_percent}</p>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${analytics.medicine_progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Checkup</p>
                    <p className="text-slate-900 font-bold">{analytics.last_checkup_date}</p>
                    <p className="text-emerald-600 text-xs font-medium mt-1">{analytics.last_checkup_status}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Appt</p>
                    <p className="text-slate-900 font-bold">{analytics.next_appointment_date}</p>
                    <p className="text-blue-600 text-xs font-medium mt-1">{analytics.next_appointment_doctor}</p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Health Score</p>
                    <h4 className="text-4xl font-bold">92<span className="text-lg opacity-50">/100</span></h4>
                    <p className="text-slate-400 text-sm mt-2">Excellent progress this month.</p>
                  </div>
                  <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <p className="text-slate-400 font-medium">No analytics data available for this patient.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Medical Records Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600 w-6 h-6" />
            Medical History
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
            <button className="text-sm font-bold text-blue-600 hover:underline">Download All Records</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {records.length > 0 ? (
            records.map((record, index) => (
              <RecordCard key={record.id} record={record} index={index} />
            ))
          ) : (
            <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-slate-400 font-medium">No medical records found for this patient.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Add New Medical Record</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleAddRecord} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report Type</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Blood Test, Prescription"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newRecord.report_type}
                    onChange={e => setNewRecord({...newRecord, report_type: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Dr. Name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newRecord.doctor}
                    onChange={e => setNewRecord({...newRecord, doctor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hospital/Clinic</label>
                  <input
                    required
                    type="text"
                    placeholder="Location"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newRecord.hospital}
                    onChange={e => setNewRecord({...newRecord, hospital: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newRecord.status}
                    onChange={e => setNewRecord({...newRecord, status: e.target.value})}
                  >
                    <option>Active</option>
                    <option>Normal</option>
                    <option>Completed</option>
                    <option>Pending Review</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Icon Category</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newRecord.icon}
                    onChange={e => setNewRecord({...newRecord, icon: e.target.value})}
                  >
                    <option value="medical_services">Medical Services</option>
                    <option value="vaccines">Vaccines</option>
                    <option value="science">Lab/Science</option>
                    <option value="favorite">Cardiology/Heart</option>
                    <option value="description">Prescription/Notes</option>
                    <option value="healing">Healing/Physio</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                  <input
                    required
                    type="text"
                    placeholder="Mar 13, 2026"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newRecord.date}
                    onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter medical details, observations, or prescriptions..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  value={newRecord.details}
                  onChange={e => setNewRecord({...newRecord, details: e.target.value})}
                ></textarea>
              </div>

              {/* Medicine/Prescription Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-slate-900">Medicine Prescription</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={includePrescription}
                      onChange={() => setIncludePrescription(!includePrescription)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-slate-600">Include Medicine</span>
                  </label>
                </div>

                {includePrescription && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medicine Name</label>
                        <input
                          required={includePrescription}
                          type="text"
                          placeholder="e.g. Paracetamol"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={newPrescription.medicine_name}
                          onChange={e => setNewPrescription({...newPrescription, medicine_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dosage (How much)</label>
                        <input
                          required={includePrescription}
                          type="text"
                          placeholder="e.g. 500mg"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={newPrescription.dosage}
                          onChange={e => setNewPrescription({...newPrescription, dosage: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timing (When to eat)</label>
                        <select
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={newPrescription.timing}
                          onChange={e => setNewPrescription({...newPrescription, timing: e.target.value})}
                        >
                          <option>Before Meal</option>
                          <option>After Meal</option>
                          <option>With Meal</option>
                          <option>Empty Stomach</option>
                          <option>Before Sleep</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meal (Which meal)</label>
                        <select
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={newPrescription.meal_timing}
                          onChange={e => setNewPrescription({...newPrescription, meal_timing: e.target.value})}
                        >
                          <option>Breakfast</option>
                          <option>Lunch</option>
                          <option>Dinner</option>
                          <option>Morning Snack</option>
                          <option>Evening Snack</option>
                          <option>Any Time</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration (How long)</label>
                        <input
                          required={includePrescription}
                          type="text"
                          placeholder="e.g. 5 days"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={newPrescription.duration}
                          onChange={e => setNewPrescription({...newPrescription, duration: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-[10px] text-blue-600 font-medium bg-blue-100/50 p-2 rounded-lg">
                      <Info className="w-3 h-3 mt-0.5" />
                      <p>This data will be used to send automated medication reminders to the patient.</p>
                    </div>
                  </motion.div>
                )}
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Record'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2 bg-slate-50 rounded-lg">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

interface RecordCardProps {
  record: MedicalRecord;
  index: number;
  key?: string;
}

function RecordCard({ record, index }: RecordCardProps) {
  const Icon = iconMap[record.icon] || Stethoscope;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
          record.status === 'Normal' || record.status === 'Completed' 
            ? 'bg-emerald-50 text-emerald-600' 
            : 'bg-blue-50 text-blue-600'
        }`}>
          {record.status}
        </span>
      </div>
      
      <h4 className="text-lg font-bold text-slate-900 mb-1">{record.report_type}</h4>
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-4">
        <Calendar className="w-3 h-3" />
        {record.date}
        <span className="mx-1">•</span>
        {record.doctor}
      </div>
      
      <p className="text-sm text-slate-600 line-clamp-3 mb-6 leading-relaxed">
        {record.details}
      </p>
      
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
            <Globe className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-xs font-semibold text-slate-500">{record.hospital}</span>
        </div>
        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

// Re-importing missing icons for the list
