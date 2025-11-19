import { useState } from "react";
import "./Home.css";

export default function PrincipalHome() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    comentario: ""
  });

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");

    try {
      // Aquí iría tu llamada al backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMensaje("¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.");
      setFormData({ nombre: "", correo: "", telefono: "", comentario: "" });
    } catch {
      setMensaje("Hubo un error al enviar el mensaje. Por favor intenta nuevamente.");
    } finally {
      setEnviando(false);
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
            <img src="/src/assets/FUNDACIÓN_BLANCO.png" alt="Fundación Recolectando Felicidad A.C" />
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
              <option value="tazas">Tazas</option>
              <option value="playeras">Playeras</option>
              <option value="termos">Termos</option>
              <option value="accesorios">Accesorios</option>
            </select>
            
            <div className="buscador-productos">
              <input 
                type="text" 
                placeholder="Buscar"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button type="button">🔍</button>
            </div>
          </div>
        </div>

        <div className="grid-productos-publico">
          {/* Producto 1 - Taza amarilla */}
          <article className="card-producto-publico">
            <div className="card-imagen">
              <img src="/src/assets/productos/taza-amarilla.jpg" alt="Taza cerámica amarilla" />
            </div>
            <div className="card-info">
              <h3 className="card-titulo">Taza cerámica amarilla con estampado de un aguacate...</h3>
              <div className="card-pie">
                <span className="card-precio">$1,000.00</span>
                <button className="btn-cotizar">Cotizar</button>
              </div>
            </div>
          </article>

          {/* Producto 2 - Termo */}
          <article className="card-producto-publico">
            <div className="card-imagen">
              <img src="/src/assets/productos/termo.jpg" alt="Termo" />
            </div>
            <div className="card-info">
              <h3 className="card-titulo">Taza cerámica amarilla con estampado de un aguacate...</h3>
              <div className="card-pie">
                <span className="card-precio">$50,000.00</span>
                <button className="btn-cotizar">Cotizar</button>
              </div>
            </div>
          </article>

          {/* Producto 3 - Playera */}
          <article className="card-producto-publico">
            <div className="card-imagen">
              <img src="/src/assets/productos/playera-naranja.jpg" alt="Playera naranja" />
            </div>
            <div className="card-info">
              <h3 className="card-titulo">Taza cerámica amarilla con estampado de un aguacate...</h3>
              <div className="card-pie">
                <span className="card-precio">$601.00</span>
                <button className="btn-cotizar">Cotizar</button>
              </div>
            </div>
          </article>

          {/* Producto 4 - Libreta */}
          <article className="card-producto-publico">
            <div className="card-imagen">
              <img src="/src/assets/productos/libreta.jpg" alt="Libreta dorada" />
            </div>
            <div className="card-info">
              <h3 className="card-titulo">Taza cerámica amarilla con estampado de un aguacate...</h3>
              <div className="card-pie">
                <span className="card-precio">$99,999.00</span>
                <button className="btn-cotizar">Cotizar</button>
              </div>
            </div>
          </article>

          {/* Producto 5 - Portarretratos */}
          <article className="card-producto-publico">
            <div className="card-imagen">
              <img src="/src/assets/productos/portarretratos.jpg" alt="Portarretratos" />
            </div>
            <div className="card-info">
              <h3 className="card-titulo">Taza cerámica amarilla con estampado de un aguacate...</h3>
              <div className="card-pie">
                <span className="card-precio">$1,000.00</span>
                <button className="btn-cotizar">Cotizar</button>
              </div>
            </div>
          </article>

          {/* Producto 6 - Llavero */}
          <article className="card-producto-publico">
            <div className="card-imagen">
              <img src="/src/assets/productos/llavero.jpg" alt="Llavero" />
            </div>
            <div className="card-info">
              <h3 className="card-titulo">Taza cerámica amarilla con estampado de un aguacate...</h3>
              <div className="card-pie">
                <span className="card-precio">$1,000.00</span>
                <button className="btn-cotizar">Cotizar</button>
              </div>
            </div>
          </article>

          {/* Producto 7 - Espejo */}
          <article className="card-producto-publico">
            <div className="card-imagen">
              <img src="/src/assets/productos/espejo.jpg" alt="Espejo personalizado" />
            </div>
            <div className="card-info">
              <h3 className="card-titulo">Taza cerámica amarilla con estampado de un aguacate...</h3>
              <div className="card-pie">
                <span className="card-precio">$1,000.00</span>
                <button className="btn-cotizar">Cotizar</button>
              </div>
            </div>
          </article>

          {/* Producto 8 - Placa QR */}
          <article className="card-producto-publico">
            <div className="card-imagen">
              <img src="/src/assets/productos/placa-qr.jpg" alt="Placa QR WiFi" />
            </div>
            <div className="card-info">
              <h3 className="card-titulo">Taza cerámica amarilla con estampado de un aguacate...</h3>
              <div className="card-pie">
                <span className="card-precio">$1,000.00</span>
                <button className="btn-cotizar">Cotizar</button>
              </div>
            </div>
          </article>
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
            <p>📧 contacto@fundacionfelicidad.org</p>
            <p>📱 +52 (999) 123-4567</p>
            <p>📍 Cancún, Quintana Roo, México</p>
          </div>

          <div className="footer-columna">
            <h4>Síguenos</h4>
            <div className="footer-redes">
              <a href="#" aria-label="Facebook">📘 Facebook</a>
              <a href="#" aria-label="Instagram">📷 Instagram</a>
              <a href="#" aria-label="Twitter">🐦 Twitter</a>
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