import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  PenTool,
  FileText,
  BarChart3,
  Sparkles,
  FlaskConical,
  Brain,
  PlusCircle,
  Zap,
} from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export default function Sidebar() {
  const { brands, currentBrandId, currentBrand, selectBrand, health } = useBrand();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/brand-profile', label: 'Brand Profile', icon: Building2 },
    { to: '/content-studio', label: 'AI Content Studio', icon: PenTool },
    { to: '/posts', label: 'Posts & History', icon: FileText },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/recommendations', label: 'AI Recommendations', icon: Sparkles, badge: 'Core' },
    { to: '/memory-lab', label: 'Memory Lab', icon: FlaskConical, badge: 'Demo' },
    { to: '/memory-explorer', label: 'Memory Explorer', icon: Brain },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-badge">
          <Zap size={20} />
        </div>
        <div>
          <span className="logo-text">SocialPulse</span>
          <span className="logo-pill">AI</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-category">Main Workspace</div>
        {navLinks.slice(0, 5).map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={link.to === '/'}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}

        <div className="nav-category">Intelligence & Memory</div>
        {navLinks.slice(5).map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.badge && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '999px',
                    backgroundColor: link.badge === 'Demo' ? '#f5f3ff' : '#eff6ff',
                    color: link.badge === 'Demo' ? '#7c3aed' : '#2563eb',
                  }}
                >
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="brand-switcher-card">
          <div className="brand-label">
            <span>Active Brand</span>
            <button
              onClick={() => navigate('/brand-profile')}
              title="Create new brand"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              <PlusCircle size={13} />
              <span>New</span>
            </button>
          </div>

          {brands.length > 0 ? (
            <select
              className="brand-select"
              value={currentBrandId || ''}
              onChange={(e) => selectBrand(e.target.value)}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.industry})
                </option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No brands found. Click + New.
            </div>
          )}

          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Memory Backend:</span>
            <span
              style={{
                fontWeight: 600,
                color: health?.memory_backend === 'hindsight' ? '#16a34a' : '#475569',
              }}
            >
              {health?.memory_backend || 'local-fallback'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
