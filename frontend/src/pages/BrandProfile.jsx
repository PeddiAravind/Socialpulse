import React, { useState } from 'react';
import { useBrand } from '../context/BrandContext';
import { api } from '../api/api';
import { Building2, PlusCircle, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function BrandProfile() {
  const { currentBrand, fetchBrands } = useBrand();

  const [formData, setFormData] = useState({
    name: '',
    industry: 'Café & Specialty Coffee',
    business_description: 'Artisanal specialty café serving locally-roasted coffee, fresh pastries, and ethical breakfast items.',
    target_audience: 'Urban professionals, remote workers, students, and specialty coffee enthusiasts aged 20-45.',
    tone: 'Friendly, warm, artisanal, inviting',
    language: 'English',
    products_services: 'Pour-over coffee, espresso drinks, cold brew, organic pastries, barista workshops',
    location: 'Downtown Metro Area',
    goals: 'Increase weekday morning foot traffic, grow Instagram engagement, and drive weekend event attendance.',
    competitors: 'Blue Bottle, Local Roasters, Starbucks Reserve',
    avoid_topics: 'Overly aggressive sales pitches, low-quality meme humor, controversial political commentary',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setStatus({ type: 'error', message: 'Brand Name is required.' });
      return;
    }
    if (!formData.industry.trim()) {
      setStatus({ type: 'error', message: 'Industry is required.' });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);
      const newBrand = await api.createBrand(formData);
      setStatus({
        type: 'success',
        message: `Brand "${newBrand.name}" created successfully and initialized in Hindsight memory!`,
      });
      await fetchBrands(newBrand.id);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to create brand.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Brand Strategy Profile</h1>
        <p className="page-subtitle">
          Define your brand identity, tone of voice, goals, and constraints. SocialPulse uses this foundation for all AI recommendations.
        </p>
      </div>

      {status && (
        <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div>{status.message}</div>
        </div>
      )}

      {currentBrand && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--accent-primary)" />
              <span>Current Active Brand: <strong>{currentBrand.name}</strong></span>
            </div>
            <span className="badge badge-purple">{currentBrand.industry}</span>
          </div>
          <div className="grid-cols-3" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <div>
              <strong>Audience:</strong>
              <div>{currentBrand.target_audience || 'Not set'}</div>
            </div>
            <div>
              <strong>Tone:</strong>
              <div>{currentBrand.tone || 'Not set'}</div>
            </div>
            <div>
              <strong>Location:</strong>
              <div>{currentBrand.location || 'Not set'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} color="var(--accent-primary)" />
            <span>Create New Brand Profile</span>
          </div>
        </div>

        <form onSubmit={handleCreateBrand}>
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Brand Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Bean & Brew Co."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Industry *</label>
              <input
                type="text"
                name="industry"
                className="form-input"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Café, SaaS, Fitness, Fashion"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Business Description</label>
            <textarea
              name="business_description"
              className="form-textarea"
              value={formData.business_description}
              onChange={handleChange}
              placeholder="What does your business do and what is your unique value proposition?"
            />
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <textarea
                name="target_audience"
                className="form-textarea"
                rows="2"
                value={formData.target_audience}
                onChange={handleChange}
                placeholder="Who are your ideal customers?"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tone of Voice</label>
              <textarea
                name="tone"
                className="form-textarea"
                rows="2"
                value={formData.tone}
                onChange={handleChange}
                placeholder="e.g. Friendly, witty, authoritative, inspirational"
              />
            </div>
          </div>

          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">Primary Language</label>
              <input
                type="text"
                name="language"
                className="form-input"
                value={formData.language}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location / Market</label>
              <input
                type="text"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Austin, TX or Global"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Key Competitors</label>
              <input
                type="text"
                name="competitors"
                className="form-input"
                value={formData.competitors}
                onChange={handleChange}
                placeholder="e.g. Rival Brands"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Products & Services</label>
            <textarea
              name="products_services"
              className="form-textarea"
              rows="2"
              value={formData.products_services}
              onChange={handleChange}
              placeholder="List flagship items, pricing tiers, or core services"
            />
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Strategic Goals</label>
              <textarea
                name="goals"
                className="form-textarea"
                rows="2"
                value={formData.goals}
                onChange={handleChange}
                placeholder="e.g. Drive awareness, boost engagement rate, generate leads"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Topics to Avoid (Negative Constraints)</label>
              <textarea
                name="avoid_topics"
                className="form-textarea"
                rows="2"
                value={formData.avoid_topics}
                onChange={handleChange}
                placeholder="e.g. Discount promotions, political topics, aggressive CTAs"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Sparkles size={16} />
              <span>{loading ? 'Creating & Onboarding...' : 'Save & Onboard Brand'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
