import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ScanCheckpointPage.css";

interface CheckpointData {
  id: number;
  lokasi: string;
  lokasi_tujuan?: string;
  jenis: string;
  status: string;
}

type CameraMode = "environment" | "user";

export default function ScanCheckpointPage() {
  const { token } = useParams<{ token: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectingRef = useRef<boolean>(false);

  const [checkpoint, setCheckpoint] = useState<CheckpointData | null>(null);
  const [nama, setNama] = useState<string>("");
  const [nip, setNip] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("environment");
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [personCount, setPersonCount] = useState<number>(0);
  const [detecting, setDetecting] = useState<boolean>(false);
  const [jabatan, setJabatan] = useState<string>("");

  useEffect(() => {
    axios
      .get<CheckpointData>(`http://127.0.0.1:8000/api/checkpoints/token/${token}`)
      .then((r) => setCheckpoint(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
    }, console.error);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const init = async () => {
      videoRef.current?.srcObject &&
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
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
    return () => stream?.getTracks().forEach((t) => t.stop());
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
          0.8
        )
      );
      const fd = new FormData();
      fd.append("image", blob, "frame.jpg");
      const r = await axios.post<{ success: boolean; jumlah_orang?: number }>(
        "http://127.0.0.1:5000/detect-live",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (r.data?.success) setPersonCount(Number(r.data.jumlah_orang ?? 0));
    } catch (e) {
      console.error(e);
    } finally {
      detectingRef.current = false;
      setDetecting(false);
    }
  }, []);

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
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setFotoBlob(blob);
        setFotoPreview(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.9
    );
  };

  const handleSubmit = async () => {
    if (!nama) { alert("Nama wajib diisi"); return; }
    if (!nip) { alert("NIP wajib diisi"); return; }
    if (!fotoBlob) { alert("Silakan ambil foto terlebih dahulu"); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("token", token!);
      fd.append("nama", nama);
      fd.append("nip", nip);
      fd.append("jabatan", jabatan);
      fd.append("latitude", String(latitude));
      fd.append("longitude", String(longitude));
      fd.append("foto", fotoBlob, "checkpoint.jpg");
      const r = await axios.post<{ checkpoint: CheckpointData }>(
        "http://127.0.0.1:8000/api/checkpoints/scan",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setCheckpoint(r.data.checkpoint);
      window.location.href = `/checkpoint-sign/${r.data.checkpoint.id}`;
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan checkpoint");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="scp-center"><span className="scp-spinner" />Memuat data…</div>;
  if (!checkpoint) return <div className="scp-center">Checkpoint tidak ditemukan</div>;

  const selesai = checkpoint.status === "selesai" || checkpoint.status === "completed";

  return (
    <div className="scp-page">
      <div className="scp-wrap">

        {/* ── TOPBAR ── */}
        <header className="scp-topbar">
          <div className="scp-topbar-left">
            <div className="scp-topbar-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <div className="scp-topbar-text">
              <div className="scp-topbar-title">Scan Checkpoint</div>
              <div className="scp-topbar-sub">Verifikasi kehadiran petugas</div>
            </div>
          </div>
          <span className={`scp-status-chip ${selesai ? "scp-status-chip--done" : "scp-status-chip--active"}`}>
            <span className="scp-status-dot" />
            {selesai ? "Selesai" : "Aktif"}
          </span>
        </header>

        {/* ── MAIN GRID ── */}
        <div className="scp-cols">

          {/* ── LEFT ── */}
          <div className="scp-col">

            {/* Lokasi card */}
            <div className="scp-card">
              <div className="scp-card-label">Lokasi Checkpoint</div>
              <div className="scp-meta-grid">
                <div className="scp-meta-item">
                  <span className="scp-meta-key">Lokasi</span>
                  <span className="scp-meta-val">{checkpoint.lokasi}</span>
                </div>
                {checkpoint.lokasi_tujuan && (
                  <div className="scp-meta-item">
                    <span className="scp-meta-key">Tujuan</span>
                    <span className="scp-meta-val">{checkpoint.lokasi_tujuan}</span>
                  </div>
                )}
                <div className="scp-meta-item">
                  <span className="scp-meta-key">Jenis</span>
                  <span className="scp-meta-val">{checkpoint.jenis}</span>
                </div>
              </div>
            </div>

            {/* Data petugas card */}
            <div className="scp-card">
              <div className="scp-card-label">Data Petugas</div>
              <div className="scp-fields">
                <div className="scp-field-row">
                  <div className="scp-field">
                    <label className="scp-label">Nama</label>
                    <input className="scp-input" type="text" placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} />
                  </div>
                  <div className="scp-field">
                    <label className="scp-label">NIP</label>
                    <input className="scp-input" type="text" placeholder="Nomor induk" value={nip} onChange={(e) => setNip(e.target.value)} />
                  </div>
                </div>
                <div className="scp-field">
                  <label className="scp-label">Jabatan</label>
                  <input className="scp-input" type="text" placeholder="Jabatan petugas" value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
                </div>
              </div>
            </div>

            {/* GPS card */}
            {latitude && longitude && (
              <div className="scp-card scp-card--map">
                <div className="scp-card-label">Posisi GPS</div>
                <div className="scp-map-wrap">
                  <iframe
                    title="Peta lokasi"
                    src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`}
                  />
                  <div className="scp-map-pill">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="scp-col scp-col--right">
            <div className="scp-card scp-card--camera">

              {/* Camera header */}
              <div className="scp-cam-header">
                <div className="scp-card-label" style={{ marginBottom: 0 }}>Kamera</div>
                <div className="scp-toggle">
                  <button
                    className={`scp-toggle-btn ${cameraMode === "environment" ? "active" : ""}`}
                    onClick={() => setCameraMode("environment")}
                  >Belakang</button>
                  <button
                    className={`scp-toggle-btn ${cameraMode === "user" ? "active" : ""}`}
                    onClick={() => setCameraMode("user")}
                  >Depan</button>
                </div>
              </div>

              {/* Viewfinder */}
              <div className="scp-viewfinder">
                {!fotoPreview ? (
                  <video ref={videoRef} autoPlay muted playsInline className="scp-media" />
                ) : (
                  <img src={fotoPreview} alt="Preview foto" className="scp-media" />
                )}
                <div className="scp-corner scp-corner--tl" />
                <div className="scp-corner scp-corner--tr" />
                <div className="scp-corner scp-corner--bl" />
                <div className="scp-corner scp-corner--br" />
              </div>

              {/* Detection bar */}
              <div className="scp-detect-bar">
                <div className="scp-detect-left">
                  <span className={`scp-pulse ${detecting ? "active" : ""}`} />
                  <span className="scp-detect-label">{detecting ? "Mendeteksi…" : "Deteksi aktif"}</span>
                </div>
                <div className="scp-detect-right">
                  <span className="scp-count">{personCount}</span>
                  <span className="scp-count-unit">orang</span>
                </div>
              </div>

              {/* Actions */}
              <div className="scp-actions">
                {!fotoPreview ? (
                  <button className="scp-btn-secondary" onClick={capturePhoto}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4"/><path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.66-.9l.82-1.2A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                    </svg>
                    Ambil Foto
                  </button>
                ) : (
                  <button className="scp-btn-secondary" onClick={() => { setFotoBlob(null); setFotoPreview(null); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                    </svg>
                    Ambil Ulang
                  </button>
                )}
                <button className="scp-btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <><span className="scp-spinner scp-spinner--sm" />Menyimpan…</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      Simpan Checkpoint
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}