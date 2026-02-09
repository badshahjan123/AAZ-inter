import { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import { Outlet } from 'react-router-dom';
import Header from './components/Layout/Header';
import './Admin.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-container">
      {sidebarOpen && (
        <div 
          className="mobile-overlay active" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
