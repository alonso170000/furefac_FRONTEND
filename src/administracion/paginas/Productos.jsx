import { useEffect, useState, useMemo } from "react";
import { listarProductos } from "../servicios/productos";
import ProductoCard from "../ui/ProductoCard";

export default function Productos() {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [lista, setLista] = useState([]);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const datos = await listarProductos({ q: busqueda, categoria });
      setLista(datos);
    } catch (e) {
      setError(e.message || "Error al cargar");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); /* carga inicial */ }, []);
  // Para buscar al presionar Enter (o usar botón lupa)
  function manejarSubmit(e) { e.preventDefault(); cargar(); }

  const total = useMemo(() => lista.length, [lista]);

  return (
    <div className="pagina-productos">
      {/* Topbar */}
      <div className="productos-topbar">
        <h1 className="titulo-seccion">PRODUCTOS</h1>

        <div className="acciones-topbar">
          <button className="btn-verde" onClick={() => alert("Nuevo producto (pendiente)")}>
            Nuevo +
          </button>

          <select
            className="select-filtro"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="tazas">Tazas</option>
            <option value="playeras">Playeras</option>
            <option value="accesorios">Accesorios</option>
          </select>

          <form onSubmit={manejarSubmit} className="buscador">
            <input
              type="text"
              placeholder="Buscar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button type="submit" aria-label="buscar">🔍</button>
          </form>
        </div>
      </div>

      {/* Contenido */}
      {cargando && <div className="estado">Cargando productos…</div>}
      {error && <div className="estado error">{error}</div>}

      {!cargando && !error && (
        <>
          <div className="grid-productos">
            {lista.map((p) => (
              <ProductoCard
                key={p.id}
                id={p.id}
                nombre={p.nombre || p.titulo}
                precio={p.precio ?? p.costo ?? 0}
                imagen={p.imagen || p.foto || "/src/assets/placeholder.png"}
                descripcion={p.descripcion || ""}
                onEditar={() => alert(`Editar #${p.id} (pendiente)`)}
              />
            ))}
          </div>

          <div className="resumen-lista">
            {total} producto{total === 1 ? "" : "s"}
          </div>
        </>
      )}
    </div>
  );
}
