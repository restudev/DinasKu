import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import type { Checkpoint } from "../types/checkpoint";
import "./Checkpointdetailpage.css";

const JENIS_LABEL: Record<string, string> = {
  berangkat: "Berangkat",
  tiba: "Tiba",
  berangkat_pulang: "Berangkat Pulang",
  tiba_kembali: "Tiba Kembali",
};

function CheckpointDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCheckpoint = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/checkpoints/${id}`);
        let data: unknown = res.data;
        if (typeof data === "string") {
          try {
            const jsonStart = data.indexOf("{");
            if (jsonStart !== -1) {
              data = JSON.parse(data.substring(jsonStart));
            }
          } catch (parseError) {
            console.error("Gagal parse JSON:", parseError);
          }
        }
        setCheckpoint(data as Checkpoint);
      } catch (err) {
        console.error("Gagal mengambil checkpoint:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadCheckpoint();
  }, [id]);

  const statusLabel = (s?: string) => {
    switch (s) {
      case "completed":
        return "Terverifikasi";
      case "in_progress":
        return "Berjalan";
      case "uploaded":
        return "Terunggah";
      default:
        return s ?? "Menunggu";
    }
  };

  const statusClass = (s?: string) => {
    switch (s) {
      case "completed":
        return "cd-chip cd-chip--done";
      case "in_progress":
        return "cd-chip cd-chip--progress";
      case "uploaded":
        return "cd-chip cd-chip--uploaded";
      default:
        return "cd-chip cd-chip--idle";
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-shell">
          <div className="cd-center">
            <div className="cd-center-icon cd-center-icon--loading">
              <svg className="cd-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              </svg>
            </div>
            <p>Memuat data checkpoint…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error / Not found ── */
  if (error || !checkpoint) {
    return (
      <div className="cd-page">
        <div className="cd-shell">
          <div className="cd-center">
            <div className="cd-center-icon cd-center-icon--error">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p>Checkpoint tidak ditemukan atau gagal dimuat.</p>
            <Link to="/documents" className="cd-btn cd-btn--ghost">Kembali ke daftar SPD</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <div className="cd-shell">

        {/* Back */}
        <Link to={`/documents/${checkpoint.spd_document_id || ""}`} className="cd-back">
          Kembali ke Detail SPD
        </Link>

        {/* Header */}
        <div className="cd-header">
          <div className="cd-header-banner">
            <div className="cd-header-banner-top">
              <div>
                <div className="cd-eyebrow">Checkpoint Perjalanan Dinas</div>
                <h1>{JENIS_LABEL[checkpoint.jenis] ?? checkpoint.jenis ?? "Checkpoint"}</h1>
              </div>
              <span className={statusClass(checkpoint.status)}>
                <span className="cd-chip-dot" />
                {statusLabel(checkpoint.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="cd-content">
          <div className="cd-section">
            <h2 className="cd-section-title">Informasi Checkpoint</h2>
            <table className="cd-table">
              <tbody>
                <tr>
                  <td><b>Lokasi</b></td>
                  <td>{checkpoint.lokasi || "—"}</td>
                </tr>
                <tr>
                  <td><b>Jenis</b></td>
                  <td>{JENIS_LABEL[checkpoint.jenis] ?? checkpoint.jenis ?? "—"}</td>
                </tr>
                <tr>
                  <td><b>Status</b></td>
                  <td>{statusLabel(checkpoint.status)}</td>
                </tr>
                <tr>
                  <td><b>QR Token</b></td>
                  <td>{checkpoint.qr_token || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cd-section">
            <h2 className="cd-section-title">QR Code</h2>
            <div className="cd-qr-container">
              {checkpoint.qr_url ? (
                <img src={checkpoint.qr_url} alt="QR Code" />
              ) : (
                <p>QR tidak tersedia</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CheckpointDetailPage;