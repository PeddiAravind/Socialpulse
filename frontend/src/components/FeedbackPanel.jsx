import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '../api/api';

export default function FeedbackPanel({ brandId, onFeedbackSubmitted }) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    try {
      setLoading(true);
      await api.submitFeedback(brandId, feedback.trim());
      setStatus({
        type: 'success',
        message: 'Explicit owner preference recorded into persistent Hindsight memory.',
      });
      setFeedback('');
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--accent-primary)" />
          <span>Teach SocialPulse Your Preferences</span>
        </div>
      </div>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
        Tell the AI strategy assistant about high-level constraints, tone changes, or topics to prioritize.
      </p>

      {status && (
        <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <CheckCircle2 size={16} />
          <div>{status.message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            className="form-textarea"
            rows="3"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. I prefer educational videos and don't want promotional content this week."
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !feedback.trim()}>
          <Send size={16} />
          <span>{loading ? 'Saving to Memory...' : 'Save Preference to Memory'}</span>
        </button>
      </form>
    </div>
  );
}
