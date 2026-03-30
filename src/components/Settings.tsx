import { AppData, Student, Staff } from '../types';
import { Save, Upload, Trash2, ShieldAlert, UserPlus, Phone, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { generateId } from '../utils';

import { useAuth } from '../AuthContext';
import { secondaryAuth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

function CreateAdminForm({ updateData, data }: { updateData: (d: Partial<AppData>) => void, data: AppData }) {
  const [loginMethod, setLoginMethod] = useState<'google' | 'phone'>('google');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      let adminId = '';
      
      if (loginMethod === 'phone') {
        const fakeEmail = `${phone.replace(/[^0-9+]/g, '')}@admin.academyos.app`;
        adminId = fakeEmail;
        await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, password);
      } else {
        adminId = email.toLowerCase();
      }

      const newAdmin: Staff = {
        id: adminId,
        name: name,
        role: role,
        salary: 0,
        whatsappNumber: loginMethod === 'phone' ? phone : ''
      };
      
      updateData({ staff: [...(data.staff || []), newAdmin] });
      
      setMessage('Admin account created successfully!');
      setEmail('');
      setPhone('');
      setPassword('');
      setName('');
    } catch (error: any) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <UserPlus size={24} className="text-emerald-500" /> Grant Admin Access
      </h3>
      <p className="text-sm text-slate-500">Authorize a new administrator by adding their Google email address or Phone Number.</p>
      
      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold ${message.includes('Error') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {message}
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <button 
          type="button"
          onClick={() => setLoginMethod('google')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${loginMethod === 'google' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          <Mail size={18} /> Google Email
        </button>
        <button 
          type="button"
          onClick={() => setLoginMethod('phone')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${loginMethod === 'phone' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          <Phone size={18} /> Phone & Password
        </button>
      </div>

      <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Admin Name</label>
          <input 
            type="text" required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={name} onChange={e => setName(e.target.value)}
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Admin Role</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            value={role} onChange={e => setRole(e.target.value as 'admin' | 'superadmin')}
          >
            <option value="admin">Standard Admin (No Settings Access)</option>
            <option value="superadmin">Super Admin (Full Access)</option>
          </select>
        </div>

        {loginMethod === 'google' ? (
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Google Email Address</label>
            <input 
              type="email" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
              <input 
                type="text" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
              <input 
                type="password" required minLength={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
          </>
        )}

        <div className="md:col-span-2 flex justify-end">
          <button 
            type="submit" disabled={loading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? 'Authorizing...' : 'Authorize Admin'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Settings({ data, updateData, importData, studentUser }: { data: AppData, updateData: (d: Partial<AppData>) => void, importData: (d: AppData) => void, studentUser?: Student | null }) {
  const { user } = useAuth();
  const isAdmin = !studentUser;
  const isMasterAdmin = user?.email?.toLowerCase() === 'asmatullah9327@gmail.com'.toLowerCase() || user?.email?.toLowerCase() === 'asmatn628@gmail.com'.toLowerCase();
  const isSuperAdmin = isMasterAdmin || data.staff?.some(s => s.id === user?.email?.toLowerCase() && s.role === 'superadmin');

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <ShieldAlert size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm">Only Super Administrators can access system settings.</p>
      </div>
    );
  }
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (confirm('This will overwrite all current data. Are you sure?')) {
          importData(imported);
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Invalid backup file!');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm('DANGER: This will delete EVERYTHING. This action cannot be undone. Type "DELETE ALL" to confirm.')) {
      const confirmation = prompt('Type "DELETE ALL" to confirm:');
      if (confirmation === 'DELETE ALL') {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateData({ settings: { ...data.settings, logo: event.target?.result as string } });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Save size={24} className="text-emerald-500" /> Academy Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Academy Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={data.settings.name}
                onChange={e => updateData({ settings: { ...data.settings, name: e.target.value } })}
              />
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase">Academy Logo</label>
            <div className="flex items-center gap-4">
              {data.settings.logo ? (
                <div className="relative group">
                  <img src={data.settings.logo} alt="Logo" className="w-20 h-20 object-contain border border-slate-200 rounded-xl" />
                  <button 
                    onClick={() => updateData({ settings: { ...data.settings, logo: undefined } })}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                  No Logo
                </div>
              )}
              <label className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-50 transition-colors text-sm">
                Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Upload size={24} className="text-blue-500" /> Data Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-900">Restore from Backup</h4>
            <p className="text-sm text-slate-500">Upload a previously exported .json file to restore your academy data.</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-100 transition-colors">
              <Upload size={18} /> Choose File
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-900">Manual Backup</h4>
            <p className="text-sm text-slate-500">Download your entire database as a single file for safe keeping.</p>
            <button 
              onClick={() => document.getElementById('backup-btn')?.click()}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
            >
              Export All Data
            </button>
          </div>
        </div>
      </div>

      {isSuperAdmin && <CreateAdminForm updateData={updateData} data={data} />}

      <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100 space-y-6">
        <h3 className="text-xl font-bold text-rose-900 flex items-center gap-2">
          <ShieldAlert size={24} /> Danger Zone
        </h3>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="font-bold text-rose-900">Reset System</h4>
            <p className="text-sm text-rose-700">Wipe all data and start fresh. This is permanent.</p>
          </div>
          <button 
            onClick={handleClearAll}
            className="px-6 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
          >
            <Trash2 size={18} className="inline mr-2" /> Factory Reset
          </button>
        </div>
      </div>
    </div>
  );
}
