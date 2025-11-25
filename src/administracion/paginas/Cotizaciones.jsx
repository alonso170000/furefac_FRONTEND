//C:\UPQROO\FUREFAC PROYECTO\Frontend_furefac\src\administracion\paginas\Cotizaciones.jsx
import { useEffect, useMemo, useState } from "react";
import "./../ui/Cotizaciones.css";
import {
  listarCotizaciones,
  cambiarEstadoCotizacion,
  registrarCompra,
  crearCotizacion,
  obtenerImagenesCotizacion,
} from "../servicios/cotizaciones";
import { listarImagenesProducto } from "../servicios/productos";

const ESTADOS = [
  { value: "todos", label: "Todo" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_seguimiento", label: "En seguimiento" },
  { value: "comprado", label: "Comprado" },
  { value: "no_comprado", label: "No comprado" },
];

export default function Cotizaciones() {
  const [estado, setEstado] = useState("todos");
  const [q, setQ] = useState("");
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [imagenesMap, setImagenesMap] = useState({});
  const [productoImagenMap, setProductoImagenMap] = useState({});

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const data = await listarCotizaciones({ estado, q });
      setLista(Array.isArray(data) ? data : []);
      // carga imágenes por cotización
      const imagenesPorId = {};
      const productoImgPorCot = {};
      await Promise.all(
        (data || []).map(async (c) => {
          if (!c?.id) return;
          try {
            const imgs = await obtenerImagenesCotizacion(c.id);
            imagenesPorId[c.id] = imgs.map((it) => it.ruta).filter(Boolean);
          } catch {
            imagenesPorId[c.id] = [];
          }
          if (c.producto_id) {
            try {
              const imgsProd = await listarImagenesProducto(c.producto_id);
              const rutasProd = (imgsProd || []).map((it) => it.ruta).filter(Boolean);
              if (rutasProd.length) productoImgPorCot[c.id] = rutasProd[0];
            } catch {
              /* ignore */
            }
          }
        })
      );
      setImagenesMap(imagenesPorId);
      setProductoImagenMap(productoImgPorCot);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las cotizaciones");
      setLista([]);
      setImagenesMap({});
      setProductoImagenMap({});
    } finally {
      setCargando(false);
    }
  }

  const filtradas = useMemo(() => {
    if (!q.trim()) return lista;
    const term = q.toLowerCase();
    return lista.filter((c) => (c.descripcion || "").toLowerCase().includes(term));
  }, [lista, q]);

  return (
    <div className="cotz-page">
      <div className="cotz-hero">
        <div className="cotz-toolbar">
          <select className="cotz-filter" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
        <div className="cotz-hero-top">
          <div className="cotz-actions">
            <button className="cotz-btn-new">Nuevo +</button>
            <div className="cotz-search">
              <input
                type="search"
                placeholder="Buscar"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onBlur={cargar}
              />
            </div>
          </div>
        </div>
      </div>

      {cargando && <div className="estado">Cargando...</div>}
      {error && <div className="estado error">{error}</div>}

      {!cargando && !error && (
        <div className="cotz-list">
          {filtradas.map((c) => (
            <CotizacionCard
              key={c.id}
              data={c}
              imagenes={imagenesMap[c.id] || []}
              productoImagen={productoImagenMap[c.id]}
              onRefresh={cargar}
            />
          ))}
          {filtradas.length === 0 && <div className="estado">Sin cotizaciones</div>}
        </div>
      )}
    </div>
  );
}

