import { useState } from 'react';
import { AppData, FeePayment, ClassLevel, Student } from '../types';
import { CLASSES } from '../constants';
import { Search, Plus, CreditCard, Send, Bell, CheckCircle, AlertCircle, Edit3, MessageSquare } from 'lucide-react';
import { generateId, formatWhatsAppLink, cn } from '../utils';
import { format } from 'date-fns';
import React from 'react';

export default function FeeCollection({ 
  data, 
  updateData,
  studentUser 
}: { 
  data: AppData, 
  updateData: (d: Partial<AppData>) => void,
  studentUser?: Student | null
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'All'>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [tempFee, setTempFee] = useState<number>(0);
  
  const [formData, setFormData] = useState<Partial<FeePayment>>({
    amount: undefined,
    month: format(new Date(), 'MMMM yyyy'),
    date: new Date().toISOString().split('T')[0],
  });

  const isAdmin = !studentUser;

  // If student is logged in, show their fee history
  if (studentUser) {
    const studentPayments = data.feePayments.filter(p => p.studentId === studentUser.id);
    const currentMonth = format(new Date(), 'MMMM yyyy');
    const isPaidThisMonth = studentPayments.some(p => p.month === currentMonth);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
              isPaidThisMonth ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
            )}>
              <CreditCard className="text-white" size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Current Month Status</p>
              <h3 className={cn(
                "text-2xl font-black",
                isPaidThisMonth ? "text-emerald-600" : "text-rose-600"
              )}>
                {isPaidThisMonth ? 'PAID' : 'UNPAID'}
              </h3>
              <p className="text-sm text-slate-500">{currentMonth}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CheckCircle className="text-white" size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Monthly Fee</p>
              <h3 className="text-2xl font-black text-slate-900">Rs. {studentUser.fee}</h3>
              <p className="text-sm text-slate-500">Fixed monthly amount</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Month</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {studentPayments.sort((a, b) => b.date.localeCompare(a.date)).map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{payment.month}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">Rs. {payment.amount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{payment.date}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => sendReceipt(payment)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                      >
                        <MessageSquare size={14} /> Get Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {studentPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      No payment records found.
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

  const filteredStudents = data.students.filter(s => 
    (selectedClass === 'All' || s.classLevel === selectedClass) &&
    (selectedSection === 'All' || s.section === selectedSection) &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.includes(searchTerm))
  );

  const availableSections = selectedClass === 'All' 
    ? Array.from(new Set(data.sections.map(s => s.name)))
    : data.sections.filter(s => s.classLevel === selectedClass).map(s => s.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment: FeePayment = {
      id: generateId(),
      studentId: formData.studentId!,
      amount: Number(formData.amount || 0),
      month: formData.month!,
      date: formData.date!,
    };
    updateData({ feePayments: [...data.feePayments, newPayment] });
    setIsModalOpen(false);
    
    // Send WhatsApp Receipt
    sendReceipt(newPayment);
  };

  const sendReceipt = (payment: FeePayment) => {
    const student = data.students.find(s => s.id === payment.studentId);
    if (!student) return;
    
    const message = `Assalam O Alaikum! Dear Parent, Fee Receipt for ${student.name}.\nAmount: ${payment.amount}\nMonth: ${payment.month}\nDate: ${payment.date}\nStatus: PAID\n\nThank you for your payment!\n\nRegards, ${data.settings.name}`;
    window.open(formatWhatsAppLink(student.whatsappNumber, message), '_blank');
  };

  const sendReminder = (studentId: string) => {
    const student = data.students.find(s => s.id === studentId);
    if (!student) return;
    
    const currentMonth = format(new Date(), 'MMMM yyyy');
    const message = `Assalam O Alaikum! Dear Parent, This is a friendly reminder regarding the monthly fee of ${student.name} for ${currentMonth}.\nAmount Due: ${student.fee}\n\nPlease ignore if already paid. Thank you!\n\nRegards, ${data.settings.name}`;
    window.open(formatWhatsAppLink(student.whatsappNumber, message), '_blank');
  };

  const isPaid = (studentId: string) => {
    const currentMonth = format(new Date(), 'MMMM yyyy');
    return data.feePayments.some(p => p.studentId === studentId && p.month === currentMonth);
  };

  const handleUpdateStudentFee = (studentId: string) => {
    const updatedStudents = data.students.map(s => s.id === studentId ? { ...s, fee: tempFee } : s);
    updateData({ students: updatedStudents });
    setEditingFeeId(null);
  };

  const [quickAmounts, setQuickAmounts] = useState<Record<string, number>>({});

  const handleQuickCollect = (studentId: string) => {
    const student = data.students.find(s => s.id === studentId);
    if (!student) return;
    
    const amount = quickAmounts[studentId] || student.fee;
    const newPayment: FeePayment = {
      id: generateId(),
      studentId,
      amount,
      month: format(new Date(), 'MMMM yyyy'),
      date: new Date().toISOString().split('T')[0],
    };
    updateData({ feePayments: [...data.feePayments, newPayment] });
    sendReceipt(newPayment);
    
    // Clear quick amount
    const newQuickAmounts = { ...quickAmounts };
    delete newQuickAmounts[studentId];
    setQuickAmounts(newQuickAmounts);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Filter by Class</label>
          <select
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={selectedClass}
            onChange={(e) => {
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
            onChange={(e) => setSelectedSection(e.target.value)}
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setFormData({ ...formData, amount: undefined });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 font-bold"
        >
          <Plus size={18} /> Collect Fee
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Fee</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((student) => {
                const currentMonth = format(new Date(), 'MMMM yyyy');
                const payment = data.feePayments.find(p => p.studentId === student.id && p.month === currentMonth);
                const paid = !!payment;
                
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                      <div className="text-[10px] text-slate-500">Roll: {student.rollNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">{student.classLevel} - {student.section}</span>
                    </td>
                    <td className="px-6 py-4">
                      {editingFeeId === student.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            autoFocus
                            className="w-20 px-2 py-1 border border-emerald-500 rounded-lg outline-none text-sm"
                            value={tempFee}
                            onChange={e => setTempFee(Number(e.target.value))}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateStudentFee(student.id)}
                          />
                          <button onClick={() => handleUpdateStudentFee(student.id)} className="text-emerald-500"><CheckCircle size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/fee">
                          <span className="text-sm font-bold text-slate-900">{student.fee}</span>
                          <button 
                            onClick={() => { setEditingFeeId(student.id); setTempFee(student.fee); }}
                            className="opacity-0 group-hover/fee:opacity-100 text-slate-400 hover:text-blue-500 transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {paid ? (
                        <span className="text-sm font-bold text-emerald-600">{payment.amount}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            placeholder={student.fee.toString()}
                            className="w-20 px-2 py-1 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            value={quickAmounts[student.id] === undefined ? '' : quickAmounts[student.id]}
                            onChange={e => setQuickAmounts({ ...quickAmounts, [student.id]: Number(e.target.value) })}
                          />
                          <button 
                            onClick={() => handleQuickCollect(student.id)}
                            className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            Collect
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold",
                        paid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      )}>
                        {paid ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => paid ? sendReceipt(payment) : sendReminder(student.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm",
                            paid ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-amber-500 text-white hover:bg-amber-600"
                          )}
                          title={paid ? "Send Receipt" : "Send Reminder"}
                        >
                          <MessageSquare size={14} />
                          {paid ? 'Receipt' : 'Reminder'}
                        </button>
                        <button 
                          onClick={() => {
                            setFormData({ ...formData, studentId: student.id, amount: student.fee });
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Advanced Collect"
                        >
                          <CreditCard size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Collect Fee</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Student</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  value={formData.studentId || ''}
                  onChange={e => {
                    const student = data.students.find(s => s.id === e.target.value);
                    setFormData({ ...formData, studentId: e.target.value, amount: student?.fee });
                  }}
                >
                  <option value="">Choose Student...</option>
                  {data.students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Roll: {s.rollNumber})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.amount === undefined ? '' : formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">For Month</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. October 2023"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  value={formData.month || ''}
                  onChange={e => setFormData({ ...formData, month: e.target.value })}
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
