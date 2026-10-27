import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { TestCatalog } from './pages/TestCatalog';
import { TestRunner } from './pages/TestRunner';
import { TestResult } from './pages/TestResult';
import { History } from './pages/History';
import { Profile } from './pages/Profile';

const App: React.FC = () => {
  return (
    <div
      className="flex flex-col"
      style={{ height: '100vh', backgroundColor: 'var(--tg-theme-bg-color)' }}
    >
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/catalog" element={<TestCatalog />} />
          <Route path="/test/:testId" element={<TestRunner />} />
          <Route path="/result/:sessionId" element={<TestResult />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Bottom navigation — hidden on test runner */}
      <Routes>
        <Route path="/test/:testId" element={null} />
        <Route path="*" element={<BottomNav />} />
      </Routes>
    </div>
  );
};

export default App;
