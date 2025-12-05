import { useEffect, useMemo, useState } from "react";
import { listarProductos } from "../administracion/servicios/productos";
import { crearComentarioPublico } from "../administracion/servicios/comentarios";
import imgPlaceholder from "../assets/manos.jpg";
import "./Home.css";
import "./CotizarModal.css";
import { FiArrowUp, FiChevronDown, FiSearch, FiX } from "react-icons/fi";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const formatoMXN = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function normalizarCategoria(producto) {
  return (producto?.categoria || producto?.categoria_nombre || producto?.nombre_categoria || "")
    .toString()
    .trim();
}

function normalizarRutaImagen(ruta) {
  if (!ruta) return imgPlaceholder;
  if (ruta.startsWith("http://") || ruta.startsWith("https://") || ruta.startsWith("data:")) return ruta;

  const limpia = ruta.trim();
  if (limpia.startsWith("/img/")) return limpia;          // imágenes servidas desde public/img
  if (limpia.startsWith("img/")) return `/${limpia}`;

  if (API_URL) {
    const sinSlash = limpia.startsWith("/") ? limpia.slice(1) : limpia;
    return `${API_URL}/${sinSlash}`;
  }
  return limpia || imgPlaceholder;
}

function formatearPrecio(valor) {
  const numero = Number(valor);
  return formatoMXN.format(Number.isFinite(numero) ? numero : 0);
}

