// src/pages/worker/WorkerNewPatient.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../../lib/storage';
import { UserPlus, CheckCircle2, ShieldCheck, Home, Phone, Heart } from 'lucide-react';

export default function WorkerNewPatient() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('Adoni');
  const [householdId, setHouseholdId] = useState('HH-AD-099');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [preferredLang, setPreferredLang] = useState('Hindi');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !phone) return;

    const newUser = store.registerPatient({
      name,
      age: Number(age),
      gender,
      preferred_language: preferredLang,
      phone,
      village,
      household_id: householdId,
      address,
      blood_group: bloodGroup
    });

    store.setActivePatient(newUser.id);
    setSubmitted(true);
    setTimeout(() => {
      navigate('/worker/vitals');
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Register Rural Patient (Offline)</h2>
        <p className="text-xs text-slate-500 mt-0.5">Saves encrypted to device; queues in outbox for automatic sync</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1">Patient Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Parvati Devi"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">Age (Years) *</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 52"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="O+">O+</option>
                <option value="AB+">AB+</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="O-">O-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1">Village</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="Adoni">Adoni</option>
                <option value="Alur">Alur</option>
                <option value="Gooty">Gooty</option>
                <option value="Dhone">Dhone</option>
                <option value="Pattikonda">Pattikonda</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Household Tag (HH ID)</label>
              <input
                type="text"
                value={householdId}
                onChange={(e) => setHouseholdId(e.target.value)}
                placeholder="e.g. HH-AD-042"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Detailed House Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Anganwadi Center, Ward 3"
              rows={2}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-[11px] text-emerald-800 font-medium">
              Generating Digital QR Health Card with AES-GCM local device encryption. No network required.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitted}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
              submitted
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {submitted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Patient Enrolled! Redirecting to Vitals...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Health Card & Proceed to Vitals</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
