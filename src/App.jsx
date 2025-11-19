import { Link, Outlet, useLocation } from "react-router-dom";

export default function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // No mostrar header en la página principal
  if (isHomePage) {
    return <Outlet />;
  }

  // Layout público simple + Outlet para sus páginas hijas
  return (
    <div>
      <header style={{ padding: "10px 20px", background: "#f0f0f0" }}>
        <Link to="/">Inicio</Link>{" "}
        <Link to="/administracion/acceso">Administración</Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}