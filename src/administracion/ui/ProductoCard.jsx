export default function ProductoCard({ id, nombre, precio, imagen, descripcion, onEditar }) {
  // Cortes visuales tipo Figma
  const precioFmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })
    .format(Number(precio) || 0);

  return (
    <article className="card-producto" title={nombre}>
      <div className="card-img" style={{ backgroundImage: `url("${imagen}")` }} />
      <div className="card-contenido">
        <h3 className="card-titulo">{nombre}</h3>
        <div className="card-pie">
          <span className="card-precio">{precioFmt}</span>
          <button className="btn-editar" onClick={onEditar}>Editar</button>
        </div>
      </div>
    </article>
  );
}