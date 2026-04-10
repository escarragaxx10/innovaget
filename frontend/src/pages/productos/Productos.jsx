import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const empresa_id = parseInt(localStorage.getItem("empresa_id"));

  const [form, setForm] = useState({
    nombre: "", descripcion: "", precio_compra: "", precio_venta: "",
    stock: "", categoria_id: "", sucursal_id: "", empresa_id,
  });

  const cargarDatos = async () => {
    try {
      const [prodRes, catRes, sucRes] = await Promise.all([
        api.get("/productos/"),
        api.get("/categorias/"),
        api.get("/sucursales/"),
      ]);
      setProductos(prodRes.data);
      setCategorias(catRes.data);
      setSucursales(sucRes.data);
    } catch (err) {
      console.error("Error cargando productos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirModalCrear = () => {
    setProductoEditando(null);
    setForm({ nombre: "", descripcion: "", precio_compra: "", precio_venta: "", stock: "", categoria_id: "", sucursal_id: "", empresa_id });
    setError("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto) => {
    setProductoEditando(producto);
    setForm({
      nombre: producto.nombre, descripcion: producto.descripcion || "",
      precio_compra: producto.precio_compra, precio_venta: producto.precio_venta,
      stock: producto.stock, categoria_id: producto.categoria_id,
      sucursal_id: producto.sucursal_id, empresa_id,
    });
    setError("");
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const datos = {
        ...form,
        precio_compra: parseFloat(form.precio_compra),
        precio_venta: parseFloat(form.precio_venta),
        stock: parseInt(form.stock),
        categoria_id: parseInt(form.categoria_id),
        sucursal_id: parseInt(form.sucursal_id),
      };
      if (productoEditando) {
        await api.put(`/productos/${productoEditando.id}`, datos);
      } else {
        await api.post("/productos/", datos);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar el producto");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await api.delete(`/productos/${id}`);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al eliminar");
    }
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatCOP = (val) => `$${Number(val).toLocaleString("es-CO")}`;

  const getStockColor = (stock) => {
    if (stock <= 0) return "#dc2626";
    if (stock <= 5) return "#f59e0b";
    return "#16a34a";
  };

  return (
    <Layout>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestión de Productos</h1>
          <p style={styles.subtitle}>{productosFiltrados.length} productos registrados</p>
        </div>
        <button onClick={abrirModalCrear} style={styles.btnPrimario}>
          + Nuevo producto
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div style={styles.searchBar}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* TABLA */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyBox}>Cargando productos...</div>
        ) : productosFiltrados.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>📦</p>
            <p>No hay productos registrados</p>
            <button onClick={abrirModalCrear} style={styles.btnPrimario}>Crear primer producto</button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Producto", "Categoría", "Sucursal", "P. Compra", "P. Venta", "Stock", "Acciones"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p, i) => (
                <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                  <td style={styles.td}>
                    <div style={styles.nombreProd}>{p.nombre}</div>
                    {p.descripcion && <div style={styles.descProd}>{p.descripcion}</div>}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>
                      {categorias.find(c => c.id === p.categoria_id)?.nombre || "-"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {sucursales.find(s => s.id === p.sucursal_id)?.nombre || "-"}
                  </td>
                  <td style={styles.td}>{formatCOP(p.precio_compra)}</td>
                  <td style={{ ...styles.td, fontWeight: "600", color: "#16a34a" }}>{formatCOP(p.precio_venta)}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.stockBadge, backgroundColor: getStockColor(p.stock) + "20", color: getStockColor(p.stock) }}>
                      {p.stock} uds
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.acciones}>
                      <button onClick={() => abrirModalEditar(p)} style={styles.btnEditar}>✏️ Editar</button>
                      <button onClick={() => handleEliminar(p.id)} style={styles.btnEliminar}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div style={styles.modalOverlay} onClick={() => setModalAbierto(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{productoEditando ? "Editar producto" : "Nuevo producto"}</h2>
              <button onClick={() => setModalAbierto(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleGuardar} style={styles.modalForm}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nombre del producto</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Zapato deportivo" required style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Descripción (opcional)</label>
                <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Talla 42, color negro" style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Precio de compra</label>
                  <input type="number" value={form.precio_compra} onChange={(e) => setForm({ ...form, precio_compra: e.target.value })}
                    placeholder="0" required style={styles.input} min="0"
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Precio de venta</label>
                  <input type="number" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                    placeholder="0" required style={styles.input} min="0"
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
                <div style={{ ...styles.fieldGroup, width: "100px" }}>
                  <label style={styles.label}>Stock inicial</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="0" required style={styles.input} min="0"
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Categoría</label>
                  <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                    required style={styles.select}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Sucursal</label>
                  <select value={form.sucursal_id} onChange={(e) => setForm({ ...form, sucursal_id: e.target.value })}
                    required style={styles.select}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              {error && <div style={styles.errorBox}><span>⚠</span><span>{error}</span></div>}

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ ...styles.btnPrimario, opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? "Guardando..." : productoEditando ? "Actualizar producto" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0 },
  btnPrimario: { padding: "10px 20px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  searchBar: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 16px", marginBottom: "20px" },
  searchIcon: { fontSize: "16px" },
  searchInput: { border: "none", outline: "none", fontSize: "14px", flex: 1, color: "#374151", backgroundColor: "transparent" },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" },
  nombreProd: { fontWeight: "600", color: "#111827" },
  descProd: { fontSize: "12px", color: "#9ca3af", marginTop: "2px" },
  badge: { padding: "3px 10px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  stockBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  acciones: { display: "flex", gap: "8px" },
  btnEditar: { padding: "5px 10px", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  btnEliminar: { padding: "5px 10px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  emptyBox: { padding: "60px", textAlign: "center", color: "#6b7280", fontSize: "15px" },
  emptyIcon: { fontSize: "48px", marginBottom: "12px" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#14532d", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  modalForm: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "flex", gap: "12px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", color: "#111827", transition: "border-color 0.2s", fontFamily: "inherit" },
  select: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", color: "#111827", backgroundColor: "#fff", fontFamily: "inherit" },
  errorBox: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" },
  btnCancelar: { padding: "10px 20px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};