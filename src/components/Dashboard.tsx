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
    <div className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-h-screen overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">
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

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-black text-brand-dark tracking-tight uppercase">Dashboard</h2>
          <p className="text-[8px] md:text-[10px] text-slate-500 font-medium mt-0.5">Ringkasan aktivitas dan statistik arsip digital.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-md p-1 rounded-lg border border-white/50 shadow-sm">
          <div className="w-6 h-6 rounded-md bg-brand-dark text-white flex items-center justify-center shadow-lg">
            <UserIcon size={12} />
          </div>
          <div className="pr-2">
            <p className="text-[8px] font-black text-brand-dark uppercase tracking-wider">{user?.name || (user?.role === 'admin' ? 'Administrator' : 'Pengguna')}</p>
            <p className="text-[6px] text-slate-400 font-bold uppercase tracking-tighter">{user?.role === 'admin' ? 'Sesi Aktif' : `Bagian: ${user?.role || 'Sesi Aktif'}`}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3">
        {[
          { label: 'Total Arsip', value: userArchives.length, icon: Archive, color: 'from-slate-600 to-slate-400', shadow: 'shadow-slate-500/20', text: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Keputusan', value: userArchives.filter(a => a.kategori === 'Keputusan').length, ...getCategoryConfig('Keputusan') },
          { label: 'Peraturan', value: userArchives.filter(a => a.kategori === 'Peraturan').length, ...getCategoryConfig('Peraturan') },
          { label: 'Telaah', value: userArchives.filter(a => a.kategori === 'Telaah').length, ...getCategoryConfig('Telaah') },
          { label: 'Tugas', value: userArchives.filter(a => a.kategori === 'Tugas').length, ...getCategoryConfig('Tugas') },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-2 md:p-3 rounded-xl md:rounded-2xl premium-shadow border border-white/50 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-500"
          >
            <div className={cn("absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br opacity-[0.05] blur-xl rounded-full transition-all duration-700 group-hover:scale-150", stat.color)} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className={cn(
                "w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center bg-white shadow-md mb-2 transition-all duration-500 group-hover:scale-110",
                stat.shadow
              )}>
                <stat.icon size={14} className={stat.text} />
              </div>
              
              <div className="space-y-0">
                <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                <h3 className="text-lg md:text-xl font-black text-brand-dark tracking-tighter leading-none">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={cn("grid gap-3 md:gap-4", user?.role === 'admin' ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
        <div className="bg-white p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] premium-shadow border border-white/50 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[1.2vw] lg:text-[1.5vw] font-black text-brand-dark uppercase tracking-tight">Distribusi Kategori</h3>
            <div className="flex items-center space-x-2 text-[0.8vw] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
              <span>Real-time</span>
            </div>
          </div>
          <div className="h-[25vh] md:h-[35vh] min-h-[250px]">
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
                  cornerRadius={8}
                  style={{ filter: 'url(#shadow)' }}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#grad-${index % COLORS.length})`} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    padding: '12px 20px',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {chartData.map((entry, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[0.8vw] font-bold text-slate-400 uppercase truncate w-full text-center">{entry.name}</span>
                <span className="text-[1.2vw] font-black text-brand-dark">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="bg-white p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] premium-shadow border border-white/50 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[1.2vw] lg:text-[1.5vw] font-black text-brand-dark uppercase tracking-tight">Distribusi Tujuan</h3>
              <div className="flex items-center space-x-2 text-[0.8vw] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                <span>Real-time</span>
              </div>
            </div>
            <div className="h-[25vh] md:h-[35vh] min-h-[250px]">
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
                    cornerRadius={8}
                    style={{ filter: 'url(#shadow)' }}
                  >
                    {targetChartData.map((_, index) => (
                      <Cell key={`cell-target-${index}`} fill={`url(#tgrad-${index % TARGET_COLORS.length})`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      padding: '12px 20px',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {targetChartData.map((entry, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: TARGET_COLORS[index % TARGET_COLORS.length] }} />
                  <span className="text-[0.8vw] font-bold text-slate-400 uppercase truncate w-full text-center">{entry.name}</span>
                  <span className="text-[1.2vw] font-black text-brand-dark">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-brand-dark p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] shadow-lg shadow-blue-900/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-success/10 blur-[50px] rounded-full -mr-16 -mt-16" />
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-tight">Kapasitas Sistem</h3>
            <span className="text-[8px] font-black text-brand-success tracking-tighter">92% Aman</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="w-[92%] h-full bg-gradient-to-r from-brand-success to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
