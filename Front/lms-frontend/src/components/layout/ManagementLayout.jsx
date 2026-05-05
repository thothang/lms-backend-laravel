import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

const ManagementLayout = () => {
  const location = useLocation();

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar - Fixed on left (desktop), overlay (mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden pt-[4.5rem] md:pt-6 lg:pt-8">
        <motion.div
           key={location.pathname}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           className="max-w-7xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default ManagementLayout;
