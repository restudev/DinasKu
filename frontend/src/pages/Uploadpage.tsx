import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Uploadpage.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

type StepStatus = "idle" | "active" | "done" | "error";

interface Step { id: string; label: string; desc: string; }

const STEPS: Step[] = [
  { id: "upload",     label: "Unggah PDF",       desc: "Mengirim file ke server…" },
  { id: "ocr",        label: "Baca teks (OCR)",   desc: "Mengekstrak teks dari dokumen…" },
  { id: "parse",      label: "Parse data SPD",    desc: "Membaca nomor, pegawai, tanggal…" },
  { id: "checkpoint", label: "Buat checkpoint",   desc: "Menentukan titik perjalanan…" },
  { id: "qr",         label: "Generate QR Code",  desc: "Membuat kode QR tiap checkpoint…" },
];

interface ParsedData {
  nomor_spd?: string;
  pegawai_nama?: string;
  tempat_berangkat?: string;
  tempat_tujuan?: string;
  tanggal_berangkat?: string;
  tanggal_kembali?: string;
  checkpoint_count?: number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function waitUntil(cond: () => boolean, timeout: number): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => { if (cond() || Date.now() - start > timeout) resolve(); else setTimeout(check, 120); };
    check();
  });
}

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile]             = useState<File | null>(null);
  const [fileUrl, setFileUrl]       = useState<string | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [stepStatus, setStepStatus] = useState<Record<string, StepStatus>>({});
  const [result, setResult]         = useState<ParsedData | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [docId, setDocId]           = useState<number | null>(null);

  const setStep = (id: string, status: StepStatus) => {
    setStepStatus((p) => ({ ...p, [id]: status }));
  };

  const animateSteps = async (ref: { current: number }) => {
    await waitUntil(() => ref.current >= 15, 6000);
    setStep("ocr", "active");
    await waitUntil(() => ref.current >= 45, 10000);
    setStep("ocr", "done"); setStep("parse", "active");
    await waitUntil(() => ref.current >= 65, 6000);
    setStep("parse", "done"); setStep("checkpoint", "active");
    await waitUntil(() => ref.current >= 80, 6000);
    setStep("checkpoint", "done"); setStep("qr", "active");
  };

  const pickFile = (f: File) => {
    // Revoke URL lama jika ada
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") pickFile(f);
    else setError("Hanya file PDF yang diterima.");
  }, [fileUrl]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(null); setResult(null);
    setStepStatus({}); setProgress(0);
    const progRef = { current: 0 };
    setStep("upload", "active");
    animateSteps(progRef);

    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const res = await axios.post(`${API_URL}/api/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          progRef.current = Math.min(60, pct * 0.6);
          setProgress(progRef.current);
        },
      });

      progRef.current = 100; setProgress(100);
      STEPS.forEach((s) => setStep(s.id, "done"));

      const doc = res.data.document ?? res.data;
      setResult({
        nomor_spd:         doc.nomor_spd,
        pegawai_nama:      doc.pegawai_nama,
        tempat_berangkat:  doc.tempat_berangkat,
        tempat_tujuan:     doc.tempat_tujuan,
        tanggal_berangkat: doc.tanggal_berangkat,
        tanggal_kembali:   doc.tanggal_kembali,
        checkpoint_count:  res.data.checkpoint_count ?? doc.checkpoint_count,
      });
      setDocId(doc.id);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : "Terjadi kesalahan saat mengunggah.";
      setError(msg);
      setStepStatus((p) => {
        const next = { ...p };
        Object.keys(next).forEach((k) => { if (next[k] === "active") next[k] = "error"; });
        return next;
      });
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null); setFileUrl(null); setUploading(false); setProgress(0);
    setStepStatus({});
    setResult(null); setError(null); setDocId(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const done = result !== null;

  return (
    <div className="up-page">

      {/* ── Header ── */}
      <div className="up-header">
        <div className="up-header-inner">
          <span className="up-eyebrow">
            <span className="up-eyebrow-dot" />
            Unggah Dokumen
          </span>
          <h1 className="up-title">Tambah Surat Perjalanan Dinas</h1>
          <p className="up-sub">
            Unggah PDF SPD — sistem membaca, mengurai, dan membuat QR checkpoint secara otomatis.
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="up-body">

        {/* LEFT */}
        <div className="up-left">

          {/* Drop zone */}
          {!done && (
            <div
              className={`up-drop${dragging ? " up-drop--over" : ""}${file ? " up-drop--has-file" : ""}${uploading ? " up-drop--uploading" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && !uploading && inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept=".pdf,application/pdf"
                className="up-drop-input" onChange={onFileChange} />

              {!file ? (
                <div className="up-drop-empty">
                  <div className="up-drop-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="up-drop-label">Seret file PDF ke sini</p>
                  <p className="up-drop-hint">atau <span>klik untuk pilih file</span> · maks. 20 MB</p>
                </div>
              ) : (
                <div className="up-file-info">
                  <div className="up-file-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                  </div>
                  <div className="up-file-meta">
                    <p className="up-file-name">{file.name}</p>
                    <p className="up-file-size">{formatBytes(file.size)}</p>
                  </div>
                  {!uploading && (
                    <button className="up-file-remove" onClick={(e) => { e.stopPropagation(); reset(); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {uploading && (
                <div className="up-progress-wrap">
                  <div className="up-progress-track">
                    <div className="up-progress-bar" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="up-progress-pct">{progress}%</span>
                </div>
              )}
            </div>
          )}

          {/* PDF Preview — muncul setelah file dipilih */}
          {file && fileUrl && (
            <div className="up-pdf-preview">
              <div className="up-pdf-preview-header">
                <p className="up-pdf-preview-title">Pratinjau dokumen</p>
                <span className="up-pdf-preview-pages">{file.name}</span>
              </div>
              <iframe
                className="up-pdf-preview-embed"
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                title="Pratinjau PDF"
              />
            </div>
          )}

          {/* Done banner */}
          {done && (
            <div className="up-done-banner">
              <div className="up-done-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="up-done-title">Dokumen berhasil diproses</p>
                <p className="up-done-sub">{file?.name}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="up-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* CTA */}
          {!done ? (
            <button className="up-btn-submit" onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <svg className="up-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
                  </svg>
                  Memproses dokumen…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Proses Dokumen
                </>
              )}
            </button>
          ) : (
            <div className="up-done-actions">
              <button className="up-btn-ghost" onClick={reset}>Unggah dokumen lain</button>
              <button className="up-btn-primary" onClick={() => navigate(`/documents/${docId}`)}>
                Lihat detail SPD
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="up-right">

          {/* Steps */}
          <div className="up-steps-card">
            <p className="up-card-title">Proses otomatis</p>
            <ol className="up-steps">
              {STEPS.map((step, i) => {
                const status = stepStatus[step.id] ?? "idle";
                return (
                  <li key={step.id} className={`up-step up-step--${status}`}>
                    <div className="up-step-track">
                      <div className="up-step-dot">
                        {status === "done" && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        {status === "active" && (
                          <svg className="up-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
                          </svg>
                        )}
                        {status === "error" && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                        {status === "idle" && <span>{i + 1}</span>}
                      </div>
                      {i < STEPS.length - 1 && <div className="up-step-line" />}
                    </div>
                    <div className="up-step-body">
                      <p className="up-step-label">{step.label}</p>
                      {status === "active" && <p className="up-step-desc">{step.desc}</p>}
                      {status === "done" && step.id === "checkpoint" && result?.checkpoint_count && (
                        <p className="up-step-desc">{result.checkpoint_count} titik checkpoint dibuat</p>
                      )}
                      {status === "done" && step.id === "qr" && result?.checkpoint_count && (
                        <p className="up-step-desc">{result.checkpoint_count} QR code digenerate</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Result */}
          {result && (
            <div className="up-result-card">
              <p className="up-card-title">Data yang terbaca</p>
              <dl className="up-result-list">
                {[
                  ["Nomor SPD",  result.nomor_spd],
                  ["Pegawai",    result.pegawai_nama],
                  ["Asal",       result.tempat_berangkat],
                  ["Tujuan",     result.tempat_tujuan],
                  ["Berangkat",  formatDate(result.tanggal_berangkat)],
                  ["Kembali",    formatDate(result.tanggal_kembali)],
                ].map(([label, val]) => (
                  <div key={label} className="up-result-row">
                    <dt>{label}</dt>
                    <dd>{val || "—"}</dd>
                  </div>
                ))}
                <div className="up-result-row">
                  <dt>Checkpoint</dt>
                  <dd>
                    <span className="up-result-badge">{result.checkpoint_count ?? 0} titik</span>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}