export default function PrincipalHome() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    comentario: "",
  });

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [modalCotizarAbierta, setModalCotizarAbierta] = useState(false);
  const [productoCotizando, setProductoCotizando] = useState(null);
  const [indiceImagenCotizar, setIndiceImagenCotizar] = useState(0);
  const [formCotizar, setFormCotizar] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    descripcion: "",
    cantidad: 1,
  });
  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]);
  const [enviandoCotizacion, setEnviandoCotizacion] = useState(false);
  const [mensajeCotizacion, setMensajeCotizacion] = useState("");
  const [errorCotizacion, setErrorCotizacion] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      setCargandoProductos(true);
      setErrorProductos("");
      const data = await listarProductos({ activo: 1 });
      setProductos(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorProductos(e?.message || "No se pudieron cargar los productos.");
    } finally {
      setCargandoProductos(false);
    }
  }

  const categoriasDisponibles = useMemo(() => {
    const set = new Set();
    productos.forEach((p) => {
      const cat = normalizarCategoria(p);
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const catSeleccionada = categoria.toLowerCase();

    return productos.filter((p) => {
      const catProd = normalizarCategoria(p).toLowerCase();
      const coincideCategoria = categoria === "todos" || catProd === catSeleccionada;
      const coincideBusqueda =
        !termino ||
        p?.nombre?.toLowerCase().includes(termino) ||
        p?.descripcion?.toLowerCase().includes(termino) ||
        catProd.includes(termino);
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, busqueda, categoria]);

  const imagenesProductoCotizar = useMemo(() => {
    if (!productoCotizando) return [];
    let imgs = [];
    if (Array.isArray(productoCotizando.imagenes)) {
      imgs = productoCotizando.imagenes.filter(Boolean);
    } else if (typeof productoCotizando?.imagenes === "string" && productoCotizando.imagenes.length) {
      if (productoCotizando.imagenes.includes("||")) {
        imgs = productoCotizando.imagenes.split("||").filter(Boolean);
      } else {
        try { imgs = JSON.parse(productoCotizando.imagenes); } catch { imgs = []; }
      }
    }
    if (!imgs.length) {
      const fallback =
        productoCotizando?.imagen ||
        productoCotizando?.foto ||
        productoCotizando?.ruta ||
        productoCotizando?.ruta_imagen ||
        productoCotizando?.imagen_principal;
      imgs = [fallback];
    }
    return imgs.map(normalizarRutaImagen).filter(Boolean);
  }, [productoCotizando]);

  const precioProductoCotizar = useMemo(() => {
    if (!productoCotizando) return "";
    const valor = productoCotizando?.precio_mxn ?? productoCotizando?.precio ?? productoCotizando?.costo ?? 0;
    return formatearPrecio(valor);
  }, [productoCotizando]);
  const categoriaProductoCotizar = normalizarCategoria(productoCotizando);
  const descripcionProductoCotizar = productoCotizando?.descripcion || "Sin descripcion disponible.";
  const totalImagenesProducto = imagenesProductoCotizar.length;

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");

    try {
      await crearComentarioPublico({
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono.trim(),
        comentario: formData.comentario.trim(),
      });
      setMensaje("Comentario enviado con éxito. Gracias por escribirnos.");
      setFormData({ nombre: "", correo: "", telefono: "", comentario: "" });
    } catch (err) {
      setMensaje(err?.message || "Hubo un error al enviar el comentario.");
    } finally {
      setEnviando(false);
    }
  }

  function abrirModalCotizar(producto) {
    setProductoCotizando(producto);
    setIndiceImagenCotizar(0);
    setFormCotizar({
      nombre: "",
      correo: "",
      telefono: "",
      descripcion: "",
      cantidad: 1,
    });
    setImagenesAdjuntas([]);
    setMensajeCotizacion("");
    setErrorCotizacion("");
    setModalCotizarAbierta(true);
  }

  function cerrarModalCotizar() {
    setModalCotizarAbierta(false);
    setProductoCotizando(null);
    setIndiceImagenCotizar(0);
    setFormCotizar({
      nombre: "",
      correo: "",
      telefono: "",
      descripcion: "",
      cantidad: 1,
    });
    setImagenesAdjuntas([]);
    setMensajeCotizacion("");
    setErrorCotizacion("");
  }

  async function agregarArchivosCotizar(files) {
    const LIMITE = 5;
    const disponibles = LIMITE - imagenesAdjuntas.length;
    if (disponibles <= 0) {
      setErrorCotizacion(`Solo puedes subir hasta ${LIMITE} imagenes`);
      return;
    }
    const lista = Array.from(files || []).slice(0, disponibles);
    const nuevos = [];
    for (const file of lista) {
      const base64 = await toBase64(file);
      nuevos.push({ preview: base64, nombre: file.name });
    }
    setImagenesAdjuntas((prev) => [...prev, ...nuevos]);
  }

  function eliminarImagenCotizacion(idx) {
    setImagenesAdjuntas((prev) => prev.filter((_, i) => i !== idx));
  }

  function onDropCotizacion(e) {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      agregarArchivosCotizar(e.dataTransfer.files);
    }
  }

  function onDragOverCotizacion(e) { e.preventDefault(); }

  function siguienteImagenCotizar() {
    if (!imagenesProductoCotizar.length) return;
    setIndiceImagenCotizar((i) => (i + 1) % imagenesProductoCotizar.length);
  }

  function anteriorImagenCotizar() {
    if (!imagenesProductoCotizar.length) return;
    setIndiceImagenCotizar((i) => (i - 1 + imagenesProductoCotizar.length) % imagenesProductoCotizar.length);
  }

  async function enviarCotizacion(e) {
    e.preventDefault();
    try {
      setEnviandoCotizacion(true);
      setMensajeCotizacion("");
      setErrorCotizacion("");
      const endpoint = (API_URL ? `${API_URL}/api/cotizaciones` : "/api/cotizaciones");
      const payload = {
        producto_id: productoCotizando?.id ?? productoCotizando?.producto_id ?? null,
        nombre_usuario: formCotizar.nombre.trim(),
        correo: formCotizar.correo.trim(),
        telefono: formCotizar.telefono.trim(),
        descripcion: formCotizar.descripcion.trim(),
        cantidad_solicitada: Number(formCotizar.cantidad) || 1,
        producto_nombre_snap: productoCotizando?.nombre || productoCotizando?.titulo || null,
        producto_precio_snap: productoCotizando?.precio_mxn ?? productoCotizando?.precio ?? productoCotizando?.costo ?? null,
        producto_categoria_snap: normalizarCategoria(productoCotizando) || null,
        producto_descripcion_snap: productoCotizando?.descripcion || null,
        imagenes: imagenesAdjuntas.slice(0, 5).map((img) => img.preview),
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "No se pudo enviar la cotizacion.");
      }

      setMensajeCotizacion(data?.message || "Cotizacion enviada. Pronto nos comunicaremos contigo.");
      setFormCotizar((prev) => ({ ...prev, descripcion: "", cantidad: 1 }));
    } catch (err) {
      setErrorCotizacion(err?.message || "No se pudo enviar la cotizacion.");
    } finally {
      setEnviandoCotizacion(false);
    }
  }

  return (
    <div className="home-principal">
      {/* Barra superior colorida con logo y menú */}
      <header className="header-colorido">
        <div className="header-decoracion">
          <div className="circulo circulo-1"></div>
          <div className="circulo circulo-2"></div>
          <div className="circulo circulo-3"></div>
          <div className="circulo circulo-4"></div>
        </div>
        
        <div className="header-contenedor">
          <div className="header-logo">
            <img src="/src/assets/fundacion_blanco.png" alt="Fundación Recolectando Felicidad A.C" />
          </div>

          <nav className="header-menu">
            <a href="#productos" className="menu-link">Productos</a>
            <a href="#contacto" className="menu-link">Contáctanos</a>
          </nav>
        </div>
      </header>

      {/* Sección Hero - Contenido con texto e imagen de fondo */}
      <section className="hero-contenido-section">
        <div className="hero-contenido-wrapper">
          <div className="hero-texto">
            <h1 className="hero-titulo">TU COMPRA<br />CAMBIA VIDAS</h1>
            <p className="hero-descripcion">
              Descubre productos con propósito que impulsan el bienestar y el desarrollo de niños, jóvenes y familias en situación vulnerable.
            </p>
          </div>
        </div>
      </section>

      {modalCotizarAbierta && (
        <div className="cotizar-overlay" onClick={cerrarModalCotizar}>
          <div className="cotizar-modal" onClick={(e) => e.stopPropagation()}>
            <button className="cotizar-close" onClick={cerrarModalCotizar} aria-label="Cerrar"> <FiX></FiX></button>
            <div className="cotizar-title">Cotizar producto</div>
            <div className="cotizar-headbar">
              <div className="cotizar-head-meta">
                <span className="cotizar-pill">{categoriaProductoCotizar || "Producto"}</span>
                <span className="cotizar-pill ghost">
                  {totalImagenesProducto || 1} foto{(totalImagenesProducto || 1) === 1 ? "" : "s"}
                </span>
              </div>
              <div className="cotizar-price-chip">{precioProductoCotizar}</div>
            </div>
            <div className="cotizar-grid">
              <div className="cotizar-col cotizar-col-left">
                <div className="cotizar-left-panel">
                  <div className="cotizar-left-content">
                    <div className="cotizar-left-top">
                      <p className="cotizar-eyebrow">Detalles del producto</p>
                    </div>
                    <div className="cotizar-image-card">
                      <div className="cotizar-image-frame">
                        {imagenesProductoCotizar.length > 0 ? (
                          <img
                            src={imagenesProductoCotizar[indiceImagenCotizar] || imgPlaceholder}
                            alt="Producto"
                          />
                        ) : (
                          <div className="cotizar-image-placeholder" />
                        )}
                        {imagenesProductoCotizar.length > 1 && (
                          <>
                            <button
                              type="button"
                              className="slider-btn-public left"
                              onClick={anteriorImagenCotizar}
                              aria-label="Anterior"
                            >
                              {"<"}
                            </button>
                            <button
                              type="button"
                              className="slider-btn-public right"
                              onClick={siguienteImagenCotizar}
                              aria-label="Siguiente"
                              >
                                {">"}
                              </button>
                            </>
                          )}
                          <div className="cotizar-chip-floating">
                            {categoriaProductoCotizar || "Producto"}
                          </div>
                        </div>
                      </div>
                      <h3 className="cotizar-titulo">
                        {productoCotizando?.nombre || productoCotizando?.titulo || "Producto"}
                      </h3>
                      <p className="cotizar-descripcion">
                        {descripcionProductoCotizar}
                      </p>
                      <div className="cotizar-meta-row">
                        <div className="cotizar-pill ghost">{categoriaProductoCotizar || "Sin categoria"}</div>
                        <div className="cotizar-pill outline">{precioProductoCotizar}</div>
                      </div>
                      <div className="cotizar-highlight">
                        Adjunta referencias para una propuesta precisa. Nos comunicaremos con usted en cuanto sea posible.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cotizar-col cotizar-col-right">
                  <div className="cotizar-right-head">
                    <p className="cotizar-eyebrow">Cotizar producto</p>
                    <p className="cotizar-note">
                      Completa los campos para recibir una cotizacion personalizada del producto seleccionado.
                  </p>
                </div>

                <form className="cotizar-form" onSubmit={enviarCotizacion}>
                  <div className="cotizar-section">
                    <h4>Detalles del cliente</h4>
                    <label className="cotizar-field">
                      <span>Nombre*</span>
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={formCotizar.nombre}
                        onChange={(e) => setFormCotizar({ ...formCotizar, nombre: e.target.value })}
                        required
                      />
                    </label>
                    <label className="cotizar-field">
                      <span>Correo*</span>
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formCotizar.correo}
                        onChange={(e) => setFormCotizar({ ...formCotizar, correo: e.target.value })}
                        required
                      />
                    </label>
                    <label className="cotizar-field">
                      <span>Telefono*</span>
                      <input
                        type="tel"
                        placeholder="Número de teléfono"
                        value={formCotizar.telefono}
                        onChange={(e) => setFormCotizar({ ...formCotizar, telefono: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  <div className="cotizar-section">
                    <h4>Detalles de la cotizacion</h4>
                    <label className="cotizar-field">
                      <span>Descripcion*</span>
                      <textarea
                        placeholder="Describe brevemente lo que necesitas o personalizaciones."
                        value={formCotizar.descripcion}
                        onChange={(e) => setFormCotizar({ ...formCotizar, descripcion: e.target.value })}
                        rows={4}
                        required
                      />
                    </label>

                    <div className="cotizar-row">
                      <label className="cotizar-field">
                        <span>Cantidad</span>
                        <input
                          type="number"
                          min="1"
                          className="cotizar-input-short"
                          value={formCotizar.cantidad}
                          onChange={(e) => setFormCotizar({ ...formCotizar, cantidad: Number(e.target.value) || 1 })}
                        />
                      </label>
                    </div>

                    <div className="cotizar-upload">
                      <div className="cotizar-upload-row">
                        <label className="btn-upload" htmlFor="cotizar-file">Seleccionar imagen</label>
                        <input
                          id="cotizar-file"
                          className="hidden-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            await agregarArchivosCotizar(e.target.files);
                            e.target.value = "";
                          }}
                        />
                        <span className="cotizar-upload-info">
                          {imagenesAdjuntas.length > 0 ? `${imagenesAdjuntas.length} seleccionada(s)` : "Ninguna imagen seleccionada"}
                        </span>
                      </div>

                      <div
                        className="cotizar-dropzone"
                        onDrop={onDropCotizacion}
                        onDragOver={onDragOverCotizacion}
                      >
                        <div className="drop-plus-circle">+</div>
                        <p>Arrastre y suelte la imagen</p>
                        <small>Hasta 5 imagenes</small>
                      </div>
                    </div>
                  </div>

                  {imagenesAdjuntas.length > 0 && (
                    <div className="cotizar-preview-grid">
                      {imagenesAdjuntas.map((img, idx) => (
                        <div key={idx} className="cotizar-preview-card">
                          <img src={img.preview} alt={`Imagen ${idx + 1}`} />
                          <div className="cotizar-preview-footer">
                            <span>{img.nombre || `Imagen ${idx + 1}`}</span>
                            <button type="button" className="btn-mini-rojo" onClick={() => eliminarImagenCotizacion(idx)}>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {errorCotizacion && <div className="estado-productos estado-error">{errorCotizacion}</div>}
                  {mensajeCotizacion && <div className="estado-productos">{mensajeCotizacion}</div>}

                  <div className="cotizar-actions">
                    <button type="button" className="btn-secundario" onClick={cerrarModalCotizar}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primario-cotizar" disabled={enviandoCotizacion}>
                      {enviandoCotizacion ? "Enviando..." : "Cotizar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seccion de Contacto */}
      {/* Sección de Productos */}
      <section id="productos" className="productos-section">
        <div className="productos-header">
          <h2 className="productos-titulo">PRODUCTOS</h2>
          
          <div className="productos-controles">
            <div className="select-wrapper">
              <FiChevronDown className="select-icon" aria-hidden="true" />
              <select 
                className="select-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="todos">Todos</option>
                {categoriasDisponibles.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <form className="buscador-productos" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text" 
                placeholder="Buscar"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button type="submit">
                <FiSearch aria-hidden="true" />
                <span></span>
              </button>
            </form>
          </div>
        </div>

        <div className="grid-productos-publico">
          {cargandoProductos && (
            <div className="estado-productos">Cargando productos...</div>
          )}

          {errorProductos && (
            <div className="estado-productos estado-error">{errorProductos}</div>
          )}

          {!cargandoProductos && !errorProductos && productosFiltrados.length === 0 && (
            <div className="estado-productos">No hay productos para mostrar.</div>
          )}

          {!cargandoProductos && !errorProductos && productosFiltrados.map((producto) => (
            <PublicProductCard
              key={producto.id ?? producto.nombre}
              producto={producto}
              onCotizar={() => abrirModalCotizar(producto)}
            />
          ))}
        </div>
      </section>

      {/* Seccion de Contacto */}
      <section id="contacto" className="contacto-section">
        <div className="contacto-contenedor">
          <div className="contacto-formulario">
            <h2 className="contacto-titulo">Contáctanos</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grupo">
                <label htmlFor="nombre">Nombre*:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-grupo">
                <label htmlFor="correo">Correo*:</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-grupo">
                <label htmlFor="telefono">Teléfono*:</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-grupo">
                <label htmlFor="comentario">Comentario*:</label>
                <textarea
                  id="comentario"
                  name="comentario"
                  rows="4"
                  value={formData.comentario}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              {mensaje && <div className="mensaje-formulario">{mensaje}</div>}

              <button type="submit" className="btn-enviar" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </div>

          <div className="contacto-info">
            <h2 className="info-titulo">Déjanos tus opiniones</h2>
            <p className="info-descripcion">
              ¿Tienes alguna pregunta, sugerencia o petición sobre algún producto? 
              Nos encantaría saber de ti. Completa el formulario y nos pondremos 
              en contacto contigo a la brevedad.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-contenido">
          <div className="footer-columna">
            <img src="/src/assets/logo-fundacion.png" alt="Logo" className="footer-logo" />
            <p className="footer-descripcion">
              Fundación Recolectando Felicidad A.C.<br />
              Transformando vidas a través de tu apoyo
            </p>
          </div>

          <div className="footer-columna">
            <h4>Contáctanos</h4>
            <p>Correo: furefeac@gmail.com</p>
            <p>Teléfono: +52 998 475 6646</p>
            <p>Ubicación: C. 69 134C-M3, L2, El Petén, 77519 Cancún, Q.R.</p>
          </div>

          <div className="footer-columna">
            <h4>Síguenos</h4>
            <div className="footer-redes">
              <a href="https://www.facebook.com/share/17AWj2oarB/" aria-label="Facebook">Facebook</a>
              <a href="https://www.instagram.com/furefeac?igsh=NDZzZ3BzY3F6NTRh" aria-label="Instagram">Instagram</a>
              <a href="https://www.tiktok.com/@furefeac" aria-label="Twitter">Tiktok</a>
            </div>
          </div>

          <div className="footer-columna">
            <h4>Enlaces</h4>
            <a href="https://www.furefeac.org/">Home</a>
            <a href="#productos">Productos</a>
            <a href="#contacto">Contacto</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Fundación Recolectando Felicidad A.C. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function PublicProductCard({ producto, onCotizar }) {
  const [indice, setIndice] = useState(0);
  let imagenes = [];
  if (Array.isArray(producto?.imagenes)) {
    imagenes = producto.imagenes.filter(Boolean);
  } else if (typeof producto?.imagenes === "string" && producto.imagenes.length) {
    if (producto.imagenes.includes("||")) {
      imagenes = producto.imagenes.split("||").filter(Boolean);
    } else {
      try { imagenes = JSON.parse(producto.imagenes); } catch { imagenes = []; }
    }
  }
  if (!imagenes.length) {
    const fallback =
      producto?.imagen ||
      producto?.foto ||
      producto?.ruta ||
      producto?.ruta_imagen ||
      producto?.imagen_principal;
    imagenes = [fallback];
  }
  imagenes = imagenes.map(normalizarRutaImagen);

  const actual = imagenes[indice] || imgPlaceholder;
  const precio = formatearPrecio(producto?.precio_mxn ?? producto?.precio ?? producto?.costo ?? 0);
  const categoriaProducto = normalizarCategoria(producto);
  const descripcion = (producto?.descripcion || "").trim() || "Sin descripcion disponible.";

  function siguiente() {
    setIndice((i) => (i + 1) % imagenes.length);
  }
  function anterior() {
    setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
  }

  return (
    <article 
      className="card-producto-publico" 
      title={producto.descripcion || producto.nombre}
    >
      <div className="card-imagen">
        <img src={actual} alt={producto.nombre || "Producto"} />
        {imagenes.length > 1 && (
          <>
            <button className="slider-btn-public left" type="button" onClick={anterior} aria-label="Anterior">‹</button>
            <button className="slider-btn-public right" type="button" onClick={siguiente} aria-label="Siguiente">›</button>
          </>
        )}
      </div>
      <div className="card-info">
        {categoriaProducto && <span className="card-categoria">{categoriaProducto}</span>}
        <h3 className="card-titulo-info">{producto.nombre}</h3>
        <p className="card-descripcion-publico">{descripcion}</p>
        <div className="card-pie-principal">
          <span className="card-precio-info">{precio}</span>
          <button type="button" className="btn-cotizar" onClick={onCotizar}>
            Cotizar
          </button>
        </div>
      </div>
    </article>
  );
}
