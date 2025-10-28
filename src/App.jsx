import { Link, Outlet } from "react-router-dom";

export default function App() {
  // Layout público simple + Outlet para sus páginas hijas
  return (
    <div>
      <header>
        <Link to="/">Inicio</Link>{" "}
        <Link to="/administracion/acceso">
          Administración
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
