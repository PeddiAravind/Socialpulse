import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useBrand } from '../context/BrandContext';
import { AlertCircle } from 'lucide-react';

export default function Layout() {
  const { error } = useBrand();

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="content-body">
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <div>
                <strong>Backend Communication Error:</strong> {error}
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
