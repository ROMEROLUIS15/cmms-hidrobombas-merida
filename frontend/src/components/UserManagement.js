import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Trash2, 
  Mail, 
  Clock,
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error al cargar usuarios');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/status`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success(currentStatus ? 'Acceso revocado' : 'Usuario aprobado con éxito');
      fetchUsers();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Rol actualizado');
      fetchUsers();
    } catch (error) {
      toast.error('Error al actualizar rol');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Está seguro de eliminar este usuario permanentemente?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Usuario eliminado');
        fetchUsers();
      } catch (error) {
        toast.error('Error al eliminar usuario');
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const usernameMatch = u.username ? u.username.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const emailMatch = u.email ? u.email.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return usernameMatch || emailMatch;
  });

  // Debugging log para ver qué datos llegan del backend
  console.log("Usuarios cargados desde el backend:", users);
  console.log("Usuarios filtrados:", filteredUsers);

  if (loading) return <div className="p-8 text-center">Cargando gestión de usuarios...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
            Control de Usuarios
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Gestione el acceso y roles del personal técnico.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-full w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users List - Responsive View */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-full max-w-full">
        
        {/* Mobile Vertical View (Cards) */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No se encontraron usuarios que coincidan con su búsqueda.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="p-4 flex flex-col gap-4">
                
                {/* Avatar and Name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0">
                      {(u.username || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{u.username}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{u.email}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all shrink-0 h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Role and Status Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rol Asignado</span>
                    <select 
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2 py-1.5 focus:ring-0 cursor-pointer outline-none shadow-sm"
                    >
                      <option value="technician">Técnico</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Administrador</option>
                      <option value="client">Cliente</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                    <button 
                      onClick={() => handleToggleStatus(u.id, u.isActive)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${
                        u.isActive 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                      }`}
                    >
                      {u.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {u.isActive ? 'ACTIVO' : 'PENDIENTE'}
                    </button>
                  </div>
                </div>

                {/* Last Access */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Último acceso: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Nunca'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Último Acceso</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0">
                        {(u.username || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{u.username}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer hover:border-blue-300 outline-none transition-colors"
                    >
                      <option value="technician">Técnico</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Administrador</option>
                      <option value="client">Cliente</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(u.id, u.isActive)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                        u.isActive 
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                          : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 animate-pulse'
                      }`}
                    >
                      {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {u.isActive ? 'ACTIVO' : 'PENDIENTE'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Nunca'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No se encontraron usuarios que coincidan con su búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
