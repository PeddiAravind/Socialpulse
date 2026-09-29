import React, { useState, useEffect } from 'react';
import { useBrand } from '../context/BrandContext';
import { api } from '../api/api';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export default function Analytics() {
  const { currentBrand, currentBrandId } = useBrand();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentBrandId) return;
    async function loadAnalytics() {
      try {
        setLoading(true);
        const data = await api.getAnalytics(currentBrandId);
        setAnalytics(data);
      } catch (e) {
        console.error('Failed to load analytics:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [currentBrandId]);

  if (!currentBrand) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Please select or create a brand to view analytics.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Calculating historical analytics and metrics..." />;
  }

  if (!analytics || analytics.total_posts === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Historical Analytics</h1>
          <p className="page-subtitle">Evidence-based performance analysis for <strong>{currentBrand.name}</strong></p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            No historical posts found for this brand yet.
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Seed synthetic historical posts in the Posts tab to unlock deep analytical insights.
          </p>
        </div>
      </div>
    );
  }

  const summary = analytics.summary_metrics || {};

  // Prepare Format Chart Data
  const formatData = Object.entries(analytics.by_content_format || {}).map(([name, data]) => ({
    name,
    avgEngagement: data.avg_engagement_rate,
    totalPosts: data.count,
    totalReach: data.total_reach,
  }));

  // Prepare Category Chart Data
  const categoryData = Object.entries(analytics.by_category || {}).map(([name, data]) => ({
    name,
    avgEngagement: data.avg_engagement_rate,
    totalPosts: data.count,
  }));

  // Prepare Platform Chart Data
  const platformData = Object.entries(analytics.by_platform || {}).map(([name, data]) => ({
    name,
    value: data.count,
    avgEngagement: data.avg_engagement_rate,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Historical Analytics & Evidence</h1>
        <p className="page-subtitle">
          Based on <strong>{analytics.total_posts} posts</strong> ({analytics.date_range})
        </p>
      </div>

      {/* Observational Caveat Notice */}
      {analytics.caveat && (
        <div className="alert alert-info">
          <AlertTriangle size={18} />
          <div>
            <strong>Observational Correlation Notice:</strong> {analytics.caveat}
          </div>
        </div>
      )}

      {/* Summary Stat Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <StatCard
          label="Total Reach"
          value={(summary.total_reach || 0).toLocaleString()}
          subtext={`Avg ${(summary.avg_reach_per_post || 0).toLocaleString()} / post`}
          icon={Eye}
          color="#6366f1"
          bg="#eef2ff"
        />
        <StatCard
          label="Avg Engagement Rate"
          value={`${analytics.average_engagement_rate}%`}
          subtext="Weighted (Interactions / Reach)"
          icon={TrendingUp}
          color="#10b981"
          bg="#ecfdf5"
        />
        <StatCard
          label="Total Likes & Comments"
          value={((summary.total_likes || 0) + (summary.total_comments || 0)).toLocaleString()}
          subtext={`${(summary.total_likes || 0).toLocaleString()} likes, ${(summary.total_comments || 0).toLocaleString()} comments`}
          icon={Heart}
          color="#ec4899"
          bg="#fdf2f8"
        />
        <StatCard
          label="Total Saves & Shares"
          value={((summary.total_saves || 0) + (summary.total_shares || 0)).toLocaleString()}
          subtext="High-intent engagement actions"
          icon={Bookmark}
          color="#8b5cf6"
          bg="#f5f3ff"
        />
      </div>

      {/* Charts Section */}
      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        {/* Format Performance Bar Chart */}
        <div className="card">
          <div className="card-title">
            <span>Engagement Rate by Content Format</span>
            <span className="badge badge-purple">
              Top: {analytics.best_format?.name} ({analytics.best_format?.avg_engagement_rate}%)
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Average engagement rate percentage calculated across each content format type.
          </p>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis unit="%" stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Avg Engagement Rate']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="avgEngagement" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance Bar Chart */}
        <div className="card">
          <div className="card-title">
            <span>Engagement Rate by Category</span>
            <span className="badge badge-blue">
              Top: {analytics.best_category?.name} ({analytics.best_category?.avg_engagement_rate}%)
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Average engagement rate percentage achieved across different editorial categories.
          </p>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis unit="%" stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Avg Engagement Rate']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="avgEngagement" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Platform Breakdown Table */}
      <div className="card">
        <div className="card-title">Platform Performance Breakdown</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Post Count</th>
                <th>Total Reach</th>
                <th>Avg Engagement Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.by_platform || {}).map(([plat, data]) => (
                <tr key={plat}>
                  <td style={{ fontWeight: 600 }}>{plat}</td>
                  <td>{data.count} posts</td>
                  <td>{(data.total_reach || 0).toLocaleString()}</td>
                  <td>
                    <span className="badge badge-purple">{data.avg_engagement_rate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
