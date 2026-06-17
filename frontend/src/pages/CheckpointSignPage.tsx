import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import SignatureCanvas, { type SignatureCanvasRef } from "./SignatureCanvas";
import "./CheckpointSignPage.css";

interface Checkpoint {
  id: number;
  lokasi: string;
  jenis: string;
  nama?: string;
  nip?: string;
  jumlah_orang?: number;
  latitude?: number;
  longitude?: number;
  berita_acara_pdf?: string;
}

function CheckpointSignPage() {
  const { id } = useParams<{ id: string }>();
  const sigRef = useRef<SignatureCanvasRef>(null);

  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);

  // Mode tanda tangan: gambar di canvas atau upload file
  const [sigMode, setSigMode] = useState<"draw" | "upload">("draw");
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    axios
      .get<Checkpoint>(`http://127.0.0.1:8000/api/checkpoints/${id}`)
      .then((res) => {
        if (mounted) setCheckpoint(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const clearSignature = () => sigRef.current?.clear();

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStampFile(file);
    setStampPreview(URL.createObjectURL(file));
  };

  const handleSigFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigFile(file);
    setSigPreview(URL.createObjectURL(file));
  };

  const removeSigFile = () => {
    setSigFile(null);
    setSigPreview(null);
  };

  const handleSigModeChange = (mode: "draw" | "upload") => {
    setSigMode(mode);
    if (mode === "draw") {
      removeSigFile();
    } else {
      clearSignature();
    }
  };

  const saveDocument = async () => {
    let sigBlob: Blob;
    let sigFileName = "signature.png";

    if (sigMode === "draw") {
      if (!sigRef.current || sigRef.current.isEmpty()) {
        alert("Tanda tangan wajib diisi");
        return;
      }
      const canvas = sigRef.current.getTrimmedCanvas();
      if (!canvas) {
        alert("Canvas tidak tersedia");
        return;
      }
      const dataUrl = canvas.toDataURL("image/png");
      const response = await fetch(dataUrl);
      sigBlob = await response.blob();
    } else {
      if (!sigFile) {
        alert("File tanda tangan wajib diupload");
        return;
      }
      sigBlob = sigFile;
      sigFileName = sigFile.name;
    }

    if (!stampFile) {
      alert("Stempel wajib diupload");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("checkpoint_id", String(checkpoint!.id));
      formData.append("signature", sigBlob, sigFileName);
      formData.append("stamp", stampFile);

      const res = await axios.post<{ checkpoint?: Checkpoint; pdf_url?: string }>(
        "http://127.0.0.1:8000/api/checkpoints/sign",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.checkpoint) setCheckpoint(res.data.checkpoint);
      if (res.data.pdf_url) window.open(res.data.pdf_url, "_blank");

      alert("Dokumen berhasil dibuat");
    } catch (error) {
      console.error("Sign error:", error);
      if (axios.isAxiosError(error)) {
        alert(JSON.stringify(error.response?.data, null, 2));
      } else {
        alert("Terjadi kesalahan saat menyimpan");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="csp-center"><span className="csp-spinner" />Memuat data…</div>;
  if (!checkpoint) return <div className="csp-center">Checkpoint tidak ditemukan</div>;

  const selesai = !!checkpoint.berita_acara_pdf;

  return (
    <div className="csp-page">
      <div className="csp-wrap">
        {/* TOPBAR */}
        <header className="csp-topbar">
          <div className="csp-topbar-left">
            <div className="csp-topbar-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div className="csp-topbar-text">
              <div className="csp-topbar-title">Tanda Tangan &amp; Stempel</div>
              <div className="csp-topbar-sub">Pengesahan berita acara checkpoint</div>
            </div>
          </div>
          <span className={`csp-chip ${selesai ? "csp-chip--done" : "csp-chip--pending"}`}>
            <span className="csp-chip-dot" />
            {selesai ? "Tersimpan" : "Belum ditandatangani"}
          </span>
        </header>

        {/* GRID */}
        <div className="csp-cols">
          {/* LEFT */}
          <div className="csp-col">
            <div className="csp-card">
              <div className="csp-card-label">Informasi Checkpoint</div>
              <div className="csp-meta">
                <div className="csp-meta-item">
                  <span className="csp-meta-key">Lokasi</span>
                  <span className="csp-meta-val">{checkpoint.lokasi}</span>
                </div>
                <div className="csp-meta-item">
                  <span className="csp-meta-key">Jenis</span>
                  <span className="csp-meta-val">{checkpoint.jenis}</span>
                </div>
                <div className="csp-meta-item">
                  <span className="csp-meta-key">Petugas</span>
                  <span className="csp-meta-val">{checkpoint.nama}</span>
                </div>
                <div className="csp-meta-item">
                  <span className="csp-meta-key">NIP</span>
                  <span className="csp-meta-val">{checkpoint.nip}</span>
                </div>
                <div className="csp-meta-item">
                  <span className="csp-meta-key">Jumlah Orang</span>
                  <span className="csp-meta-val">{checkpoint.jumlah_orang ?? "—"}</span>
                </div>
                <div className="csp-meta-item">
                  <span className="csp-meta-key">GPS</span>
                  <span className="csp-meta-val csp-meta-mono">
                    {checkpoint.latitude ?? "-"}, {checkpoint.longitude ?? "-"}
                  </span>
                </div>
              </div>
            </div>

            {selesai && (
              <div className="csp-card csp-card--success">
                <div className="csp-success-row">
                  <div className="csp-success-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="csp-success-title">Berita acara tersimpan</div>
                    <div className="csp-success-sub">Dokumen PDF telah digenerate</div>
                  </div>
                </div>
                <a href={checkpoint.berita_acara_pdf} target="_blank" rel="noreferrer" className="csp-btn-pdf">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Buka PDF
                </a>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="csp-col csp-col--right">
            {/* TANDA TANGAN */}
            <div className="csp-card">
              <div className="csp-card-label">Tanda Tangan</div>

              <div className="csp-sig-tabs">
                <button
                  type="button"
                  className={`csp-sig-tab ${sigMode === "draw" ? "csp-sig-tab--active" : ""}`}
                  onClick={() => handleSigModeChange("draw")}
                >
                  Gambar
                </button>
                <button
                  type="button"
                  className={`csp-sig-tab ${sigMode === "upload" ? "csp-sig-tab--active" : ""}`}
                  onClick={() => handleSigModeChange("upload")}
                >
                  Upload File
                </button>
              </div>

              {sigMode === "draw" ? (
                <>
                  <div className="csp-sig-wrap">
                    <SignatureCanvas
                      ref={sigRef}
                      width={600}
                      height={200}
                      penColor="#0f172a"
                      style={{ cursor: "crosshair" }}
                    />
                    <div className="csp-sig-hint">Tanda tangani di area ini</div>
                  </div>
                  <button className="csp-btn-ghost" onClick={clearSignature}>
                    Hapus tanda tangan
                  </button>
                </>
              ) : (
                <>
                  {sigPreview ? (
                    <div className="csp-stamp-preview">
                      <img src={sigPreview} alt="Preview tanda tangan" className="csp-stamp-img" />
                      <button className="csp-btn-ghost" onClick={removeSigFile}>
                        Ganti file
                      </button>
                    </div>
                  ) : (
                    <label className="csp-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSigFileChange}
                        className="csp-upload-input"
                      />
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span className="csp-upload-label">Klik untuk upload tanda tangan</span>
                      <span className="csp-upload-sub">PNG atau JPG</span>
                    </label>
                  )}
                </>
              )}
            </div>

            {/* STEMPEL */}
            <div className="csp-card">
              <div className="csp-card-label">Stempel</div>
              {stampPreview ? (
                <div className="csp-stamp-preview">
                  <img src={stampPreview} alt="Preview stempel" className="csp-stamp-img" />
                  <button className="csp-btn-ghost" onClick={() => { setStampFile(null); setStampPreview(null); }}>
                    Ganti stempel
                  </button>
                </div>
              ) : (
                <label className="csp-upload">
                  <input type="file" accept="image/*" onChange={handleStampChange} className="csp-upload-input" />
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="csp-upload-label">Klik untuk upload stempel</span>
                  <span className="csp-upload-sub">PNG atau JPG</span>
                </label>
              )}
            </div>

            <button className="csp-btn-submit" onClick={saveDocument} disabled={saving}>
              {saving ? (
                <><span className="csp-spinner csp-spinner--sm" />Menyimpan…</>
              ) : (
                <>Generate Berita Acara</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckpointSignPage;