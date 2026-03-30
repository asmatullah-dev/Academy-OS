import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Test, TestResult, AppData } from './types';
import { format } from 'date-fns';

function addLogo(doc: jsPDF, data: AppData, y: number = 10) {
  if (data.settings.logo) {
    try {
      doc.addImage(data.settings.logo, 'PNG', 10, y, 30, 30);
    } catch (e) {
      console.error('Failed to add logo to PDF', e);
    }
  }
}

export function generateStudentResultCard(student: Student, data: AppData) {
  const doc = new jsPDF();
  const { settings, tests, testResults } = data;

  addLogo(doc, data);

  // Header
  doc.setFontSize(22);
  doc.text(settings.name, 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Student Progress Report', 105, 30, { align: 'center' });

  // Student Info
  doc.setFontSize(12);
  doc.text(`Name: ${student.name}`, 20, 50);
  doc.text(`Roll No: ${student.rollNumber}`, 20, 57);
  doc.text(`Father's Name: ${student.fatherName}`, 20, 64);
  doc.text(`Class: ${student.classLevel} - ${student.section}`, 20, 71);
  doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, 150, 50);

  // Results Table
  const studentResults = testResults.filter(r => r.studentId === student.id);
  const tableData = studentResults.map(r => {
    const test = tests.find(t => t.id === r.testId);
    return [
      test ? format(new Date(test.date), 'dd/MM/yyyy') : '-',
      test?.subject || 'Unknown',
      r.obtainedMarks,
      test?.totalMarks || 0,
      ((r.obtainedMarks / (test?.totalMarks || 1)) * 100).toFixed(1) + '%'
    ];
  });

  autoTable(doc, {
    startY: 80,
    head: [['Date', 'Subject', 'Obtained', 'Total', 'Percentage']],
    body: tableData,
  });

  // Summary
  const totalObtained = studentResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
  const totalMax = studentResults.reduce((sum, r) => {
    const test = tests.find(t => t.id === r.testId);
    return sum + (test?.totalMarks || 0);
  }, 0);
  const finalPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0';

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text(`Grand Total: ${totalObtained} / ${totalMax}`, 20, finalY);
  doc.text(`Overall Percentage: ${finalPercentage}%`, 20, finalY + 10);

  doc.save(`${student.name}_Result_Card.pdf`);
}

