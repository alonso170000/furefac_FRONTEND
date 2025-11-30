import { useEffect, useState } from "react";
import { listarComentarios } from "../servicios/comentarios";

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function formatearFecha(fecha) {
  const d = fecha ? new Date(fecha) : new Date();
  if (Number.isNaN(d.getTime())) return { mes: "", dia: "", ano: "" };
  return {
    mes: MESES[d.getMonth()],
    dia: String(d.getDate()).padStart(2, "0"),
    ano: d.getFullYear(),
  };
}

export default function Comentarios() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const data = await listarComentarios();
      const ordenados = Array.isArray(data) ? [...data].sort((a, b) => {
        const fa = new Date(a?.creado_en || a?.fecha || a?.created_at || 0).getTime();
        const fb = new Date(b?.creado_en || b?.fecha || b?.created_at || 0).getTime();
        return fb - fa;
      }) : [];
      setLista(ordenados);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los comentarios");
      setLista([]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="comentarios-page">

      <div className="comentarios-top">
        <button className="btn-accion" onClick={cargar}>Refrescar</button>
      </div>

      {cargando && <div className="estado">Cargando comentarios...</div>}
      {error && <div className="estado error">{error}</div>}
      {!cargando && !error && lista.length === 0 && (
        <div className="estado">Aún no hay comentarios recibidos.</div>
      )}

      <div className="comentarios-lista">
        {lista.map((c, idx) => {
          const texto = c?.comentario || c?.mensaje || "Sin comentario";
          const nombre = c?.nombre || "Anónimo";
          const correo = c?.correo || c?.email || "";
          const telefono = c?.telefono || c?.tel || "";
          const { mes, dia, ano } = formatearFecha(c?.creado_en || c?.fecha || c?.created_at);

          return (
            <article key={c?.id ?? idx} className="comentario-card">
              <div className="comentario-texto">{texto}</div>
              <div className="comentario-meta">
                <div className="comentario-fecha">
                  <span className="mes">{mes}</span>
                  <span className="dia">{dia}</span>
                  <span className="ano">{ano}</span>
                </div>
                <div className="comentario-autor">
                  <strong>{nombre}</strong>
                  {telefono && <span>{telefono}</span>}
                  {correo && <span>{correo}</span>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
