import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Moon, Sun, Activity, Pill, Plus, Trash2, Clock, BellRing } from 'lucide-react';

interface DashboardProps {
  user: any;
}

const MOOD_OPTIONS = [
  { text: 'Extreme Sad', score: 1, icon: '😭', color: 'bg-slate-500', textCol: 'text-slate-500' },
  { text: 'Sad', score: 2, icon: '😢', color: 'bg-blue-500', textCol: 'text-blue-500' },
  { text: 'Angry', score: 3, icon: '😠', color: 'bg-red-500', textCol: 'text-red-500' },
  { text: 'Irritable', score: 4, icon: '😤', color: 'bg-orange-500', textCol: 'text-orange-500' },
  { text: 'Happy', score: 5, icon: '😊', color: 'bg-emerald-500', textCol: 'text-emerald-500' },
  { text: 'Super Happy', score: 6, icon: '🤩', color: 'bg-yellow-400', textCol: 'text-yellow-500' },
];

export default function Dashboard({ user }: DashboardProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [logForm, setLogForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    sleep_hours: 8,
    energy_level: 5,
    mood_score: 5,
    mood_text: 'Happy'
  });

  const [medForm, setMedForm] = useState({
    name: '',
    time_of_day: 'Morning',
    alarm_time: '08:00'
  });

  useEffect(() => {
    fetchData();
    setupAlarms();
  }, [user.id]);

  const fetchData = async () => {
    try {
      const [logsRes, medsRes] = await Promise.all([
        fetch(`/api/logs/${user.id}`),
        fetch(`/api/medicines/${user.id}`)
      ]);
      const logsData = await logsRes.json();
      const medsData = await medsRes.json();
      setLogs(logsData);
      setMedicines(medsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const setupAlarms = () => {
    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    const checkAlarms = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      medicines.forEach(med => {
        if (med.alarm_time === currentTime && now.getSeconds() === 0) {
          if (Notification.permission === "granted") {
            new Notification(`Time for ${med.name}`, {
              body: `It's ${med.time_of_day} medicine time.`,
              icon: '/favicon.ico'
            });
          } else {
            alert(`Time to take your medicine: ${med.name}`);
          }
        }
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...logForm
        }),
      });
      fetchData();
      alert('Daily log saved!');
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  const handleMedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...medForm
        }),
      });
      setMedForm({ name: '', time_of_day: 'Morning', alarm_time: '08:00' });
      fetchData();
    } catch (error) {
      console.error('Error saving medicine:', error);
    }
  };

  const deleteMedicine = async (id: number) => {
    try {
      await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting medicine:', error);
    }
  };

  const chartData = logs.map(log => ({
    ...log,
    dateLabel: format(parseISO(log.date), 'MMM dd')
  }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-slate-200/60">
        <div className="mb-4 md:mb-0">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Hello, {user.name}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Track your mood, sleep, and medications.</p>
        </div>
        <div className="flex space-x-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-slate-200/60">
          {['overview', 'logs', 'medicines'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-white shadow-md text-indigo-600 scale-105' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-white">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg shadow-blue-200 text-white">
                  <Moon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Sleep Trend</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="sleep_hours" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-white">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-200 text-white">
                  <Sun className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Energy Levels</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 10]} />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="energy_level" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-white">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 text-white">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Mood Score</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[1, 6]} ticks={[1,2,3,4,5,6]} tickFormatter={(val) => MOOD_OPTIONS.find(m => m.score === val)?.icon || ''} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [MOOD_OPTIONS.find(m => m.score === value)?.text || value, 'Mood']} />
                    <Line type="monotone" dataKey="mood_score" stroke="#10B981" strokeWidth={4} dot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Daily Check-in</h2>
            <form onSubmit={handleLogSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={logForm.date}
                  onChange={e => setLogForm({...logForm, date: e.target.value})}
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>Sleep (Hours)</span>
                  <span className="text-indigo-600 font-bold">{logForm.sleep_hours}h</span>
                </label>
                <input
                  type="range"
                  min="0" max="24" step="0.5"
                  className="w-full accent-indigo-600"
                  value={logForm.sleep_hours}
                  onChange={e => setLogForm({...logForm, sleep_hours: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>Energy Level (1-10)</span>
                  <span className="text-amber-600 font-bold">{logForm.energy_level}</span>
                </label>
                <input
                  type="range"
                  min="1" max="10" step="1"
                  className="w-full accent-amber-500"
                  value={logForm.energy_level}
                  onChange={e => setLogForm({...logForm, energy_level: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Mood</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.text}
                      type="button"
                      onClick={() => setLogForm({...logForm, mood_score: mood.score, mood_text: mood.text})}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                        logForm.mood_text === mood.text 
                          ? `border-transparent ${mood.color} text-white shadow-lg scale-105` 
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl mb-1">{mood.icon}</span>
                      <span className="text-xs font-medium text-center leading-tight">{mood.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200">
                Save Daily Log
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {activeTab === 'medicines' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
              <Pill className="w-5 h-5 mr-2 text-indigo-600" /> Add Medicine
            </h2>
            <form onSubmit={handleMedSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={medForm.name}
                  onChange={e => setMedForm({...medForm, name: e.target.value})}
                  placeholder="e.g., Sertraline"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time of Day</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={medForm.time_of_day}
                    onChange={e => setMedForm({...medForm, time_of_day: e.target.value})}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alarm Time</label>
                  <input
                    type="time"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={medForm.alarm_time}
                    onChange={e => setMedForm({...medForm, alarm_time: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center">
                <Plus className="w-5 h-5 mr-1" /> Add Reminder
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Your Reminders</h2>
            {medicines.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500">
                No medicines added yet.
              </div>
            ) : (
              medicines.map(med => (
                <div key={med.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-50 p-3 rounded-full">
                      <Pill className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{med.name}</h4>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Clock className="w-4 h-4 mr-1" /> {med.time_of_day}
                        <span className="mx-2">•</span>
                        <BellRing className="w-4 h-4 mr-1 text-amber-500" /> {med.alarm_time}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMedicine(med.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
