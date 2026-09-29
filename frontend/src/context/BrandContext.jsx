import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/api';

const BrandContext = createContext(null);

const STORAGE_KEY = 'socialpulse_active_brand_id';

export function BrandProvider({ children }) {
  const [brands, setBrands] = useState([]);
  const [currentBrandId, setCurrentBrandId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? Number(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [currentBrand, setCurrentBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch (e) {
      console.warn('Backend health check failed:', e);
      setHealth({ status: 'offline', memory_backend: 'unknown' });
    }
  }, []);

  const fetchBrands = useCallback(async (selectBrandId = null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBrands();
      setBrands(data || []);
      
      if (data && data.length > 0) {
        let savedId = null;
        try {
          const s = localStorage.getItem(STORAGE_KEY);
          if (s) savedId = Number(s);
        } catch (e) {}

        const targetId = selectBrandId || currentBrandId || savedId;
        const found = data.find((b) => b.id === Number(targetId)) || data[0];
        setCurrentBrandId(found.id);
        setCurrentBrand(found);
        try {
          localStorage.setItem(STORAGE_KEY, String(found.id));
        } catch (e) {}
      } else {
        setCurrentBrandId(null);
        setCurrentBrand(null);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to load brands:', err);
      setError('Could not connect to FastAPI backend. Ensure uvicorn is running.');
    } finally {
      setLoading(false);
    }
  }, [currentBrandId]);

  const selectBrand = (id) => {
    const numId = Number(id);
    setCurrentBrandId(numId);
    try {
      localStorage.setItem(STORAGE_KEY, String(numId));
    } catch (e) {}
    const found = brands.find((b) => b.id === numId);
    if (found) setCurrentBrand(found);
  };

  useEffect(() => {
    fetchHealth();
    fetchBrands();
  }, [fetchHealth, fetchBrands]);

  const refreshCurrentBrand = async () => {
    if (!currentBrandId) return;
    try {
      const b = await api.getBrand(currentBrandId);
      setCurrentBrand(b);
    } catch (e) {
      console.error('Failed to refresh brand:', e);
    }
  };

  return (
    <BrandContext.Provider
      value={{
        brands,
        currentBrandId,
        currentBrand,
        selectBrand,
        fetchBrands,
        refreshCurrentBrand,
        loading,
        error,
        health,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
