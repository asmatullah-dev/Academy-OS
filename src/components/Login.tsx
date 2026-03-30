import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { LogIn, GraduationCap, ShieldCheck, UserCircle2, Phone, Mail } from 'lucide-react';
import Logo from './Logo';
import { motion } from 'motion/react';
import { AppData, Student } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ data, authError }: { data: AppData, authError?: string }) {
  const { loginWithGoogle, loginAnonymously, logout } = useAuth();
  const [loginType, setLoginType] = useState<'admin' | 'student'>('admin');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(authError || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleAdminGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError('Google Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminPhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fakeEmail = `${phoneNumber.replace(/[^0-9+]/g, '')}@admin.academyos.app`;
      await signInWithEmailAndPassword(auth, fakeEmail, password);
    } catch (err: any) {
      console.error(err);
      setError('Invalid Phone Number or Password.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Log in anonymously first to get read access to students collection
      await loginAnonymously();
      
      const studentsRef = collection(db, `academies/main_academy/students`);
      const q = query(studentsRef, where("whatsappNumber", "==", phoneNumber));
      const querySnapshot = await getDocs(q);
      
      let foundStudent = null;
      querySnapshot.forEach((doc) => {
        if (doc.data().password === password) {
          foundStudent = { id: doc.id, ...doc.data() } as Student;
        }
      });
      
      if (foundStudent) {
        localStorage.setItem('student_session', JSON.stringify(foundStudent));
        window.location.reload();
      } else {
        await logout();
        setError('Invalid Phone Number or Password');
      }
    } catch (err) {
      console.error(err);
      await logout();
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Logo className="justify-center mb-4" />
          <p className="text-slate-400 text-sm">Professional Academy Management System</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => { setLoginType('admin'); setError(''); }}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${loginType === 'admin' ? 'text-emerald-600 bg-emerald-50/50 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ShieldCheck size={18} />
              Admin Portal
            </button>
            <button 
              onClick={() => { setLoginType('student'); setError(''); }}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${loginType === 'student' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <UserCircle2 size={18} />
              Student Portal
            </button>
          </div>

          <div className="p-8">
            {loginType === 'admin' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Access</h2>
                  <p className="text-slate-500 text-sm">Sign in to manage your academy</p>
                </div>
                
                {error && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAdminPhoneLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                      <input 
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
                      <input 
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 text-white rounded-2xl font-bold transition-all shadow-xl active:scale-[0.98] bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or continue with</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button 
                  type="button"
                  onClick={handleAdminGoogleLogin}
                  disabled={loading}
                  className={`w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-slate-50 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {loading ? 'Authenticating...' : 'Sign in with Google'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleStudentLogin} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Access</h2>
                  <p className="text-slate-500 text-sm">Enter your credentials to view your progress</p>
                </div>
                
                {error && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                    <input 
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 text-white rounded-2xl font-bold transition-all shadow-xl active:scale-[0.98] bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Authenticating...' : 'Access Portal'}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
