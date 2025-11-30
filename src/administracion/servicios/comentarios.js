import { fetchAutenticado } from "./auth";

/**
 * Lado público: crear comentario desde landing.
 */
export async function crearComentarioPublico(payload) {
  const endpoint = `${import.meta.env.VITE_API_URL}/api/comentarios`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudo enviar el comentario");
  return data;
}

/**
 * Lado admin: listar comentarios del buzón (requiere token).
 */
export async function listarComentarios() {
  const res = await fetchAutenticado(`/api/comentarios/buzon`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "No se pudieron cargar los comentarios");
  return Array.isArray(data) ? data : [];
}
