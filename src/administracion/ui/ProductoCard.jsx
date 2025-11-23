import { useState } from "react";

const PLACEHOLDER = "linear-gradient(135deg, #eef2ff, #c7d2fe)";

export default function ProductoCard({ id, nombre, precio, imagen, imagenes = [], descripcion, onEditar }) {
  const precioFmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })
    .format(Number(precio) || 0);

  const catalogo = imagenes.length ? imagenes : (imagen ? [imagen] : [PLACEHOLDER]);
  const [indice, setIndice] = useState(0);

  const actual = catalogo[indice] || "";
  const fondo = actual
    ? `url("${actual}")`
    : PLACEHOLDER;

  function siguiente() {
    if (!catalogo.length) return;
    setIndice((i) => (i + 1) % catalogo.length);
  }
  function anterior() {
    if (!catalogo.length) return;
    setIndice((i) => (i - 1 + catalogo.length) % catalogo.length);
  }

  return (
    <article className="card-producto" title={nombre}>
      <div className="card-img" style={{ backgroundImage: fondo }}>
        {catalogo.length > 1 && (
          <>
            <button type="button" className="slider-btn left" onClick={anterior} aria-label="Anterior">‹</button>
            <button type="button" className="slider-btn right" onClick={siguiente} aria-label="Siguiente">›</button>
          </>
        )}
      </div>
      <div className="card-contenido">
        <h3 className="card-titulo">{nombre}</h3>
        <p className="card-descripcion">{descripcion || "Sin descripcion"}</p>
      </div>
      <div className="card-pie">
        <span className="card-precio">{precioFmt}</span>
        <button className="btn-editar" onClick={onEditar}>Editar</button>
      </div>
    </article>
  );
}
