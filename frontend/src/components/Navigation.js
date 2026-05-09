import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ClipboardList,
  Building2,
  ShieldCheck
} from 'lucide-react';

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
    },
    {
      path: '/users',
      icon: Users,
      label: 'Usuarios',
      roles: ['admin']
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
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      supervisor: 'bg-blue-100 text-blue-700 border-blue-200',
      technician: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      client: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Section: Logo + Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3 shrink-0 group">
                <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl shadow-sm border border-slate-100 p-0.5 transition-transform group-hover:scale-105">
                  <img src="/logo.jpg" alt="Hidrobombas Mérida" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="text-[15px] sm:text-lg font-extrabold text-slate-900 leading-tight tracking-tight">
                    Hidrobombas <span className="text-blue-600">Mérida</span>
                  </h1>
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Sistema CMMS
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-2">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Section: User Info & Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              {/* User Profile Badge (Desktop) */}
              <div className="hidden sm:flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/60">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <div className="flex items-center space-x-2">
                  {user?.full_name && (
                    <span className="text-sm font-bold text-slate-700">
                      {user.full_name.split(' ')[0]}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getRoleBadgeColor(user?.role)}`}>
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                onClick={onLogout}
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center space-x-2 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors rounded-full px-4"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-semibold">Salir</span>
              </Button>

              {/* Mobile Menu Button */}
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="sm"
                className="lg:hidden text-slate-600 hover:text-slate-900 shrink-0 bg-slate-100 rounded-lg h-9 w-9 p-0 flex items-center justify-center"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl origin-top animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-5 sm:py-6 space-y-4">
              
              {/* User Info Mobile */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {user?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {user?.email}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0 shadow-sm ${getRoleBadgeColor(user?.role)}`}>
                  {getRoleLabel(user?.role)}
                </span>
              </div>

              {/* Mobile Navigation Items */}
              <div className="grid gap-2 sm:gap-3">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="text-[15px] sm:text-base">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Logout */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="group flex items-center justify-center space-x-2 w-full px-4 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-100 hover:border-red-100 shadow-sm"
                >
                  <LogOut className="w-5 h-5 transition-colors text-slate-400 group-hover:text-red-600" />
                  <span className="text-[15px] sm:text-base">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 top-16 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;