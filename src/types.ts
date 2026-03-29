export type Category = 'Keputusan' | 'Peraturan' | 'Kontrak' | 'Tugas';

export interface ArchiveItem {
  id: string;
  nomor: string;
  nama: string;
  tanggal_surat: string;
  kategori: Category;
  file_url: string;
  created_at: string;
  user_id: string;
  target_user_id?: string; // ID of the recipient user
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}
