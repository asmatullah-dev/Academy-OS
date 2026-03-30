import { useState } from 'react';
import { AppData, Staff, StaffPayment, Student } from '../types';
import { Plus, Search, Trash2, CreditCard, Send, UserCheck, History, Edit3, CheckCircle, MessageSquare } from 'lucide-react';
import { generateId, formatWhatsAppLink, cn } from '../utils';
import { format } from 'date-fns';
import React from 'react';

export default function TeacherPayroll({ data, updateData, studentUser }: { data: AppData, updateData: (d: Partial<AppData>) => void, studentUser?: Student | null }) {
  const [activeTab, setActiveTab] = useState<'staff' | 'payments'>('staff');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [tempSalary, setTempSalary] = useState<number>(0);
  
  const isAdmin = !studentUser;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <CreditCard size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm">Only administrators can access payroll information.</p>
      </div>
    );
  }
  
  const [formData, setFormData] = useState<Partial<Staff>>({
    salary: undefined
  });
  const [paymentFormData, setPaymentFormData] = useState<Partial<StaffPayment>>({
    date: new Date().toISOString().split('T')[0],
    amount: undefined
  });

  const filteredStaff = data.staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email?.trim().toLowerCase();
    const newStaff: Staff = {
      id: email || generateId(),
      name: formData.name!,
      role: formData.role!,
      salary: Number(formData.salary || 0),
      whatsappNumber: formData.whatsappNumber!,
      email: email,
    };
    updateData({ staff: [...data.staff, newStaff] });
    setIsModalOpen(false);
    setFormData({ salary: undefined });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment: StaffPayment = {
      id: generateId(),
      staffId: paymentFormData.staffId!,
      amount: Number(paymentFormData.amount || 0),
      month: paymentFormData.month!,
      date: paymentFormData.date!,
    };
    updateData({ staffPayments: [...data.staffPayments, newPayment] });
    setIsModalOpen(false);
    
    // Send WhatsApp Notification
    sendPaymentNotification(newPayment);
  };

  const sendPaymentNotification = (payment: StaffPayment) => {
    const staff = data.staff.find(s => s.id === payment.staffId);
    if (!staff) return;
    
    const message = `Assalam O Alaikum! Dear ${staff.name}, your salary for ${payment.month} has been processed.\nAmount: ${payment.amount}\nDate: ${payment.date}\n\nRegards, ${data.settings.name}`;
    window.open(formatWhatsAppLink(staff.whatsappNumber, message), '_blank');
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      updateData({ 
        staff: data.staff.filter(s => s.id !== id),
        staffPayments: data.staffPayments.filter(p => p.staffId !== id)
      });
    }
  };

  const handleUpdateSalary = (staffId: string) => {
    const updatedStaff = data.staff.map(s => s.id === staffId ? { ...s, salary: tempSalary } : s);
    updateData({ staff: updatedStaff });
    setEditingSalaryId(null);
  };

  const [quickSalaryAmounts, setQuickSalaryAmounts] = useState<Record<string, number>>({});

  const handleQuickPay = (staffId: string) => {
    const staff = data.staff.find(s => s.id === staffId);
    if (!staff) return;
    
    const amount = quickSalaryAmounts[staffId] || staff.salary;
    const newPayment: StaffPayment = {
      id: generateId(),
      staffId,
      amount,
      month: format(new Date(), 'MMMM yyyy'),
      date: new Date().toISOString().split('T')[0],
    };
    updateData({ staffPayments: [...data.staffPayments, newPayment] });
    sendPaymentNotification(newPayment);
    
    // Clear quick amount
    const newQuickAmounts = { ...quickSalaryAmounts };
    delete newQuickAmounts[staffId];
    setQuickSalaryAmounts(newQuickAmounts);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'staff' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <UserCheck size={18} /> Staff Registry
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'payments' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <History size={18} /> Payment Logs
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search staff..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => {
                if (activeTab === 'staff') setFormData({ salary: undefined });
                else setPaymentFormData({ ...paymentFormData, amount: undefined });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 font-bold text-sm whitespace-nowrap"
            >
              <Plus size={18} />
              <span>{activeTab === 'staff' ? 'Add Staff' : 'Record Payment'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'staff' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  {isAdmin && (
                    <>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Salary</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Pay</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => {
                    const currentMonth = format(new Date(), 'MMMM yyyy');
                    const paid = data.staffPayments.some(p => p.staffId === staff.id && p.month === currentMonth);
                    
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-900">{staff.name}</div>
                          {isAdmin && <div className="text-xs text-slate-500">{staff.whatsappNumber}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">{staff.role}</span>
                        </td>
                        {isAdmin && (
                          <>
                            <td className="px-6 py-4">
                              {editingSalaryId === staff.id ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    autoFocus
                                    className="w-24 px-2 py-1 border border-emerald-500 rounded-lg outline-none text-sm"
                                    value={tempSalary}
                                    onChange={e => setTempSalary(Number(e.target.value))}
                                    onKeyDown={e => e.key === 'Enter' && handleUpdateSalary(staff.id)}
                                  />
                                  <button onClick={() => handleUpdateSalary(staff.id)} className="text-emerald-500"><CheckCircle size={16} /></button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group/salary">
                                  <span className="text-sm font-bold text-slate-900">{staff.salary}</span>
                                  <button 
                                    onClick={() => { setEditingSalaryId(staff.id); setTempSalary(staff.salary); }}
                                    className="opacity-0 group-hover/salary:opacity-100 text-slate-400 hover:text-blue-500 transition-all"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {paid ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                  <CheckCircle size={12} /> Paid
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    placeholder={staff.salary.toString()}
                                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    value={quickSalaryAmounts[staff.id] === undefined ? '' : quickSalaryAmounts[staff.id]}
                                    onChange={e => setQuickSalaryAmounts({ ...quickSalaryAmounts, [staff.id]: Number(e.target.value) })}
                                  />
                                  <button 
                                    onClick={() => handleQuickPay(staff.id)}
                                    className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-all shadow-sm"
                                  >
                                    Pay
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setPaymentFormData({ ...paymentFormData, staffId: staff.id, amount: staff.salary });
                                    setActiveTab('payments');
                                    setIsModalOpen(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Pay Salary"
                                >
                                  <CreditCard size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteStaff(staff.id)}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Remove"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 2} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <UserCheck size={48} className="text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-900">No staff members found</p>
                        <p className="text-sm">Try adjusting your search or add a new staff member.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.staffPayments.length > 0 ? (
                  data.staffPayments.map((payment) => {
                    const staff = data.staff.find(s => s.id === payment.staffId);
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{staff?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{payment.month}</td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">{payment.amount}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{payment.date}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => sendPaymentNotification(payment)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            <MessageSquare size={12} />
                            Resend
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <History size={48} className="text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-900">No payment logs found</p>
                        <p className="text-sm">Record a payment to see it here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {activeTab === 'staff' ? 'Add New Staff' : 'Record Salary Payment'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={activeTab === 'staff' ? handleStaffSubmit : handlePaymentSubmit} className="p-8 space-y-4">
              {activeTab === 'staff' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="For admin login"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Role / Designation</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Teacher, Admin, Security"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.role || ''}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Monthly Salary</label>
                      <input
                        required
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.salary === undefined ? '' : formData.salary}
                        onChange={e => setFormData({ ...formData, salary: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp Number</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 923001234567"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.whatsappNumber || ''}
                        onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Select Staff Member</label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={paymentFormData.staffId || ''}
                      onChange={e => {
                        const staff = data.staff.find(s => s.id === e.target.value);
                        setPaymentFormData({ ...paymentFormData, staffId: e.target.value, amount: staff?.salary });
                      }}
                    >
                      <option value="">Choose Staff...</option>
                      {data.staff.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
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
                        value={paymentFormData.amount === undefined ? '' : paymentFormData.amount}
                        onChange={e => setPaymentFormData({ ...paymentFormData, amount: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={paymentFormData.date || ''}
                        onChange={e => setPaymentFormData({ ...paymentFormData, date: e.target.value })}
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
                      value={paymentFormData.month || ''}
                      onChange={e => setPaymentFormData({ ...paymentFormData, month: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  {activeTab === 'staff' ? 'Save Staff' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
