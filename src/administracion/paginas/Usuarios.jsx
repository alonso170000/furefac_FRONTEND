// src/administracion/paginas/Usuarios.jsx
// VERSIÓN: Protección por NOMBRE de rol ("Superadmin")

import { useState, useEffect } from "react";
import "../ui/Usuarios.css";
import { useAuth } from "../servicios/auth";
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  listarRoles,
  crearRol,
  actualizarRol,
  eliminarRol,
  listarSecciones,
  obtenerPermisosRol,
  actualizarPermisosRol,
} from "../servicios/usuarios";
import {FiSettings, FiSearch} from "react-icons/fi";
  
export default function Usuarios() {
  const { usuario: usuarioActual } = useAuth();
  
  const [vistaActual, setVistaActual] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Modales
  const [modalUsuario, setModalUsuario] = useState(false);
  const [modalRol, setModalRol] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [rolEditar, setRolEditar] = useState(null);

  // Form states
  const [formUsuario, setFormUsuario] = useState({
    usuario: "",
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    rol_id: "",
    activo: 1,
  });

  const [formRol, setFormRol] = useState({
    nombre: "",
  });

  // FUNCIÓN HELPER: Verificar si un usuario es Superadmin
  const esSuperadmin = (usuario) => {
    // Verificar por nombre de rol (case insensitive)
    return usuario?.rol_nombre?.toLowerCase() === "superadmin";
  };

  // FUNCIÓN HELPER: Verificar si es el usuario actual
  const esUsuarioActual = (usuarioId) => {
    return usuarioId === usuarioActual?.id;
  };

  // NUEVO: Verificar si un rol es el del usuario actual
  const esMiRol = (rolNombre) => {
    if (!usuarioActual) {
      console.warn("usuarioActual es null o undefined");
      return false;
    }
    
    if (!usuarioActual.rol_nombre) {
      console.warn("usuarioActual no tiene campo rol_nombre:", usuarioActual);
      return false;
    }
    
    const miRol = usuarioActual.rol_nombre.toLowerCase();
    const rolComparar = rolNombre?.toLowerCase();
    
    console.log("🔍 esMiRol:", { 
      miRol, 
      rolComparar, 
      sonIguales: miRol === rolComparar,
      usuarioActual 
    });
    
    return miRol === rolComparar;
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [vistaActual]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      if (vistaActual === "usuarios") {
        const [dataUsuarios, dataRoles] = await Promise.all([
          listarUsuarios(),
          listarRoles(),
        ]);
        setUsuarios(dataUsuarios);
        setRoles(dataRoles);
      } else if (vistaActual === "roles") {
        const dataRoles = await listarRoles();
        setRoles(dataRoles);
      } else if (vistaActual === "permisos") {
        const [dataRoles, dataSecciones] = await Promise.all([
          listarRoles(),
          listarSecciones(),
        ]);
        setRoles(dataRoles);
        setSecciones(dataSecciones);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // ==================== GESTIÓN DE USUARIOS ====================

  const abrirModalUsuario = (usuario = null) => {
    // Filtrar roles disponibles antes de abrir el modal
    const rolesParaModal = roles.filter((r) => {
      if (esSuperadmin(usuarioActual)) return true;
      return r.nombre.toLowerCase() !== "superadmin";
    });

    if (usuario) {
      setUsuarioEditar(usuario);
      setFormUsuario({
        usuario: usuario.usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        password: "",
        rol_id: usuario.rol_id,
        activo: usuario.activo,
      });
    } else {
      setUsuarioEditar(null);
      setFormUsuario({
        usuario: "",
        nombre: "",
        apellido: "",
        correo: "",
        password: "",
        rol_id: rolesParaModal[0]?.id || "",
        activo: 1,
      });
    }
    setModalUsuario(true);
  };

  const cerrarModalUsuario = () => {
    setModalUsuario(false);
    setUsuarioEditar(null);
    setFormUsuario({
      usuario: "",
      nombre: "",
      apellido: "",
      correo: "",
      password: "",
      rol_id: "",
      activo: 1,
    });
  };

  const handleSubmitUsuario = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    setCargando(true);

    try {
      if (usuarioEditar) {
        const payload = {
          nombre: formUsuario.nombre,
          apellido: formUsuario.apellido,
          correo: formUsuario.correo,
        };

        // Solo enviar nueva contrasena si el campo no viene vacio
        if (formUsuario.password.trim()) {
          payload.password = formUsuario.password.trim();
        }
        
        // Solo incluir rol y estado si NO es el usuario actual
        if (!esUsuarioActual(usuarioEditar.id)) {
          payload.rol_id = formUsuario.rol_id;
          payload.activo = formUsuario.activo;
        }
        
        await actualizarUsuario(usuarioEditar.id, payload);
        setExito("Usuario actualizado correctamente");
      } else {
        await crearUsuario(formUsuario);
        setExito("Usuario creado correctamente");
      }
      await cargarDatos();
      cerrarModalUsuario();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarUsuario = async (id, nombreUsuario, usuario) => {
    // PROTECCIÓN 1: No permitir eliminar Superadmins
    if (esSuperadmin(usuario)) {
      setError("No se puede eliminar un usuario Superadmin");
      return;
    }
    
    // PROTECCIÓN 2: No permitir eliminarte a ti mismo
    if (esUsuarioActual(id)) {
      setError("No puedes eliminar tu propia cuenta");
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${nombreUsuario}"?`)) return;
    
    setError("");
    setExito("");
    setCargando(true);

    try {
      await eliminarUsuario(id);
      setExito("Usuario eliminado correctamente");
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // ==================== GESTIÓN DE ROLES ====================

  const abrirModalRol = (rol = null) => {
    if (rol) {
      setRolEditar(rol);
      setFormRol({ nombre: rol.nombre });
    } else {
      setRolEditar(null);
      setFormRol({ nombre: "" });
    }
    setModalRol(true);
  };

  const cerrarModalRol = () => {
    setModalRol(false);
    setRolEditar(null);
    setFormRol({ nombre: "" });
  };

  const handleSubmitRol = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    setCargando(true);

    try {
      if (rolEditar) {
        // PROTECCIÓN 1: No permitir editar el rol Superadmin
        if (rolEditar.nombre.toLowerCase() === "superadmin") {
          setError("No se puede editar el rol Superadmin");
          setCargando(false);
          return;
        }
        
        // PROTECCIÓN 2: No permitir editar el rol Admin
        if (rolEditar.nombre.toLowerCase() === "admin") {
          setError("No se puede editar el rol Admin");
          setCargando(false);
          return;
        }
        
        await actualizarRol(rolEditar.id, formRol);
        setExito("Rol actualizado correctamente");
      } else {
        await crearRol(formRol);
        setExito("Rol creado correctamente");
      }
      await cargarDatos();
      cerrarModalRol();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarRol = async (id, nombreRol) => {
    // PROTECCIÓN 1: No permitir eliminar el rol Superadmin
    if (nombreRol.toLowerCase() === "superadmin") {
      setError("No se puede eliminar el rol Superadmin");
      return;
    }
    
    // PROTECCIÓN 2: No permitir eliminar el rol Admin
    if (nombreRol.toLowerCase() === "admin") {
      setError("No se puede eliminar el rol Admin");
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${nombreRol}"?`)) return;
    
    setError("");
    setExito("");
    setCargando(true);

    try {
      await eliminarRol(id);
      setExito("Rol eliminado correctamente");
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // ==================== GESTIÓN DE PERMISOS ====================

  const cargarPermisosRol = async (rolId) => {
    setCargando(true);
    setError("");
    try {
      const data = await obtenerPermisosRol(rolId);
      setPermisos(data);
      setRolSeleccionado(rolId);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const togglePermiso = (seccionId, tipo) => {
    setPermisos((prev) =>
      prev.map((p) =>
        p.seccion_id === seccionId ? { ...p, [tipo]: p[tipo] === 1 ? 0 : 1 } : p
      )
    );
  };

  const handleGuardarPermisos = async () => {
    if (!rolSeleccionado) return;
    
    setError("");
    setExito("");
    setCargando(true);

    try {
      await actualizarPermisosRol(rolSeleccionado, permisos);
      setExito("Permisos actualizados correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // ==================== FILTROS ====================

  // PROTECCIÓN: Ocultar usuarios Superadmin (excepto si TÚ eres Superadmin)
  const usuariosFiltrados = usuarios
    .filter((u) => {
      // Si eres Superadmin, puedes ver a todos (incluyendo otros Superadmins)
      if (esSuperadmin(usuarioActual)) {
        return true;
      }
      // Si no eres Superadmin, no puedes ver a los Superadmins
      return !esSuperadmin(u);
    })
    .filter((u) => {
      const termino = busqueda.toLowerCase();
      return (
        u.usuario.toLowerCase().includes(termino) ||
        u.nombre.toLowerCase().includes(termino) ||
        u.apellido.toLowerCase().includes(termino) ||
        u.correo.toLowerCase().includes(termino) ||
        u.rol_nombre?.toLowerCase().includes(termino)
      );
    });

  const rolesFiltrados = roles.filter((r) =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // NUEVO: Filtrar roles para el dropdown del modal (ocultar Superadmin excepto si eres Superadmin)
  const rolesDisponibles = roles.filter((r) => {
    // Si eres Superadmin, puedes asignar cualquier rol (incluyendo Superadmin)
    if (esSuperadmin(usuarioActual)) {
      return true;
    }
    // Si no eres Superadmin, no puedes asignar el rol Superadmin
    return r.nombre.toLowerCase() !== "superadmin";
  });

  // ==================== RENDER ====================

  return (
    <div className="pagina-usuarios">
      {/* Mensajes */}
      {error && (
        <div className="alerta error">
          <div>
            <p className="alerta-titulo">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {exito && (
        <div className="alerta exito">
          <div>
            <p className="alerta-titulo">Éxito</p>
            <p>{exito}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="usuarios-tabs">
        <button
          onClick={() => setVistaActual("usuarios")}
          className={`tab-btn ${vistaActual === "usuarios" ? "active" : ""}`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setVistaActual("roles")}
          className={`tab-btn ${vistaActual === "roles" ? "active" : ""}`}
        >
          Roles
        </button>
        <button
          onClick={() => setVistaActual("permisos")}
          className={`tab-btn ${vistaActual === "permisos" ? "active" : ""}`}
        >
          Permisos
        </button>
      </div>

      {/* Contenido según vista */}
      <div className="usuarios-card">
          {/* VISTA USUARIOS */}
          {vistaActual === "usuarios" && (
            <>
              <div className="usuarios-acciones">
                <button onClick={() => abrirModalUsuario()} className="btn-verde">
                  + Nuevo Usuario
                </button>
                <div className="usuarios-buscador">
                  <input
                    type="text"
                    placeholder="Buscar usuario"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  <button><FiSearch /></button>
                </div>
              </div>

              {cargando ? (
                <div className="estado-carga">
                  <div className="spinner"></div>
                  <p>Cargando usuarios...</p>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="estado-vacio">
                  <p>No se encontraron usuarios</p>
                </div>
              ) : (
                <div className="usuarios-tabla-container">
                  <table className="usuarios-tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((usuario) => (
                        <tr key={usuario.id}>
                          <td className="usuario-id">{usuario.id}</td>
                          <td className="usuario-nombre">{usuario.usuario}</td>
                          <td>
                            {usuario.nombre} {usuario.apellido}
                          </td>
                          <td className="usuario-email">{usuario.correo}</td>
                          <td>
                            <span className="badge rol">{usuario.rol_nombre}</span>
                          </td>
                          <td>
                            <span className={`badge ${usuario.activo ? "activo" : "inactivo"}`}>
                              {usuario.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td>
                            <div className="acciones-celda">
                              <button
                                onClick={() => abrirModalUsuario(usuario)}
                                className="btn-accion editar"
                              >
                                Editar
                              </button>
                              {/* Mostrar eliminar solo si NO es Superadmin Y NO es tu usuario */}
                              {!esSuperadmin(usuario) && !esUsuarioActual(usuario.id) && (
                                <button
                                  onClick={() =>
                                    handleEliminarUsuario(usuario.id, usuario.usuario, usuario)
                                  }
                                  className="btn-accion eliminar"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* VISTA ROLES */}
          {vistaActual === "roles" && (
            <>
              <div className="usuarios-acciones">
                <button onClick={() => abrirModalRol()} className="btn-verde">
                  + Nuevo Rol
                </button>
                <div className="usuarios-buscador">
                  <input
                    type="text"
                    placeholder="Buscar rol"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  <button><FiSearch/></button>
                </div>
              </div>

              {cargando ? (
                <div className="estado-carga">
                  <div className="spinner"></div>
                  <p>Cargando roles...</p>
                </div>
              ) : rolesFiltrados.length === 0 ? (
                <div className="estado-vacio">
                  <p>No se encontraron roles</p>
                </div>
              ) : (
                <div className="roles-grid">
                  {rolesFiltrados.map((rol) => (
                    <div key={rol.id} className="rol-card">
                      <div className="rol-card-header">
                        <div className="rol-card-info">
                          <h3>{rol.nombre}</h3>
                          <p>ID: {rol.id}</p>
                        </div>
                        <div className="rol-card-icon"> <FiSettings></FiSettings> </div>
                      </div>
                      <div className="rol-card-meta">
                        Creado: {new Date(rol.creado_en).toLocaleDateString()}
                      </div>
                      <div className="rol-card-actions">
                        <button
                          onClick={() => abrirModalRol(rol)}
                          className="btn-accion editar"
                        >
                          Editar
                        </button>
                        {/* No mostrar eliminar si es Superadmin o Admin */}
                        {rol.nombre.toLowerCase() !== "superadmin" && 
                         rol.nombre.toLowerCase() !== "admin" && (
                          <button
                            onClick={() => handleEliminarRol(rol.id, rol.nombre)}
                            className="btn-accion eliminar"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* VISTA PERMISOS */}
          {vistaActual === "permisos" && (
            <>
              <div className="permisos-selector">
                <label>Selecciona un rol para gestionar sus permisos:</label>
                <select
                  value={rolSeleccionado || ""}
                  onChange={(e) => cargarPermisosRol(Number(e.target.value))}
                >
                  <option value="">-- Selecciona un rol --</option>
                  {/* Filtrar Superadmin (excepto si eres Superadmin) */}
                  {roles
                    .filter((rol) => {
                      // Si eres Superadmin, puedes editar permisos de todos los roles
                      if (esSuperadmin(usuarioActual)) return true;
                      // Si no, no puedes editar permisos del rol Superadmin
                      return rol.nombre.toLowerCase() !== "superadmin";
                    })
                    .map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                </select>
              </div>

              {rolSeleccionado && (
                <>
                  {cargando ? (
                    <div className="estado-carga">
                      <div className="spinner"></div>
                      <p>Cargando permisos...</p>
                    </div>
                  ) : (
                    <>
                      <div className="permisos-tabla-container">
                        <table className="permisos-tabla">
                          <thead>
                            <tr>
                              <th>Sección</th>
                              <th>Crear</th>
                              <th>Editar</th>
                              <th>Eliminar</th>
                              <th>Reporte</th>
                            </tr>
                          </thead>
                          <tbody>
                            {permisos.map((permiso) => (
                              <tr key={permiso.seccion_id}>
                                <td>{permiso.seccion}</td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={permiso.puede_crear === 1}
                                    onChange={() =>
                                      togglePermiso(
                                        permiso.seccion_id,
                                        "puede_crear"
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={permiso.puede_editar === 1}
                                    onChange={() =>
                                      togglePermiso(
                                        permiso.seccion_id,
                                        "puede_editar"
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={permiso.puede_eliminar === 1}
                                    onChange={() =>
                                      togglePermiso(
                                        permiso.seccion_id,
                                        "puede_eliminar"
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={permiso.puede_reporte === 1}
                                    onChange={() =>
                                      togglePermiso(
                                        permiso.seccion_id,
                                        "puede_reporte"
                                      )
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleGuardarPermisos}
                        disabled={cargando}
                        className="btn-guardar-permisos"
                      >
                        {cargando ? "Guardando..." : "Guardar Permisos"}
                      </button>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

      {/* MODAL USUARIO */}
      {modalUsuario && (
        <div className="modal-usuarios">
          <div className="modal-usuarios-contenido">
            <div className="modal-usuarios-header">
              <h2>{usuarioEditar ? "Editar Usuario" : "Nuevo Usuario"}</h2>
              <button onClick={cerrarModalUsuario} className="modal-usuarios-close">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitUsuario} className="modal-usuarios-body">
              <div className="modal-field-grid">
                <div className="modal-usuarios-field">
                  <label>Usuario *</label>
                  <input
                    type="text"
                    value={formUsuario.usuario}
                    onChange={(e) =>
                      setFormUsuario({ ...formUsuario, usuario: e.target.value })
                    }
                    disabled={!!usuarioEditar}
                    required
                    placeholder="Nombre de usuario"
                  />
                </div>

                <div className="modal-usuarios-field">
                  <label>Correo *</label>
                  <input
                    type="email"
                    value={formUsuario.correo}
                    onChange={(e) =>
                      setFormUsuario({ ...formUsuario, correo: e.target.value })
                    }
                    required
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="modal-usuarios-field">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formUsuario.nombre}
                    onChange={(e) =>
                      setFormUsuario({ ...formUsuario, nombre: e.target.value })
                    }
                    required
                    placeholder="Nombre"
                  />
                </div>

                <div className="modal-usuarios-field">
                  <label>Apellido *</label>
                  <input
                    type="text"
                    value={formUsuario.apellido}
                    onChange={(e) =>
                      setFormUsuario({ ...formUsuario, apellido: e.target.value })
                    }
                    required
                    placeholder="Apellido"
                  />
                </div>

                <div className="modal-usuarios-field">
                  <label>Contraseña {!usuarioEditar && "*"}</label>
                  <input
                    type="password"
                    value={formUsuario.password}
                    onChange={(e) =>
                      setFormUsuario({ ...formUsuario, password: e.target.value })
                    }
                    required={!usuarioEditar}
                    placeholder={usuarioEditar ? "Dejar vacío para no cambiar" : "Contraseña"}
                  />
                </div>

                <div className="modal-usuarios-field">
                  <label>Rol *</label>
                  <select
                    value={formUsuario.rol_id}
                    onChange={(e) =>
                      setFormUsuario({ ...formUsuario, rol_id: e.target.value })
                    }
                    required
                    disabled={usuarioEditar && esUsuarioActual(usuarioEditar.id)}
                  >
                    <option value="">Selecciona un rol</option>
                    {rolesDisponibles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                  {usuarioEditar && esUsuarioActual(usuarioEditar.id) && (
                    <small style={{ 
                      color: 'rgba(255,255,255,0.7)', 
                      fontSize: '0.8rem', 
                      marginTop: '4px', 
                      display: 'block' 
                    }}>
                      No puedes cambiar tu propio rol
                    </small>
                  )}
                </div>

                <div className="modal-usuarios-field">
                  <label>Estado</label>
                  <select
                    value={formUsuario.activo}
                    onChange={(e) =>
                      setFormUsuario({
                        ...formUsuario,
                        activo: Number(e.target.value),
                      })
                    }
                    disabled={usuarioEditar && esUsuarioActual(usuarioEditar.id)}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                  {usuarioEditar && esUsuarioActual(usuarioEditar.id) && (
                    <small style={{ 
                      color: 'rgba(255,255,255,0.7)', 
                      fontSize: '0.8rem', 
                      marginTop: '4px', 
                      display: 'block' 
                    }}>
                      No puedes cambiar tu propio estado
                    </small>
                  )}
                </div>
              </div>

              <div className="modal-usuarios-actions">
                <button type="submit" disabled={cargando} className="modal-btn-guardar">
                  {cargando ? "Guardando..." : "Guardar"}
                </button>
                <button type="button" onClick={cerrarModalUsuario} className="modal-btn-cancelar">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ROL */}
      {modalRol && (
        <div className="modal-usuarios">
          <div className="modal-usuarios-contenido modal-rol-contenido">
            <div className="modal-usuarios-header">
              <h2>{rolEditar ? "Editar Rol" : "Nuevo Rol"}</h2>
              <button onClick={cerrarModalRol} className="modal-usuarios-close">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitRol} className="modal-usuarios-body">
              <div className="modal-usuarios-field">
                <label>Nombre del Rol *</label>
                <input
                  type="text"
                  value={formRol.nombre}
                  onChange={(e) => setFormRol({ ...formRol, nombre: e.target.value })}
                  required
                  placeholder="Ej: Administrador, Vendedor, etc."
                  disabled={
                    (rolEditar?.nombre.toLowerCase() === "superadmin") ||
                    (rolEditar?.nombre.toLowerCase() === "admin")
                  }
                />
                {rolEditar?.nombre.toLowerCase() === "superadmin" && (
                  <small style={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: '0.8rem', 
                    marginTop: '4px', 
                    display: 'block' 
                  }}>
                    El rol Superadmin no se puede editar
                  </small>
                )}
                {rolEditar?.nombre.toLowerCase() === "admin" && (
                  <small style={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: '0.8rem', 
                    marginTop: '4px', 
                    display: 'block' 
                  }}>
                    🔒 El rol Admin no se puede editar
                  </small>
                )}
              </div>

              <div className="modal-usuarios-actions">
                <button 
                  type="submit" 
                  disabled={
                    cargando || 
                    (rolEditar?.nombre.toLowerCase() === "superadmin") ||
                    (rolEditar?.nombre.toLowerCase() === "admin")
                  } 
                  className="modal-btn-guardar"
                >
                  {cargando ? "Guardando..." : "Guardar"}
                </button>
                <button type="button" onClick={cerrarModalRol} className="modal-btn-cancelar">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
