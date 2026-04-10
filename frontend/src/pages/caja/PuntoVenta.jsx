import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function PuntoVenta() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cajaSeleccionada, setCajaSeleccionada] = useState("");
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [medioPago, setMedioPago] = useState("Efectivo");
  const [pagoCon, setPagoCon] = useState("");
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [facturaExitosa, setFacturaExitosa] = useState(null);
  const [tipoDescuento, setTipoDescuento] = useState("ninguno");
  const [descuentoValor, setDescuentoValor] = useState("");
  const [modalCliente, setModalCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", cedula_nit: "", telefono: "", email: "" });
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState(null);

  const empresa_id = parseInt(localStorage.getItem("empresa_id"));
  const role = localStorage.getItem("role");
  const sucursal_id_cajero = localStorage.getItem("sucursal_id");
  const busquedaRef = useRef(null);

  const cargarDatos = async () => {
    try {
      const [prodRes, clientRes, sucRes] = await Promise.all([
        api.get("/productos/"),
        api.get("/clientes/"),
        api.get("/sucursales/"),
      ]);
      setProductos(prodRes.data);
      setClientes(clientRes.data);
      if (role === "cajero" && sucursal_id_cajero) {
        const suSucursal = sucRes.data.filter(s => s.id === parseInt(sucursal_id_cajero));
        setSucursales(suSucursal);
        setSucursalSeleccionada(sucursal_id_cajero);
        cargarCajas(sucursal_id_cajero);
      } else {
        setSucursales(sucRes.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const cargarCajas = async (sucId) => {
    try {
      const res = await api.get(`/cajas/activa/${sucId}`);
      setCajaSeleccionada(res.data.id);
    } catch {
      setCajaSeleccionada("");
    }
  };

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => { if (sucursalSeleccionada && role === "admin") cargarCajas(sucursalSeleccionada); }, [sucursalSeleccionada]);

  const productosFiltrados = productos.filter(p =>
    p.sucursal_id === parseInt(sucursalSeleccionada) &&
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    p.stock > 0
  );

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.producto_id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stock) return prev;
        return prev.map(i => i.producto_id === producto.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario }
          : i
        );
      }
      return [...prev, {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_venta,
        cantidad: 1,
        subtotal: producto.precio_venta,
        stock: producto.stock,
      }];
    });
    setBusqueda("");
    busquedaRef.current?.focus();
  };

  const cambiarCantidad = (producto_id, cantidad) => {
    if (cantidad <= 0) { eliminarDelCarrito(producto_id); return; }
    setCarrito(prev => prev.map(i => i.producto_id === producto_id
      ? { ...i, cantidad, subtotal: cantidad * i.precio_unitario }
      : i
    ));
  };

  const eliminarDelCarrito = (producto_id) => {
    setCarrito(prev => prev.filter(i => i.producto_id !== producto_id));
  };

  const subtotal = carrito.reduce((sum, i) => sum + i.subtotal, 0);

  const calcularDescuento = () => {
    if (tipoDescuento === "porcentaje" && descuentoValor) return subtotal * (parseFloat(descuentoValor) / 100);
    if (tipoDescuento === "valor" && descuentoValor) return Math.min(parseFloat(descuentoValor), subtotal);
    return 0;
  };

  const descuentoAplicado = calcularDescuento();
  const total = Math.max(0, subtotal - descuentoAplicado);
  const cambio = pagoCon ? Math.max(0, parseFloat(pagoCon) - total) : 0;
  const formatCOP = (val) => `$${Number(val).toLocaleString("es-CO")}`;

  const handleRegistrarCliente = async (e) => {
    e.preventDefault();
    setGuardandoCliente(true);
    try {
      const res = await api.post("/clientes/", { ...nuevoCliente, empresa_id });
      setClientes(prev => [...prev, res.data]);
      setClienteId(res.data.id);
      setClienteEncontrado(res.data);
      setBusquedaCliente(res.data.nombre + " — " + res.data.cedula_nit);
      setModalCliente(false);
      setNuevoCliente({ nombre: "", cedula_nit: "", telefono: "", email: "" });
    } catch (err) {
      alert(err.response?.data?.detail || "Error al registrar cliente");
    } finally { setGuardandoCliente(false); }
  };

  const handleVenta = async () => {
    if (!sucursalSeleccionada) { setError("Selecciona una sucursal"); return; }
    if (!cajaSeleccionada) { setError("No hay caja abierta en esta sucursal"); return; }
    if (carrito.length === 0) { setError("El carrito está vacío"); return; }
    if (medioPago === "Efectivo" && (!pagoCon || parseFloat(pagoCon) < total)) {
      setError("El pago en efectivo es insuficiente"); return;
    }
    setProcesando(true);
    setError("");
    try {
      const res = await api.post("/ventas/", {
        empresa_id,
        sucursal_id: parseInt(sucursalSeleccionada),
        caja_id: parseInt(cajaSeleccionada),
        cliente_id: clienteId ? parseInt(clienteId) : null,
        medio_pago: medioPago,
        pago_con: medioPago === "Efectivo" ? parseFloat(pagoCon) : null,
        descuento_porcentaje: tipoDescuento === "porcentaje" ? parseFloat(descuentoValor) || 0 : 0,
        descuento_valor: tipoDescuento === "valor" ? parseFloat(descuentoValor) || 0 : 0,
        items: carrito.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      });
      setFacturaExitosa(res.data);
      setCarrito([]);
      setPagoCon("");
      setClienteId("");
      setClienteEncontrado(null);
      setBusquedaCliente("");
      setDescuentoValor("");
      setTipoDescuento("ninguno");
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al procesar la venta");
    } finally { setProcesando(false); }
  };

  if (loading) return <Layout><div style={styles.loading}>Cargando punto de venta...</div></Layout>;

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Punto de Venta</h1>
        <div style={styles.headerControls}>
          {role === "admin" && (
            <select value={sucursalSeleccionada} onChange={(e) => setSucursalSeleccionada(e.target.value)} style={styles.selectHeader}>
              <option value="">Seleccionar sucursal...</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          )}
          {role === "cajero" && sucursales[0] && (
            <span style={styles.sucursalBadge}>🏪 {sucursales[0].nombre}</span>
          )}
          {sucursalSeleccionada && (
            <span style={cajaSeleccionada ? styles.cajaAbierta : styles.cajaCerrada}>
              {cajaSeleccionada ? "🟢 Caja abierta" : "🔴 Sin caja abierta"}
            </span>
          )}
        </div>
      </div>

      <div style={styles.posGrid}>
        {/* PANEL IZQUIERDO */}
        <div style={styles.leftPanel}>
          <div style={styles.searchBox}>
            <span>🔍</span>
            <input ref={busquedaRef} type="text" placeholder="Buscar producto..." value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)} style={styles.searchInput} autoFocus />
          </div>
          {!sucursalSeleccionada ? (
            <div style={styles.emptyState}>Selecciona una sucursal para ver los productos</div>
          ) : productosFiltrados.length === 0 ? (
            <div style={styles.emptyState}>{busqueda ? `Sin resultados para "${busqueda}"` : "No hay productos con stock disponible"}</div>
          ) : (
            <div style={styles.productosGrid}>
              {productosFiltrados.map(p => (
                <button key={p.id} onClick={() => agregarAlCarrito(p)} style={styles.productoCard}>
                  <div style={styles.prodNombre}>{p.nombre}</div>
                  <div style={styles.prodPrecio}>{formatCOP(p.precio_venta)}</div>
                  <div style={styles.prodStock}>Stock: {p.stock}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PANEL DERECHO */}
        <div style={styles.rightPanel}>

          {/* ✅ BÚSQUEDA DE CLIENTE */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>👤 Cliente</label>
            <div style={styles.clienteRow}>
              <input type="text" placeholder="Buscar por cédula o nombre..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setClienteId("");
                  setClienteEncontrado(null);
                }}
                style={styles.selectCliente} />
              <button onClick={() => setModalCliente(true)} style={styles.btnNuevoCliente}>+ Nuevo</button>
            </div>

            {busquedaCliente.length >= 2 && !clienteEncontrado && (
              <div style={styles.clienteResultados}>
                {clientes.filter(c =>
                  c.cedula_nit.includes(busquedaCliente) ||
                  c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())
                ).length === 0 ? (
                  <div style={styles.clienteNoEncontrado}>
                    No encontrado —{" "}
                    <button onClick={() => setModalCliente(true)} style={styles.btnRegistrarCliente}>
                      Registrar cliente
                    </button>
                  </div>
                ) : (
                  clientes.filter(c =>
                    c.cedula_nit.includes(busquedaCliente) ||
                    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())
                  ).slice(0, 5).map(c => (
                    <div key={c.id} onClick={() => {
                      setClienteId(c.id);
                      setClienteEncontrado(c);
                      setBusquedaCliente(c.nombre + " — " + c.cedula_nit);
                    }} style={styles.clienteResultadoItem}>
                      <span style={{ fontWeight: "600" }}>{c.nombre}</span>
                      <span style={{ color: "#6b7280", fontSize: "12px" }}>{c.cedula_nit}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {clienteEncontrado && (
              <div style={styles.clienteSeleccionado}>
                <span>✅ {clienteEncontrado.nombre}</span>
                <button onClick={() => { setClienteId(""); setClienteEncontrado(null); setBusquedaCliente(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>✕</button>
              </div>
            )}
          </div>

          {/* CARRITO */}
          <div style={styles.carritoBox}>
            {carrito.length === 0 ? (
              <div style={styles.carritoVacio}>El carrito está vacío</div>
            ) : (
              carrito.map(item => (
                <div key={item.producto_id} style={styles.carritoItem}>
                  <div style={styles.itemInfo}>
                    <span style={styles.itemNombre}>{item.nombre}</span>
                    <span style={styles.itemPrecio}>{formatCOP(item.precio_unitario)}</span>
                  </div>
                  <div style={styles.itemControls}>
                    <button onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)} style={styles.btnCant}>−</button>
                    <span style={styles.cantNum}>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)} style={styles.btnCant}>+</button>
                    <span style={styles.itemSubtotal}>{formatCOP(item.subtotal)}</span>
                    <button onClick={() => eliminarDelCarrito(item.producto_id)} style={styles.btnEliminar}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGO */}
          <div style={styles.pagoBox}>
            <div style={styles.section}>
              <label style={styles.sectionLabel}>💳 Medio de pago</label>
              <div style={styles.medioPagoRow}>
                {["Efectivo", "Transferencia", "Otro"].map(m => (
                  <button key={m} onClick={() => setMedioPago(m)}
                    style={{ ...styles.btnMedio, backgroundColor: medioPago === m ? "#16a34a" : "#f3f4f6", color: medioPago === m ? "#fff" : "#374151" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {medioPago === "Efectivo" && (
              <div style={styles.section}>
                <label style={styles.sectionLabel}>💵 Pago con</label>
                <input type="number" value={pagoCon} onChange={(e) => setPagoCon(e.target.value)}
                  placeholder="0" style={styles.inputPago} min={total} />
                {pagoCon && parseFloat(pagoCon) >= total && (
                  <div style={styles.cambioBox}>
                    <span>Cambio:</span>
                    <span style={styles.cambioValor}>{formatCOP(cambio)}</span>
                  </div>
                )}
              </div>
            )}

            <div style={styles.section}>
              <label style={styles.sectionLabel}>🏷️ Descuento</label>
              <div style={styles.medioPagoRow}>
                {[{ key: "ninguno", label: "Sin descuento" }, { key: "porcentaje", label: "% Porcentaje" }, { key: "valor", label: "$ Valor fijo" }].map(d => (
                  <button key={d.key} onClick={() => { setTipoDescuento(d.key); setDescuentoValor(""); }}
                    style={{ ...styles.btnMedio, backgroundColor: tipoDescuento === d.key ? "#f59e0b" : "#f3f4f6", color: tipoDescuento === d.key ? "#fff" : "#374151", fontSize: "12px" }}>
                    {d.label}
                  </button>
                ))}
              </div>
              {tipoDescuento !== "ninguno" && (
                <div style={{ marginTop: "8px" }}>
                  <input type="number" value={descuentoValor} onChange={(e) => setDescuentoValor(e.target.value)}
                    placeholder={tipoDescuento === "porcentaje" ? "Ej: 10 (10%)" : "Ej: 5000"}
                    style={styles.inputPago} min="0" />
                  {descuentoAplicado > 0 && (
                    <div style={{ ...styles.cambioBox, backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
                      <span>Descuento:</span>
                      <span style={{ fontWeight: "700", color: "#f59e0b" }}>-{formatCOP(descuentoAplicado)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {descuentoAplicado > 0 && (
              <div style={styles.subtotalBox}>
                <div style={styles.subtotalRow}><span style={{ color: "#6b7280" }}>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
                <div style={styles.subtotalRow}><span style={{ color: "#f59e0b" }}>Descuento</span><span style={{ color: "#f59e0b" }}>-{formatCOP(descuentoAplicado)}</span></div>
              </div>
            )}

            <div style={styles.totalBox}>
              <span style={styles.totalLabel}>TOTAL</span>
              <span style={styles.totalValor}>{formatCOP(total)}</span>
            </div>

            {error && <div style={styles.errorBox}>⚠ {error}</div>}

            <button onClick={handleVenta} disabled={procesando || carrito.length === 0}
              style={{ ...styles.btnCobrar, opacity: (procesando || carrito.length === 0) ? 0.6 : 1 }}>
              {procesando ? "Procesando..." : `Cobrar ${formatCOP(total)}`}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {modalCliente && (
        <div style={styles.overlay} onClick={() => setModalCliente(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Registrar nuevo cliente</h3>
              <button onClick={() => setModalCliente(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleRegistrarCliente} style={styles.modalForm}>
              {[
                { label: "Nombre completo", key: "nombre", type: "text", placeholder: "Juan Pérez", required: true },
                { label: "Cédula / NIT", key: "cedula_nit", type: "text", placeholder: "1234567890", required: true },
                { label: "Teléfono", key: "telefono", type: "text", placeholder: "3001234567" },
                { label: "Correo electrónico", key: "email", type: "email", placeholder: "cliente@email.com" },
              ].map(f => (
                <div key={f.key} style={styles.fieldGroup}>
                  <label style={styles.label}>{f.label}</label>
                  <input type={f.type} value={nuevoCliente[f.key]} placeholder={f.placeholder}
                    required={f.required}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, [f.key]: e.target.value })}
                    style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
              ))}
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setModalCliente(false)} style={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={guardandoCliente} style={styles.btnPrimario}>
                  {guardandoCliente ? "Guardando..." : "Registrar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FACTURA EXITOSA */}
      {facturaExitosa && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, textAlign: "center", maxWidth: "400px" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
            <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#14532d", margin: "0 0 8px 0" }}>¡Venta registrada!</h3>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 16px 0" }}>Factura #{facturaExitosa.id}</p>
            <div style={{ backgroundColor: "#f0fdf4", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              {facturaExitosa.descuento_porcentaje > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#f59e0b" }}>Descuento</span>
                  <span style={{ fontWeight: "600", color: "#f59e0b" }}>{facturaExitosa.descuento_porcentaje}%</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#6b7280" }}>Total cobrado</span>
                <span style={{ fontWeight: "700", color: "#16a34a", fontSize: "18px" }}>{formatCOP(facturaExitosa.total)}</span>
              </div>
              {facturaExitosa.cambio > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Cambio entregado</span>
                  <span style={{ fontWeight: "600", color: "#374151" }}>{formatCOP(facturaExitosa.cambio)}</span>
                </div>
              )}
            </div>
            <button onClick={() => setFacturaExitosa(null)} style={styles.btnPrimario}>Nueva venta</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#6b7280", fontSize: "16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: 0 },
  headerControls: { display: "flex", alignItems: "center", gap: "12px" },
  selectHeader: { padding: "8px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none" },
  sucursalBadge: { padding: "6px 14px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "20px", fontSize: "13px", fontWeight: "600", border: "1px solid #bbf7d0" },
  cajaAbierta: { padding: "6px 12px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "20px", fontSize: "13px", fontWeight: "600" },
  cajaCerrada: { padding: "6px 12px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "20px", fontSize: "13px", fontWeight: "600" },
  posGrid: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", height: "calc(100vh - 160px)" },
  leftPanel: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" },
  searchBox: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px" },
  searchInput: { border: "none", outline: "none", fontSize: "15px", flex: 1 },
  emptyState: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "14px" },
  productosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", overflowY: "auto" },
  productoCard: { padding: "16px", backgroundColor: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "10px", cursor: "pointer", textAlign: "left" },
  prodNombre: { fontSize: "14px", fontWeight: "600", color: "#111827", marginBottom: "6px" },
  prodPrecio: { fontSize: "16px", fontWeight: "700", color: "#16a34a", marginBottom: "4px" },
  prodStock: { fontSize: "11px", color: "#9ca3af" },
  rightPanel: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" },
  section: { display: "flex", flexDirection: "column", gap: "8px" },
  sectionLabel: { fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" },
  clienteRow: { display: "flex", gap: "8px" },
  selectCliente: { flex: 1, padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "13px", outline: "none" },
  btnNuevoCliente: { padding: "8px 12px", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap" },
  clienteResultados: { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  clienteResultadoItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "13px" },
  clienteNoEncontrado: { padding: "10px 14px", fontSize: "13px", color: "#6b7280" },
  btnRegistrarCliente: { background: "none", border: "none", color: "#16a34a", fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  clienteSeleccionado: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "13px", color: "#16a34a", fontWeight: "600" },
  carritoBox: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", minHeight: "100px" },
  carritoVacio: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "14px" },
  carritoItem: { padding: "10px 12px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" },
  itemInfo: { display: "flex", justifyContent: "space-between", marginBottom: "6px" },
  itemNombre: { fontSize: "13px", fontWeight: "600", color: "#111827" },
  itemPrecio: { fontSize: "12px", color: "#6b7280" },
  itemControls: { display: "flex", alignItems: "center", gap: "8px" },
  btnCant: { width: "26px", height: "26px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "700" },
  cantNum: { fontSize: "14px", fontWeight: "700", minWidth: "20px", textAlign: "center" },
  itemSubtotal: { fontSize: "14px", fontWeight: "700", color: "#16a34a", marginLeft: "auto" },
  btnEliminar: { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "14px" },
  pagoBox: { display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #e5e7eb", paddingTop: "12px" },
  medioPagoRow: { display: "flex", gap: "6px" },
  btnMedio: { flex: 1, padding: "8px 4px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  inputPago: { padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" },
  cambioBox: { display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#f0fdf4", borderRadius: "8px", marginTop: "6px", border: "1px solid #bbf7d0" },
  cambioValor: { fontWeight: "700", color: "#16a34a" },
  subtotalBox: { backgroundColor: "#f9fafb", borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" },
  subtotalRow: { display: "flex", justifyContent: "space-between", fontSize: "13px" },
  totalBox: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "#052e16", borderRadius: "10px" },
  totalLabel: { fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.6)", letterSpacing: "1px" },
  totalValor: { fontSize: "24px", fontWeight: "700", color: "#4ade80" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  btnCobrar: { padding: "14px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#14532d", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  modalForm: { display: "flex", flexDirection: "column", gap: "14px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" },
  btnCancelar: { padding: "10px 18px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  btnPrimario: { padding: "10px 20px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};