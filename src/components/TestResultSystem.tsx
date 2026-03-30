import React, { useState } from 'react';
import { AppData, Test, TestResult, ClassLevel, Student } from '../types';
import { CLASSES } from '../constants';
import { Plus, Search, Trash2, FileText, Send, Trophy, Users, Download, MessageSquare } from 'lucide-react';
import { generateId, formatWhatsAppLink, cn } from '../utils';
import { generateTestResultSheet, generateStudentResultCard, generateCombinedClassReport } from '../reports';

export default function TestResultSystem({ 
  data, 
  updateData,
  studentUser 
}: { 
  data: AppData, 
  updateData: (d: Partial<AppData>) => void,
  studentUser?: Student | null
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<ClassLevel | 'All'>('All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [formData, setFormData] = useState<Partial<Test>>({
    classLevel: '1',
    subject: '',
    totalMarks: undefined,
    date: new Date().toISOString().split('T')[0],
  });

  const isAdmin = !studentUser;

  // If student is logged in, only show their results
  if (studentUser) {
    const studentTests = data.tests.filter(t => t.classLevel === studentUser.classLevel && t.section === studentUser.section);
    const studentResults = data.testResults.filter(r => r.studentId === studentUser.id);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Tests</p>
            <p className="text-3xl font-black text-slate-900">{studentResults.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Average Percentage</p>
            <p className="text-3xl font-black text-emerald-600">
              {studentResults.length > 0
                ? (studentResults.reduce((acc, r) => {
                    const test = data.tests.find(t => t.id === r.testId);
                    return acc + (test ? (r.obtainedMarks / test.totalMarks) * 100 : 0);
                  }, 0) / studentResults.length).toFixed(1)
                : '0'}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Recent Performance</p>
            <p className="text-3xl font-black text-blue-600">
              {studentResults.length > 0 ? 'Good' : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Your Test Results</h3>
            <button 
              onClick={() => generateStudentResultCard(studentUser, data)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download size={14} /> Download Full Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Subject</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Marks</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Percentage</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {studentResults.sort((a, b) => {
                  const testA = data.tests.find(t => t.id === a.testId);
                  const testB = data.tests.find(t => t.id === b.testId);
                  return (testB?.date || '').localeCompare(testA?.date || '');
                }).map(result => {
                  const test = data.tests.find(t => t.id === result.testId);
                  if (!test) return null;
                  const percentage = (result.obtainedMarks / test.totalMarks) * 100;
                  return (
                    <tr key={result.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">{test.date}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{test.subject}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {result.obtainedMarks} / {test.totalMarks}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                percentage >= 80 ? "bg-emerald-500" : percentage >= 50 ? "bg-blue-500" : "bg-rose-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{percentage.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                          percentage >= 40 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        )}>
                          {percentage >= 40 ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const filteredTests = data.tests.filter(t => 
    (filterClass === 'All' || t.classLevel === filterClass) &&
    (filterSection === 'All' || t.section === filterSection) &&
    (t.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentSection = data.sections.find(s => s.classLevel === formData.classLevel && s.name === formData.section);
  const availableSubjects = currentSection?.subjects || [];

  const availableSections = data.sections.filter(s => s.classLevel === formData.classLevel);
  const filterSections = filterClass === 'All' 
    ? Array.from(new Set(data.sections.map(s => s.name)))
    : data.sections.filter(s => s.classLevel === filterClass).map(s => s.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTest: Test = {
      id: generateId(),
      classLevel: formData.classLevel as ClassLevel,
      section: formData.section!,
      subject: formData.subject!,
      totalMarks: Number(formData.totalMarks || 0),
      date: formData.date!,
    };
    updateData({ tests: [...data.tests, newTest] });
    setIsModalOpen(false);
    setFormData({ classLevel: '1', subject: '', totalMarks: undefined, date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this test and all its results?')) {
      updateData({ 
        tests: data.tests.filter(t => t.id !== id),
        testResults: data.testResults.filter(r => r.testId !== id)
      });
    }
  };

  const updateResult = (testId: string, studentId: string, marks: number | undefined) => {
    const existingIndex = data.testResults.findIndex(r => r.testId === testId && r.studentId === studentId);
    let newResults = [...data.testResults];
    
    if (existingIndex > -1) {
      if (marks === undefined) {
        newResults.splice(existingIndex, 1);
      } else {
        newResults[existingIndex].obtainedMarks = marks;
      }
    } else if (marks !== undefined) {
      newResults.push({
        id: generateId(),
        testId,
        studentId,
        obtainedMarks: marks
      });
    }
    
    updateData({ testResults: newResults });
  };

  const sendWhatsAppResult = (studentId: string, test: Test) => {
    const student = data.students.find(s => s.id === studentId);
    const result = data.testResults.find(r => r.testId === test.id && r.studentId === studentId);
    if (!student || !result) return;
    
    const message = `Assalam O Alaikum! Dear Parent, Result for ${student.name} in ${test.subject} test (${test.date}):\nObtained Marks: ${result.obtainedMarks}/${test.totalMarks}\nPercentage: ${((result.obtainedMarks / test.totalMarks) * 100).toFixed(1)}%\n\nRegards, ${data.settings.name}`;
    window.open(formatWhatsAppLink(student.whatsappNumber, message), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Class</label>
          <select
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={filterClass}
            onChange={e => {
              setFilterClass(e.target.value as ClassLevel | 'All');
              setFilterSection('All');
            }}
          >
            <option value="All">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Section</label>
          <select
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={filterSection}
            onChange={e => setFilterSection(e.target.value)}
          >
            <option value="All">All Sections</option>
            {filterSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search subject..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (filterClass === 'All' || filterSection === 'All') {
                alert('Please select a specific Class and Section to generate a combined report.');
                return;
              }
              generateCombinedClassReport(filterClass, filterSection, data);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 text-sm font-bold"
          >
            <Download size={18} /> Combined PDF
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 text-sm font-bold"
          >
            <Plus size={18} /> Create Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            Recent Tests
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {filteredTests.map((test) => (
              <div 
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer",
                  selectedTest?.id === test.id 
                    ? 'bg-emerald-50 border-emerald-200 shadow-md shadow-emerald-500/5' 
                    : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{test.subject}</h4>
                    <p className="text-xs text-slate-500">{test.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); generateTestResultSheet(test, data); }}
                      className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Download Sheet"
                    >
                      <FileText size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(test.id); }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase">
                    Class {test.classLevel} - {test.section}
                  </span>
                  <span className="text-xs text-slate-400">Total: {test.totalMarks} Marks</span>
                </div>
              </div>
            ))}
            {filteredTests.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                No tests found. Create your first test to start tracking results.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-500" size={20} />
            {selectedTest ? `Results: ${selectedTest.subject}` : 'Select a test to view results'}
          </h3>
          {selectedTest ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Marks</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Pos</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const studentsInTest = data.students.filter(s => s.classLevel === selectedTest.classLevel && s.section === selectedTest.section);
                      const results = studentsInTest.map(s => {
                        const r = data.testResults.find(tr => tr.testId === selectedTest.id && tr.studentId === s.id);
                        return { student: s, result: r };
                      });
                      
                      // Sort to find positions
                      const sortedResults = [...results].sort((a, b) => (b.result?.obtainedMarks || 0) - (a.result?.obtainedMarks || 0));

                      return results.map(({ student, result }, index) => {
                        const position = sortedResults.findIndex(sr => (sr.result?.obtainedMarks || 0) === (result?.obtainedMarks || 0)) + 1;
                        let posText = position.toString();
                        if (position === 1) posText = '1st';
                        else if (position === 2) posText = '2nd';
                        else if (position === 3) posText = '3rd';

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                              <div className="text-[10px] text-slate-500">Roll: {student.rollNumber}</div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                className="w-20 px-2 py-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                                value={result?.obtainedMarks === undefined ? '' : result.obtainedMarks}
                                onKeyDown={(e) => {
                                  if (e.key === 'Shift') {
                                    e.preventDefault();
                                    const table = (e.target as HTMLElement).closest('table');
                                    if (table) {
                                      const inputs = Array.from(table.querySelectorAll('input[type="number"]'));
                                      const nextInput = inputs[index + 1] as HTMLInputElement;
                                      if (nextInput) nextInput.focus();
                                    }
                                  }
                                }}
                                onChange={e => updateResult(selectedTest.id, student.id, e.target.value === '' ? undefined : Number(e.target.value))}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "text-xs font-bold",
                                position <= 3 ? "text-emerald-600" : "text-slate-400"
                              )}>
                                {posText}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button 
                                  onClick={() => generateStudentResultCard(student, data)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Student PDF"
                                >
                                  <FileText size={16} />
                                </button>
                                <button 
                                  onClick={() => sendWhatsAppResult(student.id, selectedTest)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="WhatsApp Result"
                                >
                                  <MessageSquare size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 gap-3">
              <Trophy size={48} className="opacity-20" />
              <p>Select a test from the left to manage results</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Create New Test</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Class</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.classLevel}
                    onChange={e => setFormData({ ...formData, classLevel: e.target.value as ClassLevel, section: '', subject: '' })}
                  >
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Section</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.section || ''}
                    onChange={e => setFormData({ ...formData, section: e.target.value, subject: '' })}
                  >
                    <option value="">Select Section</option>
                    {availableSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  value={formData.subject || ''}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="">Choose Subject...</option>
                  {availableSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                {availableSubjects.length === 0 && formData.section && (
                  <p className="text-[10px] text-rose-500 mt-1">No subjects added for this section. Add them in Class & Sections tab.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Total Marks</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.totalMarks === undefined ? '' : formData.totalMarks}
                    onChange={e => setFormData({ ...formData, totalMarks: e.target.value === '' ? undefined : Number(e.target.value) })}
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
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={!formData.subject}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
