import { useState, useEffect, useRef } from 'react';
import { AppData, Student, ClassLevel } from '../types';
import { CLASSES } from '../constants';
import { Plus, Search, Edit2, Trash2, FileText, Download, User, Phone, Calendar, Clipboard, CreditCard, Send, X, ArrowUpCircle, Camera, Languages, Droplets, Scale, Info } from 'lucide-react';
import { generateId, downloadCSV, formatWhatsAppLink } from '../utils';
import { generateStudentResultCard, generateIDCard } from '../reports';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentManagement({ data, updateData, studentUser }: { data: AppData, updateData: (d: Partial<AppData>) => void, studentUser?: Student | null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    classLevel: '1',
    section: '',
    fee: undefined,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = !studentUser;

  const filteredStudents = data.students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.includes(searchTerm) ||
      s.fatherName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (isAdmin) return matchesSearch;
    // Students can only see classmates
    return matchesSearch && s.classLevel === studentUser?.classLevel && s.section === studentUser?.section;
  });

  const getNextRollNumber = (classLevel: string, section: string) => {
    const groupStudents = data.students.filter(s => s.classLevel === classLevel && s.section === section);
    if (groupStudents.length === 0) return "1";
    const rollNumbers = groupStudents.map(s => parseInt(s.rollNumber)).filter(n => !isNaN(n));
    if (rollNumbers.length === 0) return "1";
    return (Math.max(...rollNumbers) + 1).toString();
  };

  useEffect(() => {
    if (!editingStudent && formData.classLevel && formData.section) {
      const nextRoll = getNextRollNumber(formData.classLevel, formData.section);
      setFormData(prev => ({ ...prev, rollNumber: nextRoll }));
    }
  }, [formData.classLevel, formData.section, editingStudent]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateData({
        students: data.students.map(s => s.id === editingStudent.id ? { ...s, ...formData } as Student : s)
      });
    } else {
      const newStudent: Student = {
        id: generateId(),
        name: formData.name!,
        rollNumber: formData.rollNumber!,
        fatherName: formData.fatherName!,
        classLevel: formData.classLevel as ClassLevel,
        section: formData.section!,
        fee: Number(formData.fee || 0),
        whatsappNumber: formData.whatsappNumber!,
        motherLanguage: formData.motherLanguage,
        bloodGroup: formData.bloodGroup,
        age: formData.age,
        weight: formData.weight,
        bioData: formData.bioData,
        photo: formData.photo,
        password: formData.password,
      };
      updateData({ students: [...data.students, newStudent] });
    }
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({ classLevel: '1', section: '', fee: undefined });
  };

  const handlePromote = (student: Student) => {
    const currentIndex = CLASSES.indexOf(student.classLevel);
    if (currentIndex === CLASSES.length - 1) {
      alert('Student is already in the highest class.');
      return;
    }
    const nextClass = CLASSES[currentIndex + 1] as ClassLevel;
    if (confirm(`Promote ${student.name} to Class ${nextClass}?`)) {
      const nextRoll = getNextRollNumber(nextClass, student.section);
      updateData({
        students: data.students.map(s => s.id === student.id ? { ...s, classLevel: nextClass, rollNumber: nextRoll } : s)
      });
      setSelectedStudent(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      updateData({ students: data.students.filter(s => s.id !== id) });
    }
  };

  const handleExport = () => {
    const headers = ['Roll No', 'Name', 'Father Name', 'Class', 'Section', 'Fee', 'WhatsApp'];
    const rows = data.students.map(s => [
      s.rollNumber, s.name, s.fatherName, s.classLevel, s.section, s.fee, s.whatsappNumber
    ]);
    downloadCSV(headers, rows, 'students_list.csv');
  };

  const sendWhatsAppReport = (student: Student) => {
    const message = `Assalam O Alaikum! Dear Parent, here is the progress report for ${student.name}.\nRoll No: ${student.rollNumber}\nClass: ${student.classLevel}-${student.section}\n\nRegards, ${data.settings.name}`;
    window.open(formatWhatsAppLink(student.whatsappNumber, message), '_blank');
  };

  const availableSections = data.sections.filter(s => s.classLevel === formData.classLevel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, roll no, or father's name..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {isAdmin && (
            <>
              <button 
                onClick={handleExport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Download size={18} />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={() => {
                  setEditingStudent(null);
                  setFormData({ classLevel: '1', section: '', fee: undefined });
                  setIsModalOpen(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Plus size={18} />
                <span>Add Student</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp</th>
                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{student.rollNumber}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="text-left group/name flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                          {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User size={14} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 group-hover/name:text-emerald-600 transition-colors">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.fatherName}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Class {student.classLevel} - {student.section}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.whatsappNumber}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => generateStudentResultCard(student, data)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Generate Report"
                          >
                            <FileText size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingStudent(student);
                              setFormData(student);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <User size={48} className="text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-900">No students found</p>
                      <p className="text-sm">Try adjusting your search or add a new student.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-emerald-500 p-8 text-white relative">
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
                    {selectedStudent.photo ? (
                      <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={48} className="text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedStudent.name}</h3>
                    <p className="opacity-80">Roll Number: {selectedStudent.rollNumber}</p>
                    <p className="opacity-80">Class {selectedStudent.classLevel} - {selectedStudent.section}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Bio Data & Info</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <User size={18} className="text-emerald-500" />
                      <span className="text-sm">Father: {selectedStudent.fatherName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone size={18} className="text-emerald-500" />
                      <span className="text-sm">WhatsApp: {selectedStudent.whatsappNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Droplets size={18} className="text-emerald-500" />
                      <span className="text-sm">Blood Group: {selectedStudent.bloodGroup || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Languages size={18} className="text-emerald-500" />
                      <span className="text-sm">Mother Tongue: {selectedStudent.motherLanguage || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Calendar size={18} className="text-emerald-500" />
                      <span className="text-sm">Age: {selectedStudent.age || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Scale size={18} className="text-emerald-500" />
                      <span className="text-sm">Weight: {selectedStudent.weight || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Info size={18} className="text-emerald-500" />
                      <span className="text-sm">Bio: {selectedStudent.bioData || 'N/A'}</span>
                    </div>
                    {selectedStudent.password && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <Clipboard size={18} className="text-emerald-500" />
                        <span className="text-sm font-bold">Login Password: {selectedStudent.password}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => generateStudentResultCard(selectedStudent, data)}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl transition-all font-medium"
                    >
                      <Clipboard size={18} /> Progress Report (PDF)
                    </button>
                    <button 
                      onClick={() => generateIDCard(selectedStudent, data)}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-all font-medium"
                    >
                      <CreditCard size={18} /> Student ID Card (PDF)
                    </button>
                    <button 
                      onClick={() => handlePromote(selectedStudent)}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-xl transition-all font-medium"
                    >
                      <ArrowUpCircle size={18} /> Promote to Next Class
                    </button>
                    <button 
                      onClick={() => sendWhatsAppReport(selectedStudent)}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl transition-all font-medium"
                    >
                      <Send size={18} /> WhatsApp Report
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingStudent(null); }} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all overflow-hidden group"
                >
                  {formData.photo ? (
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <>
                      <Camera size={24} className="text-slate-400 group-hover:text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500 uppercase mt-1">Photo</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Academic Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Class</label>
                      <select
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.classLevel}
                        onChange={e => setFormData({ ...formData, classLevel: e.target.value as ClassLevel, section: '' })}
                      >
                        {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Section</label>
                      <select
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.section || ''}
                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                      >
                        <option value="">Select Section</option>
                        {availableSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Roll Number</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-slate-50"
                        value={formData.rollNumber || ''}
                        onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Monthly Fee</label>
                      <input
                        type="number"
                        placeholder="Fee amount"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.fee === undefined ? '' : formData.fee}
                        onChange={e => setFormData({ ...formData, fee: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Student Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Father's Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.fatherName || ''}
                      onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp Number</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 923001234567"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.whatsappNumber || ''}
                      onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Login Password</label>
                    <input
                      type="text"
                      placeholder="Set student login password"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.password || ''}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bio Data (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Mother Tongue</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.motherLanguage || ''}
                        onChange={e => setFormData({ ...formData, motherLanguage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Blood Group</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.bloodGroup || ''}
                        onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Age</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.age || ''}
                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Weight</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.weight || ''}
                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Other Bio Data</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                      value={formData.bioData || ''}
                      onChange={e => setFormData({ ...formData, bioData: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingStudent(null); }}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                >
                  {editingStudent ? 'Update Student Record' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
