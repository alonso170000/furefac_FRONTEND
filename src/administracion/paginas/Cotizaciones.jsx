//C:\UPQROO\FUREFAC PROYECTO\Frontend_furefac\src\administracion\paginas\Cotizaciones.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./../ui/Cotizaciones.css";
import {
  listarCotizaciones,
  cambiarEstadoCotizacion,
  registrarCompra,
  crearCotizacion,
  obtenerImagenesCotizacion,
} from "../servicios/cotizaciones";
import { listarImagenesProducto, listarCategorias, listarProductos } from "../servicios/productos";
import { FiX, FiUploadCloud, FiImage, FiPlus, FiAlertTriangle } from "react-icons/fi";

const ESTADOS = [
  { value: "todos", label: "Todo" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_seguimiento", label: "En seguimiento" },
  { value: "comprado", label: "Comprado" },
  { value: "no_comprado", label: "No comprado" },
];

const LIMITE_IMAGENES_COTZ = 5;

export default function Cotizaciones() {
  const [estado, setEstado] = useState("todos");
  const [q, setQ] = useState("");
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [imagenesMap, setImagenesMap] = useState({});
  const [productoImagenMap, setProductoImagenMap] = useState({});
  const [modalAbierta, setModalAbierta] = useState(false);
  const [formModal, setFormModal] = useState({
    categoria: "",
    producto: "",
    nombre: "",
    correo: "",
    telefono: "",
    descripcion: "",
    cantidad: 1,
  });
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [errorCompra, setErrorCompra] = useState("");
  const [imagenesModal, setImagenesModal] = useState([]);
  const inputArchivoRef = useRef(null);
  const [compraModalAbierta, setCompraModalAbierta] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [compraForm, setCompraForm] = useState({
    cantidad: 1,
    fecha: "",
    metodoPago: "efectivo",
    metodoPagoOtro: "",
    precioFinal: "",
    notas: "",
    enviarRecibo: true,
  });
  const [enviandoCompra, setEnviandoCompra] = useState(false);
  const [confirmarCompraAbierta, setConfirmarCompraAbierta] = useState(false);
  const METODOS_PAGO = [
    { value: "efectivo", label: "Efectivo" },
    { value: "transferencia", label: "Transferencia bancaria" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "deposito", label: "Deposito" },
    { value: "otro", label: "Otro" },
  ];

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const data = await listarCotizaciones({ estado, q });
      setLista(Array.isArray(data) ? data : []);
      // carga imágenes por cotización
      const imagenesPorId = {};
      const productoImgPorCot = {};
      await Promise.all(
        (data || []).map(async (c) => {
          if (!c?.id) return;
          try {
            const imgs = await obtenerImagenesCotizacion(c.id);
            imagenesPorId[c.id] = imgs.map((it) => it.ruta).filter(Boolean);
          } catch {
            imagenesPorId[c.id] = [];
          }
          if (c.producto_id) {
            try {
              const imgsProd = await listarImagenesProducto(c.producto_id);
              const rutasProd = (imgsProd || []).map((it) => it.ruta).filter(Boolean);
              if (rutasProd.length) productoImgPorCot[c.id] = rutasProd[0];
            } catch {
              /* ignore */
            }
          }
        })
      );
      setImagenesMap(imagenesPorId);
      setProductoImagenMap(productoImgPorCot);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las cotizaciones");
      setLista([]);
      setImagenesMap({});
      setProductoImagenMap({});
    } finally {
      setCargando(false);
    }
  }

  function abrirModalNuevo() {
    setFormModal({
      categoria: "",
      producto: "",
      nombre: "",
      correo: "",
      telefono: "",
      descripcion: "",
      cantidad: 1,
    });
    setImagenesModal([]);
    setErrorModal("");
    setModalAbierta(true);
  }

  function cerrarModal() {
    setModalAbierta(false);
    setEnviando(false);
    setErrorModal("");
    setFormModal({
      categoria: "",
      producto: "",
      nombre: "",
      correo: "",
      telefono: "",
      descripcion: "",
      cantidad: 1,
    });
    setImagenesModal([]);
  }

  const cargarCategoriasModal = useCallback(async () => {
    try {
      setCargandoCategorias(true);
      const data = await listarCategorias();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorModal(err?.message || "No se pudieron cargar las categorias");
      setCategorias([]);
    } finally {
      setCargandoCategorias(false);
    }
  }, []);

  const cargarProductosModal = useCallback(async (categoriaId = "") => {
    try {
      setCargandoProductos(true);
      const data = await listarProductos({
        categoria_id: categoriaId || "",
        activo: "",
      });
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorModal(err?.message || "No se pudieron cargar los productos");
      setProductos([]);
    } finally {
      setCargandoProductos(false);
    }
  }, []);

  useEffect(() => {
    if (!modalAbierta) return;
    if (!categorias.length) {
      cargarCategoriasModal();
    }
  }, [modalAbierta, categorias.length, cargarCategoriasModal]);

  useEffect(() => {
    if (!modalAbierta) return;
    cargarProductosModal(formModal.categoria);
  }, [modalAbierta, formModal.categoria, cargarProductosModal]);

  async function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function manejarArchivos(fileList) {
    if (!fileList?.length) return;
    const disponibles = LIMITE_IMAGENES_COTZ - imagenesModal.length;
    if (disponibles <= 0) {
      setErrorModal(`Solo puedes agregar hasta ${LIMITE_IMAGENES_COTZ} im\u00e1genes`);
      return;
    }
    const seleccionados = Array.from(fileList).slice(0, disponibles);
    const convertidas = [];
    for (const file of seleccionados) {
      const base64 = await toBase64(file);
      convertidas.push({
        preview: base64,
        base64,
        nombre: file.name,
      });
    }
    setImagenesModal((prev) => [...prev, ...convertidas]);
  }

  function onDropArchivo(e) {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      manejarArchivos(e.dataTransfer.files);
    }
  }

  function onDragOverArchivo(e) {
    e.preventDefault();
  }

  function quitarImagen(idx) {
    setImagenesModal((prev) => prev.filter((_, i) => i !== idx));
  }

  const productoSeleccionado = useMemo(
    () => productos.find((p) => String(p.id ?? p.value) === String(formModal.producto)),
    [formModal.producto, productos]
  );

  const productoSeleccionadoImagen = useMemo(() => {
    if (!productoSeleccionado) return "";
    if (Array.isArray(productoSeleccionado.imagenes) && productoSeleccionado.imagenes.length) {
      return productoSeleccionado.imagenes[0];
    }
    return (
      productoSeleccionado.imagen_portada ||
      productoSeleccionado.imagen ||
      productoSeleccionado.foto ||
      ""
    );
  }, [productoSeleccionado]);

  const precioProductoSeleccionado = useMemo(() => {
    if (!productoSeleccionado) return "";
    const referencia =
      productoSeleccionado.precio_mxn ??
      productoSeleccionado.precio ??
      productoSeleccionado.costo ??
      null;
    if (referencia === null || referencia === undefined || referencia === "") return "";
    const numero = Number(referencia);
    if (Number.isNaN(numero)) return "";
    return `$${numero.toLocaleString("es-MX")}`;
  }, [productoSeleccionado]);

  async function enviarCotizacion(e) {
    e.preventDefault();
    const nombre = formModal.nombre.trim();
    const correo = formModal.correo.trim();
    const telefono = formModal.telefono.trim();
    const descripcion = formModal.descripcion.trim();
    if (!nombre || !correo || !telefono || !descripcion) {
      setErrorModal("Completa los campos obligatorios marcados con *");
      return;
    }
    try {
      setEnviando(true);
      setErrorModal("");
      const payload = {
        nombre_usuario: nombre,
        correo,
        telefono,
        descripcion,
        cantidad_solicitada: Number(formModal.cantidad) > 0 ? Number(formModal.cantidad) : 1,
        imagenes: imagenesModal.map((img) => img.base64).filter(Boolean),
      };
      if (productoSeleccionado) {
        payload.producto_id = productoSeleccionado.id ?? productoSeleccionado.value;
        payload.producto_nombre_snap = productoSeleccionado.nombre ?? productoSeleccionado.label;
        payload.producto_precio_snap =
          productoSeleccionado.precio_mxn ??
          productoSeleccionado.precio ??
          productoSeleccionado.costo ??
          null;
        payload.producto_categoria_snap =
          productoSeleccionado.categoria_nombre ??
          productoSeleccionado.categoria ??
          productoSeleccionado.categoria_id ??
          null;
        payload.producto_descripcion_snap = productoSeleccionado.descripcion || "";
      }
      await crearCotizacion(payload);
      cerrarModal();
      cargar();
    } catch (err) {
      setErrorModal(err?.message || "No se pudo crear la cotizaci\u00f3n");
    } finally {
      setEnviando(false);
    }
  }

  const filtradas = useMemo(() => {
    if (!q.trim()) return lista;
    const term = q.toLowerCase();
    return lista.filter((c) => (c.descripcion || "").toLowerCase().includes(term));
  }, [lista, q]);

  function abrirCompraModal(cotizacion) {
    if (!cotizacion) return;
    setCotizacionSeleccionada(cotizacion);
    const precioBase =
      cotizacion.producto_precio ??
      cotizacion.producto_precio_snap ??
      cotizacion.precio_mxn ??
      cotizacion.precio ??
      cotizacion.costo ??
      cotizacion.precio_unitario ??
      0;
    const cantidadBase = cotizacion.cantidad_solicitada || 1;
    setCompraForm({
      cantidad: cantidadBase,
      fecha: new Date().toISOString().slice(0, 10),
      metodoPago: "efectivo",
      metodoPagoOtro: "",
      precioFinal: precioBase,
      notas: "",
      enviarRecibo: true,
    });
    setCompraModalAbierta(true);
  }

  function cerrarCompraModal() {
    setCompraModalAbierta(false);
    setCotizacionSeleccionada(null);
    setCompraForm({
      cantidad: 1,
      fecha: "",
      metodoPago: "efectivo",
      metodoPagoOtro: "",
      precioFinal: "",
      notas: "",
      enviarRecibo: true,
    });
    setEnviandoCompra(false);
    setConfirmarCompraAbierta(false);
    setErrorCompra("");
  }

  const totalCompra = useMemo(() => {
    const cantidad = Number(compraForm.cantidad) > 0 ? Number(compraForm.cantidad) : 1;
    const precio = Number(compraForm.precioFinal) || 0;
    return cantidad * precio;
  }, [compraForm.cantidad, compraForm.precioFinal]);

  function generarFolio(cotizacion) {
    const year = new Date().getFullYear();
    const numero = String(cotizacion?.id || Math.floor(Date.now() % 100000)).padStart(5, "0");
    return `FRF-${year}-${numero}`;
  }

  async function confirmarCompra() {
    if (!cotizacionSeleccionada) return;
    try {
      setEnviandoCompra(true);
      const payload = {
        cotizacion_id: cotizacionSeleccionada.id,
        folio: generarFolio(cotizacionSeleccionada),
        fecha_compra: compraForm.fecha,
        cantidad: Number(compraForm.cantidad) > 0 ? Number(compraForm.cantidad) : 1,
        precio_unitario_final: Number(compraForm.precioFinal) || 0,
        total: totalCompra,
        metodo_pago: compraForm.metodoPago,
        metodo_pago_otro:
          compraForm.metodoPago === "otro"
            ? compraForm.metodoPagoOtro.trim() || null
            : null,
        notas: compraForm.notas.trim() || null,
        cliente_nombre: cotizacionSeleccionada.nombre_usuario,
        cliente_correo: cotizacionSeleccionada.correo,
        cliente_telefono: cotizacionSeleccionada.telefono,
        producto_nombre:
          cotizacionSeleccionada.producto_nombre ||
          cotizacionSeleccionada.producto_nombre_snap ||
          cotizacionSeleccionada.nombre_producto ||
          "Producto",
        producto_descripcion:
          cotizacionSeleccionada.producto_descripcion ||
          cotizacionSeleccionada.descripcion ||
          cotizacionSeleccionada.producto_descripcion_snap ||
          "",
        producto_categoria:
          cotizacionSeleccionada.producto_categoria ||
          cotizacionSeleccionada.producto_categoria_snap ||
          cotizacionSeleccionada.categoria ||
          null,
      };
      await registrarCompra(payload);
      try {
        await cambiarEstadoCotizacion(cotizacionSeleccionada.id, "comprado");
        setLista((prev) =>
          prev.map((c) => (c.id === cotizacionSeleccionada.id ? { ...c, estado: "comprado" } : c))
        );
      } catch (estadoErr) {
        setErrorCompra(estadoErr?.message || "La compra se guardó pero no se pudo actualizar el estado");
      }
      cerrarCompraModal();
      cargar();
    } catch (err) {
      setErrorCompra(err?.message || "No se pudo registrar la compra");
    } finally {
      setEnviandoCompra(false);
      setConfirmarCompraAbierta(false);
    }
  }

  function handleSubmitCompra(e) {
    e.preventDefault();
    if (!compraForm.fecha || !cotizacionSeleccionada) {
      setErrorCompra("Completa la fecha y los campos obligatorios");
      return;
    }
    if (compraForm.metodoPago === "otro" && !compraForm.metodoPagoOtro.trim()) {
      setErrorCompra("Escribe el otro método de pago");
      return;
    }
    setErrorCompra("");
    setConfirmarCompraAbierta(true);
  }

  return (
    <div className="cotz-page">
      <div className="cotz-hero">
        <div className="cotz-toolbar">
          <select className="cotz-filter" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
        <div className="cotz-hero-top">
          <div className="cotz-actions">
            <button className="cotz-btn-new" onClick={abrirModalNuevo}>Nuevo +</button>
            <div className="cotz-search">
              <input
                type="search"
                placeholder="Buscar"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onBlur={cargar}
              />
            </div>
          </div>
        </div>
      </div>

      {cargando && <div className="estado">Cargando...</div>}
      {error && <div className="estado error">{error}</div>}

      {!cargando && !error && (
        <div className="cotz-list">
          {filtradas.map((c) => (
            <CotizacionCard
              key={c.id}
              data={c}
              imagenes={imagenesMap[c.id] || []}
              productoImagen={productoImagenMap[c.id]}
              onRefresh={cargar}
              onRegistrarCompra={() => abrirCompraModal(c)}
            />
          ))}
          {filtradas.length === 0 && <div className="estado">Sin cotizaciones</div>}
        </div>
      )}

      {compraModalAbierta && cotizacionSeleccionada && (
        <div className="cotz-modal-overlay" onClick={cerrarCompraModal}>
          <div className="compra-modal-shell" onClick={(e) => e.stopPropagation()}>
            
            <div className="compra-modal-inner">
              <h2 className="cotz-modal-title">Registrar compra</h2>
              <button className="cotz-modal-close" onClick={cerrarCompraModal} aria-label="Cerrar modal">
              <FiX />
            </button>
              <div className="compra-modal-grid">
                <div className="compra-panel compra-panel-left">
                  <div className="compra-section">
                    <h4>Detalles del cliente</h4>
                    <label className="cotz-field">
                      <span>Nombre:</span>
                      <input className="cotz-input" value={cotizacionSeleccionada.nombre_usuario || ""} readOnly />
                    </label>
                    <label className="cotz-field">
                      <span>Telefono:</span>
                      <input className="cotz-input" value={cotizacionSeleccionada.telefono || ""} readOnly />
                    </label>
                    <label className="cotz-field">
                      <span>Correo:</span>
                      <input className="cotz-input" value={cotizacionSeleccionada.correo || ""} readOnly />
                    </label>
                  </div>

                  <div className="compra-section compra-section-producto">
                    <h4>Detalles del producto</h4>
                    <label className="cotz-field">
                      <span>Nombre:</span>
                      <input
                        className="cotz-input"
                        value={
                          cotizacionSeleccionada.producto_nombre ||
                          cotizacionSeleccionada.producto_nombre_snap ||
                          cotizacionSeleccionada.nombre_producto ||
                          ""
                        }
                        readOnly
                      />
                    </label>
                    <div className="cotz-two-cols">
                      <label className="cotz-field">
                        <span>Precio unitario original:</span>
                        <input
                          className="cotz-input"
                          value={
                            cotizacionSeleccionada.producto_precio ??
                            cotizacionSeleccionada.producto_precio_snap ??
                            ""
                          }
                          readOnly
                        />
                      </label>
                      <label className="cotz-field">
                        <span>Categoria:</span>
                        <input
                          className="cotz-input"
                          value={
                            cotizacionSeleccionada.producto_categoria ||
                            cotizacionSeleccionada.producto_categoria_snap ||
                            cotizacionSeleccionada.categoria ||
                            ""
                          }
                          readOnly
                        />
                      </label>
                    </div>
                    <label className="cotz-field">
                      <span>Descripción:</span>
                      <textarea
                        className="cotz-textarea"
                        value={
                          cotizacionSeleccionada.producto_descripcion ||
                          cotizacionSeleccionada.descripcion ||
                          ""
                        }
                        readOnly
                      />
                    </label>
                  </div>
                </div>

                <form className="compra-panel compra-panel-compra" onSubmit={handleSubmitCompra}>
                  <h4>Detalles de la compra</h4>
                  <div className="cotz-two-cols">
                    <label className="cotz-field">
                      <span>Cantidad:</span>
                      <input
                        className="cotz-input"
                        type="number"
                        min="1"
                        value={compraForm.cantidad}
                        onChange={(e) => setCompraForm((p) => ({ ...p, cantidad: e.target.value }))}
                      />
                    </label>
                    <label className="cotz-field">
                      <span>Fecha:</span>
                      <input
                        className="cotz-input"
                        type="date"
                        value={compraForm.fecha}
                        onChange={(e) => setCompraForm((p) => ({ ...p, fecha: e.target.value }))}
                        required
                      />
                    </label>
                  </div>

                  <div className="cotz-two-cols">
                    <label className="cotz-field">
                      <span>Método de pago:</span>
                      <select
                        className="cotz-input"
                        value={compraForm.metodoPago}
                        onChange={(e) => setCompraForm((p) => ({ ...p, metodoPago: e.target.value }))}
                      >
                        {METODOS_PAGO.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="cotz-field">
                      <span>Precio unitario final:</span>
                      <input
                        className="cotz-input"
                        type="number"
                        step="0.01"
                        value={compraForm.precioFinal}
                        onChange={(e) => setCompraForm((p) => ({ ...p, precioFinal: e.target.value }))}
                      />
                    </label>
                  </div>

                  {compraForm.metodoPago === "otro" && (
                    <label className="cotz-field">
                      <span>Otro método de pago:</span>
                      <input
                        className="cotz-input"
                        type="text"
                        placeholder="Escribe el otro método de pago"
                        value={compraForm.metodoPagoOtro}
                        onChange={(e) => setCompraForm((p) => ({ ...p, metodoPagoOtro: e.target.value }))}
                      />
                    </label>
                  )}

                  <label className="cotz-field">
                    <span>Notas (opcional):</span>
                    <textarea
                      className="cotz-textarea"
                      placeholder="Describe alguna observación o detalle"
                      value={compraForm.notas}
                      onChange={(e) => setCompraForm((p) => ({ ...p, notas: e.target.value }))}
                    />
                  </label>

                  <label className="compra-check">
                    <input
                      type="checkbox"
                      checked={compraForm.enviarRecibo}
                      onChange={(e) => setCompraForm((p) => ({ ...p, enviarRecibo: e.target.checked }))}
                    />
                    <span>Enviar recibo al correo del cliente</span>
                  </label>

                  <div className="compra-total">
                    <span>Total:</span>
                    <strong>${(totalCompra || 0).toFixed(2)}</strong>
                  </div>

                  {errorCompra && <div className="cotz-modal-error">{errorCompra}</div>}

                  <div className="cotz-modal-actions">
                    <button type="button" className="cotz-btn-secondary" onClick={cerrarCompraModal} disabled={enviandoCompra}>
                      Cancelar
                    </button>
                    <button className="cotz-btn-primary" type="submit" disabled={enviandoCompra}>
                      {enviandoCompra ? "Guardando..." : "Aceptar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmarCompraAbierta && (
        <div className="cotz-modal-overlay compra-confirm-overlay" onClick={() => setConfirmarCompraAbierta(false)}>
          <div className="compra-confirm-card" onClick={(e) => e.stopPropagation()}>
            
            <div className="compra-confirm-body">
              <div className="compra-confirm-icon">
                <FiAlertTriangle />
              </div>
              <p>Una vez guardado, su estado cambia a comprada y no se podrá cambiar de estado.</p>
              <div className="compra-confirm-actions">
                <button className="cotz-btn-secondary" type="button" onClick={() => setConfirmarCompraAbierta(false)} disabled={enviandoCompra}>
                  Cancelar
                </button>
                <button className="cotz-btn-primary" type="button" onClick={confirmarCompra} disabled={enviandoCompra}>
                  {enviandoCompra ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalAbierta && (
        <div className="cotz-modal-overlay" onClick={cerrarModal}>
          <div className="cotz-modal-shell" onClick={(e) => e.stopPropagation()}>
            
            <div className="cotz-modal-inner">
              
              <h2 className="cotz-modal-title">Cotizar producto</h2>
              <button className="cotz-modal-close" onClick={cerrarModal} aria-label="Cerrar modal">
              <FiX />
              </button>
              <div className="cotz-modal-grid">
                <div className="cotz-modal-panel cotz-panel-producto">
                  <div className="cotz-panel-heading">
                    <div>
                      <p className="cotz-panel-kicker">Detalles del producto</p>
                      <div className="cotz-panel-selects">
                        <label className="cotz-field">
                          <span>Categoria:</span>
                          <select
                            className="cotz-input"
                            value={formModal.categoria}
                            onChange={(e) =>
                              setFormModal((prev) => ({
                                ...prev,
                                categoria: e.target.value,
                                producto: "",
                              }))
                            }
                            disabled={cargandoCategorias}
                          >
                            <option value="">
                              {cargandoCategorias ? "Cargando..." : "Selecciona categoria"}
                            </option>
                            {categorias.map((cat) => (
                              <option key={cat.id ?? cat.value} value={cat.id ?? cat.value}>
                                {cat.nombre ?? cat.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="cotz-field">
                          <span>Nombre:</span>
                          <select
                            className="cotz-input"
                            value={formModal.producto}
                            onChange={(e) =>
                              setFormModal((prev) => ({ ...prev, producto: e.target.value }))
                            }
                            disabled={cargandoProductos}
                          >
                            <option value="">
                              {cargandoProductos ? "Cargando..." : "Selecciona nombre"}
                            </option>
                            {productos.map((prod) => (
                              <option key={prod.id ?? prod.value} value={prod.id ?? prod.value}>
                                {prod.nombre ?? prod.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                    {(cargandoCategorias || cargandoProductos) && (
                      <span className="cotz-pill">Actualizando</span>
                    )}
                  </div>

                  <div className="cotz-product-visor">
                    {productoSeleccionado ? (
                      <>
                        <div className="cotz-product-visor-top">
                          <div className="cotz-product-visual">
                            {productoSeleccionadoImagen ? (
                              <img src={productoSeleccionadoImagen} alt="producto" />
                            ) : (
                              <div className="cotz-product-icon">
                                <FiImage />
                              </div>
                            )}
                          </div>
                          <div className="cotz-product-copy">
                            <h4>{productoSeleccionado.nombre ?? productoSeleccionado.label}</h4>
                            <div className="cotz-product-meta">
                              {(productoSeleccionado.categoria_nombre || productoSeleccionado.categoria) && (
                                <span>{productoSeleccionado.categoria_nombre || productoSeleccionado.categoria}</span>
                              )}
                              {precioProductoSeleccionado && <span>{precioProductoSeleccionado}</span>}
                            </div>
                          </div>
                        </div>
                        <p className="cotz-product-description">
                          {productoSeleccionado.descripcion || "Sin descripción para este producto."}
                        </p>
                      </>
                    ) : (
                      <div className="cotz-product-placeholder">
                        <FiImage />
                        <p>Selecciona una categoria y un producto para previsualizarlo aquí.</p>
                      </div>
                    )}
                  </div>
                </div>

                <form className="cotz-modal-panel cotz-panel-form" onSubmit={enviarCotizacion}>
                  <div className="cotz-form-section">
                    <h4>Detalles del cliente</h4>
                    <div className="cotz-two-cols">
                      <label className="cotz-field">
                        <span>Nombre*:</span>
                        <input
                          className="cotz-input"
                          type="text"
                          placeholder="Nombre"
                          value={formModal.nombre}
                          onChange={(e) =>
                            setFormModal((prev) => ({ ...prev, nombre: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <label className="cotz-field">
                        <span>Correo*:</span>
                        <input
                          className="cotz-input"
                          type="email"
                          placeholder="Correo"
                          value={formModal.correo}
                          onChange={(e) =>
                            setFormModal((prev) => ({ ...prev, correo: e.target.value }))
                          }
                          required
                        />
                      </label>
                    </div>
                    <label className="cotz-field">
                      <span>Telefono*:</span>
                      <input
                        className="cotz-input"
                        type="tel"
                        placeholder="Telefono"
                        value={formModal.telefono}
                        onChange={(e) =>
                          setFormModal((prev) => ({ ...prev, telefono: e.target.value }))
                        }
                        required
                      />
                    </label>
                  </div>

                  <div className="cotz-form-section">
                    <h4>Detalles de la cotización</h4>
                    <label className="cotz-field">
                      <span>Descripción*:</span>
                      <textarea
                        className="cotz-textarea"
                        placeholder="Agrega una descripción"
                        value={formModal.descripcion}
                        onChange={(e) =>
                          setFormModal((prev) => ({ ...prev, descripcion: e.target.value }))
                        }
                        required
                      />
                    </label>

                    <div className="cotz-two-cols">
                      <label className="cotz-field">
                        <span>Cantidad:</span>
                        <input
                          className="cotz-input"
                          type="number"
                          min="1"
                          value={formModal.cantidad}
                          onChange={(e) =>
                            setFormModal((prev) => ({ ...prev, cantidad: e.target.value }))
                          }
                        />
                      </label>
                      <div className="cotz-field">
                        <span>Imagen:</span>
                        <div className="cotz-upload-control">
                          <button
                            type="button"
                            className="cotz-btn-secondary"
                            onClick={() => inputArchivoRef.current?.click()}
                          >
                            <FiUploadCloud /> Seleccionar imagen
                          </button>
                          <small>
                            {imagenesModal.length
                              ? `${imagenesModal.length} imagen${imagenesModal.length > 1 ? "es" : ""} seleccionada`
                              : "Ninguna imagen seleccionada"}
                          </small>
                        </div>
                        <input
                          ref={inputArchivoRef}
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          onChange={(e) => manejarArchivos(e.target.files)}
                        />
                      </div>
                    </div>

                    <div
                      className="cotz-upload-area"
                      onDrop={onDropArchivo}
                      onDragOver={onDragOverArchivo}
                      onClick={() => inputArchivoRef.current?.click()}
                    >
                      <div className="cotz-upload-area-inner">
                        <FiUploadCloud />
                        <p>Arrastre y suelte la imagen</p>
                        <small>
                          Formatos jpg, png o webp. Máximo {LIMITE_IMAGENES_COTZ} imágenes.
                        </small>
                        <div className="cotz-upload-plus">
                          <FiPlus />
                        </div>
                      </div>
                    </div>

                    {imagenesModal.length > 0 && (
                      <div className="cotz-upload-list">
                        {imagenesModal.map((img, idx) => (
                          <div key={idx} className="cotz-upload-thumb">
                            <img src={img.preview} alt={`img-${idx}`} />
                            <button
                              type="button"
                              className="cotz-upload-remove"
                              onClick={() => quitarImagen(idx)}
                              aria-label="Quitar imagen"
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {errorModal && <div className="cotz-modal-error">{errorModal}</div>}

                  <div className="cotz-modal-actions">
                    <button
                      type="button"
                      className="cotz-btn-secondary"
                      onClick={cerrarModal}
                      disabled={enviando}
                    >
                      Cancelar
                    </button>
                    <button className="cotz-btn-primary" type="submit" disabled={enviando}>
                      {enviando ? "Enviando..." : "Cotizar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CotizacionCard({ data, imagenes = [], productoImagen, onRefresh, onRegistrarCompra }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(false);
  const [chipHover, setChipHover] = useState(null);
  const [estadoActual, setEstadoActual] = useState(data?.estado || "pendiente");
  
  const fecha = data?.creado_en ? new Date(data.creado_en) : null;
  const mes = fecha ? fecha.toLocaleString("es-MX", { month: "short" }).toUpperCase() : "";
  const dia = fecha ? fecha.getDate() : "";
  const anio = fecha ? fecha.getFullYear() : "";
  const thumb = productoImagen || data?.imagen_portada || (data?.imagenes?.[0]) || "https://via.placeholder.com/120";
  const esComprado = estadoActual === "comprado";

  useEffect(() => {
    setEstadoActual(data?.estado || "pendiente");
  }, [data?.estado]);

  async function cambiarEstado(nuevoEstado) {
    if (esComprado) {
      setMenuAbierto(false);
      setSubmenuAbierto(false);
      return;
    }
    try {
      setEstadoActual(nuevoEstado);
      await cambiarEstadoCotizacion(data.id, nuevoEstado);
      setMenuAbierto(false);
      setSubmenuAbierto(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  }

  function descargarImagen(url, index) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `cotizacion-${data.id}-imagen-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuAbierto && !e.target.closest('.cotz-menu-btn') && !e.target.closest('.cotz-menu-dropdown')) {
        setMenuAbierto(false);
        setSubmenuAbierto(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuAbierto]);

  return (
    <article className="cotz-card">
      <div className="cotz-thumb">
        <img src={thumb} alt="producto" />
      </div>
      <div className="cotz-body">
        <div className="cotz-desc-row">
          <p className="cotz-desc">{data?.descripcion || "Sin descripción"}</p>
          <div className="cotz-date">
            <div>{mes}</div>
            <div className="cotz-date-day">{dia}</div>
            <div>{anio}</div>
          </div>
        </div>
      </div>
      <div className="cotz-right">
        <div className="cotz-user" data-estado={estadoActual}>
          <strong>{data?.nombre_usuario}</strong>
          <small>{data?.telefono}</small>
          <small>{data?.correo}</small>
        </div>
        <div className="cotz-actions-row">

          <div className={`cotz-chips ${imagenes.length > 2 ? "cotz-chips--many" : ""}`}>
            {imagenes.map((img, idx) => (

              <span
                key={idx}
                className="cotz-chip-img"
                onMouseEnter={() => setChipHover(idx)}
                onMouseLeave={() => setChipHover(null)}
                onFocus={() => setChipHover(idx)}
                onBlur={() => setChipHover(null)}
                tabIndex={0}
              >
                <img src={img} alt={`img-${idx}`} />

                {chipHover === idx && (

                  <div

                    className="cotz-chip-download"

                    onClick={() => descargarImagen(img, idx)}

                  >

                    Descargar

                  </div>

                )}

                

              </span>

            ))}

          </div>

          <button
            className="cotz-menu-btn"
            onClick={() => setMenuAbierto(!menuAbierto)}
            onMouseEnter={() => setMenuAbierto(true)}
          >
            ...
          </button>

          {menuAbierto && (
            <div className="cotz-menu-dropdown">
              {!esComprado && (
                <button 
                  className="cotz-menu-item"
                  onClick={() => {
                    setMenuAbierto(false);
                    setSubmenuAbierto(false);
                    if (typeof onRegistrarCompra === "function") onRegistrarCompra(data);
                  }}
                >
                  Registrar compra
                </button>
              )}
              {esComprado ? (
                <button className="cotz-menu-item" disabled>
                  Estado: Comprado
                </button>
              ) : (
                <button 
                  className="cotz-menu-item has-submenu"
                  onMouseEnter={() => setSubmenuAbierto(true)}
                  onFocus={() => setSubmenuAbierto(true)}
                  onBlur={() => setSubmenuAbierto(false)}
                >
                  Cambiar estado
                  <div
                    className={`cotz-submenu ${submenuAbierto ? "visible" : ""}`}
                    onMouseEnter={() => setSubmenuAbierto(true)}
                    onMouseLeave={() => setSubmenuAbierto(false)}
                  >
                    <button 
                      className="cotz-menu-item pendiente"
                      onClick={() => cambiarEstado("pendiente")}
                    >
                      Pendiente
                    </button>
                    <button 
                      className="cotz-menu-item seguimiento"
                      onClick={() => cambiarEstado("en_seguimiento")}
                    >
                      En seguimiento
                    </button>
                    <button 
                      className="cotz-menu-item no-comprado"
                      onClick={() => cambiarEstado("no_comprado")}
                    >
                      No comprado
                    </button>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
