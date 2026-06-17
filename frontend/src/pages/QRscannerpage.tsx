import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import "./QRScannerPage.css";

type ScanState = "idle" | "scanning" | "found" | "error";

interface ScanResult {
  token: string;
  raw: string;
}

interface CheckpointData {
  id: number;
  lokasi: string;
  jenis: string;
  urutan: number;
  qr_url: string | null;
  status: string;
}

const parseToken = (raw: string): string => {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    for (const prefix of ["scan", "checkpoint"]) {
      const idx = parts.indexOf(prefix);
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
    const last = parts[parts.length - 1];
    if (last) return last;
  } catch {
    // not a URL — use as-is
  }
  return trimmed;
};

const SCANNER_ID = "qrs-html5-scanner";
const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function QRScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualToken, setManualToken] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [checkpoint, setCheckpoint] = useState<CheckpointData | null>(null);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);

  // ── Upload QR from image state ─────────────────────────────
  const [uploadDecoding] = useState(false);
  const [uploadDecodeError, setUploadDecodeError] = useState("");

  // ── Stop scanner ───────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const s = scannerRef.current.getState();
      if (s === 2 || s === 3) await scannerRef.current.stop();
    } catch {
      /* ignore */
    }
    try {
      scannerRef.current.clear();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
  }, []);

  // ── Fetch checkpoint by token ──────────────────────────────
  const fetchCheckpoint = useCallback(async (token: string) => {
    setLoadingCheckpoint(true);
    setCheckpoint(null);
    try {
      const res = await fetch(`${API_URL}/api/checkpoints/token/${token}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setCheckpoint(data);
    } catch {
      setCheckpoint(null);
    } finally {
      setLoadingCheckpoint(false);
    }
  }, []);

  // ── Decode QR from uploaded image, then navigate ───────────
  const handleUploadQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      console.log("FILE:", file);

      const html5QrCode = new Html5Qrcode("temp-reader");

      const decodedText = await html5QrCode.scanFile(file, true);

      console.log("DECODED:", decodedText);

      const token = parseToken(decodedText);

      if (!token) {
        alert("Token QR tidak ditemukan");
        return;
      }

      navigate(`/checkpoint/${token}`);
    } catch (err) {
      console.error("SCAN FILE ERROR:", err);

      alert("QR tidak dapat dibaca");
    }
  };

  // ── Start scanner ──────────────────────────────────────────
  const startScanner = useCallback(async () => {
    setState("scanning");
    setErrorMsg("");
    setResult(null);
    setCheckpoint(null);
    setUploadDecodeError("");

    await new Promise((r) => setTimeout(r, 80));

    try {
      const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "user" },
        {
          fps: 5,
        },
        async (decodedText: string) => {
          console.log("QR DETECTED:", decodedText);

          const token = parseToken(decodedText);

          await stopScanner();

          navigate(`/checkpoint/${token}`);
        },
        (errorMessage) => {
          console.log(errorMessage);
        },
      );
    } catch (e: unknown) {
      await stopScanner();
      const msg =
        e instanceof Error && e.message.toLowerCase().includes("permission")
          ? "Izin kamera ditolak. Buka pengaturan browser dan izinkan akses kamera."
          : e instanceof Error && e.message
            ? `Kamera tidak dapat dibuka: ${e.message}`
            : "Kamera tidak dapat diakses. Pastikan perangkat memiliki kamera.";
      setErrorMsg(msg);
      setState("error");
    }
  }, [stopScanner, fetchCheckpoint]);

  const goToCheckpoint = (token: string) => navigate(`/checkpoint/${token}`);

  const handleManualSubmit = () => {
    const raw = manualToken.trim();
    if (!raw) return;
    goToCheckpoint(parseToken(raw));
  };

  // ── Reset ──────────────────────────────────────────────────
  const reset = useCallback(async () => {
    await stopScanner();
    setResult(null);
    setCheckpoint(null);
    setErrorMsg("");
    setShowManual(false);
    setManualToken("");
    setUploadDecodeError("");
    setState("idle");
  }, [stopScanner]);

  useEffect(
    () => () => {
      stopScanner();
    },
    [stopScanner],
  );

  return (
    <div className="qrs-page">
      {/* Hidden file input for upload QR */}
      <input
        ref={uploadFileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUploadQr}
      />

      <div className="qrs-wrap">
        <div id="temp-reader" style={{ display: "none" }} />
        {/* ── TOPBAR ── */}
        <header className="qrs-topbar">
          <div className="qrs-topbar-left">
            <div className="qrs-topbar-icon">
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
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h1v1h-1zM18 14h3M14 18h1M18 18h3M14 21h1M17 17h1v1h-1z" />
              </svg>
            </div>
            <div className="qrs-topbar-text">
              <div className="qrs-topbar-title">Scan QR Checkpoint</div>
              <div className="qrs-topbar-sub">
                Arahkan kamera ke QR Code pada surat
              </div>
            </div>
          </div>
          <span
            className={`qrs-chip ${
              state === "found"
                ? "qrs-chip--done"
                : state === "error"
                  ? "qrs-chip--error"
                  : state === "scanning"
                    ? "qrs-chip--scanning"
                    : "qrs-chip--idle"
            }`}
          >
            <span className="qrs-chip-dot" />
            {state === "found"
              ? "Terdeteksi"
              : state === "error"
                ? "Gagal"
                : state === "scanning"
                  ? "Memindai…"
                  : "Siap"}
          </span>
        </header>

        {/* ── BODY ── */}
        <div className="qrs-body">
          {/* ── LEFT: viewfinder ── */}
          <div className="qrs-col qrs-col--cam">
            <div className="qrs-card qrs-card--cam">
              {/* IDLE */}
              {state === "idle" && (
                <div className="qrs-idle">
                  <div className="qrs-idle-icon">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <path d="M14 14h1v1h-1zM18 14h3M14 18h1M18 18h3M14 21h1M17 17h1v1h-1z" />
                    </svg>
                  </div>
                  <p className="qrs-idle-title">Kamera belum aktif</p>
                  <p className="qrs-idle-sub">
                    Scan langsung lewat kamera atau upload foto QR Code
                  </p>

                  {/* ── 2 opsi ── */}
                  <div className="qrs-idle-actions">
                    <button className="qrs-btn-primary" onClick={startScanner}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Mulai Scan
                    </button>
                    <button
                      className="qrs-btn-ghost qrs-btn-upload-idle"
                      onClick={() => uploadFileRef.current?.click()}
                      disabled={uploadDecoding}
                    >
                      {uploadDecoding ? (
                        <>
                          <span className="qrs-upload-spinner" />
                          Membaca QR…
                        </>
                      ) : (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <path d="M14 14h1v1h-1zM18 14h3M14 18h1M18 18h3M14 21h1M17 17h1v1h-1z" />
                            <path d="M19 19v-3m0 0l-2 2m2-2l2 2" />
                          </svg>
                          Upload QR
                        </>
                      )}
                    </button>
                  </div>

                  {/* Decode error feedback */}
                  {uploadDecodeError && (
                    <div className="qrs-upload-decode-error">
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
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {uploadDecodeError}
                    </div>
                  )}
                </div>
              )}

              {/* SCANNING */}
              {state === "scanning" && (
                <div className="qrs-viewfinder">
                  <div id={SCANNER_ID} className="qrs-h5scanner" />
                  <div className="qrs-cam-controls">
                    <button
                      className="qrs-ctrl-btn qrs-ctrl-btn--stop"
                      onClick={reset}
                      title="Hentikan kamera"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* FOUND */}
              {state === "found" && result && (
                <div className="qrs-found">
                  <div className="qrs-found-icon">
                    <svg
                      width="32"
                      height="32"
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
                  <p className="qrs-found-title">QR Code Terdeteksi!</p>

                  {/* QR Image */}
                  <div className="qrs-found-qrwrap">
                    {loadingCheckpoint ? (
                      <div className="qrs-found-qrskeleton" />
                    ) : checkpoint?.qr_url ? (
                      <>
                        <div className="qrs-found-qrframe">
                          <img
                            src={checkpoint.qr_url}
                            alt="QR Code"
                            className="qrs-found-qrimg"
                          />
                        </div>
                        <a
                          href={checkpoint.qr_url}
                          download={`qr-checkpoint-${checkpoint.urutan ?? ""}.svg`}
                          className="qrs-btn-ghost qrs-btn-download"
                          target="_blank"
                          rel="noreferrer"
                        >
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
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Unduh QR
                        </a>
                      </>
                    ) : (
                      !loadingCheckpoint && (
                        <div className="qrs-found-qrplaceholder">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <path d="M14 14h1v1h-1zM18 14h3M14 18h1M18 18h3M14 21h1M17 17h1v1h-1z" />
                          </svg>
                          <span>QR tidak tersedia</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Checkpoint info */}
                  {checkpoint && (
                    <div className="qrs-found-info">
                      <div className="qrs-found-info-row">
                        <span className="qrs-found-info-label">Lokasi</span>
                        <span className="qrs-found-info-val">
                          {checkpoint.lokasi}
                        </span>
                      </div>
                      <div className="qrs-found-info-row">
                        <span className="qrs-found-info-label">Jenis</span>
                        <span className="qrs-found-info-val qrs-found-info-badge">
                          {checkpoint.jenis}
                        </span>
                      </div>
                      <div className="qrs-found-info-row">
                        <span className="qrs-found-info-label">Urutan</span>
                        <span className="qrs-found-info-val">
                          Checkpoint {checkpoint.urutan}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Token */}
                  <div className="qrs-found-token">
                    <span className="qrs-found-token-label">Token</span>
                    <code className="qrs-found-token-val">{result.token}</code>
                  </div>

                  {result.raw !== result.token && (
                    <div className="qrs-found-token" style={{ opacity: 0.55 }}>
                      <span className="qrs-found-token-label">Raw QR</span>
                      <code
                        className="qrs-found-token-val"
                        style={{ fontSize: 11 }}
                      >
                        {result.raw}
                      </code>
                    </div>
                  )}

                  <div className="qrs-found-actions">
                    <button
                      className="qrs-btn-primary"
                      onClick={() => goToCheckpoint(result.token)}
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
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      Buka Checkpoint
                    </button>
                    <button className="qrs-btn-ghost" onClick={reset}>
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
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      Scan Ulang
                    </button>
                  </div>
                </div>
              )}

              {/* ERROR */}
              {state === "error" && (
                <div className="qrs-error">
                  <div className="qrs-error-icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <p className="qrs-error-title">Kamera tidak dapat dibuka</p>
                  <p className="qrs-error-msg">{errorMsg}</p>
                  <div className="qrs-idle-actions">
                    <button className="qrs-btn-primary" onClick={startScanner}>
                      Coba Lagi
                    </button>
                    <button
                      className="qrs-btn-ghost"
                      onClick={() => {
                        setState("idle");
                        setErrorMsg("");
                      }}
                    >
                      Kembali
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: info & manual ── */}
          <div className="qrs-col qrs-col--info">
            <div className="qrs-card">
              <div className="qrs-card-label">Cara Scan</div>
              <ol className="qrs-steps">
                <li className="qrs-step">
                  <div className="qrs-step-num">1</div>
                  <div className="qrs-step-text">
                    <strong>Tekan "Mulai Scan"</strong> dan izinkan akses
                    kamera, atau <strong>"Upload QR"</strong> untuk pilih gambar
                    dari galeri
                  </div>
                </li>
                <li className="qrs-step">
                  <div className="qrs-step-num">2</div>
                  <div className="qrs-step-text">
                    <strong>Arahkan kamera</strong> ke QR Code pada surat
                    perjalanan dinas
                  </div>
                </li>
                <li className="qrs-step">
                  <div className="qrs-step-num">3</div>
                  <div className="qrs-step-text">
                    <strong>Tahan diam</strong> hingga QR Code terdeteksi secara
                    otomatis
                  </div>
                </li>
                <li className="qrs-step">
                  <div className="qrs-step-num">4</div>
                  <div className="qrs-step-text">
                    <strong>Klik "Buka Checkpoint"</strong> untuk melanjutkan
                    verifikasi
                  </div>
                </li>
              </ol>
            </div>

            <div className="qrs-card">
              <div className="qrs-card-label">Tips Scan</div>
              <ul className="qrs-tips">
                {[
                  { ok: true, text: "Pastikan cahaya cukup terang" },
                  { ok: true, text: "Jarak ideal 10–30 cm dari QR Code" },
                  { ok: true, text: "Gunakan lampu flash bila gelap" },
                  { ok: false, text: "Hindari pantulan cahaya pada kertas" },
                  { ok: false, text: "Jangan goyangkan kamera terlalu cepat" },
                ].map(({ ok, text }) => (
                  <li key={text} className="qrs-tip">
                    <span
                      className={`qrs-tip-icon ${ok ? "qrs-tip-icon--ok" : "qrs-tip-icon--warn"}`}
                    >
                      {ok ? (
                        <svg
                          width="13"
                          height="13"
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
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="qrs-card">
              <div className="qrs-card-label">Input Token Manual</div>
              {!showManual ? (
                <button
                  className="qrs-btn-ghost qrs-btn-block"
                  onClick={() => setShowManual(true)}
                >
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
                    <line x1="17" y1="10" x2="3" y2="10" />
                    <line x1="21" y1="6" x2="3" y2="6" />
                    <line x1="21" y1="14" x2="3" y2="14" />
                    <line x1="17" y1="18" x2="3" y2="18" />
                  </svg>
                  Masukkan token secara manual
                </button>
              ) : (
                <div className="qrs-manual">
                  <p className="qrs-manual-hint">
                    Masukkan token QR atau URL checkpoint yang tertera pada
                    surat.
                  </p>
                  <input
                    className="qrs-manual-input"
                    type="text"
                    placeholder="Token atau URL lengkap"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                    autoFocus
                  />
                  <div className="qrs-manual-actions">
                    <button
                      className="qrs-btn-primary"
                      onClick={handleManualSubmit}
                      disabled={!manualToken.trim()}
                    >
                      Buka Checkpoint
                    </button>
                    <button
                      className="qrs-btn-ghost"
                      onClick={() => {
                        setShowManual(false);
                        setManualToken("");
                      }}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
