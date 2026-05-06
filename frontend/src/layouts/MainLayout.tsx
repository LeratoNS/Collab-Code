// Lerato Sibanda u22705504 P14

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <main className="dark:text-gray-100">
        <Outlet />
      </main>
    </div>
  );
};
