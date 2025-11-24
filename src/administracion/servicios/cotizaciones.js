import { fetchAutenticado } from "./auth";

export async function listarCotizaciones({ estado = "todos", q = "" } = {}) {
  const params = new URLSearchParams();
  if (estado && estado !== "todos") params.set("estado", estado);
  if (q) params.set("q", q);
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await fetchAutenticado(`/api/cotizaciones${query}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudieron cargar las cotizaciones");
  return data || [];
}

export async function cambiarEstadoCotizacion(id, estado) {
  const res = await fetchAutenticado(`/api/cotizaciones/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudo actualizar el estado");
  return data;
}

export async function crearCotizacion(payload) {
  const res = await fetchAutenticado(`/api/cotizaciones`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudo crear la cotización");
  return data;
}

export async function registrarCompra(payload) {
  const res = await fetchAutenticado(`/api/historial`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudo registrar la compra");
  return data;
}

export async function obtenerImagenesCotizacion(id) {
  const res = await fetchAutenticado(`/api/cotizaciones/${id}/imagenes`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudieron cargar las imágenes");
  return Array.isArray(data) ? data : [];
}
