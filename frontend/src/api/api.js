const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Generic fetch wrapper with error handling and JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = null;
      }
      const message = errorJson?.detail || errorText || `HTTP error ${response.status}`;
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // System Health
  getHealth: () => request('/api/health'),

  // Brands
  getBrands: () => request('/api/brands'),
  getBrand: (brandId) => request(`/api/brands/${brandId}`),
  createBrand: (brandData) =>
    request('/api/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    }),

  // Posts & Synthetic Seeding
  getPosts: (brandId) => request(`/api/brands/${brandId}/posts`),
  createPost: (brandId, postData) =>
    request(`/api/brands/${brandId}/posts`, {
      method: 'POST',
      body: JSON.stringify(postData),
    }),
  seedBrandPosts: (brandId) =>
    request(`/api/brands/${brandId}/seed`, {
      method: 'POST',
    }),

  // Analytics & Evidence Learning
  getAnalytics: (brandId) => request(`/api/brands/${brandId}/analytics`),
  learnBrand: (brandId) =>
    request(`/api/brands/${brandId}/learn`, {
      method: 'POST',
    }),

  // Recommendations & Actions
  generateRecommendations: (brandId, query = 'What should I post tomorrow?', { baseline = false } = {}) =>
    request(`/api/brands/${brandId}/recommendations`, {
      method: 'POST',
      body: JSON.stringify({ query, ...(baseline ? { baseline: true } : {}) }),
    }),
  recordExperiment: (brandId, observation, context = 'Memory Lab experiment') =>
    request(`/api/brands/${brandId}/memory/experiment`, {
      method: 'POST',
      body: JSON.stringify({ observation, context }),
    }),
  getRecommendationHistory: (brandId) => request(`/api/brands/${brandId}/recommendations`),
  takeRecommendationAction: (brandId, recId, actionData) =>
    request(`/api/brands/${brandId}/recommendations/${recId}/action`, {
      method: 'POST',
      body: JSON.stringify(actionData),
    }),

  // Explicit User Feedback
  submitFeedback: (brandId, feedback) =>
    request(`/api/brands/${brandId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),

  // Hindsight / Local Memory
  getMemories: (brandId) => request(`/api/brands/${brandId}/memory`),
  getMemoryStatus: (brandId) => request(`/api/brands/${brandId}/memory/status`),
};

export default api;
