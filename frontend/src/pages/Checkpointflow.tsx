import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import SignatureCanvas, { type SignatureCanvasRef } from "./SignatureCanvas";
import "./CheckpointFlow.css";

interface Checkpoint {
  id?: number;
  qr_token?: string;
  lokasi: string;
  lokasi_tujuan?: string;
  jenis: string;
  prev_berita_acara_pdf?: string;
  berita_acara_pdf?: string;
  nama?: string;
  nip?: string;
  jabatan?: string;
  jumlah_orang?: number;
  waktu_scan?: string;
  [key: string]: unknown;
}

interface CheckpointFormData {
  nama: string;
  nip: string;
  jabatan: string;
  latitude: number | null;
  longitude: number | null;
  fotoBlob: Blob | null;
  fotoPreview: string | null;
  personCount: number;
  signatureDataUrl: string | null;
  signatureMode: "draw" | "upload";
  signatureFile: File | null;
  stampFile: File | null;
  stampPreview: string | null;
  savedCheckpoint: Checkpoint | null;
}

interface ResultData {
  pdf_url?: string;
  checkpoint?: Checkpoint;
}

interface StepProps {
  checkpoint: Checkpoint;
  formData: CheckpointFormData;
  setFormData: React.Dispatch<React.SetStateAction<CheckpointFormData>>;
  onNext?: () => void;
  onBack?: () => void;
  submitting?: boolean;
}

interface StepResultProps {
  result: ResultData | null;
  checkpoint: Checkpoint | null;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Scan" },
  { id: 2, label: "Tanda Tangan" },
  { id: 3, label: "Rangkuman" },
  { id: 4, label: "Hasil" },
] as const;

