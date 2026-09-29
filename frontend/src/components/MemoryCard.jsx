import React from 'react';
import { Brain, BarChart2, Building2, MessageSquare, Sparkles } from 'lucide-react';

export default function MemoryCard({ memoryText, index }) {
  let icon = Brain;
  let typeLabel = 'Core Memory';
  let badgeClass = 'badge-purple';

  if (typeof memoryText === 'string') {
    if (memoryText.includes('Performance Observation:')) {
      icon = BarChart2;
      typeLabel = 'Analytics Observation';
      badgeClass = 'badge-blue';
    } else if (memoryText.includes('Brand:')) {
      icon = Building2;
      typeLabel = 'Brand Profile';
      badgeClass = 'badge-purple';
    } else if (memoryText.includes('Explicit owner preference:')) {
      icon = MessageSquare;
      typeLabel = 'Owner Preference';
      badgeClass = 'badge-amber';
    }
  }

  const Icon = icon;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Icon size={16} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Memory #{index + 1}
          </span>
        </div>
        <span className={`badge ${badgeClass}`}>{typeLabel}</span>
      </div>

      <div
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-primary)',
          lineHeight: '1.55',
          backgroundColor: 'var(--bg-primary)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {typeof memoryText === 'string' ? memoryText : JSON.stringify(memoryText)}
      </div>
    </div>
  );
}
