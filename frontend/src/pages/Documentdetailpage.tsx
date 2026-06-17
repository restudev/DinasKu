import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./Documentdetailpage.css";

interface Document {
  id: number;
  nomor_spd: string;
  pegawai_nama: string;
  pegawai_nip?: string;
  tempat_berangkat: string;
  tempat_tujuan: string;
  tanggal_berangkat?: string;
  tanggal_kembali?: string;
  status?: string;
  checkpoint_count?: number;
  file_url?: string;
}

interface Checkpoint {
  id: number;
  urutan: number;
  jenis: string;
  lokasi: string;
  lokasi_tujuan?: string;
  status: string;
  nama?: string;
  waktu_scan?: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const JENIS_LABEL: Record<string, string> = {
  berangkat: "Berangkat",
  tiba: "Tiba",
  berangkat_pulang: "Berangkat Pulang",
  tiba_kembali: "Tiba Kembali",
};

const JENIS_DESC: Record<string, string> = {
  berangkat: "Keberangkatan dari tempat asal",
  tiba: "Kedatangan di tempat tujuan",
  berangkat_pulang: "Keberangkatan kembali menuju asal",
  tiba_kembali: "Kedatangan kembali di tempat kedudukan",
};

/* ── Icon helpers ── */

function IconPlane({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l2-2 6.5-1.5L20 5c1-1 2.5.5 1.5 1.5l-8.5 8.5L11.5 21 9 19l-1-3-3-1z" />
      <path d="M14 7l3 3" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconFlag({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22V4" />
      <path d="M4 4h13l-2 4 2 4H4" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function IconCalendar({ className, checked }: { className?: string; checked?: boolean }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      {checked && <path d="M9 15l1.8 1.8L15 13" />}
    </svg>
  );
}

function IconFile({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function IconExternal({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function jenisIcon(jenis: string) {
  switch (jenis) {
    case "berangkat":
    case "berangkat_pulang":
      return <IconPlane />;
    case "tiba":
      return <IconPin />;
    case "tiba_kembali":
      return <IconFlag />;
    default:
      return <IconPin />;
  }
}

function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, cpRes] = await Promise.all([
          axios.get<Document>(`${API_URL}/api/documents/${id}`),
          axios.get<Checkpoint[]>(`${API_URL}/api/documents/${id}/checkpoints`),
        ]);
        setDocument(docRes.data);
        setCheckpoints(cpRes.data);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const formatTime = (d?: string) => {
    if (!d) return null;
    return new Date(d).toLocaleTimeString("id-ID", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDateShort = (d?: string) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  const statusLabel = (s?: string) => {
    switch (s) {
      case "completed":  return "Selesai";
      case "in_progress": return "Berjalan";
      case "uploaded":   return "Terunggah";
      default:           return s ?? "Belum diproses";
    }
  };

  const statusClass = (s?: string) => {
    switch (s) {
      case "completed":   return "dd-chip dd-chip--done";
      case "in_progress": return "dd-chip dd-chip--progress";
      case "uploaded":    return "dd-chip dd-chip--uploaded";
      default:            return "dd-chip dd-chip--idle";
    }
  };

  const done  = checkpoints.filter((c) => c.status === "completed").length;
  const total = checkpoints.length || document?.checkpoint_count || 0;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="dd-page">
        <div className="dd-shell">
          <div className="dd-center">
            <div className="dd-center-icon dd-center-icon--loading">
              <svg className="dd-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              </svg>
            </div>
            <p>Memuat berkas SPD…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !document) {
    return (
      <div className="dd-page">
        <div className="dd-shell">
          <div className="dd-center">
            <div className="dd-center-icon dd-center-icon--error">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p>Dokumen tidak ditemukan atau gagal dimuat.</p>
            <Link to="/documents" className="dd-btn dd-btn--ghost">Kembali ke daftar</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dd-page">
      <div className="dd-shell">

        {/* Back */}
        <Link to="/documents" className="dd-back">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Daftar SPD
        </Link>

        {/* Header (Ticket) */}
        <div className="dd-header">
          <div className="dd-header-banner">
            <div className="dd-header-banner-top">
              <div>
                <div className="dd-eyebrow">Surat Perjalanan Dinas</div>
                <div className="dd-doc-id">{document.nomor_spd || "Tanpa nomor"}</div>
              </div>
              <span className={statusClass(document.status)}>
                <span className="dd-chip-dot" />
                {statusLabel(document.status)}
              </span>
            </div>

            <div className="dd-route">
              <div className="dd-route-place">
                <span className="dd-route-label">Asal</span>
                <span className="dd-route-name">{document.tempat_berangkat || "—"}</span>
              </div>
              <div className="dd-route-line">
                <span className="dd-route-track" />
                <span className="dd-route-icon">
                  <IconPlane />
                </span>
                <span className="dd-route-track" />
              </div>
              <div className="dd-route-place dd-route-place--end">
                <span className="dd-route-label">Tujuan</span>
                <span className="dd-route-name">{document.tempat_tujuan || "—"}</span>
              </div>
            </div>
          </div>

          <div className="dd-header-tear">
            <div className="dd-header-perforation" />
          </div>

          <div className="dd-infobar">
            <div className="dd-info-item">
              <span className="dd-info-icon"><IconUser /></span>
              <div className="dd-info-body">
                <span className="dd-info-label">Pegawai</span>
                <span className="dd-info-val">{document.pegawai_nama || "—"}</span>
                {document.pegawai_nip && (
                  <span className="dd-info-sub">NIP. {document.pegawai_nip}</span>
                )}
              </div>
            </div>

            <div className="dd-info-item">
              <span className="dd-info-icon"><IconCalendar /></span>
              <div className="dd-info-body">
                <span className="dd-info-label">Berangkat</span>
                <span className="dd-info-val">{formatDate(document.tanggal_berangkat)}</span>
                {formatTime(document.tanggal_berangkat) && (
                  <span className="dd-info-sub">{formatTime(document.tanggal_berangkat)} WIB</span>
                )}
              </div>
            </div>

            <div className="dd-info-item">
              <span className="dd-info-icon"><IconCalendar checked /></span>
              <div className="dd-info-body">
                <span className="dd-info-label">Kembali</span>
                <span className="dd-info-val">{formatDate(document.tanggal_kembali)}</span>
                {formatTime(document.tanggal_kembali) && (
                  <span className="dd-info-sub">{formatTime(document.tanggal_kembali)} WIB</span>
                )}
              </div>
            </div>

            <div className="dd-info-item">
              <span className="dd-info-icon"><IconFile /></span>
              <div className="dd-info-body">
                <span className="dd-info-label">Dokumen</span>
                {document.file_url ? (
                  <a href={document.file_url} target="_blank" rel="noreferrer" className="dd-info-link">
                    Lihat SPD <IconExternal />
                  </a>
                ) : (
                  <span className="dd-info-val">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Itinerary Checkpoint (full width) */}
        <div className="dd-section">
          <div className="dd-section-head">
            <div>
              <h2 className="dd-section-title">Checkpoint</h2>
              <p className="dd-section-sub">Setiap titik harus diverifikasi sesuai urutan perjalanan.</p>
            </div>
            <div className="dd-progress">
              <div className="dd-progress-track">
                <div className="dd-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="dd-progress-label">{done}/{total} titik selesai</span>
            </div>
          </div>

          {checkpoints.length === 0 ? (
            <div className="dd-empty">
              <div className="dd-empty-icon">
                <IconClock />
              </div>
              <p>Belum ada checkpoint untuk dokumen ini.</p>
            </div>
          ) : (
            <div className="dd-itinerary">
              {checkpoints.map((cp) => {
                const isDone = cp.status === "completed";
                return (
                  <div className="dd-stop" key={cp.id}>
                    <div className="dd-stop-rail">
                      <div className={`dd-stop-marker ${isDone ? "dd-stop-marker--done" : "dd-stop-marker--pending"}`}>
                        {isDone ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span>{cp.urutan}</span>
                        )}
                      </div>
                      <div className={`dd-stop-connector ${isDone ? "dd-stop-connector--done" : ""}`} />
                    </div>

                    <Link to={`/checkpoints/${cp.id}`} className="dd-stop-card">
                      <div className="dd-stop-main">
                        <span className="dd-stop-icon">{jenisIcon(cp.jenis)}</span>
                        <div className="dd-stop-info">
                          <p className="dd-stop-location">{JENIS_LABEL[cp.jenis] ?? cp.jenis}</p>
                          <p className="dd-stop-desc">{JENIS_DESC[cp.jenis] ?? "Titik verifikasi perjalanan"}</p>
                        </div>
                      </div>

                      <div className="dd-stop-place">
                        <IconPin />
                        <span>
                          {cp.lokasi}
                          {cp.lokasi_tujuan && (
                            <span className="dd-stop-arrow"> → {cp.lokasi_tujuan}</span>
                          )}
                        </span>
                      </div>

                      <div className="dd-stop-time">
                        <IconClock />
                        <span>{cp.waktu_scan ? formatDateShort(cp.waktu_scan) : "–"}</span>
                      </div>

                      <span className={`dd-stop-status ${isDone ? "dd-stop-status--done" : "dd-stop-status--pending"}`}>
                        {isDone ? "Terverifikasi" : "Belum Diverifikasi"}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview PDF */}
        <div className="dd-section">
          <div className="dd-section-head">
            <div>
              <h2 className="dd-section-title">Berkas SPD</h2>
              <p className="dd-section-sub">Dokumen asli yang diunggah ke sistem.</p>
            </div>
            {document.file_url && (
              <a href={document.file_url} target="_blank" rel="noreferrer" className="dd-btn dd-btn--ghost">
                <IconExternal />
                Buka di tab baru
              </a>
            )}
          </div>

          {document.file_url ? (
            <div className="dd-pdf-wrap">
              <iframe src={document.file_url} title="Dokumen SPD" />
            </div>
          ) : (
            <div className="dd-empty">
              <div className="dd-empty-icon">
                <IconFile />
              </div>
              <p>File SPD tidak tersedia.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DocumentDetailPage;