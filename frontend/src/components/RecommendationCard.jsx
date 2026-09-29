import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  Users,
  Brain,
  BarChart2,
} from 'lucide-react';
import { api } from '../api/api';

export default function RecommendationCard({
  rec,
  index,
  recId,
  brandId,
  onFeedbackSuccess,
}) {
  const [feedbackText, setFeedbackText] = useState('');
  const [showCaptionDetails, setShowCaptionDetails] = useState(true);
  const [actionStatus, setActionStatus] = useState(null); // { type: 'success'|'warning'|'error', message: string }
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await api.takeRecommendationAction(brandId, recId, {
        action: 'approved',
        recommendation_index: index,
      });
      setActionStatus({
        type: 'success',
        message: 'Feedback recorded. SocialPulse will remember this preference.',
      });
      if (onFeedbackSuccess) onFeedbackSuccess();
    } catch (err) {
      setActionStatus({
        type: 'error',
        message: `Failed to record approval: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      await api.takeRecommendationAction(brandId, recId, {
        action: 'rejected',
        recommendation_index: index,
      });
      setActionStatus({
        type: 'warning',
        message: 'Rejected recommendation recorded and added to learning history.',
      });
      if (onFeedbackSuccess) onFeedbackSuccess();
    } catch (err) {
      setActionStatus({
        type: 'error',
        message: `Failed to record rejection: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const cleanFeedback = feedbackText.trim();
    if (!cleanFeedback) return;

    try {
      setSubmitting(true);
      // Associate with recommendation (backend persists feedback on recommendation and retains to memory once)
      await api.takeRecommendationAction(brandId, recId, {
        action: 'feedback',
        recommendation_index: index,
        feedback: cleanFeedback,
      });
      setActionStatus({
        type: 'success',
        message:
          "Feedback recorded. SocialPulse will remember this preference. Click 'Generate Recommendations' to produce memory-informed recommendations.",
      });
      setFeedbackText('');
      if (onFeedbackSuccess) onFeedbackSuccess();
    } catch (err) {
      setActionStatus({
        type: 'error',
        message: `Failed to submit feedback: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              letterSpacing: '0.05em',
            }}
          >
            Option {index + 1}
          </span>
          <h3 className="rec-title">{rec.title}</h3>
        </div>
        <div className="rec-meta-pills">
          <span className="badge badge-purple">{rec.format}</span>
          <span className="badge badge-blue">{rec.category}</span>
          {rec.platform && <span className="badge badge-amber">{rec.platform}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={15} color="var(--accent-primary)" />
          <span><strong>Objective:</strong> {rec.objective}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={15} color="var(--accent-primary)" />
          <span><strong>Audience:</strong> {rec.target_audience}</span>
        </div>
      </div>

      <div className="rec-idea-box">
        <strong>💡 Content Idea:</strong> {rec.content_idea}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCaptionDetails(!showCaptionDetails)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '8px',
          }}
        >
          {showCaptionDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>Caption Hook & Suggested CTA</span>
        </button>

        {showCaptionDetails && (
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div>
              <strong>Hook:</strong> {rec.caption_direction}
            </div>
            <div>
              <strong>Call to Action:</strong>{' '}
              <code style={{ fontFamily: 'var(--font-mono)', backgroundColor: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                {rec.cta}
              </code>
            </div>
          </div>
        )}
      </div>

      <div className="rec-detail-grid">
        <div className="rec-detail-item">
          <div className="rec-detail-label">🔍 Why Recommended</div>
          <div>{rec.reason}</div>
        </div>
        <div className="rec-detail-item">
          <div className="rec-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BarChart2 size={13} /> Supporting Evidence
          </div>
          <div>{rec.evidence_used || 'General brand fit baseline'}</div>
        </div>
        <div className="rec-detail-item">
          <div className="rec-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Brain size={13} /> Memory Applied
          </div>
          <div>{rec.memory_used || 'Standard brand profile context'}</div>
        </div>
        <div className="rec-detail-item">
          <div className="rec-detail-label">✨ Content Novelty</div>
          <div>{rec.novelty_note || 'Fresh topic angle'}</div>
        </div>
      </div>

      {actionStatus && (
        <div
          className={`alert ${
            actionStatus.type === 'success'
              ? 'alert-success'
              : actionStatus.type === 'warning'
              ? 'alert-warning'
              : 'alert-danger'
          }`}
          style={{ margin: '8px 0 0 0', padding: '10px 14px' }}
        >
          {actionStatus.type === 'success' && <CheckCircle2 size={16} />}
          {actionStatus.type === 'warning' && <AlertTriangle size={16} />}
          <div>{actionStatus.message}</div>
        </div>
      )}

      {/* Feedback Section */}
      <div className="feedback-section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            💬 Help SocialPulse learn
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Shapes persistent Hindsight memory
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={handleApprove}
            disabled={submitting}
          >
            <ThumbsUp size={16} />
            <span>Approve</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleReject}
            disabled={submitting}
          >
            <ThumbsDown size={16} />
            <span>Reject</span>
          </button>
        </div>

        <form onSubmit={handleFeedbackSubmit}>
          <textarea
            className="form-textarea"
            rows="2"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell SocialPulse what you want to change... (e.g. I prefer educational videos and don't want promotional content this week.)"
            style={{ fontSize: '0.85rem', marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !feedbackText.trim()}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <Send size={14} />
              <span>Submit Feedback</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
