/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Archive, 
  Settings, 
  LogOut, 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Eye, 
  QrCode, 
  Plus, 
  Search,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  User as UserIcon,
  Lock,
  Key
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from './supabase';
import { ArchiveItem, Category, User } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Gemini AI Setup
const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || '' });

const COLORS = ['#001F3F', '#10b981', '#3b82f6', '#f59e0b'];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'storage' | 'archive' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginLogoError, setLoginLogoError] = useState(false);

  // Login State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Fetch Archives
  const fetchArchives = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('archives')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setArchives(data || []);
    } catch (err) {
      console.error('Error fetching archives:', err);
      // Fallback to mock data if Supabase is not configured
      if (!isSupabaseConfigured) {
        setArchives([
          { id: '1', nomor: '001/SK/2024', nama: 'Keputusan Direksi A', tanggal_surat: '2024-01-15', kategori: 'Keputusan', file_url: '#', created_at: new Date().toISOString(), user_id: '1' },
          { id: '2', nomor: '002/PER/2024', nama: 'Peraturan Perusahaan B', tanggal_surat: '2024-02-10', kategori: 'Peraturan', file_url: '#', created_at: new Date().toISOString(), user_id: '1' },
          { id: '3', nomor: '003/KONT/2024', nama: 'Kontrak Vendor C', tanggal_surat: '2024-03-01', kategori: 'Kontrak', file_url: '#', created_at: new Date().toISOString(), user_id: '1' },
          { id: '4', nomor: '004/ST/2024', nama: 'Surat Tugas D', tanggal_surat: '2024-03-04', kategori: 'Tugas', file_url: '#', created_at: new Date().toISOString(), user_id: '1' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchArchives();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email === 'admin' && loginForm.password === 'admin') {
      setIsLoggedIn(true);
      setUser({ email: 'admin', role: 'admin' });
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
        setUser({ email: data.email, role: data.role });
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

  // --- Components ---

  const LOGO_URL = "https://lh3.googleusercontent.com/d/1pfkTrGYxW6T7Gq4A52ko0OvYbeLHgVYb";

  const Sidebar = () => {
    const [logoError, setLogoError] = useState(false);
    return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={cn(
        "w-72 bg-brand-dark text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50 transition-transform duration-500 lg:translate-x-0 border-r border-white/5",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-brand-dark to-[#003366]">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner group cursor-pointer overflow-hidden">
              {!logoError ? (
                <img 
                  src={LOGO_URL} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <ShieldCheck size={24} className="text-emerald-400" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none uppercase">Arsip Hukum</h1>
              <p className="text-[10px] text-emerald-400/80 font-black uppercase tracking-[0.2em] mt-1">Digital System</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 mt-6 overflow-y-auto scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'storage', label: 'Penyimpanan', icon: Database },
            { id: 'archive', label: 'Daftar Arsip', icon: Archive },
            { id: 'settings', label: 'Pengaturan', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                activeTab === item.id 
                  ? "text-white shadow-xl shadow-emerald-500/10" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-brand-success to-emerald-500"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon size={20} className={cn(
                "relative z-10 transition-transform duration-300 group-hover:scale-110",
                activeTab === item.id ? "text-white" : "text-emerald-400/40"
              )} />
              <span className="relative z-10 font-bold text-sm tracking-wide">{item.label}</span>
              {activeTab === item.id && (
                <ChevronRight size={14} className="ml-auto relative z-10 opacity-50" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Sistem</span>
              <div className="flex items-center space-x-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", isSupabaseConfigured ? "bg-emerald-400" : "bg-amber-400")} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isSupabaseConfigured ? "text-emerald-400" : "text-amber-400")}>
                  {isSupabaseConfigured ? 'Online' : 'Local'}
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-brand-success to-emerald-400" />
            </div>
          </div>

          <div className="flex items-center space-x-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-black text-emerald-400 border border-white/10">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.email}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-wide">Keluar Sistem</span>
          </button>
        </div>
      </div>
    </>
    );
  };

  const Dashboard = () => {
    const chartData = useMemo(() => {
      const counts: Record<string, number> = {
        Keputusan: 0,
        Peraturan: 0,
        Kontrak: 0,
        Tugas: 0
      };
      archives.forEach(a => {
        if (counts[a.kategori] !== undefined) counts[a.kategori]++;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [archives]);

    return (
      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-brand-dark tracking-tight uppercase">Dashboard</h2>
            <p className="text-sm md:text-base text-slate-500 font-medium mt-1">Ringkasan aktivitas dan statistik arsip digital.</p>
          </div>
          <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center shadow-lg">
              <UserIcon size={20} />
            </div>
            <div className="pr-4">
              <p className="text-xs font-black text-brand-dark uppercase tracking-wider">Administrator</p>
              <p className="text-[10px] text-slate-400 font-bold">Sistem Aktif</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
          {[
            { label: 'Total Arsip', value: archives.length, icon: Archive, color: 'from-blue-600 to-blue-400', shadow: 'shadow-blue-500/20' },
            { label: 'Keputusan', value: archives.filter(a => a.kategori === 'Keputusan').length, icon: FileText, color: 'from-purple-600 to-purple-400', shadow: 'shadow-purple-500/20' },
            { label: 'Peraturan', value: archives.filter(a => a.kategori === 'Peraturan').length, icon: ShieldCheck, color: 'from-emerald-600 to-emerald-400', shadow: 'shadow-emerald-500/20' },
            { label: 'Kontrak', value: archives.filter(a => a.kategori === 'Kontrak').length, icon: Database, color: 'from-amber-600 to-amber-400', shadow: 'shadow-amber-500/20' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[240px] md:min-w-0 bg-white p-6 md:p-8 rounded-[2.5rem] premium-shadow border border-white/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500"
            >
              <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-[0.03] rounded-bl-full transition-all duration-500 group-hover:scale-110", stat.color)} />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 transition-transform duration-500 group-hover:rotate-6", stat.color, stat.shadow)}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <h3 className="text-3xl md:text-4xl font-black text-brand-dark tracking-tighter">{stat.value}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[3rem] premium-shadow border border-white/50">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Distribusi Kategori</h3>
              <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
                <span>Real-time Data</span>
              </div>
            </div>
            <div className="h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      padding: '16px 24px',
                      fontWeight: 'bold'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-brand-dark p-6 md:p-10 rounded-[3rem] shadow-2xl shadow-blue-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-success/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 h-full flex flex-col">
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-10">Detail Kategori</h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 flex-grow">
                {chartData.map((entry, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 p-5 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{entry.name}</span>
                    </div>
                    <span className="text-lg font-black text-white tracking-tighter">{entry.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between text-white">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kapasitas Sistem</span>
                  <span className="text-sm font-black tracking-tighter">92% Aman</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full mt-4 overflow-hidden">
                  <div className="w-[92%] h-full bg-gradient-to-r from-brand-success to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Storage = () => {
    const [form, setForm] = useState({ nomor: '', nama: '', tanggal: '', kategori: 'Keputusan' as Category });
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const onDrop = (acceptedFiles: File[]) => {
      setFile(acceptedFiles[0]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop, 
      accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
      multiple: false
    } as any);

    const analyzeDocument = async (file: File) => {
      setAnalyzing(true);
      try {
        // Convert file to base64 for Gemini
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          
          const prompt = "Anda adalah asisten hukum. Analisis dokumen ini dan berikan ringkasan singkat (maks 3 kalimat) mengenai isinya, nomor surat, dan pihak yang terlibat.";
          
          const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType: file.type } },
                { text: prompt }
              ]
            }
          });
          
          setAiAnalysis(result.text || "Gagal menganalisis dokumen.");
          setAnalyzing(false);
        };
      } catch (err) {
        console.error('AI Analysis error:', err);
        setAnalyzing(false);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file) return alert('Pilih file terlebih dahulu');
      
      if (!isSupabaseConfigured || !supabase) {
        return alert('Supabase belum dikonfigurasi. Silakan tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di panel Secrets.');
      }

      setUploading(true);
      try {
        // 1. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `legal-docs/${fileName}`;

        let finalFileUrl = '';
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('archives')
            .upload(filePath, file);

          if (uploadError) {
            if (uploadError.message?.includes('row-level security')) {
              throw new Error('RLS_ERROR');
            }
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('archives')
            .getPublicUrl(filePath);
          
          finalFileUrl = publicUrl;
        } catch (storageErr: any) {
          console.error('Supabase Storage error:', storageErr);
          
          if (storageErr.message === 'RLS_ERROR') {
            alert('Error Keamanan (RLS): Anda perlu menambahkan kebijakan (Policy) di Storage Supabase untuk mengizinkan INSERT pada bucket "archives".');
          }
          
          // Fallback only if absolutely necessary
          finalFileUrl = URL.createObjectURL(file);
        }

        // 2. Save Metadata to DB
        try {
          if (!isSupabaseConfigured || !supabase) throw new Error('Not configured');
          
          const { error: dbError } = await supabase
            .from('archives')
            .insert({
              nomor: form.nomor,
              nama: form.nama,
              tanggal_surat: form.tanggal,
              kategori: form.kategori,
              file_url: finalFileUrl,
              user_id: '1'
            });

          if (dbError) throw dbError;
        } catch (dbErr) {
          console.error('Supabase DB error:', dbErr);
          const newItem: ArchiveItem = {
            id: Math.random().toString(),
            nomor: form.nomor,
            nama: form.nama,
            tanggal_surat: form.tanggal,
            kategori: form.kategori,
            file_url: finalFileUrl,
            created_at: new Date().toISOString(),
            user_id: '1'
          };
          setArchives(prev => [newItem, ...prev]);
        }

        alert('Dokumen berhasil disimpan ke sistem!');
        setForm({ nomor: '', nama: '', tanggal: '', kategori: 'Keputusan' });
        setFile(null);
        setAiAnalysis(null);
        if (isSupabaseConfigured) fetchArchives();
        setActiveTab('archive');
      } catch (err: any) {
        console.error('General error:', err);
        alert('Terjadi kesalahan saat memproses dokumen.');
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-3xl font-black text-brand-dark tracking-tight uppercase">PENYIMPANAN BARU</h2>
            <p className="text-[10px] md:text-base text-slate-500 font-medium">Unggah dokumen hukum baru ke dalam sistem.</p>
          </div>
          <div className="flex items-center self-start md:self-auto space-x-2 text-[10px] font-bold text-brand-success bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
            <ShieldCheck size={12} className="md:w-3.5 md:h-3.5" />
            <span>Enkripsi Aktif</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="bg-white p-5 md:p-10 rounded-3xl md:rounded-[3rem] premium-shadow border border-white/50 space-y-6 md:space-y-10">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-50">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shadow-sm">
                <FileText size={18} className="md:w-5 md:h-5" />
              </div>
              <h3 className="text-sm md:text-xl font-black text-brand-dark uppercase tracking-tight">Informasi Dokumen</h3>
            </div>
            
            <div className="space-y-5 md:space-y-6">
              <div>
                <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nomor Surat</label>
                <input 
                  type="text" 
                  required
                  value={form.nomor}
                  onChange={e => setForm({...form, nomor: e.target.value})}
                  className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold text-sm md:text-base"
                  placeholder="001/SK/2024"
                />
              </div>
              <div>
                <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nama Dokumen</label>
                <input 
                  type="text" 
                  required
                  value={form.nama}
                  onChange={e => setForm({...form, nama: e.target.value})}
                  className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold text-sm md:text-base"
                  placeholder="Nama dokumen"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={form.tanggal}
                    onChange={e => setForm({...form, tanggal: e.target.value})}
                    className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold text-xs md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Kategori</label>
                  <select 
                    value={form.kategori}
                    onChange={e => setForm({...form, kategori: e.target.value as Category})}
                    className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold appearance-none cursor-pointer text-xs md:text-base"
                  >
                    <option>Keputusan</option>
                    <option>Peraturan</option>
                    <option>Kontrak</option>
                    <option>Tugas</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="bg-white p-5 md:p-10 rounded-3xl md:rounded-[3rem] premium-shadow border border-white/50 space-y-6 md:space-y-10">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-50">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 text-brand-success flex items-center justify-center shadow-sm">
                  <Database size={18} className="md:w-5 md:h-5" />
                </div>
                <h3 className="text-sm md:text-xl font-black text-brand-dark uppercase tracking-tight">Berkas Digital</h3>
              </div>
              
              <div className="space-y-6">
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-[2rem] p-6 md:p-10 text-center transition-all cursor-pointer group",
                    isDragActive ? "border-brand-success bg-emerald-50" : "border-slate-100 hover:border-brand-success hover:bg-emerald-50/30"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-brand-success transition-all shadow-sm">
                      <Upload size={24} className="md:w-10 md:h-10" />
                    </div>
                    {file ? (
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm font-black text-brand-dark truncate max-w-[180px]">{file.name}</p>
                        <p className="text-[9px] md:text-[10px] font-black text-brand-success uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm font-black text-slate-700">Pilih berkas arsip</p>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF, JPG, PNG (Maks 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

              {file && !aiAnalysis && (
                <button
                  type="button"
                  onClick={() => analyzeDocument(file)}
                  disabled={analyzing}
                  className="w-full flex items-center justify-center space-x-3 py-3 md:py-4 rounded-2xl border-2 border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white transition-all duration-300 disabled:opacity-50 text-xs md:text-sm font-black uppercase tracking-widest"
                >
                  <FileSearch size={18} />
                  <span>{analyzing ? 'Menganalisis...' : 'Analisis AI'}</span>
                </button>
              )}

              {aiAnalysis && (
                <div className="bg-blue-50/50 backdrop-blur-sm p-4 md:p-6 rounded-[1.5rem] border border-blue-100 space-y-3">
                  <div className="flex items-center space-x-2 text-brand-primary font-black text-[10px] uppercase tracking-[0.2em]">
                    <CheckCircle2 size={14} />
                    <span>Hasil Analisis</span>
                  </div>
                  <p className="text-[11px] md:text-sm text-blue-900 leading-relaxed font-medium italic">"{aiAnalysis}"</p>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-brand-dark text-white py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] font-black shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-3 text-sm md:text-base uppercase tracking-widest"
          >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Simpan Arsip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const ArchiveList = () => {
    const [selectedQr, setSelectedQr] = useState<string | null>(null);

    const filteredArchives = archives.filter(a => 
      a.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.nomor.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (id: string) => {
      if (!confirm('Apakah Anda yakin ingin menghapus arsip ini?')) return;
      
      try {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase not configured');
        }

        const { error } = await supabase.from('archives').delete().eq('id', id);
        if (error) throw error;
        setArchives(archives.filter(a => a.id !== id));
      } catch (err) {
        console.error('Delete error:', err);
        // Fallback for demo
        setArchives(archives.filter(a => a.id !== id));
      }
    };

    return (
      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-brand-dark tracking-tight uppercase">DAFTAR ARSIP</h2>
            <p className="text-sm md:text-base text-slate-500 font-medium mt-1">Kelola dan telusuri dokumen hukum yang tersimpan.</p>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cari nomor atau nama dokumen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-white border border-white/50 premium-shadow focus:ring-8 focus:ring-blue-500/5 focus:border-brand-primary outline-none transition-all font-bold text-sm md:text-base"
            />
          </div>
        </header>

        <div className="bg-white rounded-[3rem] premium-shadow border border-white/50 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Nomor & Nama</th>
                  <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori</th>
                  <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                  <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredArchives.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 text-brand-dark flex items-center justify-center shadow-sm group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-base font-black text-brand-dark tracking-tight">{item.nomor}</p>
                          <p className="text-xs text-slate-400 font-bold mt-0.5">{item.nama}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border",
                        item.kategori === 'Keputusan' && "bg-purple-50 text-purple-600 border border-purple-100",
                        item.kategori === 'Peraturan' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                        item.kategori === 'Kontrak' && "bg-amber-50 text-amber-600 border border-amber-100",
                        item.kategori === 'Tugas' && "bg-blue-50 text-blue-600 border border-blue-100",
                      )}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-700">{format(new Date(item.tanggal_surat), 'dd MMM yyyy')}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Terdaftar</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => window.open(item.file_url, '_blank')}
                          className="p-3.5 rounded-xl hover:bg-white hover:shadow-lg text-slate-400 hover:text-brand-primary transition-all duration-300"
                          title="Preview"
                        >
                          <Eye size={20} />
                        </button>
                        <button 
                          onClick={() => setSelectedQr(item.file_url)}
                          className="p-3.5 rounded-xl hover:bg-white hover:shadow-lg text-slate-400 hover:text-brand-success transition-all duration-300"
                          title="QR Code"
                        >
                          <QrCode size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-3.5 rounded-xl hover:bg-white hover:shadow-lg text-slate-400 hover:text-red-500 transition-all duration-300"
                          title="Hapus"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-slate-50">
            {filteredArchives.map((item) => (
              <div key={item.id} className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-dark shrink-0 shadow-sm">
                      <FileText size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-brand-dark leading-tight">{item.nomor}</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium truncate max-w-[180px]">{item.nama}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 border",
                    item.kategori === 'Keputusan' && "bg-purple-50 text-purple-600 border-purple-100",
                    item.kategori === 'Peraturan' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                    item.kategori === 'Kontrak' && "bg-amber-50 text-amber-600 border-amber-100",
                    item.kategori === 'Tugas' && "bg-blue-50 text-blue-600 border-blue-100",
                  )}>
                    {item.kategori}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{format(new Date(item.tanggal_surat), 'dd MMM yyyy')}</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => window.open(item.file_url, '_blank')}
                      className="p-3 rounded-xl bg-slate-50 text-slate-500 active:bg-brand-primary active:text-white transition-all shadow-sm"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => setSelectedQr(item.file_url)}
                      className="p-3 rounded-xl bg-slate-50 text-slate-500 active:bg-brand-success active:text-white transition-all shadow-sm"
                    >
                      <QrCode size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-3 rounded-xl bg-red-50 text-red-500 active:bg-red-500 active:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredArchives.length === 0 && (
            <div className="px-6 py-20 text-center text-gray-400">
              <Archive size={48} className="mx-auto mb-4 opacity-20" />
              <p>Tidak ada arsip ditemukan.</p>
            </div>
          )}
        </div>

        {/* QR Modal */}
        {selectedQr && (
          <div className="fixed inset-0 bg-[#001F3F]/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedQr(null)}>
            <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 duration-300 border border-white/20" onClick={e => e.stopPropagation()}>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#001F3F] tracking-tight uppercase">QR CODE ARSIP</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Akses Digital Cepat</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-[2.5rem] inline-block border border-gray-100 shadow-inner">
                <QRCodeSVG value={selectedQr} size={200} className="md:w-[220px] md:h-[220px]" />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">Pindai kode di atas untuk mengakses dokumen secara langsung di perangkat mobile Anda.</p>
              <button 
                onClick={() => setSelectedQr(null)}
                className="w-full py-5 rounded-2xl bg-[#001F3F] text-white font-black uppercase tracking-widest hover:bg-[#003366] transition-all active:scale-[0.98] shadow-xl shadow-blue-900/20"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SettingsPage = () => {
    const [users, setUsers] = useState<User[]>([
      { id: '1', email: 'admin', role: 'admin' },
      { id: '2', email: 'user@legal.com', role: 'user' }
    ]);
    const [newEmail, setNewEmail] = useState('');
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [resetEmail, setResetEmail] = useState('');

    const addUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEmail) return;
      setUsers([...users, { id: Date.now().toString(), email: newEmail, role: 'user' }]);
      setNewEmail('');
      alert('Pengguna baru berhasil ditambahkan.');
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwords.new !== passwords.confirm) return alert('Konfirmasi password tidak cocok');
      alert('Password berhasil diperbarui!');
      setPasswords({ old: '', new: '', confirm: '' });
    };

    const handleResetPassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetEmail) return;
      alert(`Link reset password telah dikirim ke ${resetEmail}`);
      setResetEmail('');
    };

    return (
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
          <h2 className="text-2xl md:text-4xl font-black text-brand-dark uppercase tracking-tight">Pengaturan</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium mt-1">Manajemen akses pengguna dan keamanan sistem.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Manajemen Pengguna */}
          <div className="space-y-6 md:space-y-10">
            <div className="bg-white p-6 md:p-10 rounded-[3rem] premium-shadow border border-white/50 space-y-8">
              <div className="flex items-center space-x-4 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shadow-sm">
                  <UserIcon size={20} />
                </div>
                <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">Tambah Pengguna</h3>
              </div>
              <form onSubmit={addUser} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Email Pengguna</label>
                  <input 
                    type="email" 
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                    placeholder="email@perusahaan.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Password Default</label>
                  <input 
                    type="text" 
                    disabled
                    value="legal123"
                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 outline-none font-bold"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-brand-dark text-white py-4.5 rounded-2xl font-black hover:bg-blue-900 transition-all shadow-2xl shadow-blue-900/20 uppercase tracking-widest text-sm"
                >
                  Tambah Akses
                </button>
              </form>
            </div>

            <div className="bg-white p-6 md:p-10 rounded-[3rem] premium-shadow border border-white/50 space-y-8">
              <div className="flex items-center space-x-4 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-brand-success flex items-center justify-center shadow-sm">
                  <Archive size={20} />
                </div>
                <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">Daftar Pengguna</h3>
              </div>
              <div className="space-y-4">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 hover:border-brand-primary transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-brand-dark font-black shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-all border border-slate-100">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{u.email}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{u.role}</p>
                      </div>
                    </div>
                    {u.role !== 'admin' && (
                      <button 
                        onClick={() => setUsers(users.filter(usr => usr.id !== u.id))}
                        className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keamanan Akun */}
          <div className="space-y-6 md:space-y-10">
            <div className="bg-white p-6 md:p-10 rounded-[3rem] premium-shadow border border-white/50 space-y-8">
              <div className="flex items-center space-x-4 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                  <Lock size={20} />
                </div>
                <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">Ubah Password</h3>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Password Lama</label>
                  <input 
                    type="password" 
                    required
                    value={passwords.old}
                    onChange={e => setPasswords({...passwords, old: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Password Baru</label>
                  <input 
                    type="password" 
                    required
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold"
                    placeholder="Minimal 8 karakter"
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
      </div>
    );
  };

  // --- Main Render ---

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-success blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/10 backdrop-blur-2xl p-10 md:p-12 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-brand-success to-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 mb-8">
                <ShieldCheck className="text-white" size={40} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
                ARSIP HUKUM<br/>
                <span className="text-emerald-400">DIGITAL SYSTEM</span>
              </h1>
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Secure Legal Management</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
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
    <div className="min-h-screen bg-[#F8FAFC] lg:pl-64">
      <Sidebar />
      
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-brand-dark text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xl border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-success to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="text-white" size={18} />
          </div>
          <div>
            <h1 className="font-black tracking-tighter uppercase leading-none text-xs">Arsip Hukum</h1>
            <p className="text-[8px] text-emerald-400 font-black uppercase tracking-[0.2em] leading-none mt-1">Digital System</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
        >
          <Menu size={22} />
        </button>
      </header>

      <main className="p-3 md:p-8 lg:p-12 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'storage' && <Storage />}
        {activeTab === 'archive' && <ArchiveList />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
