export interface Checkpoint {
  id: string;
  spd_document_id: string;

  urutan: number;

  jenis: string;

  lokasi: string;

  qr_token: string;

  qr_image: string | null;

  qr_url?: string;

  latitude: number | null;

  longitude: number | null;

  foto_url: string | null;

  jumlah_orang: number | null;

  catatan: string | null;

  waktu_scan: string | null;

  status: string;

  nama: string | null;

  nip: string | null;

  tanda_tangan_url: string | null;

  stempel_url: string | null;

  berita_acara_pdf: string | null;

  created_at: string;

  updated_at: string;
}