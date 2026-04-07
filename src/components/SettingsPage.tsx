import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Key,
  Mail,
  User as UserIcon,
  Lock,
  LayoutGrid,
  Trash2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsPageProps {
  user: User | null;
  isSupabaseConfigured: boolean;
}

const SettingsPage = ({ user, isSupabaseConfigured }: SettingsPageProps) => {
  const [resetEmail, setResetEmail] = useState('');
  const [regForm, setRegForm] = useState({ email: '', name: '', password: '', role: 'user' as User['role'] });
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  const fetchUsers = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setFetchingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Hardcoded users for quick access (same as in App.tsx)
      const hardcodedUsers: User[] = [
        { email: 'admin', id: '1', role: 'admin', name: 'Administrator' },
        { email: 'kepegawaian', id: '2', role: 'KEPEGAWAIAN', name: 'User Kepegawaian' },
        { email: 'BAK', id: '3', role: 'BAK', name: 'User BAK' },
        { email: 'BMN', id: '4', role: 'BMN', name: 'User BMN' },
        { email: 'HTL', id: '5', role: 'HTL', name: 'User HTL' },
        { email: 'REMUNERASI', id: '6', role: 'REMUNERASI', name: 'User Remunerasi' }
      ];

      // Merge and remove duplicates by email
      const allUsers = [...hardcodedUsers];
      if (data) {
        data.forEach((dbUser: User) => {
          if (!allUsers.find(u => u.email === dbUser.email)) {
            allUsers.push(dbUser);
          }
        });
      }
      
      setUsersList(allUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isSupabaseConfigured]);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      toast.error('Fitur pendaftaran dinonaktifkan dalam mode offline/simulasi.');
      return;
    }

    if (regForm.role === 'user') {
      toast.error('Silakan pilih Nama Bagian terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      // Direct insert now that schema is updated
      const { error } = await supabase
        .from('users')
        .insert([{ 
          email: regForm.email, 
          password: regForm.password, 
          role: regForm.role,
          name: regForm.name 
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Email sudah terdaftar. Gunakan email lain.');
        }
        throw error;
      }

      toast.success(`BERHASIL: User ${regForm.name} (${regForm.role}) telah terdaftar`);
      setRegForm({ email: '', name: '', password: '', role: 'user' });
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(`GAGAL MENDAFTAR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Check if it's a hardcoded user (IDs 1-6)
    const hardcodedIds = ['1', '2', '3', '4', '5', '6'];
    if (hardcodedIds.includes(userId)) {
      toast.error(`User ${userName} adalah user sistem bawaan dan tidak dapat dihapus.`);
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus user ${userName}?`)) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`User ${userName} berhasil dihapus`);
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(`Gagal menghapus user: ${err.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      toast.error('Fitur reset password dinonaktifkan dalam mode offline/simulasi.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success('Link reset password telah dikirim ke email Anda');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-xl md:text-4xl font-black text-brand-dark tracking-tight uppercase">PENGATURAN SISTEM</h2>
        <p className="text-xs md:text-base text-slate-500 font-medium mt-1">Kelola pendaftaran user client dan konfigurasi keamanan.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="bg-white p-6 md:p-10 rounded-[3rem] premium-shadow border border-white/50 space-y-8">
          <div className="flex items-center space-x-4 pb-4 border-b border-slate-50">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-brand-success flex items-center justify-center shadow-sm">
              <UserPlus size={20} />
            </div>
            <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">Pendaftaran User Client</h3>
          </div>
          <form onSubmit={handleRegisterUser} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Alamat Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={16} />
                <input 
                  type="email" 
                  required
                  value={regForm.email}
                  onChange={e => setRegForm({...regForm, email: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                  placeholder="email@perusahaan.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Nama User</label>
              <div className="relative group">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={16} />
                <input 
                  type="text" 
                  required
                  value={regForm.name}
                  onChange={e => setRegForm({...regForm, name: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                  placeholder="Nama User"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={16} />
                <input 
                  type="password" 
                  required
                  value={regForm.password}
                  onChange={e => setRegForm({...regForm, password: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Nama Bagian</label>
              <div className="relative group">
                <LayoutGrid className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={16} />
                <select 
                  required
                  value={regForm.role}
                  onChange={e => setRegForm({...regForm, role: e.target.value as User['role']})}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold appearance-none cursor-pointer"
                >
                  <option value="user">Pilih Bagian</option>
                  <option value="BAK">BAK</option>
                  <option value="BMN">BMN</option>
                  <option value="KEPEGAWAIAN">KEPEGAWAIAN</option>
                  <option value="HTL">HTL</option>
                  <option value="REMUNERASI">REMUNERASI</option>
                </select>
              </div>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-dark text-white py-4.5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-2xl shadow-blue-900/20 uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {loading ? 'Mendaftarkan...' : 'Daftarkan User'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[3rem] premium-shadow border border-white/50 space-y-8">
          <div className="flex items-center space-x-4 pb-4 border-b border-slate-50">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
              <Key size={20} />
            </div>
            <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">Reset Password</h3>
          </div>
          <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Lupa password Anda? Masukkan email Anda di bawah ini dan kami akan mengirimkan instruksi untuk mereset password Anda.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Email Pemulihan</label>
                <input 
                  type="email" 
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                  placeholder="email@perusahaan.com"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-100 text-slate-600 py-4.5 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-sm"
              >
                Kirim Link Reset
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* User List Section */}
      <div className="bg-white p-6 md:p-10 rounded-[3rem] premium-shadow border border-white/50 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-50">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
              <Users size={20} />
            </div>
            <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">Daftar User Terdaftar</h3>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            {usersList.length} Total User
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-6 py-2">Nama User</th>
                <th className="px-6 py-2">Email</th>
                <th className="px-6 py-2">Bagian</th>
                <th className="px-6 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {fetchingUsers ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Data...</p>
                    </div>
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 font-medium italic">
                    Belum ada user yang terdaftar.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.id} className="group hover:translate-x-1 transition-transform duration-300">
                    <td className="px-6 py-4 bg-slate-50/50 rounded-l-2xl border-y border-l border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs uppercase">
                          {u.name?.charAt(0) || u.email.charAt(0)}
                        </div>
                        <span className="font-bold text-brand-dark">{u.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                      <span className="text-sm text-slate-500 font-medium">{u.email}</span>
                    </td>
                    <td className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                          u.role === 'admin' ? "bg-brand-dark text-white" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {u.role}
                        </span>
                        {['1', '2', '3', '4', '5', '6'].includes(u.id) && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-500 text-[8px] font-black uppercase tracking-tighter">
                            Sistem
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-slate-50/50 rounded-r-2xl border-y border-r border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors text-right">
                      {u.role !== 'admin' && !['1', '2', '3', '4', '5', '6'].includes(u.id) && (
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Hapus User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
