import React, { useState } from 'react';
import { useBrand } from '../context/BrandContext';
import { api } from '../api/api';
import { PenTool, Sparkles, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContentStudio() {
  const { currentBrand, currentBrandId } = useBrand();

  const [postData, setPostData] = useState({
    platform: 'Instagram',
    content_format: 'Reel',
    category: 'Educational',
    topic: 'Barista Morning Routine',
    caption: 'Ever wondered how we dial in our espresso every morning? Here are the 3 secrets to perfect extraction ☕✨ #SpecialtyCoffee #BaristaLife',
    status: 'published',
    impressions: 4200,
    reach: 3500,
    likes: 240,
    comments: 32,
    shares: 18,
    saves: 45,
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPostData((prev) => ({
      ...prev,
      [name]: name === 'impressions' || name === 'reach' || name === 'likes' || name === 'comments' || name === 'shares' || name === 'saves'
        ? Number(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentBrandId) return;

    try {
      setLoading(true);
      setStatus(null);
      await api.createPost(currentBrandId, {
        platform: postData.platform,
        content_format: postData.content_format,
        category: postData.category,
        topic: postData.topic,
        caption: postData.caption,
        status: postData.status,
        impressions: postData.impressions,
        reach: postData.reach,
        likes: postData.likes,
        comments: postData.comments,
        shares: postData.shares,
        saves: postData.saves,
      });
      setStatus({
        type: 'success',
        message: 'New post published and logged to brand history successfully!',
      });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to save post' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentBrand) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Please select or create a brand to use AI Content Studio.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Content Studio</h1>
        <p className="page-subtitle">
          Draft and publish content for <strong>{currentBrand.name}</strong> aligned with your brand voice and historical learnings.
        </p>
      </div>

      {status && (
        <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div>{status.message}</div>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PenTool size={18} color="var(--accent-primary)" />
            <span>Create & Publish Social Post</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">Platform</label>
              <select name="platform" className="form-select" value={postData.platform} onChange={handleChange}>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter / X</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Content Format</label>
              <select name="content_format" className="form-select" value={postData.content_format} onChange={handleChange}>
                <option value="Reel">Reel / Short Video</option>
                <option value="Carousel">Carousel</option>
                <option value="Static Image">Static Image</option>
                <option value="Text Post">Text Post</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={postData.category} onChange={handleChange}>
                <option value="Educational">Educational</option>
                <option value="Behind-the-scenes">Behind-the-scenes</option>
                <option value="Community">Community</option>
                <option value="Promotional">Promotional</option>
                <option value="Product Spotlight">Product Spotlight</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Topic / Headline</label>
            <input
              type="text"
              name="topic"
              className="form-input"
              value={postData.topic}
              onChange={handleChange}
              placeholder="e.g. Barista Morning Routine"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Caption & Copy</label>
            <textarea
              name="caption"
              className="form-textarea"
              rows="4"
              value={postData.caption}
              onChange={handleChange}
              placeholder="Write or edit caption..."
            />
          </div>

          <div className="grid-cols-4">
            <div className="form-group">
              <label className="form-label">Reach</label>
              <input type="number" name="reach" className="form-input" value={postData.reach} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Likes</label>
              <input type="number" name="likes" className="form-input" value={postData.likes} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Comments</label>
              <input type="number" name="comments" className="form-input" value={postData.comments} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Saves</label>
              <input type="number" name="saves" className="form-input" value={postData.saves} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Send size={16} />
              <span>{loading ? 'Publishing...' : 'Log & Publish Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