// ─────────────────────────────────────────────────────────────
// StepBar
// ─────────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  return (
    <nav className="stepbar">
      {STEPS.map((s, i) => (
        <div key={s.id} className="stepbar-item">
          <div
            className={`stepbar-node ${step > s.id ? "done" : step === s.id ? "active" : ""}`}
          >
            {step > s.id ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              s.id
            )}
          </div>
          <span className={`stepbar-label ${step >= s.id ? "active" : ""}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`stepbar-line ${step > s.id ? "done" : ""}`} />
          )}
        </div>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// NavBar
// ─────────────────────────────────────────────────────────────
function NavBar({
  step,
  onBack,
  onNext,
  nextLabel = "Lanjut",
  nextDisabled = false,
  nextLoading = false,
}: {
  step: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}) {
  return (
    <div className="navbar">
      {step > 1 && (
        <button className="btn btn-ghost" onClick={onBack}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Kembali
        </button>
      )}
      {onNext && (
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
        >
          {nextLoading ? (
            <>
              <span className="spinner spinner-sm" /> Memproses…
            </>
          ) : (
            <>
              {nextLabel}{" "}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 1 — Scan
// ─────────────────────────────────────────────────────────────
function StepScan({ checkpoint, formData, setFormData, onNext }: StepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectingRef = useRef(false);

  const [cameraMode, setCameraMode] = useState<"environment" | "user">(
    "environment",
  );
  const [personCount, setPersonCount] = useState(formData.personCount);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setFormData((p) => ({
          ...p,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })),
      console.error,
    );
  }, [setFormData]);

  // Camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const init = async () => {
      const prevStream = videoRef.current?.srcObject;
      if (prevStream instanceof MediaStream) {
        prevStream.getTracks().forEach((t) => t.stop());
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraMode },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error(e);
      }
    };

    init();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, [cameraMode]);

  const detectPeople = useCallback(async () => {
    if (detectingRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    detectingRef.current = true;
    setDetecting(true);

    try {
      const c = document.createElement("canvas");
      c.width = video.videoWidth || 640;
      c.height = video.videoHeight || 480;
      c.getContext("2d")!.drawImage(video, 0, 0, c.width, c.height);

      const blob = await new Promise<Blob>((res, rej) =>
        c.toBlob(
          (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
          "image/jpeg",
          0.8,
        ),
      );

      const fd = new FormData();
      fd.append("image", blob, "frame.jpg");

      const r = await axios.post("http://127.0.0.1:5000/detect-live", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (r.data?.success) {
        const count = Number(r.data.jumlah_orang ?? 0);
        setPersonCount(count);
        setFormData((p) => ({ ...p, personCount: count }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      detectingRef.current = false;
      setDetecting(false);
    }
  }, [setFormData]);

  useEffect(() => {
    const id = setInterval(detectPeople, 2000);
    return () => clearInterval(id);
  }, [detectPeople]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas
      .getContext("2d")!
      .drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setFormData((p) => ({
          ...p,
          fotoBlob: blob,
          fotoPreview: URL.createObjectURL(blob),
        }));
      },
      "image/jpeg",
      0.9,
    );
  };

  const handleNext = async () => {
    if (!formData.nama) return alert("Nama wajib diisi");
    if (!formData.nip) return alert("NIP wajib diisi");
    if (!formData.fotoBlob) return alert("Silakan ambil foto terlebih dahulu");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("token", checkpoint.qr_token || "");
      fd.append("nama", formData.nama);
      fd.append("nip", formData.nip);
      fd.append("jabatan", formData.jabatan || "");
      if (formData.latitude) fd.append("latitude", String(formData.latitude));
      if (formData.longitude)
        fd.append("longitude", String(formData.longitude));
      fd.append("foto", formData.fotoBlob, "checkpoint.jpg");

      const r = await axios.post(
        "http://127.0.0.1:8000/api/checkpoints/scan",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setFormData((p) => ({ ...p, savedCheckpoint: r.data.checkpoint }));
      onNext?.();
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan checkpoint");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="step-layout">
      <div className="col">
        <section className="card">
          <div className="card-title">Lokasi Checkpoint</div>
          <dl className="meta-list">
            <div className="meta-row">
              <dt>Lokasi</dt>
              <dd>{checkpoint.lokasi}</dd>
            </div>
            {checkpoint.lokasi_tujuan && (
              <div className="meta-row">
                <dt>Tujuan</dt>
                <dd>{checkpoint.lokasi_tujuan}</dd>
              </div>
            )}
            <div className="meta-row">
              <dt>Jenis</dt>
              <dd>{checkpoint.jenis}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <div className="card-title">Data Petugas</div>
          <div className="field-grid">
            <div className="field">
              <label className="field-label">
                Nama <span className="required">*</span>
              </label>
              <input
                className="input"
                type="text"
                placeholder="Nama lengkap"
                value={formData.nama}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nama: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label className="field-label">
                NIP <span className="required">*</span>
              </label>
              <input
                className="input"
                type="text"
                placeholder="Nomor induk"
                value={formData.nip}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nip: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label className="field-label">Jabatan</label>
            <input
              className="input"
              type="text"
              placeholder="Jabatan petugas"
              value={formData.jabatan}
              onChange={(e) =>
                setFormData((p) => ({ ...p, jabatan: e.target.value }))
              }
            />
          </div>
        </section>

        {formData.latitude && formData.longitude && (
          <section className="card card-map">
            <div className="card-title">Posisi GPS</div>
            <div className="map-wrap">
              <iframe
                title="Peta lokasi"
                src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&z=16&output=embed`}
              />
              <div className="map-pill">
                {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="col-cam">
        <section className="card card-cam">
          <div className="cam-header">
            <div
              className="card-title"
              style={{ marginBottom: 0, textAlign: "left" }}
            >
              Kamera
            </div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${cameraMode === "environment" ? "active" : ""}`}
                onClick={() => setCameraMode("environment")}
              >
                Belakang
              </button>
              <button
                className={`toggle-btn ${cameraMode === "user" ? "active" : ""}`}
                onClick={() => setCameraMode("user")}
              >
                Depan
              </button>
            </div>
          </div>

          <div className="viewfinder">
            {!formData.fotoPreview ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="media"
              />
            ) : (
              <img
                src={formData.fotoPreview}
                alt="Preview foto"
                className="media"
              />
            )}
            <div className="corner tl" />
            <div className="corner tr" />
            <div className="corner bl" />
            <div className="corner br" />
          </div>

          <div className="detect-bar">
            <div className="detect-left">
              <span className={`pulse ${detecting ? "active" : ""}`} />
              <span className="detect-label">
                {detecting ? "Mendeteksi…" : "Deteksi aktif"}
              </span>
            </div>
            <div>
              <span className="count-num">{personCount}</span>
              <span className="count-unit"> orang</span>
            </div>
          </div>

          <div className="cam-actions">
            {!formData.fotoPreview ? (
              <button className="btn btn-primary" onClick={capturePhoto}>
                Ambil Foto
              </button>
            ) : (
              <button
                className="btn btn-ghost"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    fotoBlob: null,
                    fotoPreview: null,
                  }))
                }
              >
                Ambil Ulang
              </button>
            )}
          </div>
        </section>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <NavBar
        step={1}
        onNext={handleNext}
        nextLabel="Simpan & Lanjut"
        nextLoading={saving}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Signature & Stamp
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Step 2 — Signature & Stamp
// ─────────────────────────────────────────────────────────────
function StepSign({
  formData,
  setFormData,
  onBack,
  onNext,
}: Omit<StepProps, "checkpoint" | "submitting">) {
  const sigRef = useRef<SignatureCanvasRef>(null);

  const clearSignature = () => sigRef.current?.clear();

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((p) => ({
      ...p,
      stampFile: file,
      stampPreview: URL.createObjectURL(file),
    }));
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((p) => ({
      ...p,
      signatureFile: file,
      signatureDataUrl: URL.createObjectURL(file),
    }));
  };

  const removeSignatureFile = () => {
    setFormData((p) => ({
      ...p,
      signatureFile: null,
      signatureDataUrl: null,
    }));
  };

  const handleSignatureModeChange = (mode: "draw" | "upload") => {
    clearSignature();
    setFormData((p) => ({
      ...p,
      signatureMode: mode,
      signatureFile: null,
      signatureDataUrl: null,
    }));
  };

  const handleNext = () => {
    if (formData.signatureMode === "draw") {
      if (!sigRef.current || sigRef.current.isEmpty())
        return alert("Tanda tangan wajib diisi");

      const dataUrl =
        sigRef.current.getTrimmedCanvas()?.toDataURL("image/png") || "";
      setFormData((p) => ({ ...p, signatureDataUrl: dataUrl, signatureFile: null }));
    } else {
      if (!formData.signatureFile)
        return alert("File tanda tangan wajib diupload");
    }

    if (!formData.stampFile) return alert("Stempel wajib diupload");

    onNext?.();
  };

  return (
    <div className="step-layout">
      <div className="col">
        <section className="card card-sign">
          <div className="card-title">Tanda Tangan</div>

          <div className="sig-mode-tabs">
            <button
              type="button"
              className={`sig-mode-tab ${formData.signatureMode === "draw" ? "active" : ""}`}
              onClick={() => handleSignatureModeChange("draw")}
            >
              Gambar
            </button>
            <button
              type="button"
              className={`sig-mode-tab ${formData.signatureMode === "upload" ? "active" : ""}`}
              onClick={() => handleSignatureModeChange("upload")}
            >
              Upload File
            </button>
          </div>

          {formData.signatureMode === "draw" ? (
            <>
              <div className="sig-wrap sig-wrap--tall">
                <SignatureCanvas
                  ref={sigRef}
                  width={700}
                  height={340}
                  penColor="#0f172a"
                />
                <div className="sig-hint">Tanda tangani di area ini</div>
              </div>
              <div className="sign-actions">
                <button className="btn btn-ghost" onClick={clearSignature}>
                  Hapus Tanda Tangan
                </button>
              </div>
            </>
          ) : (
            <>
              {formData.signatureDataUrl ? (
                <div className="stamp-preview--full">
                  <img
                    src={formData.signatureDataUrl}
                    alt="Preview tanda tangan"
                    className="stamp-img--full"
                  />
                  <button className="btn btn-ghost" onClick={removeSignatureFile}>
                    Ganti File Tanda Tangan
                  </button>
                </div>
              ) : (
                <label className="upload-zone upload-zone--full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureFileChange}
                    className="upload-input"
                  />
                  <span className="upload-label">Klik untuk upload tanda tangan</span>
                  <span className="upload-sub">PNG atau JPG</span>
                </label>
              )}
            </>
          )}
        </section>
      </div>

      <div className="col-cam">
        <section className="card card-stamp">
          <div className="card-title">Stempel Instansi</div>
          {formData.stampPreview ? (
            <div className="stamp-preview stamp-preview--full">
              <img
                src={formData.stampPreview}
                alt="Preview stempel"
                className="stamp-img--full"
              />
              <button
                className="btn btn-ghost"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    stampFile: null,
                    stampPreview: null,
                  }))
                }
              >
                Ganti Stempel
              </button>
            </div>
          ) : (
            <label className="upload-zone upload-zone--full">
              <input
                type="file"
                accept="image/*"
                onChange={handleStampChange}
                className="upload-input"
              />
              <span className="upload-label">Klik untuk upload stempel</span>
              <span className="upload-sub">
                PNG atau JPG, transparan lebih baik
              </span>
            </label>
          )}
        </section>
      </div>

      <NavBar
        step={2}
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Lihat Rangkuman"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 3 — Review
// ─────────────────────────────────────────────────────────────
function StepReview({
  checkpoint,
  formData,
  onBack,
  onNext,
  submitting,
}: StepProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="step-layout step-layout--review">
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Preview" className="lightbox-img" />
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="col review-col-left">
        <section className="card card-review-left">
          <div className="card-title">Rangkuman Checkpoint</div>
          <dl className="meta-list">
            <div className="meta-row">
              <dt>Nama</dt>
              <dd>{formData.nama}</dd>
            </div>
            <div className="meta-row">
              <dt>NIP</dt>
              <dd>{formData.nip}</dd>
            </div>
            {formData.jabatan && (
              <div className="meta-row">
                <dt>Jabatan</dt>
                <dd>{formData.jabatan}</dd>
              </div>
            )}
            <div className="meta-row">
              <dt>Lokasi</dt>
              <dd>{checkpoint.lokasi}</dd>
            </div>
            <div className="meta-row">
              <dt>Jenis</dt>
              <dd>{checkpoint.jenis}</dd>
            </div>
            <div className="meta-row">
              <dt>Jumlah orang</dt>
              <dd>{formData.personCount ?? "—"}</dd>
            </div>
            {formData.latitude && formData.longitude && (
              <div className="meta-row meta-row--last">
                <dt>GPS</dt>
                <dd className="mono">
                  {formData.latitude.toFixed(6)},{" "}
                  {formData.longitude.toFixed(6)}
                </dd>
              </div>
            )}
          </dl>

          {checkpoint.prev_berita_acara_pdf ? (
            <div className="review-foto-section">
              <div className="review-foto-header">
                <span className="card-title" style={{ marginBottom: 0 }}>
                  Dokumen Dasar (SPD)
                </span>
              </div>
              <iframe
                src={checkpoint.prev_berita_acara_pdf}
                title="Preview dokumen dasar"
                className="review-pdf-frame--grow"
              />
            </div>
          ) : (
            <div className="review-foto-section">
              <div className="review-foto-header">
                <span className="card-title" style={{ marginBottom: 0 }}>
                  Dokumen Dasar (SPD)
                </span>
              </div>
              <div className="review-pdf-empty">Belum ada dokumen dasar</div>
            </div>
          )}
        </section>
      </div>

      <div className="col-cam review-col-right">
        <section className="card card-review-right">
          {formData.signatureDataUrl && (
            <div className="review-block">
              <span className="card-title">Tanda Tangan</span>
              <div
                className="review-sig-box"
                onClick={() => setLightbox(formData.signatureDataUrl!)}
              >
                <img
                  src={formData.signatureDataUrl}
                  alt="Tanda tangan"
                  className="review-sig"
                />
              </div>
            </div>
          )}

          {formData.signatureDataUrl && formData.stampPreview && (
            <div className="review-divider" />
          )}

          {formData.stampPreview && (
            <div className="review-block">
              <span className="card-title">Stempel</span>
              <div
                className="review-stamp-box"
                onClick={() => setLightbox(formData.stampPreview!)}
              >
                <img
                  src={formData.stampPreview}
                  alt="Stempel"
                  className="review-stamp-img"
                />
              </div>
            </div>
          )}
          <br />

          {formData.fotoPreview && (
            <div className="review-block review-block--grow">
              <div className="review-foto-header">
                <span className="card-title">Foto Bukti</span>
              </div>
              <div
                className="review-foto-thumb-wrap"
                onClick={() => setLightbox(formData.fotoPreview!)}
              >
                <img
                  src={formData.fotoPreview}
                  alt="Foto bukti"
                  className="review-foto-thumb-fill"
                />
              </div>
            </div>
          )}
        </section>
      </div>

      <NavBar
        step={3}
        onBack={onBack}
        onNext={onNext}
        nextLabel="Generate Berita Acara"
        nextLoading={submitting}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 4 — Result
// ─────────────────────────────────────────────────────────────
function StepResult({ result, checkpoint, onBack }: StepResultProps) {
  const pdfUrl = result?.pdf_url || checkpoint?.berita_acara_pdf;

  return (
    <div className="step-layout step-layout--result">
      <div className="col result-col-left">
        {pdfUrl ? (
          <section className="card card-result-pdf">
            <div className="card-title">Preview PDF</div>
            <iframe
              src={pdfUrl}
              className="result-pdf-frame"
              title="Preview berita acara"
            />
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-full result-pdf-btn"
              style={{
                marginTop: 12,
                textDecoration: "none",
                justifyContent: "center",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Buka / Download PDF
            </a>
          </section>
        ) : (
          <section className="card card-result-pdf">
            <div className="review-pdf-empty" style={{ flex: 1 }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="review-pdf-empty-label">PDF belum tersedia</span>
            </div>
          </section>
        )}
      </div>

      <div className="col-cam result-col-right">
        <section className="card card-success">
          <div className="success-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="success-title">Berita Acara Berhasil Dibuat</div>
          <div className="success-sub">
            Dokumen PDF telah digenerate dan tersimpan.
          </div>
        </section>

        {checkpoint && (
          <section className="card">
            <div className="card-title">Informasi Checkpoint</div>
            <dl className="meta-list">
              {checkpoint.nama && (
                <div className="meta-row">
                  <dt>Nama</dt>
                  <dd>{checkpoint.nama}</dd>
                </div>
              )}
              {checkpoint.nip && (
                <div className="meta-row">
                  <dt>NIP</dt>
                  <dd>{checkpoint.nip}</dd>
                </div>
              )}
              {checkpoint.jabatan && (
                <div className="meta-row">
                  <dt>Jabatan</dt>
                  <dd>{checkpoint.jabatan}</dd>
                </div>
              )}
              {checkpoint.lokasi && (
                <div className="meta-row">
                  <dt>Lokasi</dt>
                  <dd>{checkpoint.lokasi}</dd>
                </div>
              )}
              {checkpoint.jenis && (
                <div className="meta-row">
                  <dt>Jenis</dt>
                  <dd>{checkpoint.jenis}</dd>
                </div>
              )}
              {checkpoint.jumlah_orang != null && (
                <div className="meta-row">
                  <dt>Jumlah orang</dt>
                  <dd>{checkpoint.jumlah_orang}</dd>
                </div>
              )}
              {checkpoint.waktu_scan && (
                <div className="meta-row meta-row--last">
                  <dt>Waktu scan</dt>
                  <dd>
                    {new Date(checkpoint.waktu_scan).toLocaleString("id-ID")}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}
      </div>

      <NavBar step={4} onBack={onBack} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function CheckpointFlow() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState(1);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);

  const [formData, setFormData] = useState<CheckpointFormData>({
    nama: "",
    nip: "",
    jabatan: "",
    latitude: null,
    longitude: null,
    fotoBlob: null,
    fotoPreview: null,
    personCount: 0,
    signatureDataUrl: null,
    signatureMode: "draw", 
    signatureFile: null, 
    stampFile: null,
    stampPreview: null,
    savedCheckpoint: null,
  });

  useEffect(() => {
    if (!token) return;
    axios
      .get(`http://127.0.0.1:8000/api/checkpoints/token/${token}`)
      .then((r) => setCheckpoint(r.data as Checkpoint))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleGenerate = async () => {
    if (!formData.signatureDataUrl || !formData.stampFile) return;

    setSubmitting(true);
    try {
      const cp = formData.savedCheckpoint || checkpoint;
      const res = await fetch(formData.signatureDataUrl);
      const sigBlob = await res.blob();

      const fd = new FormData();
      fd.append("checkpoint_id", String(cp?.id));
      fd.append("signature", sigBlob, "signature.png");
      fd.append("stamp", formData.stampFile);

      const r = await axios.post(
        "http://127.0.0.1:8000/api/checkpoints/sign",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setResult(r.data as ResultData);
      if ((r.data as ResultData).checkpoint)
        setCheckpoint((r.data as ResultData).checkpoint!);
      setStep(4);
    } catch (error: unknown) {
      console.error("Sign error:", error);
      alert("Terjadi kesalahan saat generate dokumen");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="center-screen">
        <span className="spinner" /> Memuat data…
      </div>
    );
  if (!checkpoint)
    return <div className="center-screen">Checkpoint tidak ditemukan.</div>;

  const stepTitles = [
    "Scan Checkpoint",
    "Tanda Tangan & Stempel",
    "Rangkuman",
    "Hasil",
  ];
  const stepSubs = [
    "Verifikasi kehadiran dan ambil foto bukti",
    "Tanda tangan dan upload stempel",
    "Periksa data sebelum generate dokumen",
    "Download berita acara",
  ];

  return (
    <div className="page">
      <div className="wrap">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <div className="topbar-title">{stepTitles[step - 1]}</div>
              <div className="topbar-sub">{stepSubs[step - 1]}</div>
            </div>
          </div>
          <span className={`chip ${step === 4 ? "chip-done" : "chip-active"}`}>
            <span className="chip-dot" />
            {step === 4 ? "Selesai" : "Dalam Proses"}
          </span>
        </header>

        <StepBar step={step} />

        {step === 1 && (
          <StepScan
            checkpoint={checkpoint}
            formData={formData}
            setFormData={setFormData}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepSign
            formData={formData}
            setFormData={setFormData}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepReview
            checkpoint={checkpoint}
            formData={formData}
            setFormData={setFormData}
            onBack={() => setStep(2)}
            onNext={handleGenerate}
            submitting={submitting}
          />
        )}

        {step === 4 && (
          <StepResult
            result={result}
            checkpoint={checkpoint}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
}
