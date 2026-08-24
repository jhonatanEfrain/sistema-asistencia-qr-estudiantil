import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, Role } from '../../types';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Key,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  UserCheck,
  Lock,
  History,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Users,
  Building2
} from 'lucide-react';

export const UserSecurityManager: React.FC = () => {
  const {
    usuarios,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    estudiantes,
    aulas,
    historialAccesos
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nombre: string;
    email: string;
    password?: string;
    rol: Role;
    dni?: string;
    estudianteId?: string;
    assignedAulas: string[];
    activo: boolean;
  }>({
    nombre: '',
    email: '',
    password: '',
    rol: 'docente',
    dni: '',
    estudianteId: '',
    assignedAulas: [],
    activo: true
  });

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      password: '123456',
      rol: 'docente',
      dni: '',
      estudianteId: estudiantes.length > 0 ? estudiantes[0].id : '',
      assignedAulas: [],
      activo: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: UserAccount) => {
    setEditingUser(u);
    setFormData({
      nombre: u.nombre,
      email: u.email,
      password: u.password || '123456',
      rol: u.rol,
      dni: u.dni || '',
      estudianteId: u.estudianteId || '',
      assignedAulas: u.assignedAulas || [],
      activo: u.activo !== false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email) {
      alert('Por favor complete el nombre y el correo electrónico.');
      return;
    }

    if (editingUser) {
      updateUsuario(editingUser.id, {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        dni: formData.dni,
        estudianteId: formData.rol === 'padre' ? formData.estudianteId : undefined,
        assignedAulas: formData.rol === 'docente' ? formData.assignedAulas : undefined,
        activo: formData.activo
      });
    } else {
      addUsuario({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password || '123456',
        rol: formData.rol,
        dni: formData.dni,
        estudianteId: formData.rol === 'padre' ? formData.estudianteId : undefined,
        assignedAulas: formData.rol === 'docente' ? formData.assignedAulas : undefined,
        avatar: formData.rol === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
          : formData.rol === 'docente'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        activo: formData.activo
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar la cuenta de usuario de "${name}"?`)) {
      deleteUsuario(id);
    }
  };

  const toggleAulaSelection = (aulaId: string) => {
    setFormData(prev => {
      const exists = prev.assignedAulas.includes(aulaId);
      if (exists) {
        return { ...prev, assignedAulas: prev.assignedAulas.filter(a => a !== aulaId) };
      } else {
        return { ...prev, assignedAulas: [...prev.assignedAulas, aulaId] };
      }
    });
  };

  const filteredUsers = usuarios.filter(u => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.dni && u.dni.includes(searchTerm)) ||
      (u.estudianteId && u.estudianteId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'todos' || u.rol === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalAdmins = usuarios.filter(u => u.rol === 'admin').length;
  const totalDocentes = usuarios.filter(u => u.rol === 'docente').length;
  const totalPadres = usuarios.filter(u => u.rol === 'padre').length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            Gestión de Cuentas de Usuario y Seguridad
          </h2>
          <p className="text-xs text-slate-400">
            Administración completa de credenciales, roles, vinculación de padres/alumnos y auditoría de accesos.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all w-fit"
        >
          <UserPlus className="w-4 h-4" />
          Crear Nuevo Usuario Acceso
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Usuarios</p>
            <p className="text-lg font-bold text-white">{usuarios.length}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Administradores</p>
            <p className="text-lg font-bold text-white">{totalAdmins}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Docentes</p>
            <p className="text-lg font-bold text-white">{totalDocentes}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Padres / Apoderados</p>
            <p className="text-lg font-bold text-white">{totalPadres}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, DNI o ID de estudiante..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white pl-9 pr-4 py-2 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todos">Todos los Roles</option>
            <option value="admin">Administradores</option>
            <option value="docente">Docentes</option>
            <option value="padre">Padres / Apoderados</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Listado de Cuentas Habilitadas para Inicio de Sesión ({filteredUsers.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Usuario / Nombre</th>
                <th className="py-2.5 px-3">Correo (Login)</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Vinculación Asignada</th>
                <th className="py-2.5 px-3">Contraseña</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No se encontraron usuarios con los criterios ingresados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const linkedStudent = user.estudianteId
                    ? estudiantes.find(e => e.id === user.estudianteId)
                    : null;

                  const isPasswordVisible = !!showPasswordMap[user.id];

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                            alt={user.nombre}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-100">{user.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {user.id} {user.dni && `• DNI: ${user.dni}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        {user.email}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            user.rol === 'admin'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : user.rol === 'docente'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {user.rol === 'admin' ? 'Administrador' : user.rol === 'docente' ? 'Docente Tutor' : 'Padre / Apoderado'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {user.rol === 'padre' && (
                          linkedStudent ? (
                            <div className="flex items-center gap-1.5 text-slate-200 text-[11px]">
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-semibold">{linkedStudent.apellidos}, {linkedStudent.nombres}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({linkedStudent.id})</span>
                            </div>
                          ) : (
                            <span className="text-amber-400 text-[11px]">Sin estudiante asignado</span>
                          )
                        )}

                        {user.rol === 'docente' && (
                          user.assignedAulas && user.assignedAulas.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.assignedAulas.map(aId => {
                                const aulaObj = aulas.find(a => a.id === aId);
                                return (
                                  <span key={aId} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                                    {aulaObj ? `${aulaObj.grado} ${aulaObj.seccion} (${aulaObj.nivel})` : aId}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Todas / General</span>
                          )
                        )}

                        {user.rol === 'admin' && (
                          <span className="text-slate-500 text-[11px]">Acceso Total al Sistema</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">
                            {isPasswordVisible ? (user.password || '123456') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(user.id)}
                            className="text-slate-500 hover:text-slate-300 p-1"
                            title={isPasswordVisible ? 'Ocultar' : 'Mostrar'}
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {user.activo !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400">
                            <XCircle className="w-3 h-3" /> Inactivo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors"
                            title="Editar credenciales"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(user.id, user.nombre)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-400 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Info & Audit Logs */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Registro Histórico de Auditoría e Inicios de Sesión</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Usuario</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Fecha y Hora</th>
                <th className="py-2.5 px-3">IP Origen</th>
                <th className="py-2.5 px-3">Acción Registrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {historialAccesos.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">{log.usuario}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 capitalize">
                      {log.rol}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{log.fechaHora}</td>
                  <td className="py-3 px-3 text-slate-400">{log.ip}</td>
                  <td className="py-3 px-3 text-emerald-400">{log.accion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                {editingUser ? 'Editar Usuario de Acceso' : 'Crear Nuevo Usuario Acceso'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rol del Usuario <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.rol}
                  onChange={e => setFormData({ ...formData, rol: e.target.value as Role })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="docente">Docente Tutor</option>
                  <option value="padre">Padre / Apoderado</option>
                  <option value="admin">Administrador del Sistema</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre Completo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Carlos Alvarez"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Correo Electrónico (Login) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@colegio.edu.pe"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="72819301"
                    value={formData.dni}
                    onChange={e => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña de Acceso <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  El usuario podrá ingresar con su Correo o DNI usando esta contraseña.
                </p>
              </div>

              {/* Conditional: Select Student if Role is Padre */}
              {formData.rol === 'padre' && (
                <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-emerald-400">
                    Estudiante Vinculado (Obligatorio para Apoderados)
                  </label>
                  <select
                    value={formData.estudianteId}
                    onChange={e => setFormData({ ...formData, estudianteId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Seleccionar Alumno --</option>
                    {estudiantes.map(est => (
                      <option key={est.id} value={est.id}>
                        {est.apellidos}, {est.nombres} ({est.grado} {est.seccion} - {est.nivel}) [{est.id}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional: Select Classrooms if Role is Docente */}
              {formData.rol === 'docente' && (
                <div className="p-3 bg-slate-950 border border-blue-500/20 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-blue-400">
                    Aulas Asignadas para Monitoreo Tutor
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                    {aulas.map(aula => {
                      const isSelected = formData.assignedAulas.includes(aula.id);
                      return (
                        <button
                          type="button"
                          key={aula.id}
                          onClick={() => toggleAulaSelection(aula.id)}
                          className={`p-2 rounded-xl text-[11px] text-left flex items-center justify-between border transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>{aula.grado} {aula.seccion} ({aula.nivel})</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActivo"
                  checked={formData.activo}
                  onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="userActivo" className="text-xs text-slate-300 font-medium">
                  Cuenta Activa y Habilitada para Inicio de Sesión
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
