import { Navigate, Outlet } from "react-router-dom";
import { estaAutenticado } from "../servicios/auth";

export default function Protegida() {
  // Si no hay token, manda al acceso
  if (!estaAutenticado()) return <Navigate to="/administracion/acceso" replace />;
  return <Outlet />;
}
