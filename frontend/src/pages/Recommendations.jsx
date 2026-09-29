import React, { useState, useEffect } from 'react';
import { useBrand } from '../context/BrandContext';
import { api } from '../api/api';
import RecommendationCard from '../components/RecommendationCard';
import LoadingState from '../components/LoadingState';
import {
  Sparkles,
  Brain,
  BarChart2,
  RefreshCw,
  AlertCircle,
  History,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function Recommendations() {
  const { currentBrand, currentBrandId } = useBrand();

  const [query, setQuery] = useState('What should I post tomorrow?');
  const [currentBatch, setCurrentBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = async () => {
    if (!currentBrandId) return;
    try {
      const data = await api.getRecommendationHistory(currentBrandId);
      setHistory(data || []);
    } catch (e) {
      console.error('Failed to load recommendation history:', e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentBrandId]);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!currentBrandId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.generateRecommendations(currentBrandId, query);
      setCurrentBatch(res);
      await fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (!currentBrand) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Please select or create a brand to access AI Recommendations.</p>
      </div>
    );
  }

  const stage = currentBatch?.stage || 'cold-start';
  const stageBadge = {
    'memory-informed': { label: 'Memory-Informed (User Preferences Active)', class: 'badge-green' },
    'evidence-informed': { label: 'Evidence-Informed (Historical Analytics Active)', class: 'badge-blue' },
    'cold-start': { label: 'Cold-Start (Brand Profile Baseline)', class: 'badge-purple' },
  }[stage] || { label: stage, class: 'badge-purple' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Content Recommendations</h1>
        <p className="page-subtitle">
          Dynamic strategic guidance synthesized from brand profile, historical post analytics, and persistent Hindsight memory.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Query Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ marginBottom: '4px' }}>
              Strategy Question / Goal
            </label>
            <input
              type="text"
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What should I post tomorrow?"
              required
            />
          </div>
          <div style={{ paddingTop: '22px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 22px' }}>
              {loading ? (
                <>
                  <RefreshCw size={16} className="spinner" />
                  <span>Synthesizing Strategy...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Recommendations</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingState message="Retrieving memories, historical analytics, and evaluating 3 diverse strategy options..." />
      ) : currentBatch ? (
        <div>
          {/* Intelligence Stage & What Changed Banner */}
          <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Intelligence Stage:</span>
                <span className={`badge ${stageBadge.class}`}>{stageBadge.label}</span>
              </div>
              {currentBatch.memory_backend && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: currentBatch.memory_backend === 'hindsight-cloud' ? '#ecfdf5' : '#f1f5f9',
                    color: currentBatch.memory_backend === 'hindsight-cloud' ? '#047857' : '#475569',
                    border: `1px solid ${currentBatch.memory_backend === 'hindsight-cloud' ? '#a7f3d0' : '#cbd5e1'}`
                  }}
                >
                  Backend: {currentBatch.memory_backend === 'hindsight-cloud' ? 'Hindsight Cloud' : 'Local Fallback'}
                </span>
              )}
            </div>

            {currentBatch.what_changed && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--accent-light)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-hover)',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                }}
              >
                <strong>🔄 Why this changed:</strong> {currentBatch.what_changed}
              </div>
            )}
          </div>

          {/* Recommendation Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recommended Content Options</h2>
            {currentBatch.recommendations?.map((rec, idx) => (
              <RecommendationCard
                key={idx}
                rec={rec}
                index={idx}
                recId={currentBatch.recommendation_id}
                brandId={currentBrandId}
                onFeedbackSuccess={fetchHistory}
              />
            ))}
          </div>

          {/* Memory & Analytics Evidence Grid */}
          <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
            <div className="card">
              <div className="card-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} color="var(--purple-primary)" />
                  <span>What SocialPulse Remembered</span>
                </div>
              </div>
              {currentBatch.memories_used && currentBatch.memories_used.length > 0 ? (
                <ul style={{ paddingLeft: '18px', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Array.from(new Set(currentBatch.memories_used)).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>No prior memories retrieved for this batch.</p>
              )}
            </div>

            <div className="card">
              <div className="card-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={18} color="var(--info-text)" />
                  <span>Supporting Analytics Evidence</span>
                </div>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>• <strong>Posts Analyzed:</strong> {currentBatch.evidence_summary?.total_posts_analyzed || 0}</div>
                <div>• <strong>Avg Engagement Rate:</strong> {currentBatch.evidence_summary?.average_engagement_rate || 0}%</div>
                {currentBatch.evidence_summary?.best_format_observed && (
                  <div>
                    • <strong>Top Format Observed:</strong> {currentBatch.evidence_summary.best_format_observed.name} ({currentBatch.evidence_summary.best_format_observed.avg_engagement_rate}%)
                  </div>
                )}
                {currentBatch.evidence_summary?.best_category_observed && (
                  <div>
                    • <strong>Top Category Observed:</strong> {currentBatch.evidence_summary.best_category_observed.name} ({currentBatch.evidence_summary.best_category_observed.avg_engagement_rate}%)
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Note: {currentBatch.evidence_summary?.caveat || 'Observational baseline'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Sparkles size={36} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Ready to generate recommendations</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            Click <strong>Generate Recommendations</strong> above to receive 3 distinct, actionable content options tailored to your brand context, analytics, and memory.
          </p>
        </div>
      )}

      {/* History Expander */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div
          className="card-title"
          style={{ cursor: 'pointer', marginBottom: showHistory ? '16px' : '0' }}
          onClick={() => setShowHistory(!showHistory)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--accent-primary)" />
            <span>Past Recommendation History ({history.length})</span>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)' }}>
            {showHistory ? 'Hide History' : 'Show History'}
          </span>
        </div>

        {showHistory && (
          <div>
            {history.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No past recommendations logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.slice(0, 8).map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div><strong>Query:</strong> {h.query}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {h.generated_at ? new Date(h.generated_at).toLocaleString() : ''}
                      </div>
                      {h.user_feedback && (
                        <div style={{ color: 'var(--purple-primary)', fontSize: '0.8rem', marginTop: '4px' }}>
                          Feedback: "{h.user_feedback}"
                        </div>
                      )}
                    </div>
                    <span className="badge badge-purple">{h.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
