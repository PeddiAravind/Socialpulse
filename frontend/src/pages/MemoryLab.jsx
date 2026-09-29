import React, { useEffect, useState } from 'react';
import { useBrand } from '../context/BrandContext';
import { api } from '../api/api';
import {
  Sparkles,
  Database,
  Brain,
  ArrowRight,
  Check,
  CheckCircle2,
} from 'lucide-react';

const POSITIVE_EXPERIMENT = 'EXPERIMENT LEARNING: Behind-the-scenes Reel content performed better than a promotional image for Hyderabad Brew House in the available recent history. This is evidence-based and should not be treated as universally successful.';
const CONTRADICTORY_EXPERIMENT = 'EXPERIMENT UPDATE: A behind-the-scenes Reel performed poorly during an exam-week period. Reach and engagement were significantly lower than the earlier behind-the-scenes Reel. Owner feedback indicated that many students and young professionals were unavailable during exam week. This suggests the success of behind-the-scenes content may depend on timing and audience availability, and it should not be treated as universally successful.';
const CONTEXTUAL_QUESTION = 'It is exam week and I need to decide what type of content to try next. Based on everything we learned from previous experiments, what should we try?';
const MEMORY_STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were', 'with']);

function groupRecommendationMemories(memories = []) {
  const groups = { positive: [], contradictory: [], other: [] };

  for (const memory of memories) {
    const text = String(memory || '').trim();
    if (!text) continue;

    const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const isContradictory = /\b(performed poorly|underperformed|lower reach|lower engagement|significantly lower|less effective|declined)\b/i.test(text);
    const isPositive = /\b(outperformed|performed better|higher engagement|highest average engagement|performed best)\b/i.test(text);
    const group = isContradictory ? 'contradictory' : isPositive ? 'positive' : 'other';
    const tokens = new Set(normalized.split(/\s+/).filter((token) => token && !MEMORY_STOP_WORDS.has(token)));

    const duplicate = groups[group].some((existing) => {
      const existingNormalized = existing.text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (normalized === existingNormalized || normalized.includes(existingNormalized) || existingNormalized.includes(normalized)) {
        return true;
      }

      const existingTokens = existing.tokens;
      const intersection = [...tokens].filter((token) => existingTokens.has(token)).length;
      const union = new Set([...tokens, ...existingTokens]).size;
      return union > 0 && intersection / union >= 0.82;
    });

    if (!duplicate) groups[group].push({ text, tokens });
  }

  return {
    positive: groups.positive.map(({ text }) => text),
    contradictory: groups.contradictory.map(({ text }) => text),
    other: groups.other.map(({ text }) => text),
  };
}

