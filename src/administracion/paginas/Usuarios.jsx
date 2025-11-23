// src/administracion/paginas/Usuarios.jsx
import { useState, useEffect } from "react";
import "../ui/Usuarios.css";
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

export default function Usuarios() {
  const [vistaActual, setVistaActual] = useState("usuarios"); // "usuarios" | "roles" | "permisos"
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

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [vistaActual]);

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
    if (usuario) {
      setUsuarioEditar(usuario);
      setFormUsuario({
        usuario: usuario.usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        password: "", // No mostrar contraseña
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
        rol_id: roles[0]?.id || "",
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
        // Editar - solo enviar campos que pueden cambiar
        const payload = {
          nombre: formUsuario.nombre,
          apellido: formUsuario.apellido,
          correo: formUsuario.correo,
          rol_id: formUsuario.rol_id,
          activo: formUsuario.activo,
        };
        await actualizarUsuario(usuarioEditar.id, payload);
        setExito("Usuario actualizado correctamente");
      } else {
        // Crear
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

  const handleEliminarUsuario = async (id, nombreUsuario) => {
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
    if (id === 1) {
      setError("No se puede eliminar el rol Superadmin");
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

  const usuariosFiltrados = usuarios.filter((u) => {
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
          <span>👥</span> Usuarios
        </button>
        <button
          onClick={() => setVistaActual("roles")}
          className={`tab-btn ${vistaActual === "roles" ? "active" : ""}`}
        >
          <span>🎭</span> Roles
        </button>
        <button
          onClick={() => setVistaActual("permisos")}
          className={`tab-btn ${vistaActual === "permisos" ? "active" : ""}`}
        >
          <span>🔐</span> Permisos
        </button>
      </div>

      {/* Contenido según vista */}
      <div className="usuarios-card">
          {/* VISTA USUARIOS */}
          {vistaActual === "usuarios" && (
            <>
              {/* Barra de acciones */}
              <div className="usuarios-acciones">
                <button onClick={() => abrirModalUsuario()} className="btn-verde">
                  + Nuevo Usuario
                </button>
                <div className="usuarios-buscador">
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  <button>🔍</button>
                </div>
              </div>

              {/* Tabla de usuarios */}
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
                              {usuario.id !== 1 && (
                                <button
                                  onClick={() =>
                                    handleEliminarUsuario(usuario.id, usuario.usuario)
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
              {/* Barra de acciones */}
              <div className="usuarios-acciones">
                <button onClick={() => abrirModalRol()} className="btn-verde">
                  + Nuevo Rol
                </button>
                <div className="usuarios-buscador">
                  <input
                    type="text"
                    placeholder="Buscar rol..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  <button>🔍</button>
                </div>
              </div>

              {/* Grid de roles */}
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
                        <div className="rol-card-icon">🎭</div>
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
                        {rol.id !== 1 && (
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
              {/* Selector de rol */}
              <div className="permisos-selector">
                <label>Selecciona un rol para gestionar sus permisos:</label>
                <select
                  value={rolSeleccionado || ""}
                  onChange={(e) => cargarPermisosRol(Number(e.target.value))}
                >
                  <option value="">-- Selecciona un rol --</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matriz de permisos */}
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
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
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
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
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
                />
              </div>

              <div className="modal-usuarios-actions">
                <button type="submit" disabled={cargando} className="modal-btn-guardar">
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