/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle,
  Menu,
  ShieldCheck,
  User as UserIcon,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster } from 'sonner';
import { supabase, isSupabaseConfigured } from './supabase';
import { ArchiveItem, User } from './types';
import { LOGO_URL } from './constants';

// Import extracted components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Storage from './components/Storage';
import ArchiveList from './components/ArchiveList';
import SettingsPage from './components/SettingsPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('garda_is_logged_in') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'storage' | 'archive' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('garda_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist login state
  useEffect(() => {
    localStorage.setItem('garda_is_logged_in', isLoggedIn.toString());
    if (user) {
      localStorage.setItem('garda_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('garda_user');
    }
  }, [isLoggedIn, user]);

  const [searchQuery, setSearchQuery] = useState('');
  const [loginLogoError, setLoginLogoError] = useState(false);

  // Login State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Archives
  const fetchArchives = async () => {
    if (!isSupabaseConfigured || !supabase) {
      // If no Supabase, we rely on the state initialized from localStorage
      const hasInitialized = localStorage.getItem('garda_initialized');
      if (!hasInitialized && archives.length === 0) {
        // Initial mock data only if absolutely empty and never initialized
        const mockData: ArchiveItem[] = [
          { id: '1', nomor: '001/SK/2024', nama: 'Keputusan Direksi A', tanggal_surat: '2024-01-15', kategori: 'Keputusan', file_url: '#', created_at: new Date().toISOString(), user_id: '1', target_user_id: '5' },
          { id: '2', nomor: '002/PER/2024', nama: 'Peraturan Perusahaan B', tanggal_surat: '2024-02-10', kategori: 'Peraturan', file_url: '#', created_at: new Date().toISOString(), user_id: '1', target_user_id: '2' },
          { id: '3', nomor: '003/KONT/2024', nama: 'Telaah Vendor C', tanggal_surat: '2024-03-01', kategori: 'Telaah', file_url: '#', created_at: new Date().toISOString(), user_id: '1', target_user_id: '3' },
          { id: '4', nomor: '004/ST/2024', nama: 'Surat Tugas D', tanggal_surat: '2024-03-04', kategori: 'Tugas', file_url: '#', created_at: new Date().toISOString(), user_id: '1', target_user_id: '4' },
        ];
        setArchives(mockData);
        localStorage.setItem('garda_initialized', 'true');
      }
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('archives')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by target_user_id if not admin
      if (user && user.role !== 'admin') {
        const roleToId: Record<string, string> = {
          'HTL': '5',
          'KEPEGAWAIAN': '2',
          'BAK': '3',
          'BMN': '4',
          'REMUNERASI': '6'
        };
        const targetId = roleToId[user.role] || user.id;
        query = query.eq('target_user_id', targetId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        setArchives(data);
      }
    } catch (err) {
      console.error('Error fetching archives from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchArchives();
    }
  }, [isLoggedIn, user?.id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Hardcoded users for quick access
    const hardcodedUsers = [
      { email: 'admin', password: 'admin', id: '1', role: 'admin', name: 'Administrator' },
      { email: 'kepegawaian', password: 'kepegawaian123', id: '2', role: 'KEPEGAWAIAN', name: 'User Kepegawaian' },
      { email: 'BAK', password: 'BAK123', id: '3', role: 'BAK', name: 'User BAK' },
      { email: 'BMN', password: 'BMN123', id: '4', role: 'BMN', name: 'User BMN' },
      { email: 'HTL', password: 'HTL123', id: '5', role: 'HTL', name: 'User HTL' },
      { email: 'remunerasi', password: 'remunerasi123', id: '6', role: 'REMUNERASI', name: 'User Remunerasi' }
    ];

    const foundUser = hardcodedUsers.find(u => u.email === loginForm.email && u.password === loginForm.password);
    
    if (foundUser) {
      setIsLoggedIn(true);
      setUser({ id: foundUser.id, email: foundUser.email, role: foundUser.role as any, name: foundUser.name });
      return;
    }

    // Real Supabase Auth check if configured
    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', loginForm.email)
        .eq('password', loginForm.password)
        .single();

      if (data) {
        setIsLoggedIn(true);
        setUser({ id: data.id, email: data.email, role: data.role, name: data.name });
      } else {
        setLoginError('Email atau password salah.');
      }
    } catch (err) {
      setLoginError('Koneksi database gagal atau user tidak ditemukan.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-success blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/10 backdrop-blur-2xl p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-2xl space-y-6 md:space-y-10">
            <div className="text-center">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl mb-4 md:mb-6 overflow-hidden group">
                {!loginLogoError ? (
                  <img 
                    src={LOGO_URL} 
                    alt="Logo" 
                    className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-110" 
                    referrerPolicy="no-referrer"
                    onError={() => setLoginLogoError(true)}
                  />
                ) : (
                  <ShieldCheck className="text-brand-dark" size={48} />
                )}
              </div>
              <h1 className="text-5xl md:text-8xl font-zing text-white tracking-tight uppercase leading-none">
                GARDA
              </h1>
              <p className="text-emerald-400 text-[8px] md:text-[11px] font-brandon font-bold uppercase tracking-[0.2em] md:tracking-[0.25em] mt-1 opacity-90 whitespace-nowrap">
                Galeri Arsip Rahasia Digital
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Akses Identitas</label>
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all font-bold"
                    placeholder="Username atau Email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Kata Sandi</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-red-400 bg-red-400/10 p-4 rounded-2xl border border-red-400/20"
                >
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold">{loginError}</span>
                </motion.div>
              )}

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-brand-success to-emerald-500 text-white py-5 rounded-2xl font-black shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
              >
                Masuk ke Sistem
              </button>
            </form>

            <div className="pt-6 text-center border-t border-white/5">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                © 2024 Legal Archive System • v2.0
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:pl-72 transition-all duration-300">
      <Toaster position="top-center" richColors />
      <Sidebar 
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleLogout={handleLogout}
        isSupabaseConfigured={isSupabaseConfigured}
      />
      
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-brand-dark text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xl border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src={LOGO_URL} 
              alt="Logo" 
              className="w-full h-full object-contain p-1" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="font-zing tracking-tight uppercase leading-none text-xl">GARDA</h1>
            <p className="text-[5.5px] text-emerald-400 font-brandon font-bold uppercase tracking-[0.05em] leading-none mt-0.5 opacity-90 whitespace-nowrap">Galeri Arsip Rahasia Digital</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
        >
          <Menu size={22} />
        </button>
      </header>

      <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard user={user} archives={archives} />}
        {activeTab === 'storage' && user?.role === 'admin' && (
          <Storage 
            user={user} 
            fetchArchives={fetchArchives} 
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'archive' && (
          <ArchiveList 
            user={user} 
            archives={archives} 
            setArchives={setArchives}
            fetchArchives={fetchArchives}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        {activeTab === 'settings' && user?.role === 'admin' && (
          <SettingsPage 
            user={user} 
            isSupabaseConfigured={isSupabaseConfigured} 
          />
        )}
      </main>
    </div>
  );
}
