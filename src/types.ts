export type ClassLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  fatherName: string;
  classLevel: ClassLevel;
  section: string;
  fee: number;
  whatsappNumber: string;
  // New Bio Data Fields
  motherLanguage?: string;
  bloodGroup?: string;
  age?: string;
  weight?: string;
  bioData?: string;
  photo?: string; // Base64
  password?: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  name: string;
  classLevel: ClassLevel;
  subjects: string[]; // Subjects specifically for this section
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO string
  studentId: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface Test {
  id: string;
  date: string;
  subject: string; // Changed from subjectId to subject for simplicity in this app
  classLevel: ClassLevel;
  section: string;
  totalMarks: number; // Changed from maxMarks to totalMarks
}

export interface TestResult { // Renamed from Result
  id: string;
  testId: string;
  studentId: string;
  obtainedMarks: number;
}

export interface FeePayment {
  id: string;
  studentId: string;
  month: string;
  amount: number; // Changed from amountPaid
  date: string;
}

export interface Staff { // Renamed from Teacher
  id: string;
  name: string;
  role: string;
  salary: number;
  whatsappNumber: string;
  email?: string;
}

export interface StaffPayment { // Renamed from SalaryPayment
  id: string;
  staffId: string;
  month: string;
  amount: number;
  date: string;
}

export interface TimetableEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  time: string;
  subject: string;
  classLevel: ClassLevel;
  section: string;
}

export interface AcademySettings {
  name: string;
  logo?: string; // Base64 or URL
  lastBackup: string; // ISO string
  adminPhone?: string;
  adminPassword?: string;
}

export interface AppData {
  students: Student[];
  subjects: Subject[];
  sections: Section[];
  attendance: AttendanceRecord[];
  tests: Test[];
  testResults: TestResult[]; // Renamed from results
  feePayments: FeePayment[];
  staff: Staff[]; // Renamed from teachers
  staffPayments: StaffPayment[]; // Renamed from salaryPayments
  timetable: TimetableEntry[];
  settings: AcademySettings;
}
