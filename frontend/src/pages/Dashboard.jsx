import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import { api } from '../api/api';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import {
  FileText,
  Eye,
  TrendingUp,
  Award,
  Brain,
  Sparkles,
  ArrowRight,
  Database,
  PlusCircle,
  FlaskConical,
} from 'lucide-react';

export default function Dashboard() {
  const { currentBrand, currentBrandId, loading: brandLoading } = useBrand();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [memories, setMemories] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentBrandId) return;

    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [anData, memData, postData] = await Promise.allSettled([
          api.getAnalytics(currentBrandId),
          api.getMemories(currentBrandId),
          api.getPosts(currentBrandId),
        ]);

        if (isMounted) {
          if (anData.status === 'fulfilled') setAnalytics(anData.value);
          if (memData.status === 'fulfilled') setMemories(memData.value.items || []);
          if (postData.status === 'fulfilled') setRecentPosts(postData.value.slice(0, 5) || []);
        }
      } catch (e) {
        console.error('Error fetching dashboard metrics:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [currentBrandId]);

  if (brandLoading || loading) {
    return <LoadingState message="Loading dashboard metrics & brand profile..." />;
  }

  if (!currentBrand) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Welcome to SocialPulse AI</h1>
          <p className="page-subtitle">
            Get started by creating your brand profile to unlock AI recommendations and Hindsight memory.
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Sparkles size={40} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
            No Brand Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 24px' }}>
            SocialPulse personalizes its content strategies to your brand goals, target audience, and historical post analytics.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/brand-profile')}
          >
            <PlusCircle size={18} />
            <span>Create Brand Profile</span>
          </button>
        </div>
      </div>
    );
  }

  const totalPosts = analytics?.total_posts || 0;
  const totalReach = analytics?.summary_metrics?.total_reach || 0;
  const avgEng = analytics?.average_engagement_rate || 0;
  const topFormat = analytics?.best_format?.name || 'Reel';
  const memoryCount = memories.length;

  let stageLabel = 'Cold-Start Baseline';
  let stageBadgeClass = 'badge-purple';
  if (memories.some((m) => typeof m === 'string' && m.includes('Explicit owner preference:'))) {
    stageLabel = 'Memory-Informed';
    stageBadgeClass = 'badge-green';
  } else if (totalPosts > 0 || memories.some((m) => typeof m === 'string' && m.includes('Performance Observation:'))) {
    stageLabel = 'Evidence-Informed';
    stageBadgeClass = 'badge-blue';
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Executive Strategy Dashboard</h1>
          <p className="page-subtitle">
            Overview of <strong>{currentBrand.name}</strong> • AI Strategy Engine with Persistent Memory
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/recommendations')}>
            <Sparkles size={16} />
            <span>Generate Recommendations</span>
          </button>
        </div>
      </div>

      {/* Intelligence Status Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
          border: '1px solid var(--purple-border)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Brain size={18} color="var(--purple-primary)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--purple-primary)' }}>
                Intelligence Stage
              </span>
              <span className={`badge ${stageBadgeClass}`}>{stageLabel}</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {stageLabel === 'Memory-Informed' &&
                'Explicit owner preferences are active. Future recommendations prioritize your preferred formats and topic rules.'}
              {stageLabel === 'Evidence-Informed' &&
                'Historical analytics observations are active. Strategy recommendations prioritize proven engagement patterns.'}
              {stageLabel === 'Cold-Start Baseline' &&
                'Strategy relies purely on Brand Profile guidelines. Seed historical posts or run the Memory Lab to level up.'}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/memory-lab')}>
            <FlaskConical size={16} />
            <span>Open Memory Lab</span>
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
        <StatCard
          label="Total Historical Posts"
          value={totalPosts}
          subtext={totalPosts > 0 ? 'Analyzed in dataset' : 'No posts stored yet'}
          icon={FileText}
          color="#3b82f6"
          bg="#eff6ff"
        />
        <StatCard
          label="Total Reach"
          value={totalReach.toLocaleString()}
          subtext="Cumulative impressions"
          icon={Eye}
          color="#8b5cf6"
          bg="#f5f3ff"
        />
        <StatCard
          label="Avg Engagement Rate"
          value={`${avgEng}%`}
          subtext="Weighted engagement / reach"
          icon={TrendingUp}
          color="#10b981"
          bg="#ecfdf5"
        />
        <StatCard
          label="Top Performing Format"
          value={topFormat}
          subtext={analytics?.best_format?.avg_engagement_rate ? `${analytics.best_format.avg_engagement_rate}% avg eng` : 'Estimated'}
          icon={Award}
          color="#f59e0b"
          bg="#fffbeb"
        />
      </div>

      {/* Quick Launch & Recent Posts Grid */}
      <div className="grid-cols-2">
        {/* Left Column: Brand Context Summary */}
        <div className="card">
          <div className="card-title">
            <span>Brand Strategy Profile</span>
            <button
              onClick={() => navigate('/brand-profile')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Edit</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Description:</strong>
              <p style={{ marginTop: '2px' }}>{currentBrand.business_description || 'None provided'}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Target Audience:</strong>
                <div>{currentBrand.target_audience || 'General audience'}</div>
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Tone & Voice:</strong>
                <div>{currentBrand.tone || 'Professional & friendly'}</div>
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Products & Services:</strong>
                <div>{currentBrand.products_services || 'Standard catalog'}</div>
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Topics to Avoid:</strong>
                <div>{currentBrand.avoid_topics || 'None specified'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Posts Preview */}
        <div className="card">
          <div className="card-title">
            <span>Recent Historical Posts</span>
            <button
              onClick={() => navigate('/posts')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View All ({totalPosts})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <p>No historical posts logged yet.</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '12px' }}
                onClick={() => navigate('/posts')}
              >
                <Database size={14} />
                <span>Seed 50 Synthetic Posts</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentPosts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>{p.content_format}</strong> · {p.category}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{p.caption || 'No caption'}</div>
                  </div>
                  <span className="badge badge-purple">{p.metrics?.engagement_rate}% eng</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
