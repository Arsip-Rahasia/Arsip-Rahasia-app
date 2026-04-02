import React, { useState } from 'react';
import { 
  Archive, 
  FileText, 
  Search,
  Database,
  Eye,
  Download,
  Trash2,
  QrCode,
  Gavel,
  Scale,
  Handshake,
  ClipboardList,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../supabase';
import { getFile } from '../db';
import { ArchiveItem, User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ArchiveListProps {
  user: User | null;
  archives: ArchiveItem[];
  setArchives: React.Dispatch<React.SetStateAction<ArchiveItem[]>>;
  fetchArchives: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ArchiveList = ({ 
  user, 
  archives, 
  setArchives, 
  fetchArchives, 
  searchQuery, 
  setSearchQuery, 
  loading, 
  setLoading 
}: ArchiveListProps) => {
  const [selectedQr, setSelectedQr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredArchives = archives.filter(a => {
    const matchesSearch = a.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.nomor.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (user?.role === 'admin') return matchesSearch;
    
    // Map role to target_user_id
    const roleToId: Record<string, string> = {
      'HTL': '5', // Corrected from '1' to '5'
      'KEPEGAWAIAN': '2',
      'BAK': '3',
      'BMN': '4',
      'REMUNERASI': '6'
    };
    const targetId = roleToId[user?.role || ''] || user?.id;
    
    // Non-admin only sees files where they are the target
    return matchesSearch && a.target_user_id === targetId;
  });

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'Keputusan':
        return { icon: Gavel, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };
      case 'Peraturan':
        return { icon: Scale, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
      case 'Telaah':
        return { icon: Handshake, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
      case 'Tugas':
        return { icon: ClipboardList, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
      default:
        return { icon: FileText, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error('Fitur hapus dinonaktifkan dalam mode offline/simulasi.');
      return;
    }

    setLoading(true);
    try {
      const itemToDelete = archives.find(a => a.id === id);
      
      // 1. Delete from Supabase Database
      let query = supabase.from('archives').delete().eq('id', id);
      if (user && user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { error: dbError } = await query;
      if (dbError) throw dbError;

      // 2. Delete from Supabase Storage if possible
      if (itemToDelete?.file_url && !itemToDelete.file_url.startsWith('local://')) {
        try {
          const urlParts = itemToDelete.file_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from('archives').remove([`legal-docs/${fileName}`]);
        } catch (storageErr) {
          console.warn('Could not delete file from storage:', storageErr);
        }
      }
      
      setArchives(prev => prev.filter(a => a.id !== id));
      setDeletingId(null);
      toast.success('Arsip berhasil dihapus');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Gagal menghapus arsip dari database.');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (url: string) => {
    if (url.startsWith('local://')) {
      const id = url.replace('local://', '');
      const blob = await getFile(id);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        toast.error('File tidak ditemukan di penyimpanan lokal.');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-xl md:text-4xl font-black text-brand-dark tracking-tight uppercase">
            {user?.role === 'admin' ? 'DAFTAR ARSIP' : 'PESAN MASUK (INBOX)'}
          </h2>
          <p className="text-xs md:text-base text-slate-500 font-medium mt-1">
            {user?.role === 'admin' ? 'Kelola dan telusuri dokumen hukum yang tersimpan.' : 'Lihat dokumen yang dikirimkan kepada Anda.'}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <button 
            onClick={() => fetchArchives()}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-brand-dark font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            <Database size={16} />
            <span>Refresh</span>
          </button>
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
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Memuat Data...</p>
        </div>
      ) : filteredArchives.length === 0 ? (
        <div className="bg-white p-12 md:p-20 rounded-[2rem] md:rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-50 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center text-slate-300">
            <Archive size={48} className="md:w-16 md:h-16" />
          </div>
          <div>
            <h3 className="text-lg md:text-2xl font-black text-brand-dark uppercase tracking-tight">Tidak Ada Dokumen</h3>
            <p className="text-xs md:text-base text-slate-400 font-medium mt-2">
              {searchQuery ? 'Tidak ada dokumen yang sesuai dengan pencarian Anda.' : 'Belum ada dokumen yang tersimpan di database.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] premium-shadow border border-white/50 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Nomor & Nama</th>
                  <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori</th>
                  <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                  {user?.role === 'admin' && (
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Tujuan</th>
                  )}
                  <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredArchives.map((item) => {
                  const config = getCategoryConfig(item.kategori);
                  const Icon = config.icon;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center space-x-5">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", config.bg, config.text)}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.nomor}</p>
                            <p className="text-sm font-black text-brand-dark group-hover:text-brand-primary transition-colors">{item.nama}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border", config.bg, config.text, config.border)}>
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <p className="text-xs font-bold text-slate-600">{item.tanggal_surat}</p>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-10 py-6">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                            {item.target_user_id === '1' ? 'ADMIN' : 
                             item.target_user_id === '2' ? 'KEPEGAWAIAN' : 
                             item.target_user_id === '3' ? 'BAK' : 
                             item.target_user_id === '4' ? 'BMN' : 
                             item.target_user_id === '5' ? 'HTL' :
                             item.target_user_id === '6' ? 'REMUNERASI' : 'UMUM'}
                          </span>
                        </td>
                      )}
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => setSelectedQr(item.file_url)}
                            className="p-2.5 bg-brand-primary/5 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                            title="QR Code"
                          >
                            <QrCode size={16} />
                          </button>
                          <button 
                            onClick={() => handleView(item.file_url)}
                            className="p-2.5 bg-blue-50 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                            title="Lihat Dokumen"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="p-2.5 bg-emerald-50 text-brand-success rounded-xl hover:bg-brand-success hover:text-white transition-all shadow-sm"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-slate-50">
            {filteredArchives.map((item) => {
              const config = getCategoryConfig(item.kategori);
              const Icon = config.icon;
              return (
                <div key={item.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm", config.bg, config.text)}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.nomor}</p>
                        <p className="text-xs font-black text-brand-dark">{item.nama}</p>
                      </div>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", config.bg, config.text, config.border)}>
                      {item.kategori}
                    </span>
                  </div>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[10px] font-bold text-slate-500">{item.tanggal_surat}</p>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setSelectedQr(item.file_url)}
                          className="p-2 bg-brand-primary/5 text-brand-primary rounded-lg"
                        >
                          <QrCode size={14} />
                        </button>
                        <button 
                          onClick={() => handleView(item.file_url)}
                        className="p-2 bg-blue-50 text-brand-primary rounded-lg"
                      >
                        <Eye size={14} />
                      </button>
                      {user?.role === 'admin' && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedQr(null)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                <QrCode size={40} className="text-brand-primary" />
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">QR Code Dokumen</h3>
                <p className="text-slate-500 text-sm font-medium mt-2">Scan untuk mengakses file secara langsung melalui perangkat mobile.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-center border border-slate-100">
                <QRCodeSVG 
                  value={selectedQr} 
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="rounded-lg"
                />
              </div>

              <button 
                onClick={() => setSelectedQr(null)}
                className="w-full py-4 bg-brand-dark text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveList;
