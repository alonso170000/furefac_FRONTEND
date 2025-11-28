// src/administracion/paginas/Contactos.jsx
import { useState, useEffect } from "react";
import "../ui/Contactos.css";
import { 
  listarContactos, 
  crearContacto, 
  actualizarContacto, 
  eliminarContacto 
} from "../servicios/contactos";

export default function Contactos() {
  const [contactos, setContactos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  
  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [contactoEditar, setContactoEditar] = useState(null);
  
  // Form
  const [formContacto, setFormContacto] = useState({
    nombre: "",
    numero: "",
    correo: "",
  });

  // Cargar contactos al inicio
  useEffect(() => {
    cargarContactos();
  }, []);

  const cargarContactos = async () => {
    setCargando(true);
    setError("");
    try {
      const data = await listarContactos();
      setContactos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Abrir modal para crear/editar
  const abrirModal = (contacto = null) => {
    if (contacto) {
      setContactoEditar(contacto);
      setFormContacto({
        nombre: contacto.nombre,
        numero: contacto.numero,
        correo: contacto.correo,
      });
    } else {
      setContactoEditar(null);
      setFormContacto({
        nombre: "",
        numero: "",
        correo: "",
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setContactoEditar(null);
    setFormContacto({
      nombre: "",
      numero: "",
      correo: "",
    });
  };

  // Guardar contacto (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    setCargando(true);

    try {
      if (contactoEditar) {
        await actualizarContacto(contactoEditar.id, formContacto);
        setExito("Contacto actualizado correctamente");
      } else {
        await crearContacto(formContacto);
        setExito("Contacto creado correctamente");
      }
      await cargarContactos();
      cerrarModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Eliminar contacto
  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el contacto "${nombre}"?`)) {
      return;
    }

    setError("");
    setExito("");
    setCargando(true);

    try {
      await eliminarContacto(id);
      setExito("Contacto eliminado correctamente");
      await cargarContactos();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Filtrar contactos por búsqueda
  const contactosFiltrados = contactos.filter((c) => {
    const termino = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(termino) ||
      c.numero.includes(termino) ||
      c.correo.toLowerCase().includes(termino)
    );
  });

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="pagina-contactos">
      {/* Header */}
      <div className="contactos-header">
        <h1>Contactos</h1>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="alerta error">
          <p className="alerta-titulo">Error</p>
          <p>{error}</p>
        </div>
      )}

      {exito && (
        <div className="alerta exito">
          <p className="alerta-titulo">Éxito</p>
          <p>{exito}</p>
        </div>
      )}

      {/* Card Principal */}
      <div className="contactos-card">
        {/* Barra de acciones */}
        <div className="contactos-acciones">
          <button onClick={() => abrirModal()} className="btn-nuevo">
            Nuevo +
          </button>
          <div className="contactos-buscador">
            <input
              type="text"
              placeholder="Buscar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button>🔍</button>
          </div>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="estado-carga">
            <div className="spinner"></div>
            <p>Cargando contactos...</p>
          </div>
        ) : contactosFiltrados.length === 0 ? (
          <div className="estado-vacio">
            <p>No se encontraron contactos</p>
          </div>
        ) : (
          <div className="contactos-tabla-container">
            <table className="contactos-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Numero</th>
                  <th>Correo</th>
                  <th>Fecha de creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contactosFiltrados.map((contacto) => (
                  <tr key={contacto.id}>
                    <td className="contacto-nombre">{contacto.nombre}</td>
                    <td className="contacto-numero">{contacto.numero}</td>
                    <td className="contacto-correo">{contacto.correo}</td>
                    <td className="contacto-fecha">
                      {formatearFecha(contacto.creado_en)}
                    </td>
                    <td>
                      <div className="acciones-celda">
                        <button
                          onClick={() => abrirModal(contacto)}
                          className="btn-accion editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(contacto.id, contacto.nombre)}
                          className="btn-accion eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="modal-contactos">
          <div className="modal-contactos-contenido">
            <div className="modal-contactos-header">
              <h2>{contactoEditar ? "Editar Contacto" : "Nuevo Contacto"}</h2>
              <button onClick={cerrarModal} className="modal-contactos-close">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-contactos-body">
              <div className="modal-contactos-field">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formContacto.nombre}
                  onChange={(e) =>
                    setFormContacto({ ...formContacto, nombre: e.target.value })
                  }
                  required
                  placeholder="Ej: Fundación"
                />
              </div>

              <div className="modal-contactos-field">
                <label>Número *</label>
                <input
                  type="tel"
                  value={formContacto.numero}
                  onChange={(e) =>
                    setFormContacto({ ...formContacto, numero: e.target.value })
                  }
                  required
                  placeholder="Ej: 9988776655"
                />
              </div>

              <div className="modal-contactos-field">
                <label>Correo *</label>
                <input
                  type="email"
                  value={formContacto.correo}
                  onChange={(e) =>
                    setFormContacto({ ...formContacto, correo: e.target.value })
                  }
                  required
                  placeholder="Ej: contacto@ejemplo.com"
                />
              </div>

              <div className="modal-contactos-actions">
                <button
                  type="submit"
                  disabled={cargando}
                  className="modal-btn-guardar"
                >
                  {cargando ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="modal-btn-cancelar"
                >
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