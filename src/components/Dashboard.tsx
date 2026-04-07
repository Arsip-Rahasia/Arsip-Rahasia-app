import React, { useMemo } from 'react';
import { 
  Archive, 
  FileText, 
  User as UserIcon,
  Gavel,
  Scale,
  Handshake,
  ClipboardList
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { motion } from 'motion/react';
import { ArchiveItem, User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#001F3F', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const TARGET_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#475569'];

interface DashboardProps {
  user: User | null;
  archives: ArchiveItem[];
}

const Dashboard = ({ user, archives }: DashboardProps) => {
  const userArchives = useMemo(() => {
    if (user?.role === 'admin') return archives;
    
    const roleToId: Record<string, string> = {
      'HTL': '5',
      'KEPEGAWAIAN': '2',
      'BAK': '3',
      'BMN': '4',
      'REMUNERASI': '6'
    };
    const targetId = roleToId[user?.role || ''] || user?.id;
    
    return archives.filter(a => a.target_user_id === targetId);
  }, [archives, user]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    userArchives.forEach(a => {
      counts[a.kategori] = (counts[a.kategori] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [userArchives]);

  const targetChartData = useMemo(() => {
    const targetMap: Record<string, string> = {
      '1': 'HTL',
      '2': 'Kepegawaian',
      '3': 'BAK',
      '4': 'BMN',
      '5': 'HTL',
      '6': 'Remunerasi'
    };
    
    const counts: Record<string, number> = {};
    
    userArchives.forEach(a => {
      const targetName = targetMap[a.target_user_id] || 'Umum';
      counts[targetName] = (counts[targetName] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [userArchives]);

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'Keputusan':
        return { icon: Gavel, color: 'from-purple-600 to-purple-400', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', shadow: 'shadow-purple-500/30' };
      case 'Peraturan':
        return { icon: Scale, color: 'from-emerald-600 to-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', shadow: 'shadow-emerald-500/30' };
      case 'Telaah':
        return { icon: Handshake, color: 'from-amber-600 to-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', shadow: 'shadow-amber-500/30' };
      case 'Tugas':
        return { icon: ClipboardList, color: 'from-blue-600 to-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', shadow: 'shadow-blue-500/30' };
      default:
        return { icon: FileText, color: 'from-slate-600 to-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', shadow: 'shadow-slate-500/30' };
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-h-screen overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">
      {/* SVG Gradients for 3D effect */}
      <svg width="0" height="0" className="absolute">
        <defs>
          {COLORS.map((color, i) => (
            <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          ))}
          {TARGET_COLORS.map((color, i) => (
            <linearGradient key={`tgrad-${i}`} id={`tgrad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          ))}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-brand-dark tracking-tight uppercase">Dashboard</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Ringkasan aktivitas dan statistik arsip digital.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-md p-2 rounded-xl border border-white/50 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center shadow-lg">
            <UserIcon size={18} />
          </div>
          <div className="pr-3">
            <p className="text-xs font-black text-brand-dark uppercase tracking-wider">{user?.name || (user?.role === 'admin' ? 'Administrator' : 'Pengguna')}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{user?.role === 'admin' ? 'Sesi Aktif' : `Bagian: ${user?.role || 'Sesi Aktif'}`}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Total Arsip', value: userArchives.length, icon: Archive, color: 'from-slate-600 to-slate-400', shadow: 'shadow-slate-500/20', text: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Keputusan', value: userArchives.filter(a => a.kategori === 'Keputusan').length, ...getCategoryConfig('Keputusan') },
          { label: 'Peraturan', value: userArchives.filter(a => a.kategori === 'Peraturan').length, ...getCategoryConfig('Peraturan') },
          { label: 'Telaah', value: userArchives.filter(a => a.kategori === 'Telaah').length, ...getCategoryConfig('Telaah') },
          { label: 'Tugas', value: userArchives.filter(a => a.kategori === 'Tugas').length, ...getCategoryConfig('Tugas') },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl premium-shadow border border-white/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500"
          >
            <div className={cn("absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br opacity-[0.05] blur-2xl rounded-full transition-all duration-700 group-hover:scale-150", stat.color)} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center bg-white shadow-lg mb-4 transition-all duration-500 group-hover:scale-110",
                stat.shadow
              )}>
                <stat.icon size={22} className={stat.text} />
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <h3 className="text-2xl md:text-3xl font-black text-brand-dark tracking-tighter leading-none">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={cn("grid gap-4 md:gap-6", user?.role === 'admin' ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
        <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] premium-shadow border border-white/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[1.8vw] lg:text-[2vw] font-black text-brand-dark uppercase tracking-tight">Distribusi Kategori</h3>
            <div className="flex items-center space-x-3 text-[1vw] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-success animate-pulse" />
              <span>Real-time</span>
            </div>
          </div>
          <div className="h-[28vh] md:h-[38vh] min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10}
                  style={{ filter: 'url(#shadow)' }}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#grad-${index % COLORS.length})`} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                    padding: '16px 24px',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            {chartData.map((entry, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[1vw] font-bold text-slate-400 uppercase truncate w-full text-center">{entry.name}</span>
                <span className="text-[1.5vw] font-black text-brand-dark">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] premium-shadow border border-white/50 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1.8vw] lg:text-[2vw] font-black text-brand-dark uppercase tracking-tight">Distribusi Tujuan</h3>
              <div className="flex items-center space-x-3 text-[1vw] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
                <span>Real-time</span>
              </div>
            </div>
            <div className="h-[28vh] md:h-[38vh] min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="85%"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                    style={{ filter: 'url(#shadow)' }}
                  >
                    {targetChartData.map((_, index) => (
                      <Cell key={`cell-target-${index}`} fill={`url(#tgrad-${index % TARGET_COLORS.length})`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                      padding: '16px 24px',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-6">
              {targetChartData.map((entry, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: TARGET_COLORS[index % TARGET_COLORS.length] }} />
                  <span className="text-[1vw] font-bold text-slate-400 uppercase truncate w-full text-center">{entry.name}</span>
                  <span className="text-[1.5vw] font-black text-brand-dark">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-brand-dark p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-lg shadow-blue-900/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-success/10 blur-[60px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-tight">Kapasitas Sistem</h3>
            <span className="text-xs font-black text-brand-success tracking-tighter">92% Aman</span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div className="w-[92%] h-full bg-gradient-to-r from-brand-success to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
