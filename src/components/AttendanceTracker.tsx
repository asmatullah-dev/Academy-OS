import { useState } from 'react';
import { AppData, AttendanceRecord, ClassLevel, Student } from '../types';
import { CLASSES } from '../constants';
import { Search, Send, CheckCircle2, XCircle, Clock, Users, MessageSquare, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { formatWhatsAppLink, cn } from '../utils';
import React from 'react';

export default function AttendanceTracker({ data, updateData, studentUser }: { data: AppData, updateData: (d: Partial<AppData>) => void, studentUser?: Student | null }) {
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'All'>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date());

  const isAdmin = !studentUser;

  if (studentUser) {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const studentAttendance = data.attendance.filter(r => 
      r.studentId === studentUser.id && 
      new Date(r.date) >= monthStart && 
      new Date(r.date) <= monthEnd
    );

    const stats = {
      present: studentAttendance.filter(r => r.status === 'Present').length,
      absent: studentAttendance.filter(r => r.status === 'Absent').length,
      late: studentAttendance.filter(r => r.status === 'Late').length,
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Present</div>
            <div className="text-3xl font-black text-emerald-600">{stats.present}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Absent</div>
            <div className="text-3xl font-black text-rose-600">{stats.absent}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Late</div>
            <div className="text-3xl font-black text-amber-600">{stats.late}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" />
              Attendance Calendar - {format(viewMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>
          <div className="p-6 grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">{d}</div>
            ))}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const record = studentAttendance.find(r => isSameDay(new Date(r.date), day));
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border border-slate-50",
                    record?.status === 'Present' ? "bg-emerald-50 border-emerald-100" :
                    record?.status === 'Absent' ? "bg-rose-50 border-rose-100" :
                    record?.status === 'Late' ? "bg-amber-50 border-amber-100" :
                    "bg-slate-50/50"
                  )}
                >
                  <span className="text-xs font-bold text-slate-900">{format(day, 'd')}</span>
                  {record && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      record.status === 'Present' ? "bg-emerald-500" :
                      record.status === 'Absent' ? "bg-rose-500" : "bg-amber-500"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const filteredStudents = data.students.filter(s => 
    (selectedClass === 'All' || s.classLevel === selectedClass) &&
    (selectedSection === 'All' || s.section === selectedSection) &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.includes(searchTerm))
  );

  const availableSections = selectedClass === 'All' 
    ? Array.from(new Set(data.sections.map(s => s.name)))
    : data.sections.filter(s => s.classLevel === selectedClass).map(s => s.name);

  const getStatus = (studentId: string) => {
    const record = data.attendance.find(r => r.date === selectedDate && r.studentId === studentId);
    return record?.status || 'Not Marked';
  };

  const setAttendanceStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    const existingIndex = data.attendance.findIndex(r => r.date === selectedDate && r.studentId === studentId);
    let newAttendance = [...data.attendance];
    
    if (existingIndex > -1) {
      newAttendance[existingIndex].status = status;
    } else {
      newAttendance.push({
        id: `${selectedDate}_${studentId}`,
        date: selectedDate,
        studentId,
        status
      });
    }
    
    updateData({ attendance: newAttendance });
  };

  const handleBulkAttendance = (status: 'Present' | 'Absent' | 'Late') => {
    let newAttendance = [...data.attendance];
    filteredStudents.forEach(student => {
      const existingIndex = newAttendance.findIndex(r => r.date === selectedDate && r.studentId === student.id);
      if (existingIndex > -1) {
        newAttendance[existingIndex].status = status;
      } else {
        newAttendance.push({
          id: `${selectedDate}_${student.id}`,
          date: selectedDate,
          studentId: student.id,
          status
        });
      }
    });
    updateData({ attendance: newAttendance });
  };

  const sendWhatsAppAlert = (studentId: string, status: string) => {
    const student = data.students.find(s => s.id === studentId);
    if (!student) return;
    
    let message = '';
    if (status === 'Absent') {
      message = `Assalam O Alaikum! Dear Parent, Your child ${student.name} was ABSENT on ${format(new Date(selectedDate), 'dd MMM yyyy')}.`;
    } else if (status === 'Late') {
      message = `Assalam O Alaikum! Dear Parent, Your child ${student.name} was LATE on ${format(new Date(selectedDate), 'dd MMM yyyy')}.`;
    } else {
      message = `Assalam O Alaikum! Dear Parent, Your child ${student.name} was PRESENT on ${format(new Date(selectedDate), 'dd MMM yyyy')}.`;
    }
    
    message += `\n\nRegards, ${data.settings.name}`;
    window.open(formatWhatsAppLink(student.whatsappNumber, message), '_blank');
  };

  const notifyAllAbsent = () => {
    const absentStudents = filteredStudents.filter(s => getStatus(s.id) === 'Absent');
    if (absentStudents.length === 0) {
      alert('No absent students found in the current filtered list.');
      return;
    }
    if (confirm(`Send WhatsApp notifications to ${absentStudents.length} absent students?`)) {
      absentStudents.forEach(s => sendWhatsAppAlert(s.id, 'Absent'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Select Date</label>
          <input
            type="date"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Filter by Class</label>
          <select
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={selectedClass}
            onChange={e => {
              setSelectedClass(e.target.value as ClassLevel | 'All');
              setSelectedSection('All');
            }}
          >
            <option value="All">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Filter by Section</label>
          <select
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
          >
            <option value="All">All Sections</option>
            {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search student..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => handleBulkAttendance('Present')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <CheckCircle2 size={16} /> Mark All Present
        </button>
        <button 
          onClick={() => handleBulkAttendance('Absent')}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
        >
          <XCircle size={16} /> Mark All Absent
        </button>
        <button 
          onClick={notifyAllAbsent}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-800/20"
        >
          <MessageSquare size={16} /> WhatsApp All Absent
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">WhatsApp Notification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const status = getStatus(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                        <div className="text-[10px] text-slate-500">Roll: {student.rollNumber} | {student.classLevel}-{student.section}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setAttendanceStatus(student.id, 'Present')}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              status === 'Present' ? "bg-emerald-100 text-emerald-700 shadow-sm" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                            title="Present"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button 
                            onClick={() => setAttendanceStatus(student.id, 'Absent')}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              status === 'Absent' ? "bg-rose-100 text-rose-700 shadow-sm" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                            title="Absent"
                          >
                            <XCircle size={18} />
                          </button>
                          <button 
                            onClick={() => setAttendanceStatus(student.id, 'Late')}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              status === 'Late' ? "bg-amber-100 text-amber-700 shadow-sm" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                            title="Late"
                          >
                            <Clock size={18} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => sendWhatsAppAlert(student.id, status)}
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm",
                            status === 'Absent' ? "bg-rose-500 text-white hover:bg-rose-600" : 
                            status === 'Late' ? "bg-amber-500 text-white hover:bg-amber-600" :
                            status === 'Present' ? "bg-emerald-500 text-white hover:bg-emerald-600" :
                            "bg-slate-100 text-slate-400 cursor-not-allowed"
                          )}
                          disabled={status === 'Not Marked'}
                        >
                          <MessageSquare size={12} />
                          <span>Send Alert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={48} className="text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-900">No students found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
