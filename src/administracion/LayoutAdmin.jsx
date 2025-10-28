import { Link, Outlet, useNavigate } from "react-router-dom";
import { borrarToken } from "./servicios/auth";

export default function LayoutAdmin() {
  const nav = useNavigate();

  function cerrarSesion() {
    borrarToken();
    nav("/administracion/acceso", { replace: true });
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h1 className="text-lg font-semibold">Panel administrativo</h1>
        <nav className="flex items-center gap-4">
          <Link to="/administracion" className="hover:underline">Productos</Link>
          <Link to="/administracion/usuarios" className="hover:underline">Usuarios</Link>
          <Link to="/administracion/contactos" className="hover:underline">Contactos</Link>
          <Link to="/administracion/buzon" className="hover:underline">Buzón</Link>
          <button onClick={cerrarSesion} className="px-3 py-1 rounded bg-red-600 hover:bg-red-500">
            Salir
          </button>
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
