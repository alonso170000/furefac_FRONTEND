const CLAVE_TOKEN = "token_furefac";

export function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token);
}
export function leerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}
export function borrarToken() {
  localStorage.removeItem(CLAVE_TOKEN);
}
export function estaAutenticado() {
  return Boolean(leerToken());
}

/**
 * Inicia sesión contra tu backend real.
 * Recibe { identificador, contrasena } (español en UI),
 * pero envía { usuario, password } como exige el backend.
 */
export async function iniciarSesion({ identificador, contrasena }) {
  const url = `${import.meta.env.VITE_API_URL}/api/auth/login`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: identificador,   // <-- tu back pide "usuario"
      password: contrasena      // <-- tu back pide "password"
    }),
  });

  // Tu back responde 200 con { token, usuario } o 4xx con { message }
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.token) {
    return { ok: false, mensaje: data?.message || "Usuario/contraseña inválidos" };
  }

  guardarToken(data.token);
  return { ok: true, usuario: data.usuario };
}

/** Helper para fetch autenticado */
export async function fetchAutenticado(ruta, opciones = {}) {
  const token = leerToken();
  const headers = {
    ...(opciones.headers || {}),
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${import.meta.env.VITE_API_URL}${ruta}`, { ...opciones, headers });
  return res;
}
