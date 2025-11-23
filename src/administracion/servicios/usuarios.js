// src/administracion/servicios/usuarios.js
import { fetchAutenticado } from "./auth";

// ==================== USUARIOS ====================

/**
 * Listar todos los usuarios
 */
export async function listarUsuarios() {
  const res = await fetchAutenticado(`/api/usuarios`);
  if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
  return await res.json(); // [{ id, usuario, nombre, apellido, correo, rol_id, rol_nombre, activo, creado_en }]
}

/**
 * Crear un nuevo usuario
 */
export async function crearUsuario(payload) {
  const res = await fetchAutenticado(`/api/usuarios`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo crear el usuario");
  return data; // { message }
}

/**
 * Actualizar un usuario existente
 */
export async function actualizarUsuario(id, payload) {
  const res = await fetchAutenticado(`/api/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo actualizar el usuario");
  return data;
}

/**
 * Eliminar un usuario (si lo implementas en el backend)
 */
export async function eliminarUsuario(id) {
  const res = await fetchAutenticado(`/api/usuarios/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo eliminar el usuario");
  return data;
}

// ==================== ROLES ====================

/**
 * Listar todos los roles
 */
export async function listarRoles() {
  const res = await fetchAutenticado(`/api/usuarios/roles`);
  if (!res.ok) throw new Error("No se pudieron cargar los roles");
  return await res.json(); // [{ id, nombre, creado_en }]
}

/**
 * Crear un nuevo rol
 */
export async function crearRol(payload) {
  const res = await fetchAutenticado(`/api/usuarios/roles`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo crear el rol");
  return data; // { id, message }
}

/**
 * Actualizar un rol existente
 */
export async function actualizarRol(id, payload) {
  const res = await fetchAutenticado(`/api/usuarios/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo actualizar el rol");
  return data;
}

/**
 * Eliminar un rol
 */
export async function eliminarRol(id) {
  const res = await fetchAutenticado(`/api/usuarios/roles/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo eliminar el rol");
  return data;
}

// ==================== PERMISOS POR ROL ====================

/**
 * Obtener todas las secciones disponibles
 */
export async function listarSecciones() {
  const res = await fetchAutenticado(`/api/usuarios/secciones`);
  if (!res.ok) throw new Error("No se pudieron cargar las secciones");
  return await res.json(); // [{ id, nombre }]
}

/**
 * Obtener los permisos de un rol específico
 */
export async function obtenerPermisosRol(rolId) {
  const res = await fetchAutenticado(`/api/usuarios/roles/${rolId}/permisos`);
  if (!res.ok) throw new Error("No se pudieron cargar los permisos del rol");
  return await res.json(); 
  // [{ seccion_id, seccion, puede_crear, puede_editar, puede_eliminar, puede_reporte }]
}

/**
 * Actualizar los permisos de un rol
 */
export async function actualizarPermisosRol(rolId, permisos) {
  const res = await fetchAutenticado(`/api/usuarios/roles/${rolId}/permisos`, {
    method: "PUT",
    body: JSON.stringify(permisos),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudieron actualizar los permisos");
  return data;
}

/**
 * Eliminar permisos de una sección específica para un rol
 */
export async function eliminarPermisosSeccion(rolId, seccionId) {
  const res = await fetchAutenticado(`/api/usuarios/roles/${rolId}/permisos/${seccionId}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudieron eliminar los permisos");
  return data;
}