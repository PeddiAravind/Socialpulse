import React, { useState, useEffect } from 'react';
import { useBrand } from '../context/BrandContext';
import { api } from '../api/api';
import MemoryCard from '../components/MemoryCard';
import LoadingState from '../components/LoadingState';
import FeedbackPanel from '../components/FeedbackPanel';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';

export default function MemoryExplorer() {
  const { currentBrand, currentBrandId } = useBrand();

  const [memories, setMemories] = useState([]);
  const [backend, setBackend] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMemories = async () => {
    if (!currentBrandId) return;
    try {
      setLoading(true);
      const [memData, statusData] = await Promise.all([
        api.getMemories(currentBrandId),
        api.getMemoryStatus(currentBrandId).catch(() => null),
      ]);
      setMemories(memData.items || []);
      setBackend(memData.backend || statusData?.backend || '');
      setStatus(statusData);
    } catch (e) {
      console.error('Failed to load memories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [currentBrandId]);

  if (!currentBrand) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Please select or create a brand to view the Memory Explorer.</p>
      </div>
    );
  }

  // Deduplicate memories to ensure each distinct memory appears exactly once
  const uniqueMemories = Array.from(new Set(memories || []));
  const brandMemories = uniqueMemories.filter((m) => typeof m === 'string' && (m.includes('Brand profile:') || m.includes('Brand:')));
  const analyticsMemories = uniqueMemories.filter((m) => typeof m === 'string' && (m.includes('Historical observation:') || m.includes('Performance Observation:')));
  const feedbackMemories = uniqueMemories.filter((m) => typeof m === 'string' && (m.includes('Owner preference:') || m.includes('Explicit owner preference:')));
  const outcomeMemories = uniqueMemories.filter((m) => typeof m === 'string' && (m.includes('Recommendation outcome:') || m.includes('Strategy observation:')));
  const otherMemories = uniqueMemories.filter(
    (m) =>
      typeof m === 'string' &&
      !m.includes('Brand profile:') &&
      !m.includes('Brand:') &&
      !m.includes('Historical observation:') &&
      !m.includes('Performance Observation:') &&
      !m.includes('Owner preference:') &&
      !m.includes('Explicit owner preference:') &&
      !m.includes('Recommendation outcome:') &&
      !m.includes('Strategy observation:')
  );

  const backendLabel = backend === 'hindsight-cloud' ? 'Hindsight Cloud' : 'Local Fallback';

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Memory Explorer</h1>
          <p className="page-subtitle">
            All memories stored in <strong>{backendLabel}</strong> for <strong>{currentBrand.name}</strong>.
            {status?.bank_id && (
              <span style={{ marginLeft: '8px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                (Bank: {status.bank_id})
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchMemories} disabled={loading}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <LoadingState message="Retrieving persistent memories from Hindsight backend..." />
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
            {[
              { label: 'Total Memories', value: uniqueMemories.length, color: '#6366f1', bg: '#eef2ff' },
              { label: 'Brand Profile Memories', value: brandMemories.length, color: '#8b5cf6', bg: '#f5f3ff' },
              { label: 'Analytics Observations', value: analyticsMemories.length, color: '#3b82f6', bg: '#eff6ff' },
              { label: 'Owner Preferences', value: feedbackMemories.length, color: '#f59e0b', bg: '#fffbeb' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {uniqueMemories.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Brain size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>No Memories Stored Yet</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem' }}>
                Create a brand, seed historical posts, run the learning step, and submit feedback to build the memory bank.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {feedbackMemories.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#f59e0b' }}>💬</span> Owner Preference Memories ({feedbackMemories.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {feedbackMemories.map((m, i) => (
                      <MemoryCard key={i} memoryText={m} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {analyticsMemories.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#3b82f6' }}>📊</span> Analytics Observations ({analyticsMemories.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analyticsMemories.map((m, i) => (
                      <MemoryCard key={i} memoryText={m} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {brandMemories.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#8b5cf6' }}>🏢</span> Brand Profile Memories ({brandMemories.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {brandMemories.map((m, i) => (
                      <MemoryCard key={i} memoryText={m} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {outcomeMemories.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981' }}>🎯</span> Recommendation Outcomes & Strategy ({outcomeMemories.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {outcomeMemories.map((m, i) => (
                      <MemoryCard key={i} memoryText={m} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {otherMemories.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🧠</span> Other Memories ({otherMemories.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {otherMemories.map((m, i) => (
                      <MemoryCard key={i} memoryText={m} index={i} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Quick Feedback Panel */}
          <div style={{ marginTop: '32px' }}>
            <FeedbackPanel brandId={currentBrandId} onFeedbackSubmitted={fetchMemories} />
          </div>
        </>
      )}
    </div>
  );
}
