import React, { useState, useEffect } from 'react';
import { useBrand } from '../context/BrandContext';
import { api } from '../api/api';
import LoadingState from '../components/LoadingState';
import {
  FileText,
  Database,
  Brain,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export default function Posts() {
  const { currentBrand, currentBrandId } = useBrand();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterFormat, setFilterFormat] = useState('All');

  const fetchPosts = async () => {
    if (!currentBrandId) return;
    try {
      setLoading(true);
      const data = await api.getPosts(currentBrandId);
      setPosts(data || []);
    } catch (e) {
      console.error('Failed to load posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentBrandId]);

  const handleSeed = async () => {
    if (!currentBrandId) return;
    try {
      setActionLoading(true);
      setStatusMsg(null);
      const res = await api.seedBrandPosts(currentBrandId);
      setStatusMsg({
        type: 'success',
        message: `Successfully seeded ${res.seeded} realistic synthetic posts across Instagram, Facebook, and LinkedIn!`,
      });
      await fetchPosts();
    } catch (e) {
      setStatusMsg({ type: 'error', message: e.message || 'Seeding failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLearn = async () => {
    if (!currentBrandId) return;
    try {
      setActionLoading(true);
      setStatusMsg(null);
      const res = await api.learnBrand(currentBrandId);
      setStatusMsg({
        type: 'success',
        message: `Analyzed ${res.sample_size} posts and stored ${res.observations.length} performance observations in persistent memory!`,
      });
    } catch (e) {
      setStatusMsg({ type: 'error', message: e.message || 'Learning failed' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentBrand) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Please select or create a brand to view post history.</p>
      </div>
    );
  }

  const filteredPosts = posts.filter((p) => {
    const matchPlat = filterPlatform === 'All' || p.platform === filterPlatform;
    const matchFmt = filterFormat === 'All' || p.content_format === filterFormat;
    return matchPlat && matchFmt;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Historical Posts & Data</h1>
          <p className="page-subtitle">
            All stored publications and performance metrics for <strong>{currentBrand.name}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleSeed} disabled={actionLoading}>
            <Database size={16} />
            <span>{actionLoading ? 'Working...' : 'Seed 50 Synthetic Posts'}</span>
          </button>
          <button className="btn btn-primary" onClick={handleLearn} disabled={actionLoading || posts.length === 0}>
            <Brain size={16} />
            <span>Learn Analytics Observations</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`alert ${statusMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div>{statusMsg.message}</div>
        </div>
      )}

      {/* Filters & Count Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700 }}>
              Showing {filteredPosts.length} of {posts.length} Posts
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Platform:</span>
              <select
                className="form-select"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
              >
                <option value="All">All Platforms</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Format:</span>
              <select
                className="form-select"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
              >
                <option value="All">All Formats</option>
                <option value="Reel">Reel</option>
                <option value="Carousel">Carousel</option>
                <option value="Static Image">Static Image</option>
                <option value="Text Post">Text Post</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading historical posts..." />
      ) : filteredPosts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            No posts found for this filter criteria.
          </p>
          <button className="btn btn-primary" onClick={handleSeed} disabled={actionLoading}>
            <Database size={16} />
            <span>Seed 50 Synthetic Posts</span>
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date / Platform</th>
                <th>Format & Category</th>
                <th>Topic & Caption Preview</th>
                <th>Reach</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Saves</th>
                <th>Eng. Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((p) => {
                const eng = p.metrics?.engagement_rate ?? 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.platform}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.published_at ? new Date(p.published_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div><span className="badge badge-purple">{p.content_format}</span></div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {p.category}
                      </div>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.topic || 'Untitled'}</div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px',
                        }}
                      >
                        {p.caption}
                      </div>
                    </td>
                    <td>{(p.metrics?.reach || p.reach || 0).toLocaleString()}</td>
                    <td>{(p.metrics?.likes || p.likes || 0).toLocaleString()}</td>
                    <td>{(p.metrics?.comments || p.comments || 0).toLocaleString()}</td>
                    <td>{(p.metrics?.saves || p.saves || 0).toLocaleString()}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: eng > 4 ? '#ecfdf5' : '#f1f5f9',
                          color: eng > 4 ? '#16a34a' : '#475569',
                          fontWeight: 700,
                        }}
                      >
                        {eng}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
