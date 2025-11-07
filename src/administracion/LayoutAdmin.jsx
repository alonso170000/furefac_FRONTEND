import { Link, NavLink, Outlet } from "react-router-dom";
import { borrarToken } from "./servicios/auth";

export default function LayoutAdmin() {
  function cerrarSesion() {
    borrarToken();
    location.href = "/administracion/acceso";
  }

  return (
    <div className="layout-admin">
      {/* Sidebar */}
      <aside className="barra-lateral">
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 8px" }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"#fff" }} />
          <div style={{ fontWeight:700, lineHeight:"1.1" }}>Fundación<br/>Felicidad A.C</div>
        </div>

        <nav className="menu">
          <NavLink to="/administracion/productos" className={({isActive}) => isActive ? "activo" : ""}>📦 Productos</NavLink>
          <NavLink to="/administracion/usuarios">👤 Usuarios</NavLink>
          <NavLink to="/administracion/configuracion">⚙️ Configuración</NavLink>
          <NavLink to="/administracion/buzon">📬 Buzón</NavLink>
          <NavLink to="/administracion/contactos">☎️ Contactos</NavLink>
          <button onClick={cerrarSesion}>↩ Salir</button>
        </nav>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <h2 className="titulo-seccion">Panel administrativo</h2>
        <div>Super-Admin</div>
      </header>

      {/* Contenido */}
      <main className="main-admin">
        <Outlet />
      </main>
    </div>
  );
}
