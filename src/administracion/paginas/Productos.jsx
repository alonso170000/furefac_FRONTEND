import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import {
  crearProducto,
  listarProductos,
  listarCategorias,
  agregarImagenProducto,
  listarImagenesProducto,
  actualizarProducto,
  actualizarImagenProducto,
  eliminarProducto,
  eliminarImagenProducto,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerRelacionesProducto,
  cerrarCotizacionesProducto,
} from "../servicios/productos";
import ProductoCard from "../ui/ProductoCard";

const LIMITE_IMAGENES = 5;

export default function Productos() {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [lista, setLista] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState("");

  const [modalAbierta, setModalAbierta] = useState(false);
  const [modo, setModo] = useState("crear"); // crear | editar
  const [productoActual, setProductoActual] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [eliminandoProducto, setEliminandoProducto] = useState(false);
  const [eliminandoImagenId, setEliminandoImagenId] = useState(-1);
  const [errorModal, setErrorModal] = useState("");
  const [gestorCategoriasAbierto, setGestorCategoriasAbierto] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [categoriaEditando, setCategoriaEditando] = useState(null); // id
  const [nombreEditando, setNombreEditando] = useState("");
  const [cargandoCategoriaAccion, setCargandoCategoriaAccion] = useState(false);
  const [cambiandoActivo, setCambiandoActivo] = useState(false);
  const [relacionesProducto, setRelacionesProducto] = useState(null);
  const [cargandoRelaciones, setCargandoRelaciones] = useState(false);
  const [dialogoEliminar, setDialogoEliminar] = useState(null); // {tipo:'cotizaciones'|'bloqueado'}
  const [opcionEliminar, setOpcionEliminar] = useState("cerrar");
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
  });

  // imágenes [{id?, orden, preview, base64?, originalOrden}]
  const [imagenes, setImagenes] = useState([]);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const datos = await listarProductos({
        q: busqueda,
        categoria_id: categoria === "todos" ? "" : categoria,
      });
      const mapeados = (datos || []).map((p) => {
        let imgs = [];
        if (Array.isArray(p.imagenes)) imgs = p.imagenes.filter(Boolean);
        else if (typeof p.imagenes === "string" && p.imagenes.length) {
          // viene de GROUP_CONCAT con '||'
          imgs = p.imagenes.split("||").filter(Boolean);
        } else if (p.imagenes) {
          try { imgs = JSON.parse(p.imagenes); } catch { imgs = []; }
        }
        return { ...p, imagenes: imgs };
      });
      setLista(mapeados);
    } catch (e) {
      setError(e.message || "No se pudieron cargar los productos");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  useEffect(() => {
    const id = setTimeout(() => cargar(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  async function cargarCategorias() {
    try {
      setCargandoCategorias(true);
      setErrorCategorias("");
      const data = await listarCategorias();
      setCategorias(data);
    } catch (err) {
      setErrorCategorias("No se pudieron cargar las categorias" + (err.message ? ": " + err.message : ""));
      setCategorias([]);
    } finally {
      setCargandoCategorias(false);
    }
  }

  useEffect(() => {
    cargarCategorias();
  }, []);

  const productosPorCategoria = useMemo(() => {
    const mapa = {};
    lista.forEach((p) => {
      const catId = p.categoria_id ?? p.categoria;
      if (catId) mapa[catId] = (mapa[catId] || 0) + 1;
    });
    return mapa;
  }, [lista]);

  function manejarSubmit(e) {
    e.preventDefault();
    cargar();
  }

  function abrirModalNuevo() {
    setModo("crear");
    setProductoActual(null);
    setForm({ nombre: "", descripcion: "", precio: "", categoria: "" });
    setImagenes([]);
    setRelacionesProducto(null);
    setModalAbierta(true);
    setErrorModal("");
  }

  function cerrarModal() {
    setModalAbierta(false);
    setForm({ nombre: "", descripcion: "", precio: "", categoria: "" });
    setImagenes([]);
    setErrorModal("");
    setProductoActual(null);
    setRelacionesProducto(null);
    setDialogoEliminar(null);
  }

  async function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function agregarArchivos(files) {
    const disponibles = LIMITE_IMAGENES - imagenes.length;
    if (disponibles <= 0) {
      setErrorModal(`Solo puedes subir hasta ${LIMITE_IMAGENES} imágenes`);
      return;
    }
    const lista = Array.from(files || []).slice(0, disponibles);
    const nuevos = [];
    for (const file of lista) {
      const base64 = await toBase64(file);
      nuevos.push({
        id: null,
        orden: imagenes.length + nuevos.length + 1,
        preview: base64,
        base64,
      });
    }
    setImagenes((prev) => [...prev, ...nuevos]);
  }

  function onDropArchivo(e) {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      agregarArchivos(e.dataTransfer.files);
    }
  }
  function onDragOver(e) { e.preventDefault(); }

  function actualizarOrdenImagen(idx, valor) {
    const orden = Number(valor) || 1;
    setImagenes((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], orden };
      return copia;
    });
  }

  function eliminarImagen(idx) {
    const seleccionada = imagenes[idx];
    if (!seleccionada) return;

    if (!seleccionada.id) {
      setImagenes((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    const confirmado = window.confirm("¿Eliminar esta imagen del producto?");
    if (!confirmado) return;

    setEliminandoImagenId(seleccionada.id);
    eliminarImagenProducto(seleccionada.id)
      .then(() => setImagenes((prev) => prev.filter((_, i) => i !== idx)))
      .catch((err) => setErrorModal(err.message || "No se pudo eliminar la imagen"))
      .finally(() => setEliminandoImagenId(-1));
  }

  async function cargarImagenesProducto(id) {
    try {
      const imgs = await listarImagenesProducto(id);
      const mapeadas = (imgs || []).map((img) => ({
        id: img.id,
        orden: img.orden,
        preview: img.ruta,
        originalOrden: img.orden,
      }));
      setImagenes(mapeadas);
    } catch {
      setImagenes([]);
    }
  }

  async function cargarRelaciones(id) {
    if (!id) return;
    try {
      setCargandoRelaciones(true);
      const data = await obtenerRelacionesProducto(id);
      setRelacionesProducto(data);
    } catch (err) {
      setRelacionesProducto(null);
      setErrorModal(err?.message || "No se pudieron obtener las relaciones del producto");
    } finally {
      setCargandoRelaciones(false);
    }
  }

  function editarProducto(producto) {
    setModo("editar");
    setProductoActual(producto);
    setForm({
      nombre: producto.nombre || "",
      descripcion: producto.descripcion || "",
      precio: producto.precio_mxn ?? producto.precio ?? producto.costo ?? "",
      categoria: producto.categoria_id ?? producto.categoria ?? "",
    });
    setModalAbierta(true);
    setErrorModal("");
    if (producto.id) cargarImagenesProducto(producto.id);
    if (producto.id) cargarRelaciones(producto.id);
  }

  const escenarioProducto = () => {
    if (!productoActual?.id || !relacionesProducto) return 1;
    const ventas = Number(relacionesProducto.ventas || 0) > 0 || Number(relacionesProducto.cot_comprado || 0) > 0;
    const cotAbiertas = Number(relacionesProducto.cot_pendientes || 0) + Number(relacionesProducto.cot_no_comprado || 0);
    if (ventas) return 3;
    if (cotAbiertas > 0) return 2;
    return 1;
  };

  const estaDesactivado = () => {
    if (relacionesProducto && relacionesProducto.activo !== undefined) return Number(relacionesProducto.activo) === 0;
    return Number(productoActual?.activo || 0) === 0;
  };

  async function eliminarProductoActual({ skipConfirm = false } = {}) {
    if (!productoActual?.id) return;
    if (!skipConfirm) {
      const confirmado = window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.");
      if (!confirmado) return;
    }

    try {
      setEliminandoProducto(true);
      setErrorModal("");
      await eliminarProducto(productoActual.id);
      cerrarModal();
      cargar();
    } catch (err) {
      setErrorModal(err.message || "No se pudo eliminar el producto");
    } finally {
      setEliminandoProducto(false);
    }
  }

  async function actualizarActivoProducto(activoDestino = 0) {
    if (!productoActual?.id) return;
    try {
      setCambiandoActivo(true);
      setErrorModal("");
      await actualizarProducto(productoActual.id, { activo: activoDestino });
      setProductoActual((prev) => (prev ? { ...prev, activo: activoDestino } : prev));
      setRelacionesProducto((prev) => (prev ? { ...prev, activo: activoDestino } : prev));
      cargar();
    } catch (err) {
      setErrorModal(err.message || "No se pudo actualizar el estado del producto");
    } finally {
      setCambiandoActivo(false);
    }
  }

  function manejarEliminarProducto() {
    if (!productoActual?.id) return;
    if (!relacionesProducto) {
      cargarRelaciones(productoActual.id);
      setErrorModal("Obteniendo estado del producto, intenta nuevamente en un momento.");
      return;
    }
    const escenario = escenarioProducto();
    if (escenario === 3) {
      setDialogoEliminar({ tipo: "bloqueado" });
      return;
    }
    if (escenario === 2) {
      setOpcionEliminar("cerrar");
      setDialogoEliminar({ tipo: "cotizaciones" });
      return;
    }
    eliminarProductoActual();
  }

  async function cerrarCotizacionesYEliminar() {
    if (!productoActual?.id) return;
    try {
      setEliminandoProducto(true);
      setErrorModal("");
      await cerrarCotizacionesProducto(productoActual.id);
      await eliminarProductoActual({ skipConfirm: true });
      setDialogoEliminar(null);
      window.alert("Producto eliminado correctamente.\\nLas cotizaciones fueron marcadas como no compradas.");
    } catch (err) {
      setErrorModal(err.message || "No se pudo completar la eliminación");
    } finally {
      setEliminandoProducto(false);
    }
  }

  async function guardarProducto(e) {
    e.preventDefault();
    try {
      setEnviando(true);
      setErrorModal("");
      const categoriaId = form.categoria ? Number(form.categoria) : null;
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio_mxn: Number(form.precio) || 0,
        categoria_id: categoriaId,
      };

      let productoId = productoActual?.id;
      if (modo === "crear") {
        const creado = await crearProducto(payload);
        productoId = creado?.id;
      } else if (modo === "editar" && productoId) {
        await actualizarProducto(productoId, payload);
      }

      if (productoId) {
        const existentes = imagenes.filter((img) => img.id);
        const nuevas = imagenes.filter((img) => !img.id);

        const cambiadas = existentes.filter(
          (img) => img.originalOrden !== undefined && img.originalOrden !== img.orden
        );

        // Primera pasada: asignar órdenes temporales únicas para evitar conflicto
        for (const [idx, img] of cambiadas.entries()) {
          await actualizarImagenProducto(img.id, { orden: 240 + idx });
        }
        // Segunda pasada: asignar el orden final deseado
        for (const img of cambiadas) {
          await actualizarImagenProducto(img.id, { orden: img.orden });
        }

        for (const img of nuevas) {
          await agregarImagenProducto({
            producto_id: productoId,
            ruta: img.base64,
            orden: img.orden,
          });
        }
      }

      cerrarModal();
      cargar();
    } catch (err) {
      setErrorModal(err.message || "No se pudo guardar el producto");
    } finally {
      setEnviando(false);
    }
  }

  const total = useMemo(() => lista.length, [lista]);

  return (
    <div className="pagina-productos">
      <div className="productos-topbar">
        <div className="acciones-topbar">
          <button className="btn-verde" onClick={abrirModalNuevo}>
            Nuevo +
          </button>
          <select
            className="select-filtro"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="todos">Todos</option>
            {categorias.map((c) => (
              <option key={c.id ?? c.value} value={c.id ?? c.value}>
                {c.nombre ?? c.label}
              </option>
            ))}
          </select>

          <form onSubmit={manejarSubmit} className="buscador buscador-acciones">
            <input
              type="text"
              placeholder="Buscar producto"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button type="submit" aria-label="buscar">
              <FiSearch />
            </button>
          </form>
        </div>
        </div>

        {cargando && <div className="estado">Cargando productos...</div>}
      {error && <div className="estado error">{error}</div>}

      {!cargando && !error && (
        <>
          <div className="grid-productos">
            {lista.map((p) => (
              <ProductoCard
                key={p.id}
                id={p.id}
                nombre={p.nombre || p.titulo}
                precio={p.precio_mxn ?? p.precio ?? p.costo ?? 0}
                imagenes={p.imagenes}
                imagen={p.imagen || p.foto || ""}
                descripcion={p.descripcion || ""}
                onEditar={() => editarProducto(p)}
              />
            ))}
          </div>

          <div className="resumen-lista">
            {total} producto{total === 1 ? "" : "s"}
          </div>
        </>
      )}

      {modalAbierta && (
        <div className="modal-backdrop" onClick={cerrarModal}>
          <div className="modal-producto" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modo === "crear" ? "Nuevo producto" : "Editar producto"}</h3>
              <button className="modal-close" onClick={cerrarModal} aria-label="Cerrar">✕</button>
            </div>

            <form className="modal-body" onSubmit={guardarProducto}>
              <label className="modal-field">
                <span>Nombre:</span>
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </label>

              <label className="modal-field">
                <span>Descripción:</span>
                <textarea
                  placeholder="Agrega una descripción"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                />
              </label>

              <label className="modal-field">
                <span>Precio:</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio (MXN)"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                />
              </label>

              <div className="modal-row">
                <label className="modal-field flex">
                  <span>Categoria:</span>
                  <select
                    className="modal-filtro"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    required
                  >
                    <option value="">Selecciona</option>
                    {categorias.map((c) => (
                      <option key={c.id ?? c.value} value={c.id ?? c.value}>
                        {c.nombre ?? c.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-icono"
                    aria-label="Gestionar categorias"
                    onClick={() => setGestorCategoriasAbierto(true)}
                  >
                    ✎
                  </button>
                  {cargandoCategorias && <small style={{ color: "#e5e7eb" }}>Cargando...</small>}
                  {errorCategorias && <small className="estado error">{errorCategorias}</small>}
                </label>

                <label className="modal-field flex">
                  <span>Imágenes (max {LIMITE_IMAGENES}):</span>
                  <div className="modal-file">
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        await agregarArchivos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <span className="file-label">Seleccionar imágenes</span>
                    <small className="file-name">
                      {imagenes.length} / {LIMITE_IMAGENES} seleccionadas
                    </small>
                  </div>
                </label>
              </div>

              <div
                className="modal-dropzone"
                onDrop={onDropArchivo}
                onDragOver={onDragOver}
              >
                <span className="drop-plus">＋</span>
                <p>Arrastra y suelta imágenes aquí</p>
              </div>

              {imagenes.length > 0 && (
                <div className="lista-imagenes">
                  {imagenes.map((img, idx) => (
                    <div key={idx} className="imagen-item">
                      <img src={img.preview} alt={`Imagen ${idx + 1}`} />
                      <label>
                        Orden:
                        <input
                          type="number"
                          min="1"
                          max={LIMITE_IMAGENES}
                          value={img.orden}
                          onChange={(e) => actualizarOrdenImagen(idx, e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-rojo"
                        onClick={() => eliminarImagen(idx)}
                        disabled={eliminandoImagenId === img.id}
                      >
                        {eliminandoImagenId === img.id ? "Eliminando..." : img.id ? "Eliminar" : "Quitar"}
                      </button>
                      {img.id && <small>Existente</small>}
                    </div>
                  ))}
                </div>
              )}

              {errorModal && <div className="estado error">{errorModal}</div>}

              <div className="modal-actions">
                {modo === "editar" && (
                  <>
                    <button
                      type="button"
                      className={estaDesactivado() ? "btn-reactivar" : "btn-desactivar"}
                      onClick={() => actualizarActivoProducto(estaDesactivado() ? 1 : 0)}
                      disabled={enviando || eliminandoProducto || cambiandoActivo}
                    >
                      {estaDesactivado() ? "Reactivar" : "Desactivar"}
                    </button>
                    <button
                      type="button"
                      className="btn-rojo"
                      onClick={manejarEliminarProducto}
                      disabled={enviando || eliminandoProducto || cargandoRelaciones}
                    >
                      {eliminandoProducto ? "Eliminando..." : "Eliminar"}
                    </button>
                  </>
                )}
                <button
                  type="submit"
                  className="btn-verde"
                  disabled={enviando || eliminandoProducto || eliminandoImagenId !== -1}
                >
                  {enviando ? "Guardando..." : "Aceptar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialogoEliminar && (
        <div className="modal-backdrop" onClick={() => setDialogoEliminar(null)}>
          <div className="modal-producto modal-dialogo-alerta" onClick={(e) => e.stopPropagation()}>
            <div className="dialogo-header">
              <div className="dialogo-icon">!</div>
              <div className="dialogo-head-text">
                {dialogoEliminar.tipo === "cotizaciones" ? (
                  <>
                    <h3 className="dialogo-titulo">Cotizaciones pendientes</h3>
                    <p className="dialogo-texto">Se deben cambiar a "No comprado" antes de eliminar.</p>
                  </>
                ) : (
                  <>
                    <h3 className="dialogo-titulo">Producto con compras</h3>
                    <p className="dialogo-texto">No puede eliminarse porque tiene historial de compras o cotizaciones compradas.</p>
                  </>
                )}
              </div>
              <button className="modal-close" aria-label="Cerrar" onClick={() => setDialogoEliminar(null)}>
                <FiX />
              </button>
            </div>

            {dialogoEliminar.tipo === "cotizaciones" && (
              <div className="dialogo-body">
                <label className="dialogo-radio">
                  <input
                    type="radio"
                    checked={opcionEliminar === "cerrar"}
                    onChange={() => setOpcionEliminar("cerrar")}
                  />
                  <span>Cerrar cotizaciones como "No comprado" y eliminar producto.</span>
                </label>
                <div className="modal-actions dialogo-actions">
                  <button type="button" className="btn-secundario" onClick={() => setDialogoEliminar(null)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-rojo"
                    onClick={cerrarCotizacionesYEliminar}
                    disabled={eliminandoProducto}
                  >
                    {eliminandoProducto ? "Procesando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}

            {dialogoEliminar.tipo === "bloqueado" && (
              <div className="dialogo-body">
                <p className="dialogo-texto">¿Deseas desactivar este producto?</p>
                <ul className="dialogo-lista">
                  <li>No aparecerá en el catálogo.</li>
                  <li>Seguirá visible en historial y reportes.</li>
                  <li>Se puede reactivar después.</li>
                </ul>
                <div className="modal-actions dialogo-actions">
                  <button type="button" className="btn-secundario" onClick={() => setDialogoEliminar(null)}>
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="btn-rojo"
                    onClick={() => {
                      setDialogoEliminar(null);
                      if (!estaDesactivado()) actualizarActivoProducto(0);
                    }}
                    disabled={cambiandoActivo || estaDesactivado()}
                  >
                    {cambiandoActivo ? "Actualizando..." : estaDesactivado() ? "Ya desactivado" : "Desactivar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {gestorCategoriasAbierto && (
        <div className="modal-backdrop" onClick={() => setGestorCategoriasAbierto(false)}>
          <div
            className="modal-categorias"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-cat-header">
              <h3>Categorias</h3>
              <button className="modal-close" onClick={() => setGestorCategoriasAbierto(false)} aria-label="Cerrar">✕</button>
            </div>

            <div className="modal-cat-body">
              <div className="cat-add-row">
                <input
                  type="text"
                  placeholder="Nueva categoria"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  disabled={cargandoCategoriaAccion}
                />
                <button
                  type="button"
                  className="btn-verde"
                  onClick={async () => {
                    if (!nuevaCategoria.trim()) return;
                    try {
                      setCargandoCategoriaAccion(true);
                      await crearCategoria({ nombre: nuevaCategoria.trim() });
                      setNuevaCategoria("");
                      await cargarCategorias();
                      cargar();
                    } catch (err) {
                      setErrorCategorias(err.message || "No se pudo crear la categoria");
                    } finally {
                      setCargandoCategoriaAccion(false);
                    }
                  }}
                  disabled={cargandoCategoriaAccion}
                >
                  Agregar
                </button>
              </div>

              <div className="cat-list">
                {categorias.map((c) => {
                  const enEdicion = categoriaEditando === c.id;
                  const productosAsignados = productosPorCategoria[c.id] || 0;
                  return (
                    <div key={c.id ?? c.value} className="cat-item">
                      {enEdicion ? (
                        <input
                          type="text"
                          value={nombreEditando}
                          onChange={(e) => setNombreEditando(e.target.value)}
                          disabled={cargandoCategoriaAccion}
                        />
                      ) : (
                        <span>{c.nombre ?? c.label}</span>
                      )}

                      <div className="cat-actions">
                        {enEdicion ? (
                          <>
                            <button
                              type="button"
                              className="btn-verde btn-mini"
                              onClick={async () => {
                                if (!nombreEditando.trim()) return;
                                try {
                                  setCargandoCategoriaAccion(true);
                                  await actualizarCategoria(c.id, { nombre: nombreEditando.trim() });
                                  await cargarCategorias();
                                  cargar();
                                  setCategoriaEditando(null);
                                  setNombreEditando("");
                                } catch (err) {
                                  setErrorCategorias(err.message || "No se pudo actualizar la categoria");
                                } finally {
                                  setCargandoCategoriaAccion(false);
                                }
                              }}
                              disabled={cargandoCategoriaAccion}
                            >
                              ✔
                            </button>
                            <button
                              type="button"
                              className="btn-secundario btn-mini"
                              onClick={() => {
                                setCategoriaEditando(null);
                                setNombreEditando("");
                              }}
                              disabled={cargandoCategoriaAccion}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn-secundario btn-mini"
                              onClick={() => {
                                setCategoriaEditando(c.id);
                                setNombreEditando(c.nombre ?? "");
                              }}
                              aria-label="Renombrar"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="btn-rojo btn-mini"
                              onClick={async () => {
                                const mensajeExtra = productosAsignados > 0
                                  ? `\nAdvertencia: hay ${productosAsignados} producto(s) con esta categoria.`
                                  : "";
                                const confirmar = window.confirm(`¿Eliminar la categoria "${c.nombre}"?${mensajeExtra}`);
                                if (!confirmar) return;
                                try {
                                  setCargandoCategoriaAccion(true);
                                  await eliminarCategoria(c.id);
                                  if (form.categoria === String(c.id)) {
                                    setForm((prev) => ({ ...prev, categoria: "" }));
                                  }
                                  await cargarCategorias();
                                  cargar();
                                } catch (err) {
                                  setErrorCategorias(err.message || "No se pudo eliminar la categoria, asegúrate de que no tenga productos asignados");
                                } finally {
                                  setCargandoCategoriaAccion(false);
                                }
                              }}
                              aria-label="Eliminar"
                              disabled={cargandoCategoriaAccion}
                            >
                              🗑
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {errorCategorias && <div className="estado error">{errorCategorias}</div>}
            </div>

            <div className="modal-actions modal-cat-actions">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setGestorCategoriasAbierto(false)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


