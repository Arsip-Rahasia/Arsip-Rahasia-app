import React, { useState } from 'react';
import { 
  Database, 
  FileText, 
  Upload, 
  Plus,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../supabase';
import { ArchiveItem, Category, User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StorageProps {
  user: User | null;
  fetchArchives: () => Promise<void>;
  setActiveTab: (tab: 'dashboard' | 'storage' | 'archive' | 'settings') => void;
}

const Storage = ({ user, fetchArchives, setActiveTab }: StorageProps) => {
  const [form, setForm] = useState({ nomor: '', nama: '', tanggal: '', kategori: 'Keputusan' as Category, target_user_id: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // List of potential recipients for admin
  const recipients = [
    { id: '5', name: 'HTL' }, // Corrected from '1' to '5'
    { id: '2', name: 'Kepegawaian' },
    { id: '3', name: 'BAK' },
    { id: '4', name: 'BMN' },
    { id: '6', name: 'REMUNERASI' }
  ];

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    multiple: false
  } as any);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Pilih file terlebih dahulu');
    
    setUploading(true);
    try {
      let finalFileUrl = '';
      let success = false;
      
      if (isSupabaseConfigured && supabase) {
        // 1. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `legal-docs/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('archives')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage Upload Error:', uploadError);
          throw new Error(`Gagal Unggah File: ${uploadError.message}. Pastikan bucket "archives" sudah dibuat di Supabase Storage dan RLS Policy sudah diatur ke public.`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('archives')
          .getPublicUrl(filePath);
        
        finalFileUrl = publicUrl;

        // 2. Save Metadata to DB
        const insertData: any = {
          nomor: form.nomor,
          nama: form.nama,
          tanggal_surat: form.tanggal,
          kategori: form.kategori,
          file_url: finalFileUrl,
          user_id: user?.id || '1'
        };

        // Hanya masukkan target_user_id jika ada nilainya
        if (form.target_user_id) {
          insertData.target_user_id = form.target_user_id;
        }

        const { error: dbError } = await supabase
          .from('archives')
          .insert(insertData);

        if (dbError) {
          console.error('Database Insert Error:', dbError);
          if (dbError.message?.includes('target_user_id')) {
            throw new Error(`Kolom 'target_user_id' tidak ditemukan di database. \n\nSOLUSI: Jalankan perintah ini di SQL Editor Supabase:\nALTER TABLE archives ADD COLUMN target_user_id TEXT;`);
          }
          throw new Error(`Gagal Simpan Database: ${dbError.message}`);
        }
        
        success = true;
        await fetchArchives(); // Refresh from DB to ensure sync
      } else {
        throw new Error('Supabase tidak terkonfigurasi. Periksa file .env Anda.');
      }

      if (success) {
        toast.success('BERHASIL: Dokumen telah tersimpan');
        setForm({ nomor: '', nama: '', tanggal: '', kategori: 'Keputusan', target_user_id: '' });
        setFile(null);
        setActiveTab('archive');
      }
    } catch (err: any) {
      console.error('Detailed error:', err);
      toast.error(`KESALAHAN PENYIMPANAN: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-3xl font-black text-brand-dark tracking-tight uppercase">PENYIMPANAN BARU</h2>
          <p className="text-[9px] md:text-base text-slate-500 font-medium">Unggah dokumen hukum baru ke dalam sistem.</p>
          {!isSupabaseConfigured && (
            <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[10px] font-bold text-amber-600 uppercase tracking-widest">
              <AlertCircle size={12} />
              <span>Mode Simulasi (Lokal)</span>
            </div>
          )}
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
                  <option>Telaah</option>
                  <option>Tugas</option>
                </select>
              </div>
            </div>

            {user?.role === 'admin' && (
              <div>
                <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Tujuan Pengiriman</label>
                <select 
                  required
                  value={form.target_user_id}
                  onChange={e => setForm({...form, target_user_id: e.target.value})}
                  className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-brand-primary outline-none transition-all font-bold appearance-none cursor-pointer text-xs md:text-base"
                >
                  <option value="">Pilih Tujuan...</option>
                  {recipients.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}
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

export default Storage;
