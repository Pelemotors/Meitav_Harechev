import React, { useState } from 'react';
import { Car, LogOut, Menu, X, Home, Upload, Settings, Users, Globe } from 'lucide-react';
import { logout, getCurrentUser } from '../../utils/auth';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDisplayName, getRoleColor } from '../../utils/permissions';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  currentPage, 
  onPageChange, 
  onLogout 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, hasPermission } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'דף הבית', icon: Home, permission: 'admin:access' },
    { id: 'cars', label: 'ניהול רכבים', icon: Car, permission: 'cars:read' },
    { id: 'leads', label: 'ניהול לידים', icon: Users, permission: 'leads:read' },
    { id: 'sitemap', label: 'ניהול Sitemap', icon: Globe, permission: 'sitemap:read' },
    { id: 'media', label: 'ניהול מדיה', icon: Upload, permission: 'cars:write' },
    { id: 'settings', label: 'הגדרות', icon: Settings, permission: 'settings:read' }
  ];

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-darkBlue transform ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        <div className="flex items-center justify-between h-16 px-6 bg-darkBlue border-b border-blue-700">
          <div className="flex items-center gap-2">
            <Car className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-white">Strong Luxury Cars</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasAccess = hasPermission(item.permission as any);
            
            if (!hasAccess) return null;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 text-right hover:bg-blue-700 transition-colors ${
                  currentPage === item.id ? 'bg-blue-700 border-l-4 border-primary' : ''
                }`}
              >
                <Icon className="w-5 h-5 text-white" />
                <span className="text-white font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-700">
          <div className="text-white text-sm mb-4">
            <p className="font-medium">{user?.username}</p>
            <p className="text-blue-300">{user?.email}</p>
            {user?.role && (
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתק</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:mr-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {new Date().toLocaleDateString('he-IL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;