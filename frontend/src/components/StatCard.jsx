import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, color = 'var(--accent-primary)', bg = 'var(--accent-light)' }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon" style={{ backgroundColor: bg, color }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
    </div>
  );
}
