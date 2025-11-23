import { useEffect, useMemo, useState } from "react";
import { listarProductos } from "../administracion/servicios/productos";
import imgPlaceholder from "../assets/manos.jpg";
import "./Home.css";

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

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMensaje("Mensaje enviado con éxito. Nos pondremos en contacto contigo pronto.");
      setFormData({ nombre: "", correo: "", telefono: "", comentario: "" });
    } catch {
      setMensaje("Hubo un error al enviar el mensaje. Por favor intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  function irAContacto(nombreProducto) {
    setFormData((prev) => ({
      ...prev,
      comentario: nombreProducto ? `Quiero cotizar ${nombreProducto}` : prev.comentario,
    }));

    const seccion = document.getElementById("contacto");
    if (seccion) {
      seccion.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <nav className="header-menu">
            <a href="#productos" className="menu-link">Productos</a>
            <a href="#contacto" className="menu-link">Contáctanos</a>
          </nav>
          
          <div className="header-logo">
            <img src="/src/assets/fundacion_blanco.png" alt="Fundación Recolectando Felicidad A.C" />
          </div>
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

      {/* Sección de Productos */}
      <section id="productos" className="productos-section">
        <div className="productos-header">
          <h2 className="productos-titulo">PRODUCTOS</h2>
          
          <div className="productos-controles">
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
            
            <form className="buscador-productos" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text" 
                placeholder="Buscar"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button type="submit">Buscar</button>
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
              onCotizar={() => irAContacto(producto.nombre)}
            />
          ))}
        </div>
      </section>

      {/* Sección de Contacto */}
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
            <p>Correo: contacto@fundacionfelicidad.org</p>
            <p>Teléfono: +52 (999) 123-4567</p>
            <p>Ubicación: Cancún, Quintana Roo, México</p>
          </div>

          <div className="footer-columna">
            <h4>Síguenos</h4>
            <div className="footer-redes">
              <a href="#" aria-label="Facebook">Facebook</a>
              <a href="#" aria-label="Instagram">Instagram</a>
              <a href="#" aria-label="Twitter">Twitter</a>
            </div>
          </div>

          <div className="footer-columna">
            <h4>Enlaces</h4>
            <a href="/administracion/acceso">Administración</a>
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
        <h3 className="card-titulo">{producto.nombre}</h3>
        <div className="card-pie-principal">
          <span className="card-precio">{precio}</span>
          <button type="button" className="btn-cotizar" onClick={onCotizar}>
            Cotizar
          </button>
        </div>
      </div>
    </article>
  );
}
