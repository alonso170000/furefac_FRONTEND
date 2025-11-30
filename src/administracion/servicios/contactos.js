// src/administracion/servicios/contactos.js
import { fetchAutenticado } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Listar todos los contactos
 */
export async function listarContactos() {
  const res = await fetchAutenticado(`/api/contactos`); // ← Sin ${API_URL} porque fetchAutenticado ya lo agrega
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error al cargar contactos" }));
    throw new Error(error.message);
  }
  return res.json();
}

/**
 * Obtener un contacto por ID
 */
export async function obtenerContacto(id) {
  const res = await fetchAutenticado(`/api/contactos/${id}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Contacto no encontrado" }));
    throw new Error(error.message);
  }
  return res.json();
}

/**
 * Crear un nuevo contacto
 */
export async function crearContacto(contacto) {
  const res = await fetchAutenticado(`/api/contactos`, {
    method: "POST",
    body: JSON.stringify(contacto),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error al crear contacto" }));
    throw new Error(error.message);
  }

  return res.json();
}

/**
 * Actualizar un contacto existente
 */
export async function actualizarContacto(id, contacto) {
  const res = await fetchAutenticado(`/api/contactos/${id}`, {
    method: "PUT",
    body: JSON.stringify(contacto),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error al actualizar contacto" }));
    throw new Error(error.message);
  }

  return res.json();
}

/**
 * Eliminar un contacto
 */
export async function eliminarContacto(id) {
  const res = await fetchAutenticado(`/api/contactos/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error al eliminar contacto" }));
    throw new Error(error.message);
  }

  return res.json();
}

/**
 * Buscar contactos
 */
export async function buscarContactos(termino) {
  const res = await fetchAutenticado(`/api/contactos/buscar/${termino}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error al buscar contactos" }));
    throw new Error(error.message);
  }
  return res.json();
}