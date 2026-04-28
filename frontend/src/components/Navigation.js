import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Wrench, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ClipboardList,
  Building2
} from 'lucide-react';

import logo from '../assets/logo.jpg';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['admin', 'supervisor', 'technician', 'client']
    },
    {
      path: '/service-form',
      icon: FileText,
      label: 'Nuevo Servicio',
      roles: ['admin', 'supervisor', 'technician']
    },
    {
      path: '/reports',
      icon: ClipboardList,
      label: 'Reportes',
      roles: ['admin', 'supervisor', 'technician', 'client']
    },
    {
      path: '/equipment',
      icon: Settings,
      label: 'Equipos',
      roles: ['admin', 'supervisor', 'technician', 'client']
    },
    {
      path: '/clients',
      icon: Building2,
      label: 'Clientes',
      roles: ['admin', 'supervisor']
    }
  ];

  const visibleNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActiveRoute = (path) => {
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/');
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      technician: 'Técnico',
      client: 'Cliente'
    };
    return roleLabels[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-gradient-to-r from-purple-500 to-pink-500',
      supervisor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      technician: 'bg-gradient-to-r from-green-500 to-teal-500',
      client: 'bg-gradient-to-r from-orange-500 to-yellow-500'
    };
    return colors[role] || 'bg-gradient-to-r from-gray-500 to-slate-500';
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center shrink-0 min-w-0">
              <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity min-w-0">
                <div className="flex items-center justify-center w-12 h-12 shrink-0 bg-white rounded-full p-1 shadow-md">
                  <img src={logo} alt="Hidrobombas Mérida" className="w-full h-full object-contain rounded-full" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gradient">
                    CMMS Hidrobombas
                  </h1>
                  <p className="text-xs text-slate-500 -mt-1">
                    Sistema de Mantenimiento
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    data-testid={`nav-${item.path.replace('/', '')}`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900" data-testid="user-name">
                    {user?.full_name}
                  </p>
                  <div className="flex items-center justify-end">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getRoleBadgeColor(user?.role)}`}>
                      {getRoleLabel(user?.role)}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-2 border-slate-200 hover:border-red-300 hover:text-red-600 transition-colors"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Salir</span>
              </Button>

              {/* Mobile Menu Button */}
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="sm"
                className="md:hidden text-slate-700 hover:text-slate-900 shrink-0"
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-dark bg-white/90 backdrop-blur-xl border-t border-slate-200/50 shadow-2xl">
            <div className="px-4 py-3 space-y-1">
              {/* User Info Mobile */}
              <div className="flex items-center space-x-3 px-3 py-2 mb-3 bg-slate-50 rounded-lg" data-testid="mobile-user-info">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user?.full_name}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getRoleBadgeColor(user?.role)}`}>
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>

              {/* Mobile Navigation Items */}
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50/50'
                    }`}
                    data-testid={`mobile-nav-${item.path.replace('/', '')}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Logout */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                data-testid="mobile-logout-button"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
          data-testid="mobile-menu-overlay"
        />
      )}
    </>
  );
};

export default Navigation;