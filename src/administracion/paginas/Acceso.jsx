import { useState } from "react";
import { iniciarSesion } from "../servicios/auth";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo-fundacion.png";

export default function Acceso() {
  const nav = useNavigate();
  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { ok, mensaje } = await iniciarSesion({ identificador, contrasena });
    setCargando(false);

    if (!ok) return setError(mensaje || "No fue posible iniciar sesión");
    nav("/administracion/productos", { replace: true });
  }

  return (
    <div className="contenedor-login">
      <div className="caja-login">
        <div className="lado-izquierdo"></div>

        <div className="lado-derecho">
          <img src={logo} alt="Logo Fundación" className="logo" />

          <form onSubmit={manejarSubmit} className="formulario-login">
            <label>Correo electrónico o usuario</label>
            <div className="input-wrapper">
              <input
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                required
              />
            </div>

            <label>Contraseña</label>
            <div className="input-wrapper">
              <input
                type={mostrarContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarContrasena ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>

            {error && <p className="error-login">{error}</p>}

            <button type="submit" disabled={cargando}>
              {cargando ? "Accediendo..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}