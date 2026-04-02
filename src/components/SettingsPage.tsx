import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User } from '../types';

interface SettingsPageProps {
  user: User | null;
  isSupabaseConfigured: boolean;
}

const SettingsPage = ({ user, isSupabaseConfigured }: SettingsPageProps) => {
  const [resetEmail, setResetEmail] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      toast.error('Fitur update password dinonaktifkan dalam mode offline/simulasi.');
      return;
    }
    if (passwords.new !== passwords.confirm) return toast.error('Password tidak cocok');
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (error) toast.error(error.message);
    else {
      toast.success('Password berhasil diperbarui');
      setPasswords({ new: '', confirm: '' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-xl md:text-4xl font-black text-brand-dark tracking-tight uppercase">PENGATURAN SISTEM</h2>
        <p className="text-xs md:text-base text-slate-500 font-medium mt-1">Kelola keamanan akun dan konfigurasi aplikasi.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="bg-white p-6 md:p-10 rounded-[3rem] premium-shadow border border-white/50 space-y-8">
          <div className="flex items-center space-x-4 pb-4 border-b border-slate-50">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">Keamanan Akun</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Password Baru</label>
              <input 
                type="password" 
                required
                value={passwords.new}
                onChange={e => setPasswords({...passwords, new: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Konfirmasi Password</label>
              <input 
                type="password" 
                required
                value={passwords.confirm}
                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                placeholder="Ulangi password baru"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-brand-primary text-white py-4.5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 uppercase tracking-widest text-sm"
            >
              Perbarui Password
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
    </div>
  );
};

export default SettingsPage;
