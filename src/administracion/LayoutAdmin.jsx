import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiUsers,
  FiArchive,
  FiInbox,
  FiMessageSquare,
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiChevronsUp,
  FiChevronUp,
  FiX,
  FiMenu
} from "react-icons/fi";
import "./admin.css";
import { borrarToken, leerUsuario } from "./servicios/auth";
import logo from "../assets/fundacion_blanco.png";

const enlaces = [
  { to: "/administracion/productos", label: "Productos", icon: FiPackage },
  { to: "/administracion/usuarios", label: "Usuarios", icon: FiUsers },
  { to: "/administracion/historial", label: "Historial de compras", icon: FiArchive },
];

const enlacesBuzon = [
  { to: "/administracion/buzon/cotizaciones", label: "Cotizaciones", icon: FiMessageSquare },
  { to: "/administracion/buzon/comentarios", label: "Comentarios", icon: FiInbox },
];

const enlacesConfig = [
  { to: "/administracion/contactos", label: "Contactos", icon: FiSettings }, // ← CORREGIDO: era /configuracion/contactos
];

function obtenerIniciales(nombre) {
  if (!nombre) return "U";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "U";
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();
  return (partes[0].slice(0, 1) + partes[partes.length - 1].slice(0, 1)).toUpperCase();
}

export default function LayoutAdmin() {
  const [menuAbierto, setMenuAbierto] = useState(true);
  const [buzonAbierto, setBuzonAbierto] = useState(false);
  const [configAbierto, setConfigAbierto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const usuario = leerUsuario();
  const nombreUsuario = usuario?.nombre || usuario?.name || usuario?.usuario || "Usuario";
  const rolUsuario = usuario?.rol || usuario?.role || "Usuario";
  const avatarIniciales = useMemo(() => obtenerIniciales(nombreUsuario), [nombreUsuario]);

  const tituloSeccion = useMemo(() => {
    const segmento = location.pathname.replace("/administracion", "").split("/").filter(Boolean)[0] || "";
    const mapa = {
      productos: "Productos",
      usuarios: "Usuarios",
      historial: "Historial",
      buzon: "Buzón",
      cotizaciones: "Cotizaciones",
      comentarios: "Comentarios",
      configuracion: "Configuración",
      contactos: "Contactos",
      panel: "Panel",
      acceso: "Acceso",
    };
    return mapa[segmento] || "Administración";
  }, [location.pathname]);

  function cerrarSesion() {
    borrarToken();
    navigate("/administracion/acceso", { replace: true });
  }

  return (
    <div className={`admin-shell ${menuAbierto ? "" : "sidebar-hidden"}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Logo Fundacion" className="logo" />
        </div>

        <nav className="sidebar-nav">
          {enlaces.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "navlink active" : "navlink")}
            >
              <span className="nav-icon" aria-hidden>
                <item.icon />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}

          <div className="nav-section">
            <button
              type="button"
              className={`nav-toggle ${buzonAbierto ? "open" : ""}`}
              onClick={() => setBuzonAbierto(!buzonAbierto)}
              aria-expanded={buzonAbierto}
              aria-controls="submenu-buzon"
            >
              <div className="nav-toggle-left">
                <span className="nav-icon" aria-hidden><FiInbox /></span>
                <span className="nav-label">Buzón</span>
              </div>
              <span className="nav-toggle-arrow">
                {buzonAbierto ? <FiChevronUp /> : <FiChevronDown />}
              </span>
            </button>
            {buzonAbierto && (
              <div id="submenu-buzon" className="nav-submenu">
                {enlacesBuzon.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => (isActive ? "navlink-sub active" : "navlink-sub")}
                  >
                    <span className="nav-icon" aria-hidden><item.icon /></span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <div className="nav-section">
            <button
              type="button"
              className={`nav-toggle ${configAbierto ? "open" : ""}`}
              onClick={() => setConfigAbierto(!configAbierto)}
              aria-expanded={configAbierto}
              aria-controls="submenu-config"
            >
              <div className="nav-toggle-left">
                <span className="nav-icon" aria-hidden><FiSettings /></span>
                <span className="nav-label">Configuración</span>
              </div>
              <span className="nav-toggle-arrow">
                {configAbierto ? <FiChevronUp /> : <FiChevronDown />}
              </span>
            </button>
            {configAbierto && (
              <div id="submenu-config" className="nav-submenu">
                {enlacesConfig.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => (isActive ? "navlink-sub active" : "navlink-sub")}
                  >
                    <span className="nav-icon" aria-hidden><item.icon /></span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <button className="sidebar-exit" onClick={cerrarSesion}>
          <span className="nav-icon-exit" aria-hidden><FiLogOut /></span> Salir
        </button>
      </aside>

      <div className="admin-surface">
        <div className="header-outer">
          <header className="admin-header">
            <div className="header-left">
              <button
                className="header-toggle"
                type="button"
                onClick={() => setMenuAbierto(!menuAbierto)}
                aria-label={menuAbierto ? "Ocultar menú" : "Mostrar menú"}
              >
                {menuAbierto ? <FiX > </FiX> : <FiMenu></FiMenu>}
              </button>
              <div className="header-text">
                <p className="eyebrow">Administración</p>
                <h1 className="titulo-seccion">{tituloSeccion}</h1>
              </div>
            </div>
            <div className="header-user">
              <div className="user-chip">
                <div className="user-chip-text">
                  <span className="user-role">{rolUsuario}</span>
                  <span className="user-name">{nombreUsuario}</span>
                </div>
              </div>
              <div className="user-avatar">{avatarIniciales}</div>
            </div>
          </header>
        </div>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}