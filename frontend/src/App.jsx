import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandProvider } from './context/BrandContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BrandProfile from './pages/BrandProfile';
import ContentStudio from './pages/ContentStudio';
import Posts from './pages/Posts';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import MemoryLab from './pages/MemoryLab';
import MemoryExplorer from './pages/MemoryExplorer';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <BrandProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="brand-profile" element={<BrandProfile />} />
            <Route path="content-studio" element={<ContentStudio />} />
            <Route path="posts" element={<Posts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="memory-lab" element={<MemoryLab />} />
            <Route path="memory-explorer" element={<MemoryExplorer />} />
          </Route>
        </Routes>
      </BrandProvider>
    </BrowserRouter>
  );
}
