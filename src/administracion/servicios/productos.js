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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo crear el producto");
  return data; // { id, message }
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

export async function obtenerRelacionesProducto(id) {
  const res = await fetchAutenticado(`/api/productos/${id}/relaciones`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudieron obtener las relaciones del producto");
  return data;
}

export async function cerrarCotizacionesProducto(id) {
  const res = await fetchAutenticado(`/api/productos/${id}/cerrar-cotizaciones`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudieron cerrar las cotizaciones del producto");
  return data;
}

export async function listarImagenesProducto(id) {
  const res = await fetchAutenticado(`/api/producto-imagenes/producto/${id}`);
  if (!res.ok) throw new Error("No se pudieron cargar imagenes");
  return await res.json(); // [{ id, ruta, orden, creado_en }]
}

export async function agregarImagenProducto({ producto_id, ruta, orden = null }) {
  const res = await fetchAutenticado(`/api/producto-imagenes`, {
    method: "POST",
    body: JSON.stringify({ producto_id, ruta, orden }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo agregar la imagen");
  return data; // { id, message }
}

export async function actualizarImagenProducto(id, payload) {
  const res = await fetchAutenticado(`/api/producto-imagenes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo actualizar la imagen");
  return data;
}

export async function eliminarImagenProducto(id) {
  const res = await fetchAutenticado(`/api/producto-imagenes/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo eliminar la imagen");
  return data;
}

export async function listarCategorias() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
  if (!res.ok) throw new Error("No se pudieron cargar las categorias");
  return await res.json(); // [{ id, nombre }]
}

export async function crearCategoria(payload) {
  const res = await fetchAutenticado(`/api/categorias`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo crear la categoria");
  return data;
}

export async function actualizarCategoria(id, payload) {
  const res = await fetchAutenticado(`/api/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo actualizar la categoria");
  return data;
}

export async function eliminarCategoria(id) {
  const res = await fetchAutenticado(`/api/categorias/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo eliminar la categoria");
  return data;
}
