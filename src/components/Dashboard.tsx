import { AppData, Student } from '../types';
import { Users, BookOpen, GraduationCap, Wallet, Calendar, ClipboardCheck, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard({ data, studentUser }: { data: AppData, studentUser?: Student | null }) {
  if (studentUser) {
    const studentAttendance = data.attendance.filter(a => a.studentId === studentUser.id);
    const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
    const attendanceRate = studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 0;
    
    const studentResults = data.testResults.filter(r => r.studentId === studentUser.id);
    const avgScore = studentResults.length > 0 ? Math.round(studentResults.reduce((acc, r) => {
      const test = data.tests.find(t => t.id === r.testId);
      return acc + (r.obtainedMarks / (test?.totalMarks || 100)) * 100;
    }, 0) / studentResults.length) : 0;

    const stats = [
      { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: Calendar, color: 'bg-emerald-500' },
      { label: 'Average Score', value: `${avgScore}%`, icon: ClipboardCheck, color: 'bg-blue-500' },
      { label: 'Total Tests', value: studentResults.length, icon: BookOpen, color: 'bg-purple-500' },
      { label: 'Class Rank', value: 'Coming Soon', icon: GraduationCap, color: 'bg-amber-500' },
    ];

    return (
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-3xl font-bold">
            {studentUser.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back, {studentUser.name}!</h2>
            <p className="text-slate-500">Roll Number: {studentUser.rollNumber} | Class: {studentUser.classLevel} - {studentUser.section}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
            >
              <div className={`${stat.color} p-4 rounded-xl text-white shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Today's Timetable</h3>
            <div className="space-y-4">
              {data.timetable
                .filter(t => t.classLevel === studentUser.classLevel && t.section === studentUser.section && t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }))
                .map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">{entry.subject}</p>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{entry.time}</p>
                  </div>
                ))}
              {data.timetable.filter(t => t.classLevel === studentUser.classLevel && t.section === studentUser.section && t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' })).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No classes scheduled for today</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Test Results</h3>
            <div className="space-y-4">
              {studentResults.slice(-5).reverse().map((result, i) => {
                const test = data.tests.find(t => t.id === result.testId);
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{test?.subject}</p>
                      <p className="text-xs text-slate-400">{test?.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{result.obtainedMarks}/{test?.totalMarks}</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{Math.round((result.obtainedMarks / (test?.totalMarks || 100)) * 100)}%</p>
                    </div>
                  </div>
                );
              })}
              {studentResults.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No test results available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Students', value: data.students.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Staff', value: data.staff.length, icon: GraduationCap, color: 'bg-purple-500' },
    { label: 'Active Subjects', value: data.subjects.length, icon: BookOpen, color: 'bg-emerald-500' },
    { label: 'Pending Fees', value: data.students.length - data.feePayments.filter(f => f.month === new Date().toISOString().slice(0, 7)).length, icon: Wallet, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className={`${stat.color} p-4 rounded-xl text-white shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {data.attendance.slice(-5).reverse().map((record, i) => {
              const student = data.students.find(s => s.id === record.studentId);
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${record.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <p className="text-sm font-medium text-slate-700">{student?.name || 'Unknown Student'}</p>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(record.date).toLocaleDateString()}</p>
                </div>
              );
            })}
            {data.attendance.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No recent attendance logs</p>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Academy Overview</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Fee Collection Target</span>
                <span className="text-sm font-bold text-slate-900">
                  {Math.round((data.feePayments.filter(f => f.month === new Date().toISOString().slice(0, 7)).length / (data.students.length || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${(data.feePayments.filter(f => f.month === new Date().toISOString().slice(0, 7)).length / (data.students.length || 1)) * 100}%` }}
                />
              </div>
            </div>
            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Total Classes</p>
                <p className="text-lg font-bold text-slate-900">{new Set(data.students.map(s => s.classLevel)).size}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Upcoming Tests</p>
                <p className="text-lg font-bold text-slate-900">{data.tests.filter(t => new Date(t.date) > new Date()).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
