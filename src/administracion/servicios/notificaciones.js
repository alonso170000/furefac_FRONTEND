// src/administracion/servicios/notificaciones.js
import { fetchAutenticado } from "./auth";

/**
 * Obtener lista de contactos disponibles para notificar
 */
export async function listarContactosDisponibles() {
  const res = await fetchAutenticado(`/api/notificaciones/contactos-disponibles`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error al cargar contactos" }));
    throw new Error(error.message);
  }
  return res.json();
}

/**
 * Enviar notificación de compra a un contacto
 * @param {Object} params
 * @param {number} params.contacto_id - ID del contacto a notificar
 * @param {string} params.tipo - 'correo' | 'sms' | 'ambos'
 * @param {Object} params.datos_compra - Datos de la compra
 */
export async function enviarNotificacionCompra({ contacto_id, tipo, datos_compra }) {
  const res = await fetchAutenticado(`/api/notificaciones/enviar-compra`, {
    method: "POST",
    body: JSON.stringify({
      contacto_id,
      tipo,
      datos_compra,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error al enviar notificación" }));
    throw new Error(error.message);
  }

  return res.json();
}