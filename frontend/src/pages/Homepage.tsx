import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import React from "react";
import {
  FileScan,
  QrCode,
  MapPin,
  UserCheck,
  PenTool,
  Shield,
  Upload,
  CheckCircle2,
  Users,
  DollarSign,
  Eye,
  Lock,
  Database,
  Activity,
  BarChart3,
  TrendingUp,
  FileCheck,
  Fingerprint,
  Globe,
  ChevronRight,
  Play,
  ArrowRight,
  Building2,
  Mail,
  Phone,
  Menu,
  X,
  Stamp,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Homepage.css";

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = ["Beranda", "Fitur", "Alur Kerja", "Keamanan", "Kontak"];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || isMobileMenuOpen
          ? "bg-white/95 backdrop-blur-xl shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#B71C1C] to-[#D32F2F] rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <FileScan className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <span
                className={`font-bold text-lg sm:text-xl block truncate ${isScrolled || isMobileMenuOpen ? "text-[#212121]" : "text-white"}`}
              >
                DinasKu
              </span>
              <p
                className={`text-[11px] sm:text-xs truncate ${isScrolled || isMobileMenuOpen ? "text-gray-500" : "text-white/70"}`}
              >
                Sistem Perjalanan Dinas Digital
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                className={`font-medium transition-colors hover:text-[#D32F2F] ${
                  isScrolled || isMobileMenuOpen ? "text-gray-700" : "text-white/90"
                }`}
              >
                {item}
              </a>
            ))}
            <button className="px-5 py-2.5 bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105">
              Minta Demo
            </button>
          </div>

          <button
            className="lg:hidden p-2 flex-shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Buka menu"
          >
            {isMobileMenuOpen ? (
              <X className={isScrolled || isMobileMenuOpen ? "text-gray-700" : "text-white"} />
            ) : (
              <Menu className={isScrolled || isMobileMenuOpen ? "text-gray-700" : "text-white"} />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white overflow-hidden rounded-none shadow-lg"
          >
            <div className="px-4 sm:px-6 py-4 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                  className="block text-gray-700 font-medium hover:text-[#D32F2F]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <button className="w-full px-5 py-2.5 bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] text-white rounded-lg font-medium">
                Minta Demo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((p) => (p + 1) % 5), 3000);
    return () => clearInterval(interval);
  }, []);

  // Fewer, more contained floating elements; kept within bounds so they
  // never push the page wider than the viewport on mobile.
  const FLOATING_ELEMENTS = [...Array(8)].map((_, i) => ({
    id: i,
    left: 15 + ((i * 11) % 70),
    top: 10 + ((i * 17) % 70),
    duration: 3 + (i % 5) * 0.5,
    delay: (i % 4) * 0.5,
    yOffset: -40 - (i % 5) * 15,
  }));

  const heroFeatures = [
    { icon: FileScan, label: "OCR Dokumen" },
    { icon: QrCode, label: "QR Unik" },
    { icon: MapPin, label: "GPS Otomatis" },
    { icon: UserCheck, label: "Validasi Wajah" },
    { icon: PenTool, label: "TTD Digital" },
  ];

  const workflowSteps = [
    { step: 1, title: "Upload", desc: "Scan dokumen" },
    { step: 2, title: "Ekstrak", desc: "OCR otomatis" },
    { step: 3, title: "Verifikasi", desc: "Checkpoint" },
    { step: 4, title: "Tandatangan", desc: "TTD digital" },
    { step: 5, title: "Selesai", desc: "Rekam jejak" },
  ];

  return (
    <section id="beranda" className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#B71C1C] via-[#8B0000] to-[#4A0000]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 sm:left-20 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 sm:right-20 w-56 sm:w-80 h-56 sm:h-80 bg-[#D32F2F]/20 rounded-full blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        {/* Floating dots: hidden on small screens to avoid clutter/overflow */}
        <div className="hidden sm:block">
          {FLOATING_ELEMENTS.map((el) => (
            <motion.div
              key={el.id}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{ left: `${el.left}%`, top: `${el.top}%` }}
              animate={{ y: [0, el.yOffset], opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: el.duration,
                repeat: Infinity,
                delay: el.delay,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 sm:pb-20 lg:pt-40">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center max-w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6"
            >
              <Shield className="w-4 h-4 text-[#FFCDD2] mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-white/90 font-medium truncate">
                DISPERMADES Provinsi Jawa Tengah
              </span>
            </motion.div>

            <h1 className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Digitalisasi{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFCDD2] to-[#EF9A9A]">
                Surat Perjalanan Dinas
              </span>{" "}
              yang Transparan
            </h1>

            <p className="text-base sm:text-lg text-white/75 mb-8 leading-relaxed max-w-lg">
              Digitalisasi Surat Perjalanan Dinas dengan verifikasi real-time
              untuk mendukung transparansi, akuntabilitas, dan integritas
              anggaran.
            </p>

            <div className="flex flex-wrap gap-2 mb-10">
              {heroFeatures.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full"
                >
                  <feature.icon className="w-3.5 h-3.5 mr-1.5 text-[#FFCDD2] flex-shrink-0" />
                  <span className="text-sm text-white font-medium whitespace-nowrap">
                    {feature.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link
                  to="/scan"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-[#B71C1C] rounded-xl font-semibold shadow-2xl transition-all flex items-center justify-center group"
                >
                  Lihat Demo Sistem
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Cara Kerja
              </motion.button>
            </div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative max-w-md mx-auto w-full lg:max-w-none"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6 gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#B71C1C] to-[#D32F2F] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      Dasbor DinasKu
                    </p>
                    <p className="text-white/60 text-sm truncate">
                      Pemantauan real-time
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-[#2E7D32]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFC107]" />
                  <div className="w-3 h-3 rounded-full bg-[#D32F2F]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                {[
                  {
                    label: "Total SPD",
                    value: "1.247",
                    change: "bulan ini",
                    color: "#ffffff",
                  },
                  {
                    label: "Aktif",
                    value: "89",
                    change: "sedang berjalan",
                    color: "#ffffff",
                  },
                  {
                    label: "Selesai",
                    value: "1.102",
                    change: "terverifikasi",
                    color: "#ffffff",
                  },
                  {
                    label: "Menunggu",
                    value: "56",
                    change: "perlu tindakan",
                    color: "#ffffff",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 min-w-0"
                  >
                    <p className="text-white/60 text-sm truncate">
                      {stat.label}
                    </p>
                    <div className="flex items-end justify-between mt-1 gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        {stat.value}
                      </span>
                      <span
                        className="text-[11px] px-2 py-1 rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor: `${stat.color}20`,
                          color: stat.color,
                        }}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <p className="text-white/80 font-medium text-sm">
                    Verifikasi per bulan
                  </p>
                  <TrendingUp className="w-4 h-4 text-[#2E7D32] flex-shrink-0" />
                </div>
                <div className="flex items-end space-x-1.5 sm:space-x-2 h-16">
                  {[40, 55, 45, 65, 60, 75, 85, 70, 90, 95].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-[#B71C1C] to-[#D32F2F] rounded-t-sm"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    />
                  ))}
                </div>
              </div>
            </div>


            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -right-2 sm:-right-4 top-14 sm:top-16 bg-white rounded-xl p-2.5 sm:p-3 shadow-2xl max-w-[170px] sm:max-w-[200px] z-20"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#E8F5E9] rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#2E7D32]" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 font-semibold text-xs sm:text-sm">
                    Terverifikasi
                  </p>
                  <p className="text-gray-500 text-[11px] sm:text-xs truncate">
                    Checkpoint IV · Semarang
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -left-2 sm:-left-4 bottom-16 sm:bottom-24 bg-white rounded-xl p-2.5 sm:p-3 shadow-2xl max-w-[170px] sm:max-w-[200px] z-20"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#FFEBEE] rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#B71C1C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 font-semibold text-xs sm:text-sm">
                    GPS tercatat
                  </p>
                  <p className="text-gray-500 text-[11px] sm:text-xs">-7.0051, 110.4381</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Workflow steps */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-14 sm:mt-20"
        >
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-3 lg:gap-0">
            {workflowSteps.map((item, i) => (
              <div key={item.step} className="flex items-center min-w-0">
                <motion.div
                  className={`relative w-full px-4 sm:px-5 py-3 rounded-xl border transition-all ${activeStep === i ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10"}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${activeStep === i ? "bg-white text-[#B71C1C]" : "bg-white/10 text-white"}`}
                    >
                      {item.step}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {item.title}
                      </p>
                      <p className="text-white/60 text-xs truncate">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
                {i < workflowSteps.length - 1 && (
                  <ChevronRight className="hidden lg:block w-5 h-5 text-white/30 mx-1 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Problem ──────────────────────────────────────────────────────────────────
function ProblemSection() {
  const problems = [
    {
      icon: PenTool,
      title: "Tanda Tangan Rentan Dipalsukan",
      description:
        "Persetujuan berbasis kertas sulit diverifikasi keasliannya dan mudah dimanipulasi.",
      color: "#B71C1C",
    },
    {
      icon: UserCheck,
      title: "Tidak Ada Bukti Kehadiran",
      description:
        "Tidak ada cara yang andal untuk membuktikan pegawai benar-benar berada di lokasi tujuan.",
      color: "#D32F2F",
    },
    {
      icon: Users,
      title: "Data Pelaksana Tidak Cocok",
      description:
        "Pegawai yang tercantum di dokumen bisa berbeda dengan yang benar-benar menjalankan tugas.",
      color: "#F57C00",
    },
    {
      icon: Eye,
      title: "Pemantauan Sulit Dilakukan",
      description:
        "Progress perjalanan dan penyelesaian checkpoint tidak dapat dipantau secara langsung.",
      color: "#FBC02D",
    },
    {
      icon: DollarSign,
      title: "Potensi Penyimpangan Anggaran",
      description:
        "Klaim perjalanan dinas sulit divalidasi karena minimnya bukti digital yang terstruktur.",
      color: "#E64A19",
    },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="masalah"
      className="py-12 sm:py-24 bg-gradient-to-b from-[#F5F5F5] to-white overflow-x-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-[#FFEBEE] text-[#B71C1C] rounded-full text-sm font-semibold mb-4">
            Masalah yang diselesaikan
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#212121] mb-4">
            Kendala perjalanan dinas konvensional
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Proses berbasis kertas membuka celah manipulasi dan menyulitkan
            pengawasan anggaran.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all border border-gray-100"
            >
              <div
                className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
                style={{ backgroundColor: problem.color }}
              />
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${problem.color}12` }}
              >
                <problem.icon
                  className="w-7 h-7"
                  style={{ color: problem.color }}
                />
              </div>
              <h3 className="text-lg font-bold text-[#212121] mb-2">
                {problem.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Workflow ─────────────────────────────────────────────────────────────────
function WorkflowSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeWorkflow, setActiveWorkflow] = useState(0);

  const workflows = [
    {
      step: 1,
      title: "Upload Dokumen SPD",
      icon: Upload,
      color: "#B71C1C",
      description:
        "Pengguna mengunggah dokumen SPD. Sistem mengekstrak data secara otomatis lewat OCR.",
      details: [
        "Nomor SPD & ID Perjalanan Dinas",
        "Data Pelaksana (Nama, NIP, Jabatan)",
        "Tujuan Perjalanan Dinas",
        "Susunan Checkpoint & Status Verifikasi",
      ],
      output: [
        "Data terstruktur tersimpan",
        "Checkpoint dibuat otomatis",
        "ID perjalanan unik diterbitkan",
      ],
    },
    {
      step: 2,
      title: "Penerbitan QR Code",
      icon: QrCode,
      color: "#D32F2F",
      description:
        "Sistem menerbitkan QR Code unik sebagai identitas digital surat perjalanan dinas.",
      details: [
        "ID Perjalanan Dinas",
        "Data Pelaksana",
        "Daftar Checkpoint",
        "Status Verifikasi",
      ],
      output: [
        "QR Code terenkripsi",
        "Dapat dipindai via kamera",
        "Terhubung ke sistem pusat",
      ],
    },
    {
      step: 3,
      title: "Verifikasi di Lapangan",
      icon: MapPin,
      color: "#2E7D32",
      description:
        "Petugas memindai QR Code di lokasi tujuan untuk melakukan verifikasi checkpoint.",
      details: [
        "Pencocokan nama & NIP",
        "Foto wajah pelaksana",
        "Deteksi jumlah orang",
        "GPS otomatis",
      ],
      output: [
        "Foto bukti kehadiran",
        "Koordinat GPS tercatat",
        "Timestamp tersimpan",
      ],
    },
    {
      step: 4,
      title: "Tanda Tangan & Stempel Digital",
      icon: Stamp,
      color: "#1565C0",
      description:
        "Pejabat setempat menandatangani secara digital dan mengunggah stempel resmi.",
      details: [
        "Tanda tangan digital",
        "Upload stempel dinas",
        "Finalisasi dokumen checkpoint",
      ],
      output: [
        "Dokumen checkpoint tervalidasi",
        "Hash verifikasi tersimpan",
        "Jejak digital terbentuk",
      ],
    },
    {
      step: 5,
      title: "Pemantauan & Rekap",
      icon: BarChart3,
      color: "#7B1FA2",
      description:
        "Semua aktivitas checkpoint tersimpan terpusat dan dapat dipantau kapan saja.",
      details: [
        "Checkpoint selesai & tertunda",
        "Riwayat verifikasi",
        "Persentase progress",
        "Riwayat lokasi",
      ],
      output: ["Jejak audit lengkap", "Laporan kepatuhan", "Dasbor analitik"],
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWorkflow((prev) => (prev + 1) % workflows.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="alur-kerja"
      className="py-12 sm:py-24 bg-[#212121] relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
        ref={ref}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-white/10 text-white/90 rounded-full text-sm font-semibold mb-4">
            Alur Kerja
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Cara Kerja Sistem
          </h2>
          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
            5 langkah dari unggah dokumen hingga rekam jejak audit lengkap.
          </p>
        </motion.div>

        {/* Progress Stepper */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div className="hidden lg:flex items-center space-x-2">
            {workflows.map((w, i) => (
              <div key={w.step} className="flex items-center">
                <motion.button
                  onClick={() => setActiveWorkflow(i)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    activeWorkflow === i
                      ? "scale-110 shadow-xl"
                      : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor:
                      activeWorkflow === i ? w.color : "rgba(255,255,255,0.1)",
                    color: activeWorkflow === i ? "#ffffff" : "#e5e5e5",
                    boxShadow:
                      activeWorkflow === i ? `0 0 25px ${w.color}80` : "none",
                    border:
                      activeWorkflow === i
                        ? "none"
                        : `2px solid rgba(255,255,255,0.15)`,
                  }}
                >
                  {w.step}
                </motion.button>
                {i < workflows.length - 1 && (
                  <div
                    className={`w-14 h-0.5 rounded-full transition-all ${
                      activeWorkflow > i ? "bg-white" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile dots */}
        <div className="lg:hidden flex justify-center gap-2 mb-8">
          {workflows.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveWorkflow(i)}
              aria-label={`Lihat langkah ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                activeWorkflow === i ? "bg-white scale-125" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeWorkflow}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="grid lg:grid-cols-12 gap-8 items-center"
          >
            {/* === LEFT CARD (Visual) === */}
            <div className="lg:col-span-5 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-8 border border-white/10 flex flex-col items-center">
              <div className="relative mb-8 sm:mb-10">
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="relative"
                >
                  <div
                    className="w-28 h-28 sm:w-40 sm:h-40 rounded-3xl flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${workflows[activeWorkflow].color}25`,
                    }}
                  >
                    {React.createElement(workflows[activeWorkflow].icon, {
                      className: "w-14 h-14 sm:w-20 sm:h-20",
                      style: { color: workflows[activeWorkflow].color },
                    })}
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-[#212121] shadow-2xl text-lg ring-4 ring-zinc-900"
                  >
                    {workflows[activeWorkflow].step}
                  </motion.div>
                </motion.div>
              </div>

              <div className="w-full max-w-[260px] space-y-3">
                {workflows[activeWorkflow].output.map((output, i) => (
                  <motion.div
                    key={output}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: workflows[activeWorkflow].color }}
                    />
                    <span className="text-white/80 text-[15px]">{output}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* === RIGHT CONTENT === */}
            <div className="lg:col-span-7">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
                Langkah {workflows[activeWorkflow].step}:{" "}
                {workflows[activeWorkflow].title}
              </h3>
              <p className="text-white/65 mb-8 text-base leading-relaxed">
                {workflows[activeWorkflow].description}
              </p>

              <div className="space-y-3">
                {workflows[activeWorkflow].details.map((detail, i) => (
                  <motion.div
                    key={detail}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-start gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-5 py-4"
                  >
                    <div
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: workflows[activeWorkflow].color,
                      }}
                    />
                    <span className="text-white/85 text-[15px] leading-relaxed">
                      {detail}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Solutions / Features ─────────────────────────────────────────────────────
function SolutionsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const solutions = [
    {
      icon: FileScan,
      title: "OCR Dokumen Otomatis",
      description: "Ekstraksi data dari dokumen SPD tanpa input manual.",
      color: "#B71C1C",
    },
    {
      icon: QrCode,
      title: "Identitas Perjalanan Digital",
      description: "QR Code unik per SPD sebagai kunci verifikasi di lapangan.",
      color: "#D32F2F",
    },
    {
      icon: UserCheck,
      title: "Validasi Wajah Pelaksana",
      description: "Foto wajah diambil saat checkpoint untuk bukti kehadiran.",
      color: "#C62828",
    },
    {
      icon: Activity,
      title: "Dasbor Pemantauan",
      description:
        "Pantau semua perjalanan aktif dan statusnya secara langsung.",
      color: "#7B1FA2",
    },
    {
      icon: Database,
      title: "Rekam Jejak Audit",
      description: "Setiap aksi tercatat dan tidak dapat diubah.",
      color: "#00897B",
    },
    {
      icon: Shield,
      title: "Deteksi Anomali",
      description: "Sistem memberi peringatan jika ada ketidaksesuaian data.",
      color: "#F57C00",
    },
    {
      icon: BarChart3,
      title: "Laporan & Ekspor",
      description: "Ekspor rekap perjalanan dalam format yang dibutuhkan.",
      color: "#1565C0",
    },
    {
      icon: Globe,
      title: "Verifikasi Berbasis Kamera",
      description: "Scan QR dan ambil foto langsung dari browser mobile.",
      color: "#2E7D32",
    },
    {
      icon: Lock,
      title: "Kontrol Akses Berlapis",
      description: "Hak akses disesuaikan per peran: admin, petugas, KPA.",
      color: "#6A1B9A",
    },
  ];

  return (
    <section id="fitur" className="py-12 sm:py-24 bg-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-[#FFEBEE] text-[#B71C1C] rounded-full text-sm font-semibold mb-4">
            Fitur
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#212121] mb-4">
            Apa yang Dikerjakan Sistem
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Modul yang saling terintegrasi untuk menutupi celah dalam
            pengelolaan perjalanan dinas.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {solutions.map((solution, i) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -6 }}
              className="group relative bg-white rounded-2xl p-6 sm:p-7 shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
            >
              <div
                className="absolute -top-10 -right-10 w-20 h-20 rounded-full opacity-[0.08] group-hover:opacity-[0.15] transition-all"
                style={{ backgroundColor: solution.color }}
              />
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${solution.color}12` }}
              >
                <solution.icon
                  className="w-6 h-6"
                  style={{ color: solution.color }}
                />
              </div>
              <h3 className="text-base font-bold text-[#212121] mb-1">
                {solution.title}
              </h3>
              <p className="text-gray-500 text-sm">{solution.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Evidence / Accountability ────────────────────────────────────────────────
function BudgetSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const [count3, setCount3] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const animate = (setter: (v: number) => void, end: number) => {
      const duration = 2000;
      let startTime: number;
      const step = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setter(Math.floor(progress * end));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    animate(setCount3, 100);
  }, [isInView]);

  const evidenceTypes = [
    { label: "Koordinat GPS", value: "Lokasi terverifikasi" },
    { label: "Timestamp", value: "Waktu kedatangan" },
    { label: "Foto Wajah", value: "Identitas pelaksana" },
    { label: "Foto Lokasi", value: "Dokumentasi visual" },
    { label: "Tanda Tangan Digital", value: "Persetujuan pejabat" },
    { label: "Log Checkpoint", value: "Rekam jejak aktivitas" },
  ];

  return (
    <section
      className="py-12 sm:py-24 bg-gradient-to-br from-[#B71C1C] via-[#8B0000] to-[#4A0000] relative overflow-hidden"
      ref={sectionRef}
    >
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-4">
            Akuntabilitas
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Bukti Digital di Setiap Klaim
          </h2>
          <p className="text-base sm:text-lg text-white/65 max-w-2xl mx-auto">
            Setiap perjalanan dinas menghasilkan bukti digital yang terverifikasi, jauh lebih kuat dari sekadar tanda tangan di atas kertas.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-5 mb-12 sm:mb-14">
          {[
            {
              count: count3,
              suffix: "%",
              label: "Paperless",
              note: "proses verifikasi berbasis digital",
            },
            {
              count: null,
              static: "24/7",
              label: "Sistem Aktif",
              note: "pemantauan terus-menerus",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                {item.static ?? `${item.count}${item.suffix}`}
              </div>
              <div className="text-white font-medium text-sm">{item.label}</div>
              <div className="text-white/50 text-xs mt-1">{item.note}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/20"
        >
          <h3 className="text-lg sm:text-xl font-bold text-white mb-6 text-center">
            Jenis Bukti yang Dikumpulkan per Checkpoint
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidenceTypes.map((evidence, i) => (
              <motion.div
                key={evidence.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.7 + i * 0.05 }}
                className="flex items-center space-x-3 bg-white/5 rounded-xl p-4 min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFCDD2]/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#FFCDD2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">
                    {evidence.label}
                  </p>
                  <p className="text-white/50 text-xs">{evidence.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────
function SecuritySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const securityAspects = [
    {
      title: "Enkripsi Data",
      description: "Data tersimpan dan berpindah dalam kondisi terenkripsi.",
      icon: Lock,
    },
    {
      title: "Autentikasi Berlapis",
      description:
        "Akses sistem diamankan dengan verifikasi identitas berlapis.",
      icon: Fingerprint,
    },
    {
      title: "Zero-Trust Access",
      description:
        "Setiap permintaan akses diverifikasi terlepas dari lokasi pengguna.",
      icon: Shield,
    },
    {
      title: "Standar Kepatuhan",
      description: "Mengikuti prinsip keamanan data untuk sistem pemerintahan.",
      icon: FileCheck,
    },
  ];

  return (
    <section
      id="keamanan"
      className="py-12 sm:py-24 bg-gradient-to-b from-white to-gray-50 overflow-x-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-[#E8F5E9] text-[#2E7D32] rounded-full text-sm font-semibold mb-4">
            Keamanan
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#212121] mb-4">
            Keamanan Sistem
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Dibangun dengan prinsip keamanan yang sesuai untuk sistem
            pengelolaan data pemerintah daerah.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 mb-12 sm:mb-14">
          {securityAspects.map((aspect, i) => (
            <motion.div
              key={aspect.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 sm:p-7 shadow-md border border-gray-100 flex items-start space-x-5"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#43A047] flex items-center justify-center flex-shrink-0">
                <aspect.icon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#212121] mb-1">
                  {aspect.title}
                </h3>
                <p className="text-gray-500 text-sm">{aspect.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-12 sm:py-24 bg-gradient-to-br from-[#B71C1C] via-[#8B0000] to-[#4A0000] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative"
        ref={ref}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5">
            Mulai Digitalisasi SPD di Instansi Anda
          </h2>
          <p className="text-base sm:text-lg text-white/70 mb-10 max-w-xl mx-auto">
            Hubungi tim kami untuk menjadwalkan demo atau diskusi kebutuhan
            implementasi.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[#B71C1C] rounded-xl font-semibold shadow-2xl transition-all"
            >
              Jadwalkan Demo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
            >
              Hubungi Administrator
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const footerLinks = ["Beranda", "Fitur", "Alur Kerja", "Keamanan", "Kontak"];

  return (
    <footer className="bg-[#212121] text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
          <div>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-[#B71C1C] to-[#D32F2F] rounded-lg flex items-center justify-center flex-shrink-0">
                <FileScan className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl">DinasKu</span>
                <p className="text-xs text-gray-400">
                  Perjalanan Dinas Digital
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-2">
              Dinas Pemberdayaan Masyarakat dan Desa
            </p>
            <p className="text-gray-500 text-sm">Provinsi Jawa Tengah</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Navigasi</h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(/\s/g, "-")}`}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Kontak</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 text-gray-400">
                <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Jl. Pahlawan No. 9, Semarang</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">(024) 8311 174</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 min-w-0">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">
                  dispermades@jatengprov.go.id
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Hukum & Kebijakan</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Kebijakan Privasi</li>
              <li>Syarat Penggunaan</li>
              <li>Perlindungan Data</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-gray-500 text-sm">
            © 2024 DISPERMADES Provinsi Jawa Tengah. Hak cipta dilindungi.
          </p>
          <p className="text-gray-600 text-sm">
            Sistem Informasi Perjalanan Dinas Digital
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Homepage ──────────────────────────────────────────────────────────────────────
function Homepage() {
  return (
    <div className="font-sans antialiased overflow-x-hidden w-full">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <WorkflowSection />
      <SolutionsSection />
      <BudgetSection />
      <SecuritySection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default Homepage;