export function generateTestResultSheet(test: Test, data: AppData) {
  const doc = new jsPDF();
  const { settings, students, testResults } = data;

  addLogo(doc, data);

  doc.setFontSize(20);
  doc.text(settings.name, 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Class Result Sheet: ${test.classLevel} - ${test.section}`, 105, 30, { align: 'center' });
  doc.text(`Subject: ${test.subject} | Date: ${format(new Date(test.date), 'dd MMM yyyy')}`, 105, 38, { align: 'center' });

  const currentTestResults = testResults.filter(r => r.testId === test.id);
  
  // Sort results to find positions
  const sortedResults = [...currentTestResults].sort((a, b) => b.obtainedMarks - a.obtainedMarks);
  
  const tableData = currentTestResults.map(r => {
    const student = students.find(s => s.id === r.studentId);
    const position = sortedResults.findIndex(sr => sr.obtainedMarks === r.obtainedMarks) + 1;
    
    let posText = position.toString();
    if (position === 1) posText = '1st';
    if (position === 2) posText = '2nd';
    if (position === 3) posText = '3rd';

    return [
      student?.rollNumber || '-',
      student?.name || 'Unknown',
      r.obtainedMarks,
      test.totalMarks,
      ((r.obtainedMarks / test.totalMarks) * 100).toFixed(1) + '%',
      posText
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [['Roll No', 'Student Name', 'Obtained', 'Total', 'Percentage', 'Position']],
    body: tableData,
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.text[0];
        if (['1st', '2nd', '3rd'].includes(val)) {
          doc.setTextColor(0, 128, 0); // Green
        }
      }
      if (data.section === 'body' && data.column.index === 2) {
        const val = Number(data.cell.text[0]);
        if (val === 0) {
          doc.setTextColor(255, 0, 0); // Red for absent/zero
        }
      }
    }
  });

  doc.save(`Result_${test.classLevel}_${test.subject}_${test.date}.pdf`);
}

export function generateIDCard(student: Student, data: AppData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 55]
  });

  const { settings } = data;

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 85, 55, 'F');
  
  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 85, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(settings.name, 42.5, 6, { align: 'center' });
  doc.setFontSize(7);
  doc.text('STUDENT IDENTITY CARD', 42.5, 10, { align: 'center' });

  // Photo Placeholder or Student Photo
  doc.setDrawColor(200, 200, 200);
  doc.rect(5, 15, 20, 25); // Photo box
  if (student.photo) {
    try {
      doc.addImage(student.photo, 'JPEG', 5, 15, 20, 25);
    } catch (e) {}
  } else {
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text('PHOTO', 15, 28, { align: 'center' });
  }

  // Student Details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  let y = 19;
  doc.text(`Name: ${student.name}`, 28, y);
  doc.text(`Roll No: ${student.rollNumber}`, 28, y + 4);
  doc.text(`Father: ${student.fatherName}`, 28, y + 8);
  doc.text(`Class: ${student.classLevel} - ${student.section}`, 28, y + 12);
  
  // Bio Data (if available)
  doc.setFontSize(6);
  if (student.bloodGroup) doc.text(`Blood: ${student.bloodGroup}`, 28, y + 16);
  if (student.motherLanguage) doc.text(`Lang: ${student.motherLanguage}`, 45, y + 16);
  if (student.age) doc.text(`Age: ${student.age}`, 28, y + 20);
  if (student.weight) doc.text(`Weight: ${student.weight}`, 45, y + 20);

  // Footer
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 45, 85, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`WhatsApp: ${student.whatsappNumber}`, 42.5, 51, { align: 'center' });

  doc.save(`${student.name}_ID_Card.pdf`);
}

export function generateCombinedClassReport(classLevel: string, section: string, data: AppData) {
  const doc = new jsPDF();
  const { settings, students, tests, testResults } = data;

  addLogo(doc, data);

  doc.setFontSize(22);
  doc.text(settings.name, 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text(`Combined Class Result Report`, 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Class: ${classLevel} - ${section}`, 105, 38, { align: 'center' });
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy')}`, 105, 45, { align: 'center' });

  const classStudents = students.filter(s => s.classLevel === classLevel && s.section === section);
  const classTests = tests.filter(t => t.classLevel === classLevel && t.section === section);
  
  // Subjects list from the section definition if available, otherwise from tests
  const sectionDef = data.sections.find(s => s.classLevel === classLevel && s.name === section);
  const allPossibleSubjects = sectionDef?.subjects?.length ? sectionDef.subjects : Array.from(new Set(classTests.map(t => t.subject)));
  
  // Filter out subjects that have NO tests at all in this section
  const subjects = allPossibleSubjects.filter(sub => classTests.some(t => t.subject === sub));
  
  const headers = ['Roll No', 'Student Name', ...subjects, 'Total', '%', 'Pos'];
  
  // Calculate totals first to determine positions
  const studentStats = classStudents.map(student => {
    let studentTotal = 0;
    let maxTotal = 0;
    
    const subjectMarks = subjects.map(subject => {
      const test = [...classTests].reverse().find(t => t.subject === subject);
      if (!test) return '-';
      
      const result = testResults.find(r => r.testId === test.id && r.studentId === student.id);
      if (!result) return 'Abs';
      
      studentTotal += result.obtainedMarks;
      maxTotal += test.totalMarks;
      return `${result.obtainedMarks}`;
    });
    
    return {
      student,
      subjectMarks,
      studentTotal,
      maxTotal,
      percentage: maxTotal > 0 ? (studentTotal / maxTotal) * 100 : 0
    };
  });

  // Sort by percentage to find positions
  const sortedStats = [...studentStats].sort((a, b) => b.percentage - a.percentage);

  const tableData = studentStats.map(stat => {
    const position = sortedStats.findIndex(s => s.percentage === stat.percentage) + 1;
    let posText = position.toString();
    if (position === 1) posText = '1st';
    else if (position === 2) posText = '2nd';
    else if (position === 3) posText = '3rd';

    return [
      stat.student.rollNumber,
      stat.student.name,
      ...stat.subjectMarks,
      `${stat.studentTotal}/${stat.maxTotal}`,
      stat.maxTotal > 0 ? stat.percentage.toFixed(1) + '%' : '-',
      posText
    ];
  });

  autoTable(doc, {
    startY: 55,
    head: [headers],
    body: tableData,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [16, 185, 129] },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === headers.length - 1) {
        const val = data.cell.text[0];
        if (['1st', '2nd', '3rd'].includes(val)) {
          doc.setTextColor(0, 128, 0);
        }
      }
    }
  });

  doc.save(`Combined_Report_${classLevel}_${section}.pdf`);
}

export function generateAwardList(classLevel: string, section: string, data: AppData) {
  const doc = new jsPDF();
  const { settings, students } = data;

  addLogo(doc, data);

  doc.setFontSize(22);
  doc.text(settings.name, 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text(`Award List (Empty Marks Sheet)`, 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Class: ${classLevel} - ${section}`, 105, 38, { align: 'center' });

  const sectionDef = data.sections.find(s => s.classLevel === classLevel && s.name === section);
  const subjects = sectionDef?.subjects || [];
  
  const classStudents = students.filter(s => s.classLevel === classLevel && s.section === section);
  
  const headers = ['Roll No', 'Student Name', ...subjects, 'Signature'];
  
  const tableData = classStudents.map(student => [
    student.rollNumber,
    student.name,
    ...subjects.map(() => ''),
    ''
  ]);

  autoTable(doc, {
    startY: 50,
    head: [headers],
    body: tableData,
    styles: { minCellHeight: 10, fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] }
  });

  doc.save(`Award_List_${classLevel}_${section}.pdf`);
}
