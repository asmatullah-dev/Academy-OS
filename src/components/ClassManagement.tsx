import { useState } from 'react';
import { AppData, Section, ClassLevel, Student } from '../types';
import { CLASSES } from '../constants';
import { Plus, Trash2, Users, Settings, BookOpen, Edit2, FileText } from 'lucide-react';
import { generateId } from '../utils';
import { generateAwardList } from '../reports';
import React from 'react';

export default function ClassManagement({ data, updateData, studentUser }: { data: AppData, updateData: (d: Partial<AppData>) => void, studentUser?: Student | null }) {
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(studentUser?.classLevel || '1');
  const [newSection, setNewSection] = useState('');
  const [editingSection, setEditingSection] = useState<{id: string, name: string} | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newSubject, setNewSubject] = useState<{sectionId: string, name: string} | null>(null);

  const isAdmin = !studentUser;

  const handleAddSection = () => {
    if (!isAdmin || !newSection.trim()) return;
    const section: Section = {
      id: generateId(),
      name: newSection.trim(),
      classLevel: selectedClass,
      subjects: []
    };
    updateData({ sections: [...data.sections, section] });
    setNewSection('');
  };

  const handleRenameSection = () => {
    if (!editingSection || !editingSection.name.trim()) return;
    
    const oldSection = data.sections.find(s => s.id === editingSection.id);
    if (!oldSection) return;

    const updatedStudents = data.students.map(student => {
      if (student.classLevel === oldSection.classLevel && student.section === oldSection.name) {
        return { ...student, section: editingSection.name.trim() };
      }
      return student;
    });

    const updatedTests = data.tests.map(test => {
      if (test.classLevel === oldSection.classLevel && test.section === oldSection.name) {
        return { ...test, section: editingSection.name.trim() };
      }
      return test;
    });

    const updatedSections = data.sections.map(s => 
      s.id === editingSection.id ? { ...s, name: editingSection.name.trim() } : s
    );

    updateData({ 
      sections: updatedSections, 
      students: updatedStudents,
      tests: updatedTests
    });
    setEditingSection(null);
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('Delete this section? All students in this section will remain but their section name will be unassigned.')) {
      updateData({ sections: data.sections.filter(s => s.id !== id) });
    }
  };

  const handleAddSubject = (sectionId: string) => {
    if (!newSubject || !newSubject.name.trim()) return;
    const updatedSections = data.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, subjects: [...(s.subjects || []), newSubject.name.trim()] };
      }
      return s;
    });
    updateData({ sections: updatedSections });
    setNewSubject(null);
  };

  const handleDeleteSubject = (sectionId: string, subjectName: string) => {
    const updatedSections = data.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, subjects: (s.subjects || []).filter(sub => sub !== subjectName) };
      }
      return s;
    });
    updateData({ sections: updatedSections });
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const updatedStudents = data.students.map(s => s.id === editingStudent.id ? editingStudent : s);
    updateData({ students: updatedStudents });
    setEditingStudent(null);
  };

  const classSections = data.sections.filter(s => s.classLevel === selectedClass);

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Settings size={24} className="text-emerald-500" /> Manage Sections
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Class</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value as ClassLevel)}
                >
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New Section Name (e.g. A, Blue)"
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={newSection}
                  onChange={e => setNewSection(e.target.value)}
                />
                <button 
                  onClick={handleAddSection}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6">
              <h4 className="font-bold text-slate-900 mb-4">Sections for Class {selectedClass}</h4>
              <div className="space-y-2">
                {classSections.map(s => (
                  <div key={s.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    {editingSection?.id === s.id ? (
                      <div className="flex gap-2 w-full">
                        <input 
                          type="text"
                          className="flex-1 px-2 py-1 border border-slate-200 rounded-lg outline-none"
                          value={editingSection.name}
                          onChange={e => setEditingSection({ ...editingSection, name: e.target.value })}
                        />
                        <button onClick={handleRenameSection} className="text-emerald-500 font-bold">Save</button>
                        <button onClick={() => setEditingSection(null)} className="text-slate-400">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-slate-700">Section {s.name}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setEditingSection({ id: s.id, name: s.name })}
                            className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Rename"
                          >
                            <Settings size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSection(s.id)}
                            className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {classSections.length === 0 && (
                  <p className="text-sm text-slate-400 italic text-center py-4">No sections added for this class</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Class {studentUser?.classLevel} Details</h3>
          <p className="text-slate-500">Overview of your class and sections.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {classSections
          .filter(s => isAdmin || s.name === studentUser?.section)
          .map(section => {
            const students = data.students.filter(s => s.classLevel === selectedClass && s.section === section.name);
            return (
              <div key={section.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Section {section.name}</h4>
                    <p className="text-xs text-slate-500">Class {selectedClass}</p>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <button 
                        onClick={() => generateAwardList(selectedClass, section.name, data)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        <FileText size={14} /> Award List
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                      <Users size={14} /> {students.length}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <BookOpen size={14} /> Subjects
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {(section.subjects || []).map(sub => (
                        <span key={sub} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                          {sub}
                          {isAdmin && (
                            <button onClick={() => handleDeleteSubject(section.id, sub)} className="text-slate-400 hover:text-rose-500">
                              <Plus size={12} className="rotate-45" />
                            </button>
                          )}
                        </span>
                      ))}
                      {isAdmin && (
                        newSubject?.sectionId === section.id ? (
                          <div className="flex gap-1">
                            <input 
                              autoFocus
                              type="text"
                              className="px-2 py-1 border border-slate-200 rounded-md text-[10px] outline-none"
                              placeholder="Subject name"
                              value={newSubject.name}
                              onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && handleAddSubject(section.id)}
                            />
                            <button onClick={() => handleAddSubject(section.id)} className="text-emerald-500 text-[10px] font-bold">Add</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setNewSubject({ sectionId: section.id, name: '' })}
                            className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-slate-300 text-slate-400 rounded-md text-[10px] hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                          >
                            <Plus size={12} /> Add Subject
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Users size={14} /> {isAdmin ? 'Students' : 'Classmates'}
                    </h5>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                      {students.map(student => (
                        <div key={student.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg group">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{student.name}</span>
                            <span className="text-[10px] text-slate-400">Roll: {student.rollNumber}</span>
                          </div>
                          {isAdmin && (
                            <button 
                              onClick={() => setEditingStudent(student)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {students.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">No students assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {editingStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Edit Student</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleUpdateStudent} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                <input 
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Roll Number</label>
                  <input 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={editingStudent.rollNumber}
                    onChange={e => setEditingStudent({ ...editingStudent, rollNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp</label>
                  <input 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={editingStudent.whatsappNumber}
                    onChange={e => setEditingStudent({ ...editingStudent, whatsappNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
