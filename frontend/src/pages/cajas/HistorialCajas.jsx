import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function HistorialCajas() {
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarSucursales = async () => {
    try { const res = await api.get("/sucursales/"); setSucursales(res.data); }
    catch (err) { console.error(err); }
  };

  const cargarHistorial = async (sucId) => {
    setLoading(true);
    try { const res = await api.get(`/cajas/historial/${sucId}`); setHistorial(res.data); }
    catch { setHistorial([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarSucursales(); }, []);
  useEffect(() => { if (sucursalSeleccionada) cargarHistorial(sucursalSeleccionada); }, [sucursalSeleccionada]);

  const formatCOP = (val) => `$${Number(val).toLocaleString("es-CO")}`;
  const formatFecha = (f) => f ? new Date(f).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const duracion = (apertura, cierre) => {
    if (!cierre) return "Abierta";
    const diff = new Date(cierre) - new Date(apertura);
    const horas = Math.floor(diff / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    return `${horas}h ${minutos}m`;
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Historial de Cajas</h1>
          <p style={styles.subtitle}>Registro de aperturas y cierres por sucursal</p>
        </div>
      </div>

      <div style={styles.selectorCard}>
        <label style={styles.label}>Selecciona la sucursal</label>
        <select value={sucursalSeleccionada} onChange={(e) => setSucursalSeleccionada(e.target.value)} style={styles.select}>
          <option value="">Seleccionar sucursal...</option>
          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}
        </select>
      </div>

      {sucursalSeleccionada && (
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.empty}>Cargando historial...</div>
          ) : historial.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>🏧</p>
              <p>No hay cajas cerradas en esta sucursal</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>{["ID", "Apertura", "Cierre", "Duración", "Monto inicial", "Monto final", "Estado"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {historial.map((caja, i) => (
                  <tr key={caja.id} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                    <td style={styles.td}><span style={styles.idBadge}>#{caja.id}</span></td>
                    <td style={styles.td}>{formatFecha(caja.fecha_apertura)}</td>
                    <td style={styles.td}>{formatFecha(caja.fecha_cierre)}</td>
                    <td style={styles.td}>{duracion(caja.fecha_apertura, caja.fecha_cierre)}</td>
                    <td style={styles.td}>{formatCOP(caja.monto_inicial)}</td>
                    <td style={{ ...styles.td, fontWeight: "700", color: caja.monto_final ? "#16a34a" : "#9ca3af" }}>
                      {caja.monto_final ? formatCOP(caja.monto_final) : "—"}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.estadoBadge, backgroundColor: caja.estado === "CERRADA" ? "#f0fdf4" : "#fffbeb", color: caja.estado === "CERRADA" ? "#16a34a" : "#f59e0b" }}>
                        {caja.estado === "CERRADA" ? "✅ Cerrada" : "🟡 Abierta"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0 },
  selectorCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  select: { padding: "11px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#fff" },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" },
  idBadge: { fontWeight: "700", color: "#14532d" },
  estadoBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  empty: { padding: "60px", textAlign: "center", color: "#6b7280", fontSize: "15px" },
};