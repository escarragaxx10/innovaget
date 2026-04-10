import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Compras() {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [exitoso, setExitoso] = useState(null);

  const [form, setForm] = useState({
    producto_id: "",
    cantidad: "",
    costo_unitario: "",
    proveedor_id: "",
    margen_deseado: "",
    precio_venta_manual: "",
    modo_precio: "margen", // "margen" | "manual"
  });

  const cargarDatos = async () => {
    try {
      const [prodRes, provRes] = await Promise.all([
        api.get("/productos/"),
        api.get("/proveedores/"),
      ]);
      setProductos(prodRes.data);
      setProveedores(provRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const productoSeleccionado = productos.find(p => p.id === parseInt(form.producto_id));

  const precioCalculado = form.modo_precio === "margen" && form.costo_unitario && form.margen_deseado
    ? Math.round(parseFloat(form.costo_unitario) / (1 - parseFloat(form.margen_deseado) / 100))
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcesando(true);
    setError("");
    try {
      const datos = {
        producto_id: parseInt(form.producto_id),
        cantidad: parseInt(form.cantidad),
        costo_unitario: parseFloat(form.costo_unitario),
        proveedor_id: form.proveedor_id ? parseInt(form.proveedor_id) : null,
        margen_deseado: form.modo_precio === "margen" && form.margen_deseado ? parseFloat(form.margen_deseado) : null,
        precio_venta_manual: form.modo_precio === "manual" && form.precio_venta_manual ? parseFloat(form.precio_venta_manual) : null,
      };
      const res = await api.post("/compras/", datos);
      setExitoso(res.data);
      setForm({ producto_id: "", cantidad: "", costo_unitario: "", proveedor_id: "", margen_deseado: "", precio_venta_manual: "", modo_precio: "margen" });
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al registrar la compra");
    } finally {
      setProcesando(false);
    }
  };

  const formatCOP = (val) => `$${Number(val).toLocaleString("es-CO")}`;

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Registro de Compras</h1>
          <p style={styles.subtitle}>Ingresa mercancía y actualiza precios automáticamente</p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* FORMULARIO */}
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>📦 Nueva entrada de mercancía</h2>

          {loading ? <div style={styles.empty}>Cargando...</div> : (
            <form onSubmit={handleSubmit} style={styles.form}>

              {/* Producto */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Producto</label>
                <select value={form.producto_id} onChange={(e) => setForm({ ...form, producto_id: e.target.value })} required style={styles.select}>
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
                </select>
              </div>

              {/* Info del producto seleccionado */}
              {productoSeleccionado && (
                <div style={styles.infoBox}>
                  <div style={styles.infoRow}><span>Stock actual</span><span style={{ fontWeight: "700" }}>{productoSeleccionado.stock} uds</span></div>
                  <div style={styles.infoRow}><span>Precio compra actual</span><span style={{ fontWeight: "700", color: "#f59e0b" }}>{formatCOP(productoSeleccionado.precio_compra)}</span></div>
                  <div style={styles.infoRow}><span>Precio venta actual</span><span style={{ fontWeight: "700", color: "#16a34a" }}>{formatCOP(productoSeleccionado.precio_venta)}</span></div>
                </div>
              )}

              <div style={styles.row}>
                {/* Cantidad */}
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Cantidad a ingresar</label>
                  <input type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                    placeholder="0" required min="1" style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
                {/* Costo unitario */}
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Costo unitario</label>
                  <input type="number" value={form.costo_unitario} onChange={(e) => setForm({ ...form, costo_unitario: e.target.value })}
                    placeholder="0" required min="0" style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
              </div>

              {/* Proveedor */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Proveedor (opcional)</label>
                <select value={form.proveedor_id} onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })} style={styles.select}>
                  <option value="">Sin proveedor</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              {/* Modo precio */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>¿Cómo calcular el precio de venta?</label>
                <div style={styles.modoRow}>
                  <button type="button" onClick={() => setForm({ ...form, modo_precio: "margen" })}
                    style={{ ...styles.btnModo, backgroundColor: form.modo_precio === "margen" ? "#16a34a" : "#f3f4f6", color: form.modo_precio === "margen" ? "#fff" : "#374151" }}>
                    📊 Por margen %
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, modo_precio: "manual" })}
                    style={{ ...styles.btnModo, backgroundColor: form.modo_precio === "manual" ? "#16a34a" : "#f3f4f6", color: form.modo_precio === "manual" ? "#fff" : "#374151" }}>
                    ✏️ Precio manual
                  </button>
                </div>
              </div>

              {form.modo_precio === "margen" && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Margen de ganancia (%)</label>
                  <input type="number" value={form.margen_deseado} onChange={(e) => setForm({ ...form, margen_deseado: e.target.value })}
                    placeholder="Ej: 30" min="1" max="99" style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  {precioCalculado && (
                    <div style={styles.precioPreview}>
                      <span>Precio de venta calculado:</span>
                      <span style={{ fontWeight: "700", color: "#16a34a", fontSize: "18px" }}>{formatCOP(precioCalculado)}</span>
                    </div>
                  )}
                </div>
              )}

              {form.modo_precio === "manual" && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Precio de venta</label>
                  <input type="number" value={form.precio_venta_manual} onChange={(e) => setForm({ ...form, precio_venta_manual: e.target.value })}
                    placeholder="0" min="0" style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
              )}

              {error && <div style={styles.errorBox}>⚠ {error}</div>}

              <button type="submit" disabled={procesando} style={{ ...styles.btnPrimario, opacity: procesando ? 0.7 : 1, padding: "14px", fontSize: "15px" }}>
                {procesando ? "Registrando..." : "✅ Registrar entrada de mercancía"}
              </button>
            </form>
          )}
        </div>

        {/* PANEL DERECHO */}
        <div style={styles.rightPanel}>
          {/* Resultado exitoso */}
          {exitoso && (
            <div style={styles.exitoCard}>
              <p style={{ fontSize: "48px", textAlign: "center", margin: "0 0 12px 0" }}>✅</p>
              <h3 style={styles.exitoTitulo}>¡Mercancía registrada!</h3>
              <div style={styles.exitoInfo}>
                <div style={styles.infoRow}><span>Producto</span><span style={{ fontWeight: "700" }}>{exitoso.nombre}</span></div>
                <div style={styles.infoRow}><span>Nuevo stock</span><span style={{ fontWeight: "700", color: "#16a34a" }}>{exitoso.stock} uds</span></div>
                <div style={styles.infoRow}><span>Precio compra</span><span style={{ fontWeight: "700", color: "#f59e0b" }}>{formatCOP(exitoso.precio_compra)}</span></div>
                <div style={styles.infoRow}><span>Precio venta</span><span style={{ fontWeight: "700", color: "#16a34a" }}>{formatCOP(exitoso.precio_venta)}</span></div>
              </div>
              <button onClick={() => setExitoso(null)} style={{ ...styles.btnPrimario, width: "100%", marginTop: "16px" }}>
                Nueva compra
              </button>
            </div>
          )}

          {/* Info */}
          <div style={styles.infoCard}>
            <h3 style={styles.infoCardTitle}>💡 ¿Cómo funciona?</h3>
            <div style={styles.infoCardItem}>
              <span style={styles.infoCardNum}>1</span>
              <span>Selecciona el producto que compraste</span>
            </div>
            <div style={styles.infoCardItem}>
              <span style={styles.infoCardNum}>2</span>
              <span>Ingresa la cantidad y el precio de costo</span>
            </div>
            <div style={styles.infoCardItem}>
              <span style={styles.infoCardNum}>3</span>
              <span>Define el precio de venta por margen o manualmente</span>
            </div>
            <div style={styles.infoCardItem}>
              <span style={styles.infoCardNum}>4</span>
              <span>El sistema actualiza el stock y precios automáticamente</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px" },
  formCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "28px" },
  formTitle: { fontSize: "18px", fontWeight: "700", color: "#14532d", margin: "0 0 24px 0" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  row: { display: "flex", gap: "12px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  select: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#fff" },
  infoBox: { backgroundColor: "#f0fdf4", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" },
  infoRow: { display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#374151" },
  modoRow: { display: "flex", gap: "8px" },
  btnModo: { flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  precioPreview: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  btnPrimario: { padding: "10px 20px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  rightPanel: { display: "flex", flexDirection: "column", gap: "16px" },
  exitoCard: { backgroundColor: "#fff", borderRadius: "12px", border: "2px solid #16a34a", padding: "24px" },
  exitoTitulo: { fontSize: "18px", fontWeight: "700", color: "#14532d", textAlign: "center", margin: "0 0 16px 0" },
  exitoInfo: { backgroundColor: "#f0fdf4", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" },
  infoCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" },
  infoCardTitle: { fontSize: "15px", fontWeight: "700", color: "#14532d", margin: 0 },
  infoCardItem: { display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "14px", color: "#374151" },
  infoCardNum: { width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0 },
  empty: { padding: "40px", textAlign: "center", color: "#6b7280" },
};