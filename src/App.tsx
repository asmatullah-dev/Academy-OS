import { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarCheck, 
  ClipboardList, 
  CreditCard, 
  UserSquare2, 
  Clock, 
  Settings as SettingsIcon,
  LayoutDashboard,
  Menu,
  X,
  Download,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppData } from './hooks/useAppData';
import { cn, downloadJSON } from './utils';
import { differenceInDays } from 'date-fns';

// Modules
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import ClassManagement from './components/ClassManagement';
import AttendanceTracker from './components/AttendanceTracker';
import TestResultSystem from './components/TestResultSystem';
import FeeCollection from './components/FeeCollection';
import TeacherPayroll from './components/TeacherPayroll';
import ClassTimetable from './components/ClassTimetable';
import Settings from './components/Settings';
import Logo from './components/Logo';
import Login from './components/Login';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GraduationCap } from 'lucide-react';
import { Student } from './types';

type Module = 'dashboard' | 'students' | 'classes' | 'attendance' | 'tests' | 'fees' | 'payroll' | 'timetable' | 'settings';

function AppContent() {
  const { data, updateData, importData, permissionDenied } = useAppData();
  const { user, loading, isAdmin, login, loginAnonymously, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [studentUser, setStudentUser] = useState<Student | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (permissionDenied && user && !user.isAnonymous) {
      logout();
      setAuthError('You are not authorized to access this academy. Please contact the administrator.');
    }
  }, [permissionDenied, user, logout]);

  useEffect(() => {
    const initSession = async () => {
      const savedStudent = localStorage.getItem('student_session');
      if (savedStudent && !user) {
        setIsLoggingIn(true);
        try {
          await loginAnonymously();
          setStudentUser(JSON.parse(savedStudent));
          // Don't force redirect, let them see the dashboard
        } catch (err) {
          console.error('Failed to restore student session', err);
          localStorage.removeItem('student_session');
        } finally {
          setIsLoggingIn(false);
        }
      }
    };
    initSession();
  }, [user, loginAnonymously]);

  useEffect(() => {
    if (data.settings.lastBackup) {
      const lastBackup = new Date(data.settings.lastBackup);
      const today = new Date();
      if (differenceInDays(today, lastBackup) >= 7) {
        setShowBackupReminder(true);
      }
    }
  }, [data.settings.lastBackup]);

  if (loading || isLoggingIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-500 font-bold animate-pulse">
            {isLoggingIn ? 'Restoring Student Session...' : 'Initializing Academy OS...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user && !studentUser) {
    return <Login data={data} authError={authError} />;
  }

  const handleLogout = () => {
    if (studentUser) {
      localStorage.removeItem('student_session');
      window.location.reload();
    } else {
      logout();
    }
  };

  const isMasterAdmin = user?.email?.toLowerCase() === 'asmatullah9327@gmail.com'.toLowerCase() || user?.email?.toLowerCase() === 'asmatn628@gmail.com'.toLowerCase();
  const isSuperAdmin = isMasterAdmin || data.staff?.some(s => s.id === user?.email?.toLowerCase() && s.role === 'superadmin');

  const currentRole = studentUser ? 'student' : 'admin';

  // Filter nav items based on user role
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'student'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['admin'] },
    { id: 'classes', label: 'Classes & Sections', icon: GraduationCap, roles: ['admin'] },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'student'] },
    { id: 'tests', label: 'Tests & Results', icon: ClipboardList, roles: ['admin', 'student'] },
    { id: 'fees', label: 'Fees', icon: CreditCard, roles: ['admin', 'student'] },
    { id: 'payroll', label: 'Payroll', icon: UserSquare2, roles: ['admin'] },
    { id: 'timetable', label: 'Timetable', icon: Clock, roles: ['admin', 'student'] },
    ...(isSuperAdmin ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] }] : []),
  ].filter(item => item.roles.includes(currentRole));

  const handleModuleChange = (id: Module) => {
    setActiveModule(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleBackup = () => {
    downloadJSON(data, `academy_os_backup_${new Date().toISOString().split('T')[0]}.json`);
    updateData({
      settings: {
        ...data.settings,
        lastBackup: new Date().toISOString()
      }
    });
    setShowBackupReminder(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 lg:relative",
          isSidebarOpen ? "w-64" : "w-20",
          !isSidebarOpen && "lg:w-20",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <>
              <Logo />
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors ml-auto"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors mx-auto"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleModuleChange(item.id as Module)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all group",
                activeModule === item.id 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(activeModule === item.id ? "text-white" : "group-hover:text-white")} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-slate-400 hover:text-rose-400 hover:bg-rose-400/10",
              !isSidebarOpen && "justify-center"
            )}
            title="Logout"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
          <div className={cn("flex items-center gap-3 text-xs text-slate-500", !isSidebarOpen && "justify-center")}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isSidebarOpen && <span>System Online</span>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {navItems.find(i => i.id === activeModule)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={handleBackup}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Backup</span>
              </button>
            )}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{user?.displayName || studentUser?.name}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{isAdmin ? 'Administrator' : 'Student'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  (user?.displayName || studentUser?.name || 'U').charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'dashboard' && <Dashboard data={data} studentUser={studentUser} />}
              {activeModule === 'students' && <StudentManagement data={data} updateData={updateData} studentUser={studentUser} />}
              {activeModule === 'classes' && <ClassManagement data={data} updateData={updateData} studentUser={studentUser} />}
              {activeModule === 'attendance' && <AttendanceTracker data={data} updateData={updateData} studentUser={studentUser} />}
              {activeModule === 'tests' && <TestResultSystem data={data} updateData={updateData} studentUser={studentUser} />}
              {activeModule === 'fees' && <FeeCollection data={data} updateData={updateData} studentUser={studentUser} />}
              {activeModule === 'payroll' && <TeacherPayroll data={data} updateData={updateData} studentUser={studentUser} />}
              {activeModule === 'timetable' && <ClassTimetable data={data} updateData={updateData} studentUser={studentUser} />}
              {activeModule === 'settings' && <Settings data={data} updateData={updateData} importData={importData} studentUser={studentUser} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Backup Reminder Modal */}
      <AnimatePresence>
        {showBackupReminder && isAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Backup Required</h3>
              <p className="text-slate-600 mb-8">
                It has been more than 7 days since your last backup. Please download your data to ensure its safety.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleBackup}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Download Backup Now
                </button>
                <button 
                  onClick={() => setShowBackupReminder(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition-colors"
                >
                  Remind Me Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