export default function MemoryLab() {
  const { currentBrand, currentBrandId } = useBrand();

  const [activeTab, setActiveTab] = useState(0);
  const [step1Data, setStep1Data] = useState(null);
  const [step2Data, setStep2Data] = useState(null);
  const [step3Data, setStep3Data] = useState(null);
  const [step4Data, setStep4Data] = useState(null);
  const [step5Data, setStep5Data] = useState(null);
  const [step6Data, setStep6Data] = useState(null);
  const [loadingStep, setLoadingStep] = useState(null);
  const [stepError, setStepError] = useState('');
  const [restoredBrandId, setRestoredBrandId] = useState(null);
  const [progressSaved, setProgressSaved] = useState(false);

  useEffect(() => {
    const brandKey = currentBrandId == null ? null : String(currentBrandId);
    if (!brandKey) {
      setActiveTab(0);
      setStep1Data(null);
      setStep2Data(null);
      setStep3Data(null);
      setStep4Data(null);
      setStep5Data(null);
      setStep6Data(null);
      setRestoredBrandId(null);
      setStepError('');
      setProgressSaved(false);
      return;
    }

    let savedState = null;
    try {
      const serialized = localStorage.getItem(`socialpulse:memory-lab:${brandKey}`);
      savedState = serialized ? JSON.parse(serialized) : null;
    } catch {
      savedState = null;
    }

    setActiveTab(
      Number.isInteger(savedState?.activeTab) && savedState.activeTab >= 0 && savedState.activeTab < 6
        ? savedState.activeTab
        : 0,
    );
    setStep1Data(savedState?.step1Data ?? null);
    setStep2Data(savedState?.step2Data ?? null);
    setStep3Data(savedState?.step3Data ?? null);
    setStep4Data(savedState?.step4Data ?? null);
    setStep5Data(savedState?.step5Data ?? null);
    setStep6Data(savedState?.step6Data ?? null);
    setRestoredBrandId(brandKey);
    setStepError('');
    setProgressSaved(false);
  }, [currentBrandId]);

  useEffect(() => {
    const brandKey = currentBrandId == null ? null : String(currentBrandId);
    if (!brandKey || restoredBrandId !== brandKey) return;

    try {
      localStorage.setItem(`socialpulse:memory-lab:${brandKey}`, JSON.stringify({
        activeTab,
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data,
        step6Data,
      }));
      setProgressSaved(true);
    } catch {
      // Keep the demo usable when browser storage is unavailable.
      setProgressSaved(false);
    }
  }, [
    activeTab,
    currentBrandId,
    restoredBrandId,
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    step5Data,
    step6Data,
  ]);

  const runRequest = async (step, request, setData) => {
    if (!currentBrandId) return;
    try {
      setLoadingStep(step);
      setStepError('');
      setData(await request());
    } catch (error) {
      setStepError(error.message || 'The step could not be completed.');
    } finally {
      setLoadingStep(null);
    }
  };

  const runStep1 = () => runRequest(
    1,
    () => api.generateRecommendations(currentBrandId, 'What should I post tomorrow?', { baseline: true }),
    setStep1Data,
  );

  const runStep2 = () => runRequest(
    2,
    () => api.getAnalytics(currentBrandId),
    setStep2Data,
  );

  const runStep3 = () => {
    setStep4Data(null);
    setStep5Data(null);
    setStep6Data(null);
    return runRequest(
      3,
      () => api.recordExperiment(currentBrandId, POSITIVE_EXPERIMENT, 'Experiment learning'),
      setStep3Data,
    );
  };

  const runStep4 = () => {
    setStep5Data(null);
    setStep6Data(null);
    return runRequest(
      4,
      () => api.recordExperiment(currentBrandId, CONTRADICTORY_EXPERIMENT, 'Contradictory experiment evidence'),
      setStep4Data,
    );
  };

  const runStep5 = () => {
    if (step3Data?.stored && step4Data?.stored) {
      setStep5Data({ derived: true });
      setStep6Data(null);
    }
  };

  const runStep6 = () => runRequest(
    6,
    () => api.generateRecommendations(currentBrandId, CONTEXTUAL_QUESTION),
    setStep6Data,
  );

  const completedSteps = [
    Boolean(step1Data),
    Boolean(step2Data),
    Boolean(step3Data?.stored),
    Boolean(step4Data?.stored),
    Boolean(step5Data?.derived),
    Boolean(step6Data),
  ];
  const progressLabels = [
    'Cold Start',
    'Historical Evidence',
    'Positive Learning',
    'Contradiction',
    'Belief Revision',
    'New Recommendation',
  ];
  const recommendationMemoryGroups = groupRecommendationMemories(step6Data?.memories_used || []);

  if (!currentBrand) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Please select or create a brand to use Memory Lab.</p>
      </div>
    );
  }

  const tabs = [
    '1. Cold-Start Baseline',
    '2. Historical Evidence',
    '3. Experiment Learned',
    '4. Contradictory Evidence',
    '5. Belief Revision',
    '6. Contextual Recommendation',
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Memory Lab · The Evolution of Strategy</h1>
        <p className="page-subtitle">
          Interactive demonstration showing how SocialPulse AI evolves from Cold-Start recommendations to Evidence-Informed strategy, then learns from experiments and persistent memory to adapt future recommendations.
        </p>
        {progressSaved && (
          <span className="badge badge-blue memory-progress-saved" title="Saved locally in this browser for the selected brand; not stored as Memory Lab state in Hindsight Cloud.">
            <Check size={13} /> Demo progress saved for this brand
          </span>
        )}
      </div>

      <div className="memory-progress" aria-label="Memory Lab progress">
        {progressLabels.map((label, idx) => {
          const isCurrent = activeTab === idx;
          const isComplete = completedSteps[idx];
          const status = isComplete ? 'completed' : 'incomplete';
          return (
            <React.Fragment key={label}>
              <button
                className={`memory-progress-step ${status} ${isCurrent ? 'current' : ''}`}
                onClick={() => setActiveTab(idx)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${idx + 1}: ${label}, ${isComplete ? 'completed' : 'incomplete'}${isCurrent ? ', current step' : ''}`}
              >
                <span className="memory-progress-marker">
                  {isComplete ? <Check size={13} /> : idx + 1}
                </span>
                <span>{idx + 1} {label}</span>
              </button>
              {idx < progressLabels.length - 1 && <ArrowRight className="memory-progress-connector" size={14} aria-hidden="true" />}
            </React.Fragment>
          );
        })}
      </div>

      {stepError && <div className="alert alert-info" role="alert">{stepError}</div>}

      {activeTab === 0 && (
        <div className="card">
          <div className="card-title">
            <span>STEP 1 · Cold-Start Baseline</span>
            <span className="badge badge-purple">Brand Profile Only</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
            This baseline excludes historical analytics, recalled memory, and owner preferences. It is generated from the selected brand profile only.
          </p>
          <button className="btn btn-primary" onClick={runStep1} disabled={loadingStep === 1}>
            <Sparkles size={16} />
            <span>{loadingStep === 1 ? 'Generating...' : 'Generate Cold-Start Baseline'}</span>
          </button>
          {step1Data?.recommendations?.[0] && (
            <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div className="badge badge-purple" style={{ marginBottom: '8px' }}>Cold-Start Baseline</div>
              <div><strong>{step1Data.recommendations[0].title}</strong></div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                {step1Data.recommendations[0].format} / {step1Data.recommendations[0].category}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {step1Data.recommendations[0].reason}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 1 && (
        <div className="card">
          <div className="card-title">
            <span>STEP 2 · Historical Evidence</span>
            <span className="badge badge-blue">Analytics</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Read analytics calculated from this brand's existing posts. No demo analytics are generated in this step.
          </p>
          <button className="btn btn-secondary" onClick={runStep2} disabled={loadingStep === 2}>
            <Database size={16} />
            <span>{loadingStep === 2 ? 'Loading Evidence...' : 'Load Historical Evidence'}</span>
          </button>
          {step2Data && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <strong>Sample size</strong><div>{step2Data.total_posts ?? 0} posts</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <strong>Average engagement</strong><div>{step2Data.average_engagement_rate ?? 0}%</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <strong>Top format</strong><div>{step2Data.best_format?.name || 'No data'}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <strong>Top category</strong><div>{step2Data.best_category?.name || 'No data'}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                Historical analytics are supporting evidence, not a guarantee. {step2Data.caveat}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
        <div className="card">
          <div className="card-title">
            <span>STEP 3 · Experiment Learned</span>
            <span className="badge badge-blue">Positive Evidence</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>{POSITIVE_EXPERIMENT}</p>
          <button className="btn btn-primary" onClick={runStep3} disabled={loadingStep === 3 || step3Data?.stored}>
            {step3Data?.stored ? <Check size={16} /> : <Brain size={16} />}
            <span>{loadingStep === 3 ? 'Storing Learning...' : step3Data?.stored ? 'Learning Stored' : 'Store Experiment Learning'}</span>
          </button>
          {step3Data?.stored && (
            <div className="alert alert-success" style={{ marginTop: '20px' }}>
              <CheckCircle2 size={16} />
              <div>Memory stored · backend: <strong>{step3Data.backend}</strong></div>
            </div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="card">
          <div className="card-title">
            <span>STEP 4 · Contradictory Evidence</span>
            <span className="badge badge-amber">Context-Specific Result</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>{CONTRADICTORY_EXPERIMENT}</p>
          <button className="btn btn-primary" onClick={runStep4} disabled={loadingStep === 4 || !step3Data?.stored || step4Data?.stored}>
            {step4Data?.stored ? <Check size={16} /> : <Brain size={16} />}
            <span>{loadingStep === 4 ? 'Storing Evidence...' : step4Data?.stored ? 'Contradictory Evidence Stored' : 'Store Contradictory Evidence'}</span>
          </button>
          {!step3Data?.stored && <p className="memory-prerequisite">Complete Step 3 first to save the initial positive learning.</p>}
          {step4Data?.stored && (
            <div className="alert alert-success" style={{ marginTop: '20px' }}>
              <CheckCircle2 size={16} />
              <div>Contradictory evidence persisted · backend: <strong>{step4Data.backend}</strong></div>
            </div>
          )}
        </div>
      )}

      {activeTab === 4 && (
        <div className="card">
          <div className="card-title">
            <span>STEP 5 · Contextual Belief Revision</span>
            <span className="badge badge-amber">Derived from Conflicting Evidence</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
            This revision is derived from the two saved experiment memories. It is not written as a third memory.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <span className="badge badge-green">Positive learning</span><ArrowRight size={16} />
            <span className="badge badge-amber">Contradictory evidence</span><ArrowRight size={16} />
            <span className="badge badge-blue">Revised belief</span>
          </div>
          <button className="btn btn-secondary" onClick={runStep5} disabled={!step3Data?.stored || !step4Data?.stored || step5Data?.derived}>
            {step5Data?.derived ? <Check size={16} /> : <Brain size={16} />}
            <span>{step5Data?.derived ? 'Belief Revision Derived' : 'Derive Contextual Belief Revision'}</span>
          </button>
          {!step3Data?.stored || !step4Data?.stored ? (
            <p className="memory-prerequisite">Complete Step 3 and Step 4 first to derive the contextual belief revision.</p>
          ) : null}
          {step5Data?.derived && (
            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <strong>Positive evidence</strong>
                <p style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>{step3Data.observation || 'Saved positive evidence is unavailable.'}</p>
              </div>
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <strong>Contradictory evidence</strong>
                <p style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>{step4Data.observation || 'Saved contradictory evidence is unavailable.'}</p>
              </div>
              <div className="alert alert-info">
                <div>
                  <strong>Revised belief</strong>
                  <p style={{ marginTop: '6px' }}>The available evidence suggests that timing and audience availability may affect how well behind-the-scenes content performs. It should not be treated as universally successful.</p>
                  <small>No third memory was stored.</small>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 5 && (
        <div className="card">
          <div className="card-title">
            <span>STEP 6 · Memory-Informed Recommendation</span>
            <span className="badge badge-green">Exam-Week Context</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
            {CONTEXTUAL_QUESTION}
          </p>
          <button className="btn btn-primary" onClick={runStep6} disabled={loadingStep === 6 || !step5Data?.derived || Boolean(step6Data)}>
            {step6Data ? <Check size={16} /> : <Sparkles size={16} />}
            <span>{loadingStep === 6 ? 'Generating...' : step6Data ? 'Recommendation Generated' : 'Generate Context-Aware Recommendation'}</span>
          </button>
          {!step5Data?.derived && <p className="memory-prerequisite">Complete Steps 3–5 first to generate the context-aware recommendation.</p>}
          {step6Data && (
            <div style={{ marginTop: '20px' }}>
              <div className="alert alert-success">
                <div>
                  Intelligence stage: <strong>{step6Data.stage}</strong> · Memory backend: <strong>{step6Data.memory_backend}</strong>
                </div>
              </div>
              {step6Data.what_changed && (
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-md)', margin: '14px 0', fontSize: '0.88rem' }}>
                  <strong>Why the recommendation changed:</strong> {step6Data.what_changed}
                </div>
              )}
              {step6Data.recommendations?.[0] && (
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <strong>{step6Data.recommendations[0].title}</strong>
                  <div style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
                    Format: {step6Data.recommendations[0].format} · Category: {step6Data.recommendations[0].category}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {step6Data.recommendations[0].reason}
                  </p>
                </div>
              )}
              <div style={{ marginTop: '16px' }}>
                <strong>Memories used</strong>
                {step6Data.memories_used?.length ? (
                  <div style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
                    {[
                      { label: 'Positive learning', memories: recommendationMemoryGroups.positive },
                      { label: 'Contradictory / context-specific learning', memories: recommendationMemoryGroups.contradictory },
                      { label: 'Other relevant memory', memories: recommendationMemoryGroups.other },
                    ].filter((group) => group.memories.length > 0).map((group) => (
                      <div key={group.label} style={{ padding: '10px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <strong>{group.label}</strong>
                        <ul style={{ paddingLeft: '20px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                          {group.memories.map((item, index) => <li key={`${group.label}-${index}`}>{item}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ marginTop: '6px', color: 'var(--text-muted)' }}>No memories were returned for this query.</p>}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
