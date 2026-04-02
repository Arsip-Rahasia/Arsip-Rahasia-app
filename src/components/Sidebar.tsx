import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Archive, 
  Settings, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from '../types';
import { LOGO_URL } from '../constants';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  user: User | null;
  activeTab: 'dashboard' | 'storage' | 'archive' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'storage' | 'archive' | 'settings') => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
  isSupabaseConfigured: boolean;
}

const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleLogout,
  isSupabaseConfigured,
}: SidebarProps) => {
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, target: 'dashboard' as const },
    { label: 'Penyimpanan', icon: Database, target: 'storage' as const, adminOnly: true },
    { label: 'Daftar Arsip', icon: Archive, target: 'archive' as const },
    { label: 'Pengaturan', icon: Settings, target: 'settings' as const, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <>
      <aside className={cn(
        "fixed top-0 left-0 z-40 w-64 h-screen transition-transform",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:w-72 bg-gradient-to-br from-brand-dark to-blue-950 border-r border-white/5 shadow-2xl"
      )}>
        <div className="h-full px-4 py-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center space-x-3 mb-12 px-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src={LOGO_URL} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-1" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-zing tracking-tight uppercase leading-none text-xl text-white">GARDA</h1>
                <p className="text-[5.5px] text-emerald-400 font-brandon font-bold uppercase tracking-[0.05em] leading-none mt-0.5 opacity-90 whitespace-nowrap">Galeri Arsip Rahasia Digital</p>
              </div>
            </div>

            <ul className="space-y-2 font-medium">
              {filteredMenuItems.map((item) => (
                <li key={item.target}>
                  <button 
                    onClick={() => {
                      setActiveTab(item.target);
                      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full p-4 rounded-2xl group transition-all duration-300",
                      activeTab === item.target
                        ? "bg-gradient-to-br from-brand-success to-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon 
                      size={20} 
                      className={cn(
                        "transition-colors",
                        activeTab === item.target ? "text-white" : "text-brand-success group-hover:text-white"
                      )}
                    />
                    <span className="ml-4 font-black uppercase tracking-widest text-[10px]">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            {isSupabaseConfigured && user && (
              <button 
                onClick={() => {
                  handleLogout();
                  if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full p-4 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 group"
              >
                <LogOut size={20} className="text-red-400/60 group-hover:text-red-300" />
                <span className="ml-4 font-black uppercase tracking-widest text-[10px]">Keluar</span>
              </button>
            )}
            
            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-brand-success/20 text-brand-success flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Sistem Status</p>
                  <p className="text-[9px] font-black text-brand-success uppercase tracking-tighter">Terlindungi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 bg-brand-dark/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