function CotizacionCard({ data, imagenes = [], productoImagen, onRefresh }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(false);
  const [chipHover, setChipHover] = useState(null);
  const [estadoActual, setEstadoActual] = useState(data?.estado || "pendiente");
  
  const fecha = data?.creado_en ? new Date(data.creado_en) : null;
  const mes = fecha ? fecha.toLocaleString("es-MX", { month: "short" }).toUpperCase() : "";
  const dia = fecha ? fecha.getDate() : "";
  const anio = fecha ? fecha.getFullYear() : "";
  const thumb = productoImagen || data?.imagen_portada || (data?.imagenes?.[0]) || "https://via.placeholder.com/120";

  useEffect(() => {
    setEstadoActual(data?.estado || "pendiente");
  }, [data?.estado]);

  async function cambiarEstado(nuevoEstado) {
    try {
      setEstadoActual(nuevoEstado);
      await cambiarEstadoCotizacion(data.id, nuevoEstado);
      setMenuAbierto(false);
      setSubmenuAbierto(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  }

  async function registrarCompraHandler() {
    try {
      await registrarCompra(data.id);
      setMenuAbierto(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error al registrar compra:", error);
    }
  }

  function descargarImagen(url, index) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `cotizacion-${data.id}-imagen-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuAbierto && !e.target.closest('.cotz-menu-btn') && !e.target.closest('.cotz-menu-dropdown')) {
        setMenuAbierto(false);
        setSubmenuAbierto(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuAbierto]);

  return (
    <article className="cotz-card">
      <div className="cotz-thumb">
        <img src={thumb} alt="producto" />
      </div>
      <div className="cotz-body">
        <div className="cotz-desc-row">
          <p className="cotz-desc">{data?.descripcion || "Sin descripción"}</p>
          <div className="cotz-date">
            <div>{mes}</div>
            <div className="cotz-date-day">{dia}</div>
            <div>{anio}</div>
          </div>
        </div>
      </div>
      <div className="cotz-right">
        <div className="cotz-user" data-estado={estadoActual}>
          <strong>{data?.nombre_usuario}</strong>
          <small>{data?.telefono}</small>
          <small>{data?.correo}</small>
        </div>
        <div className="cotz-actions-row">

          <div className={`cotz-chips ${imagenes.length > 2 ? "cotz-chips--many" : ""}`}>
            {imagenes.map((img, idx) => (

              <span
                key={idx}
                className="cotz-chip-img"
                onMouseEnter={() => setChipHover(idx)}
                onMouseLeave={() => setChipHover(null)}
                onFocus={() => setChipHover(idx)}
                onBlur={() => setChipHover(null)}
                tabIndex={0}
              >
                <img src={img} alt={`img-${idx}`} />

                {chipHover === idx && (

                  <div

                    className="cotz-chip-download"

                    onClick={() => descargarImagen(img, idx)}

                  >

                    Descargar

                  </div>

                )}

                

              </span>

            ))}

          </div>

          <button
            className="cotz-menu-btn"
            onClick={() => setMenuAbierto(!menuAbierto)}
            onMouseEnter={() => setMenuAbierto(true)}
          >
            ...
          </button>

          {menuAbierto && (
            <div className="cotz-menu-dropdown">
              <button 
                className="cotz-menu-item"
                onClick={() => registrarCompraHandler()}
              >
                Registrar compra
              </button>
              <button 
                className="cotz-menu-item has-submenu"
                onMouseEnter={() => setSubmenuAbierto(true)}
                onFocus={() => setSubmenuAbierto(true)}
                onBlur={() => setSubmenuAbierto(false)}
              >
                Cambiar estado
                <div
                  className={`cotz-submenu ${submenuAbierto ? "visible" : ""}`}
                  onMouseEnter={() => setSubmenuAbierto(true)}
                  onMouseLeave={() => setSubmenuAbierto(false)}
                >
                  <button 
                    className="cotz-menu-item pendiente"
                    onClick={() => cambiarEstado("pendiente")}
                  >
                    Pendiente
                  </button>
                  <button 
                    className="cotz-menu-item seguimiento"
                    onClick={() => cambiarEstado("en_seguimiento")}
                  >
                    En seguimiento
                  </button>
                  <button 
                    className="cotz-menu-item no-comprado"
                    onClick={() => cambiarEstado("no_comprado")}
                  >
                    No comprado
                  </button>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

