import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
