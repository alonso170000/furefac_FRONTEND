import { fetchAutenticado } from "./auth";

export async function listarHistorial() {
  const res = await fetchAutenticado(`/api/historial`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudo cargar el historial de compras");
  return Array.isArray(data) ? data : [];
}

export async function obtenerDetalleHistorial(id) {
  const res = await fetchAutenticado(`/api/historial/${id}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudo cargar el detalle");
  return data || null;
}
