import { useEffect, useMemo, useRef, useState } from "react";
import "./../ui/Historial.css";
import { listarHistorial, obtenerDetalleHistorial, reenviarReciboHistorial } from "../servicios/historial";
import { obtenerCotizacion } from "../servicios/cotizaciones";
import { FiAlertTriangle, FiEye, FiFileText, FiSearch, FiSend, FiX } from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoFundacion from "../../assets/logo-fundacion.png";

export default function Historial() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");
  const [reciboAbierto, setReciboAbierto] = useState(false);
  const [reciboDetalle, setReciboDetalle] = useState(null);
  const [cargandoRecibo, setCargandoRecibo] = useState(false);
  const [errorRecibo, setErrorRecibo] = useState("");
  const [reenviandoId, setReenviandoId] = useState(null);
  const [mensajeReenvio, setMensajeReenvio] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "" });
  const toastTimeout = useRef(null);
  const reciboRef = useRef(null);
  const reciboHiddenRef = useRef(null);
  const [confirmarReenvio, setConfirmarReenvio] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const data = await listarHistorial();
      setLista(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "No se pudo cargar el historial");
      setLista([]);
    } finally {
      setCargando(false);
    }
  }

  const filtrados = useMemo(() => {
    if (!q.trim()) return lista;
    const term = q.toLowerCase();
    return lista.filter((item) =>
      [
        item.folio,
        item.cliente,
        item.producto,
        item.metodo_pago,
        item.usuario_nombre,
        item.usuario_apellido,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [lista, q]);

  function formatearFecha(fecha) {
    if (!fecha) return "";
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString("es-MX");
  }

  function formatearMoneda(valor) {
    const num = Number(valor);
    if (Number.isNaN(num)) return valor ?? "";
    return num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function enriquecerDetalleConCotizacion(data) {
    let precioOriginal = data?.producto_precio ?? null;
    let categoriaOriginal = data?.producto_categoria ?? null;

    if (data?.cotizacion_id) {
      try {
        const cot = await obtenerCotizacion(data.cotizacion_id);
        const precioSnap =
          cot?.producto_precio_snap ??
          cot?.producto_precio ??
          cot?.precio_mxn ??
          cot?.precio ??
          null;
        const catSnap =
          cot?.producto_categoria_snap ??
          cot?.producto_categoria ??
          cot?.categoria ??
          null;
        precioOriginal = precioOriginal ?? precioSnap;
        categoriaOriginal = categoriaOriginal ?? catSnap;
      } catch {
        /* ignore */
      }
    }

    return {
      ...data,
      precio_original: precioOriginal,
      producto_categoria_original: categoriaOriginal,
    };
  }

  async function verDetalles(item) {
    if (!item?.id) return;
    try {
      setCargandoDetalle(true);
      setErrorDetalle("");
      const data = await obtenerDetalleHistorial(item.id);
      const enriquecido = await enriquecerDetalleConCotizacion(data);
      setDetalle(enriquecido);
      setDetalleAbierto(true);
    } catch (err) {
      setErrorDetalle(err?.message || "No se pudo cargar el detalle");
      setDetalleAbierto(true);
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function verRecibo(item) {
    if (!item?.id) return;
    try {
      setCargandoRecibo(true);
      setErrorRecibo("");
      const data = await obtenerDetalleHistorial(item.id);
      const enriquecido = await enriquecerDetalleConCotizacion(data);
      setReciboDetalle(enriquecido);
      setReciboAbierto(true);
    } catch (err) {
      setErrorRecibo(err?.message || "No se pudo cargar el recibo");
      setReciboAbierto(true);
    } finally {
      setCargandoRecibo(false);
    }
  }

  function reenviarRecibo(item) {
    if (!item?.id) return;
    setMensajeReenvio("");
    setErrorRecibo("");
    generarYEnviarRecibo(item.id);
  }

  function mostrarToast(msg, type = "ok") {
    setToast({ msg, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ msg: "", type: "" }), 5000);
  }

  async function generarYEnviarRecibo(id) {
    try {
      setReenviandoId(id);
      mostrarToast("Enviando...", "info");
      const data = await obtenerDetalleHistorial(id);
      const detalle = await enriquecerDetalleConCotizacion(data);
      setReciboDetalle(detalle);
      const pdfBase64 = await generarPdfDesdeRecibo(detalle);
      const correo = detalle?.cliente_correo || detalle?.correo || "";
      await reenviarReciboHistorial(id, { pdfBase64, correo });
      setMensajeReenvio("Recibo reenviado con éxito");
      mostrarToast("Recibo reenviado con éxito", "ok");
    } catch (err) {
      setErrorRecibo(err?.message || "No se pudo reenviar el recibo");
      mostrarToast(err?.message || "No se pudo reenviar el recibo", "error");
    } finally {
      setReenviandoId(null);
    }
  }

  async function generarPdfDesdeRecibo(detalle) {
    // Renderizar el recibo en un contenedor oculto para capturarlo
    setReciboDetalle(detalle);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const el = reciboHiddenRef.current || reciboRef.current;
    if (!el) throw new Error("No se pudo generar el recibo");
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const marginTop = 20;
    const marginBottom = 20;
    const maxHeight = pdf.internal.pageSize.getHeight() - marginTop - marginBottom;
    const finalHeight = Math.min(imgHeight, maxHeight);
    pdf.addImage(imgData, "PNG", 20, marginTop, imgWidth, finalHeight);
    const dataUri = pdf.output("datauristring");
    return dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
  }

  async function descargarRecibo() {
    if (!reciboRef.current) return;
    try {
      const canvas = await html2canvas(reciboRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const marginTop = 20;
      const marginBottom = 20;
      const maxHeight = pageHeight - marginTop - marginBottom;
      const finalHeight = Math.min(imgHeight, maxHeight);
      pdf.addImage(imgData, "PNG", 20, marginTop, imgWidth, finalHeight);
      pdf.save(`recibo-${reciboDetalle?.folio || "compra"}.pdf`);
    } catch (err) {
      setErrorRecibo("No se pudo generar el PDF");
    }
  }

  return (
    <div className="hist-page">
      <div className="hist-hero">
        <div className="hist-search">
          <FiSearch className="hist-search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {cargando && <div className="estado">Cargando historial...</div>}
      {error && <div className="estado error">{error}</div>}

      {!cargando && !error && (
        <div className="hist-card">
          <div className="hist-table-wrap">
            <table className="hist-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha de compra</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Metodo de pago</th>
                  <th>Registrado por</th>
                  <th className="hist-th-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={9} className="hist-empty">Sin resultados</td>
                  </tr>
                )}
                {filtrados.map((item) => (
                  <tr key={item.id ?? item.folio}>
                    <td>{item.folio || "-"}</td>
                    <td>{formatearFecha(item.fecha)}</td>
                    <td>{item.cliente || "-"}</td>
                    <td>{item.producto || "-"}</td>
                    <td className="hist-num">{item.cantidad ?? "-"}</td>
                    <td className="hist-num">{formatearMoneda(item.total)}</td>
                    <td>{item.metodo_pago || "-"}</td>
                    <td>{[item.usuario_nombre, item.usuario_apellido].filter(Boolean).join(" ") || "-"}</td>
                    <td>
                      <div className="hist-actions">
                        <button className="hist-btn hist-btn-yellow" onClick={() => verDetalles(item)}>
                          <FiEye></FiEye>
                          <span>Ver detalles</span>
                        </button>
                        <button className="hist-btn hist-btn-green" onClick={() => verRecibo(item)}>
                          <FiFileText></FiFileText>
                          <span>Ver recibo</span>
                        </button>
                        <button
                          className="hist-btn hist-btn-blue"
                          onClick={() => setConfirmarReenvio(item)}
                          disabled={reenviandoId === item.id}
                        >
                          <FiSend></FiSend>
                          <span>{reenviandoId === item.id ? "Enviando..." : "Reenviar recibo"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detalleAbierto && (
        <div className="hist-modal-overlay" onClick={() => setDetalleAbierto(false)}>
          <div className="hist-modal-shell" onClick={(e) => e.stopPropagation()}>
            <div className="hist-modal-inner">
              <h2 className="hist-modal-title">Detalles de la compra</h2>
              <button className="hist-modal-close" onClick={() => setDetalleAbierto(false)} aria-label="Cerrar modal">
                <FiX />
              </button>
              {cargandoDetalle && <div className="estado">Cargando detalle...</div>}
              {!cargandoDetalle && (
                <div className="hist-modal-grid">
                  <div className="hist-modal-panel hist-panel-left">
                    <div className="hist-modal-section">
                      <h4>Detalles del cliente</h4>
                      <label className="hist-field">
                        <span>Nombre:</span>
                        <input className="hist-input" readOnly value={detalle?.cliente_nombre || detalle?.cliente || ""} />
                      </label>
                      <label className="hist-field">
                        <span>Teléfono:</span>
                        <input className="hist-input" readOnly value={detalle?.cliente_telefono || ""} />
                      </label>
                      <label className="hist-field">
                        <span>Correo:</span>
                        <input className="hist-input" readOnly value={detalle?.cliente_correo || ""} />
                      </label>
                    </div>

                    <div className="hist-modal-section">
                      <h4>Detalles del producto</h4>
                      <label className="hist-field">
                        <span>Nombre:</span>
                        <input className="hist-input" readOnly value={detalle?.producto_nombre || detalle?.producto || ""} />
                      </label>
                      <div className="hist-two-cols">
                        <label className="hist-field">
                          <span>Precio unitario original:</span>
                          <input
                            className="hist-input"
                            readOnly
                            value={
                              detalle?.precio_original ??
                              detalle?.producto_precio ??
                              detalle?.producto_precio_snap ??
                              ""
                            }
                          />
                        </label>
                        <label className="hist-field">
                          <span>Categoría:</span>
                          <input
                            className="hist-input"
                            readOnly
                            value={
                              detalle?.producto_categoria_original ||
                              detalle?.producto_categoria ||
                              detalle?.categoria ||
                              ""
                            }
                          />
                        </label>
                      </div>
                      <label className="hist-field">
                        <span>Descripción:</span>
                        <textarea className="hist-textarea" readOnly value={detalle?.producto_descripcion || ""} />
                      </label>
                    </div>
                  </div>

                  <div className="hist-modal-panel hist-panel-right">
                    <h4>Detalles de la compra</h4>
                    <div className="hist-two-cols">
                      <label className="hist-field">
                        <span>Folio:</span>
                        <input className="hist-input" readOnly value={detalle?.folio || ""} />
                      </label>
                      <label className="hist-field">
                        <span>Fecha:</span>
                        <input className="hist-input" readOnly value={formatearFecha(detalle?.fecha || detalle?.fecha_compra)} />
                      </label>
                    </div>
                    <div className="hist-two-cols">
                      <label className="hist-field">
                        <span>Cantidad:</span>
                        <input className="hist-input" readOnly value={detalle?.cantidad ?? ""} />
                      </label>
                      <label className="hist-field">
                        <span>Precio unitario final:</span>
                        <input className="hist-input" readOnly value={detalle?.precio_unitario_final ?? ""} />
                      </label>
                    </div>
                    <div className="hist-two-cols">
                      <label className="hist-field">
                        <span>Método de pago:</span>
                        <input className="hist-input" readOnly value={detalle?.metodo_pago || ""} />
                      </label>
                      <label className="hist-field">
                        <span>Total:</span>
                        <input className="hist-input" readOnly value={detalle?.total ?? ""} />
                      </label>
                    </div>
                    {detalle?.metodo_pago_otro && (
                      <label className="hist-field">
                        <span>Otro método de pago:</span>
                        <input className="hist-input" readOnly value={detalle?.metodo_pago_otro || ""} />
                      </label>
                    )}
                    <label className="hist-field">
                      <span>Notas:</span>
                      <textarea
                        className="hist-textarea"
                        readOnly
                        value={detalle?.notas || "Sin notas registradas"}
                      />
                    </label>
                  </div>
                </div>
              )}
              {errorDetalle && <div className="estado error">{errorDetalle}</div>}
            </div>
          </div>
        </div>
      )}

      {reciboAbierto && (
        <div className="hist-modal-overlay" onClick={() => setReciboAbierto(false)}>
          <div className="hist-modal-shell hist-recibo-shell" onClick={(e) => e.stopPropagation()}>
            <div className="hist-modal-inner">
              <h2 className="hist-modal-title">Recibo</h2>
              <button className="hist-modal-close" onClick={() => setReciboAbierto(false)} aria-label="Cerrar recibo">
                <FiX />
              </button>
              {cargandoRecibo && <div className="estado">Cargando recibo...</div>}
              {!cargandoRecibo && (
                <>
                  <div className="hist-recibo-frame">
                    <div className="hist-recibo-paper" ref={reciboRef}>
                      <div className="hist-recibo-header">
                        <div className="hist-recibo-logo">
                          <div className="hist-recibo-logo-img">
                            <img src={logoFundacion} alt="Logo fundación" />
                          </div>
                        </div>
                        <div className="hist-recibo-folio">
                          <div>Folio: {reciboDetalle?.folio || "-"}</div>
                          <div>Fecha: {formatearFecha(reciboDetalle?.fecha || reciboDetalle?.fecha_compra)}</div>
                        </div>
                      </div>

                      <h3 className="hist-recibo-title">Recibo de compra</h3>

                      <div className="hist-recibo-cliente">
                        <div className="hist-recibo-cliente-label">Cliente</div>
                        <div className="hist-recibo-cliente-datos">
                          <div><strong>Nombre: </strong>{reciboDetalle?.cliente_nombre || reciboDetalle?.cliente || "-"}</div>
                          <div><strong>Teléfono: </strong>{reciboDetalle?.cliente_telefono || "-"}</div>
                          <div><strong>Correo: </strong>{reciboDetalle?.cliente_correo || "-"}</div>
                        </div>
                      </div>

                      <table className="hist-recibo-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio unitario</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{reciboDetalle?.producto_nombre || reciboDetalle?.producto || "-"}</td>
                            <td>{reciboDetalle?.cantidad ?? "-"}</td>
                            <td className="hist-recibo-num">
                              {formatearMoneda(reciboDetalle?.precio_unitario_final ?? reciboDetalle?.precio_original ?? 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="hist-recibo-pago">
                        <div><strong>Método de pago: </strong>{reciboDetalle?.metodo_pago || "-"}</div>
                        <div><strong>Total: </strong>{formatearMoneda(reciboDetalle?.total ?? 0)}</div>
                      </div>

                      <div className="hist-recibo-footer">
                        <p><strong>¡Gracias por tu compra!</strong></p>
                        <p>Con tu apoyo estás ayudando a los programas de la Fundación Recolectando Felicidad A.C.</p>
                        <p className="hist-recibo-legal">Este es un comprobante simplificado sin efectos fiscales.</p>
                      </div>
                    </div>
                  </div>
                  {errorRecibo && <div className="estado error">{errorRecibo}</div>}
                  <div className="hist-recibo-actions">
                    <button className="cotz-btn-primary" onClick={descargarRecibo} disabled={cargandoRecibo}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      {cargandoRecibo ? "Generando..." : "Descargar PDF"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recibo oculto para generar PDF al reenviar */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
        <div className="hist-recibo-paper" ref={reciboHiddenRef}>
          <div className="hist-recibo-header">
            <div className="hist-recibo-logo">
              <div className="hist-recibo-logo-img">
                <img src={logoFundacion} alt="Logo fundación" />
              </div>
            </div>
            <div className="hist-recibo-folio">
              <div>Folio: {reciboDetalle?.folio || "-"}</div>
              <div>Fecha: {formatearFecha(reciboDetalle?.fecha || reciboDetalle?.fecha_compra)}</div>
            </div>
          </div>

          <h3 className="hist-recibo-title">Recibo de compra</h3>

          <div className="hist-recibo-cliente">
            <div className="hist-recibo-cliente-label">Cliente</div>
            <div className="hist-recibo-cliente-datos">
              <div><strong>Nombre: </strong>{reciboDetalle?.cliente_nombre || reciboDetalle?.cliente || "-"}</div>
              <div><strong>Teléfono: </strong>{reciboDetalle?.cliente_telefono || "-"}</div>
              <div><strong>Correo: </strong>{reciboDetalle?.cliente_correo || "-"}</div>
            </div>
          </div>

          <table className="hist-recibo-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{reciboDetalle?.producto_nombre || reciboDetalle?.producto || "-"}</td>
                <td>{reciboDetalle?.cantidad ?? "-"}</td>
                <td className="hist-recibo-num">
                  {formatearMoneda(reciboDetalle?.precio_unitario_final ?? reciboDetalle?.precio_original ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="hist-recibo-pago">
            <div><strong>Método de pago: </strong>{reciboDetalle?.metodo_pago || "-"}</div>
            <div><strong>Total: </strong>{formatearMoneda(reciboDetalle?.total ?? 0)}</div>
          </div>

          <div className="hist-recibo-footer">
            <p><strong>¡Gracias por tu compra!</strong></p>
            <p>Con tu apoyo estás ayudando a los programas de la Fundación Recolectando Felicidad A.C.</p>
            <p className="hist-recibo-legal">Este es un comprobante simplificado sin efectos fiscales.</p>
          </div>
        </div>
      </div>

      {toast.msg && (
        <div className={`hist-toast ${toast.type === "error" ? "error" : "ok"}`}>
          {toast.msg}
        </div>
      )}

      {confirmarReenvio && (
        <div className="hist-modal-overlay" onClick={() => setConfirmarReenvio(null)}>
          <div className="hist-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="hist-confirm-icon">
              <FiAlertTriangle />
            </div>
            <p className="hist-confirm-text">
              ¿Seguro que deseas reenviar el recibo al cliente?
            </p>
            <div className="hist-confirm-actions">
              <button className="hist-btn hist-btn-yellow" type="button" onClick={() => setConfirmarReenvio(null)}>
                Cancelar
              </button>
              <button
                className="hist-btn hist-btn-blue"
                type="button"
                onClick={() => {
                  const item = confirmarReenvio;
                  setConfirmarReenvio(null);
                  reenviarRecibo(item);
                }}
              >
                Reenviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
