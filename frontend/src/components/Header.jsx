import React from 'react';
import { useBrand } from '../context/BrandContext';
import { Building2, Activity, Sparkles, Database } from 'lucide-react';

export default function Header() {
  const { currentBrand, health } = useBrand();

  return (
    <header className="top-header">
      <div className="header-brand-info">
        <Building2 size={20} color="var(--accent-primary)" />
        <span className="header-brand-title">
          {currentBrand ? currentBrand.name : 'Select or Create Brand'}
        </span>
        {currentBrand?.industry && (
          <span className="badge badge-purple">{currentBrand.industry}</span>
        )}
      </div>

      <div className="header-badges">
  <span className="badge badge-blue">
    <Database size={12} />
    {health?.memory_backend === 'hindsight-cloud'
      ? 'Hindsight Cloud Memory'
      : 'Local Fallback Memory'}
  </span>

  <span className="badge badge-green">
    <Activity size={12} />
    FastAPI Connected
  </span>
</div>
    </header>
  );
}
