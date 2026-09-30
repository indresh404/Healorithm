import React, { useState } from 'react';
import { store } from '../lib/storage';
import { 
  Bot, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  ArrowRight, 
  ShieldAlert, 
  Activity, 
  FileText 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CareCoordinationAgentPage() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Care Coordination Agent Console</h2>
            <p className="text-sm text-slate-500">Autonomous workflow orchestration between offline field workers and online clinicians</p>
          </div>
        </div>
      </div>

      {/* Agent Operational Lifecycle Explainer */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-md">
        <h3 className="text-base font-bold text-white mb-2">Agent Workflow Cycle</h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl mb-6">
          The agent observes every synced case from rural tablets, detects missing diagnostic parameters, summarizes longitudinal medical history, prepares handoff summaries for attending doctors, and tracks referral execution. It never makes unassisted diagnostic decisions.
        </p>

        {/* 6 Step Interactive Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Step 1</span>
            <h4 className="text-xs font-bold text-white mt-1">1. Observe</h4>
            <p className="text-[11px] text-slate-400 mt-1">New delta sync received</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Step 2</span>
            <h4 className="text-xs font-bold text-white mt-1">2. Analyze</h4>
            <p className="text-[11px] text-slate-400 mt-1">Evaluate vitals & risks</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Step 3</span>
            <h4 className="text-xs font-bold text-white mt-1">3. Recommend</h4>
            <p className="text-[11px] text-slate-400 mt-1">Suggest specialty triage</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Step 4</span>
            <h4 className="text-xs font-bold text-white mt-1">4. Ask / Act</h4>
            <p className="text-[11px] text-slate-400 mt-1">Queue missing data task</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Step 5</span>
            <h4 className="text-xs font-bold text-white mt-1">5. Escalate</h4>
            <p className="text-[11px] text-slate-400 mt-1">Emergency to top queue</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Step 6</span>
            <h4 className="text-xs font-bold text-white mt-1">6. Record</h4>
            <p className="text-[11px] text-slate-400 mt-1">Audit log & doctor note</p>
          </div>
        </div>
      </div>

      {/* Active Care Coordination Tasks */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Queued Agent Coordination Tasks</h3>
            <p className="text-xs text-slate-500">Tasks delivered to ASHA tablets on their next village synchronization</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {snapshot.careTasks.length} Active Tasks
          </span>
        </div>

        <div className="space-y-3">
          {snapshot.careTasks.map((task) => (
            <div key={task.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {task.priority} Priority
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{task.patient_name}</h4>
                  <span className="text-xs text-slate-500">• {task.village}</span>
                </div>
                <span className="text-xs font-bold text-slate-600">Assigned ASHA: {task.assigned_worker}</span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                <strong>Reason:</strong> {task.reason}
              </p>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Recommended Worker Field Action</span>
                <p className="text-slate-800 font-medium">{task.recommended_action}</p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400">Created: {new Date(task.created_at).toLocaleDateString()}</span>
                <Link
                  to={`/admin/users/${task.user_id}`}
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <span>Open Patient Case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
