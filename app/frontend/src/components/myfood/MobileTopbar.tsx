import { Link } from "react-router-dom";

export default function MobileTopbar() {
  return (
    <div className="m-topbar">
      <Link to="/" className="m-topbar-logo" style={{ textDecoration: "none", color: "inherit" }}>
        <svg viewBox="0 0 32 32" fill="none" width="20" height="20">
          <path
            d="M16 4C16 4 8 10 8 18c0 5.5 3.6 10 8 10s8-4.5 8-10C24 10 16 4 16 4Z"
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
            opacity={0.6}
          />
          <line x1="16" y1="28" x2="16" y2="20" stroke="#fff" strokeWidth="1.5" opacity={0.6} />
        </svg>
        <span className="m-topbar-name">MyCelium</span>
        <span className="m-topbar-dot" />
      </Link>
      <div className="m-topbar-actions">
        <button
          type="button"
          className="btn btn--ghost btn--icon btn--sm"
          style={{ borderRadius: "50%", background: "rgba(255,255,255,0.1)" }}
          aria-label="Profile"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="#aaa" strokeWidth="1.5" width="14" height="14">
            <circle cx="8" cy="6" r="3" />
            <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--icon btn--sm"
          style={{ background: "rgba(255,255,255,0.1)" }}
          aria-label="Menu"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="#aaa" strokeWidth="2" width="16" height="16">
            <line x1="2" y1="4" x2="14" y2="4" />
            <line x1="2" y1="8" x2="14" y2="8" />
            <line x1="2" y1="12" x2="14" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
