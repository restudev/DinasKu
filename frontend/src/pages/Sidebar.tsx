import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

// ── Icons ────────────────────────────────────────────────────────────────────

function IconDocuments() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function IconQR() {
  return (
    <svg
      width="18"
      height="18"
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
      <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" />
    </svg>
  );
}


function IconChevron() {
  return (
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
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconMenu() {
  return (
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
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconClose() {
  return (
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Daftar SPD",
    to: "/documents",
    icon: <IconDocuments />,
  },
  {
    label: "Unggah SPD",
    to: "/upload",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    label: "Scan QR",
    to: "/scan",
    icon: <IconQR />,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change


  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-icon">
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
            <path d="M14 2v6h6" />
            <polyline points="9 15 11 17 15 13" />
          </svg>
        </div>
        {!collapsed && (
          <div className="sb-logo-text">
            <span className="sb-logo-name">DinasKu</span>
            <span className="sb-logo-sub">Perjalanan Dinas Digital</span>
          </div>
        )}
        <button
          className="sb-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
        >
          <span
            style={{
              transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
              display: "block",
              transition: "transform .25s",
            }}
          >
            <IconChevron />
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {!collapsed && <p className="sb-nav-label">Menu Utama</p>}
        <ul className="sb-nav-list">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`sb-nav-item ${active ? "sb-nav-item--active" : ""} ${collapsed ? "sb-nav-item--collapsed" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sb-nav-icon">{item.icon}</span>
                  {!collapsed && (
                    <span className="sb-nav-label-text">{item.label}</span>
                  )}
                  {active && !collapsed && <span className="sb-nav-pip" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sb-footer">
          <div className="sb-footer-badge">
            <span className="sb-footer-dot" />
            Sistem aktif
          </div>
          <span className="sb-footer-ver">v1.0</span>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="sb-mobile-bar">
        <button
          className="sb-mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu"
        >
          <IconMenu />
        </button>
        <div className="sb-mobile-logo">
          <div className="sb-logo-icon sb-logo-icon--sm">
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <polyline points="9 15 11 17 15 13" />
            </svg>
          </div>
          <span className="sb-logo-name">DinasKu</span>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="sb-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside className={`sb-drawer ${mobileOpen ? "sb-drawer--open" : ""}`}>
        <button
          className="sb-drawer-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
        >
          <IconClose />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`sb-sidebar ${collapsed ? "sb-sidebar--collapsed" : ""}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}