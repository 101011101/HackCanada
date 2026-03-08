import { NavLink } from "react-router-dom";

export default function BottomTabBar() {
  return (
    <div className="m-tabbar">
      <NavLink
        to="/myfarm"
        className={({ isActive }) => `m-tab${isActive ? " m-tab--on" : ""}`}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
          <path d="M8 2C8 2 4 6 4 10c0 2.2 1.8 4 4 4s4-1.8 4-4C12 6 8 2 8 2Z" />
          <line x1="8" y1="14" x2="8" y2="10" />
        </svg>
        <span className="m-tab-lbl">My Farm</span>
        <span className="m-tab-dot" />
      </NavLink>
      <button type="button" className="m-tab-add" aria-label="Add">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
          <path d="M8 2v12M2 8h12" strokeLinecap="round" />
        </svg>
      </button>
      <NavLink
        to="/myfood"
        className={({ isActive }) => `m-tab${isActive ? " m-tab--on" : ""}`}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
          <path d="M3 6h10l-1 8H4L3 6Z" />
          <path d="M6 6V4a2 2 0 0 1 4 0v2" />
        </svg>
        <span className="m-tab-lbl">My Food</span>
        <span className="m-tab-dot" />
      </NavLink>
    </div>
  );
}
