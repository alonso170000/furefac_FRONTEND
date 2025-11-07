import { fetchAutenticado } from "./auth";

export async function listarProductos({ q = "", categoria_id = "", activo = "" } = {}) {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (categoria_id) params.append("categoria_id", categoria_id);
  if (activo !== "") params.append("activo", activo);

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productos?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudieron cargar los productos");
  return await res.json(); // retorna arreglo de productos con { id, nombre, descripcion, precio_mxn, ... }
}

export async function crearProducto(payload) {
  const res = await fetchAutenticado(`/api/productos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo crear el producto");
  return await res.json(); // { id, message }
}

export async function actualizarProducto(id, payload) {
  const res = await fetchAutenticado(`/api/productos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo actualizar el producto");
  return await res.json();
}

export async function eliminarProducto(id) {
  const res = await fetchAutenticado(`/api/productos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("No se pudo eliminar el producto");
  return await res.json();
}

export async function listarImagenesProducto(id) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productos/${id}/imagenes`);
  if (!res.ok) throw new Error("No se pudieron cargar imágenes");
  return await res.json(); // [{ id, ruta, orden, creado_en }]
}

export async function agregarImagenProducto(id, { ruta, orden = 0 }) {
  const res = await fetchAutenticado(`/api/productos/${id}/imagenes`, {
    method: "POST",
    body: JSON.stringify({ ruta, orden }),
  });
  if (!res.ok) throw new Error("No se pudo agregar la imagen");
  return await res.json(); // { id, message }
}
