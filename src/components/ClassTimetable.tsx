import { useState } from 'react';
import { AppData, TimetableEntry, ClassLevel, Student } from '../types';
import { CLASSES, DAYS } from '../constants';
import { Plus, Trash2, Smartphone, Monitor } from 'lucide-react';
import { generateId } from '../utils';
import React from 'react';

export default function ClassTimetable({ 
  data, 
  updateData,
  studentUser 
}: { 
  data: AppData, 
  updateData: (d: Partial<AppData>) => void,
  studentUser?: Student | null
}) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TimetableEntry>>({ day: 'Monday', classLevel: '1' });

  const isAdmin = !studentUser;

  // If student is logged in, show their specific timetable
  if (studentUser) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Monitor className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Class Timetable</h3>
              <p className="text-sm text-slate-500">Class {studentUser.classLevel} - {studentUser.section}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map(day => {
              const dayEntries = data.timetable
                .filter(e => e.day === day && e.classLevel === studentUser.classLevel && e.section === studentUser.section)
                .sort((a, b) => a.time.localeCompare(b.time));

              return (
                <div key={day} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
                    {day}
                    <span className="text-[10px] px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-500">
                      {dayEntries.length} Classes
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {dayEntries.map(entry => (
                      <div key={entry.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{entry.subject}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">{entry.time}</p>
                        </div>
                      </div>
                    ))}
                    {dayEntries.length === 0 && (
                      <p className="text-center py-4 text-xs text-slate-400 italic">No classes</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: TimetableEntry = {
      id: generateId(),
      day: formData.day as any,
      time: formData.time!,
      subject: formData.subject!,
      classLevel: formData.classLevel as ClassLevel,
      section: formData.section!,
    };
    updateData({ timetable: [...data.timetable, entry] });
    setIsModalOpen(false);
    setFormData({ day: 'Monday', classLevel: '1' });
  };

  const handleDelete = (id: string) => {
    updateData({ timetable: data.timetable.filter(e => e.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setView('desktop')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'desktop' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <Monitor size={16} /> Desktop
          </button>
          <button onClick={() => setView('mobile')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <Smartphone size={16} /> Mobile
          </button>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20">
          <Plus size={18} /> Add Schedule
        </button>
      </div>

      {view === 'desktop' ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-32">Day</th>
                {CLASSES.slice(0, 6).map(c => <th key={c} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Class {c}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {DAYS.map(day => (
                <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 bg-slate-50/30">{day}</td>
                  {CLASSES.slice(0, 6).map(c => {
                    const entries = data.timetable.filter(e => e.day === day && e.classLevel === c);
                    return (
                      <td key={c} className="px-6 py-4 align-top">
                        <div className="space-y-2">
                          {entries.map(e => (
                            <div key={e.id} className="p-2 bg-blue-50 border border-blue-100 rounded-lg group relative">
                              <p className="text-xs font-bold text-blue-700">{e.time}</p>
                              <p className="text-sm font-semibold text-blue-900">{e.subject}</p>
                              <p className="text-[10px] text-blue-600">{e.section}</p>
                              <button onClick={() => handleDelete(e.id)} className="absolute -top-2 -right-2 p-1 bg-white shadow-md rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4 max-w-md mx-auto">
          {DAYS.map(day => (
            <div key={day} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900">{day}</h4>
              </div>
              <div className="divide-y divide-slate-50">
                {data.timetable.filter(e => e.day === day).sort((a, b) => a.time.localeCompare(b.time)).map(e => (
                  <div key={e.id} className="p-4 flex justify-between items-center group">
                    <div>
                      <p className="text-xs font-bold text-emerald-600">{e.time}</p>
                      <p className="font-bold text-slate-900">{e.subject}</p>
                      <p className="text-xs text-slate-500">Class {e.classLevel} - {e.section}</p>
                    </div>
                    <button onClick={() => handleDelete(e.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {data.timetable.filter(e => e.day === day).length === 0 && (
                  <p className="p-6 text-center text-sm text-slate-400 italic">No classes scheduled</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Add Schedule Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleAddEntry} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Day</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-xl" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value as any})}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Time</label>
                  <input required type="time" className="w-full px-4 py-2 border border-slate-200 rounded-xl" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl" value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Class</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-xl" value={formData.classLevel} onChange={e => setFormData({...formData, classLevel: e.target.value as ClassLevel})}>
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Section</label>
                  <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl" value={formData.section || ''} onChange={e => setFormData({...formData, section: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 mt-4">Save Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
