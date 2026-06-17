import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileScan, Search, MapPin, ArrowRight,
  FileX2, AlertTriangle, Loader2, ClipboardList,
  CalendarRange, ChevronRight,
} from "lucide-react";

interface Document {
  id: number;
  nomor_spd: string;
  pegawai_nama: string;
  pegawai_nip?: string;
  tempat_berangkat: string;
  tempat_tujuan: string;
  tanggal_berangkat?: string;
  tanggal_kembali?: string;
  checkpoint_count?: number;
  status?: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";



function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [query, setQuery]         = useState("");

  useEffect(() => {
    axios.get<Document[]>(`${API_URL}/api/documents`)
      .then((res) => setDocuments(res.data))
      .catch((err) => { console.error(err); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const formatTanggal = (tanggal?: string): string => {
    if (!tanggal) return "-";
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

const filtered = documents.filter((doc) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      doc.nomor_spd?.toLowerCase().includes(q) ||
      doc.pegawai_nama?.toLowerCase().includes(q) ||
      doc.tempat_tujuan?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#B71C1C] via-[#8B0000] to-[#4A0000]">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D32F2F]/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-16 sm:pb-20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
              <FileScan className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/60 text-xs font-medium tracking-widest uppercase">
              Sistem Perjalanan Dinas Digital
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
            Daftar Surat Perjalanan Dinas
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-sm sm:text-base">
            Pantau status verifikasi dan checkpoint perjalanan secara real-time.
          </motion.p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-7 pb-20 relative z-10">

        {/* Toolbar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor SPD, nama pegawai, atau tujuan…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 text-sm text-[#212121] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/25 focus:border-[#D32F2F] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl bg-[#FFEBEE] text-[#B71C1C] font-semibold text-sm whitespace-nowrap flex-shrink-0">
            <ClipboardList className="w-4 h-4" />
            {loading ? "…" : `${filtered.length} SPD`}
          </div>
        </motion.div>

        {/* States */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow p-14 flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-7 h-7 text-[#D32F2F] animate-spin" />
            <p className="text-gray-400 text-sm">Memuat daftar dokumen…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-100 shadow p-14 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#B71C1C]" />
            </div>
            <p className="text-gray-500 text-sm max-w-xs">Gagal memuat dokumen. Periksa koneksi ke server.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow p-14 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <FileX2 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm">
              {query ? "Tidak ada dokumen yang cocok." : "Belum ada SPD yang diunggah."}
            </p>
          </div>
        ) : (

          /* ── LIST ── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            className="bg-white rounded-2xl border border-gray-100 shadow overflow-hidden">

            {filtered.map((doc, index) => {
              const total = doc.checkpoint_count ?? 0;

              return (
                <motion.div key={doc.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * (index % 10) }}>
                  <Link
                    to={`/documents/${doc.id}`}
                    className={`group flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5 hover:bg-[#FFF5F5] active:bg-[#FFEBEE] transition-colors duration-150 ${
                      index < filtered.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    {/* LEFT: info utama */}
                    <div className="flex-1 min-w-0">

                      {/* Baris 1: Nomor */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-[#B71C1C]">
                          {doc.nomor_spd || "—"}
                        </span>
                      </div>

                      {/* Baris 2: Nama */}
                      <p className="text-sm sm:text-[15px] font-semibold text-[#212121] truncate leading-snug mb-1.5">
                        {doc.pegawai_nama || "-"}
                        {doc.pegawai_nip && (
                          <span className="ml-2 font-normal text-xs text-gray-400 font-mono">
                            {doc.pegawai_nip}
                          </span>
                        )}
                      </p>

                      {/* Baris 3: Rute */}
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#D32F2F] flex-shrink-0" />
                        <span className="text-xs text-gray-500 truncate">
                          {doc.tempat_berangkat || "-"}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        <span className="text-xs font-semibold text-[#B71C1C] truncate">
                          {doc.tempat_tujuan || "-"}
                        </span>
                      </div>

                      {/* Baris 4: Tanggal (mobile only) */}
                      <div className="flex items-center gap-1.5 mt-1.5 sm:hidden">
                        <CalendarRange className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-400">
                          {formatTanggal(doc.tanggal_berangkat)} – {formatTanggal(doc.tanggal_kembali)}
                        </span>
                      </div>
                    </div>

                    {/* CENTER: tanggal — desktop */}
                    <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                      <CalendarRange className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formatTanggal(doc.tanggal_berangkat)} – {formatTanggal(doc.tanggal_kembali)}</span>
                    </div>

                    {/* RIGHT: titik + chevron */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-bold text-[#B71C1C] bg-[#FFEBEE] w-8 h-8 rounded-lg flex items-center justify-center">
                          {total}
                        </span>
                        <span className="text-[10px] text-gray-400">titik</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#D32F2F] transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;