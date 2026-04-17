import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function ModalPDF({ onCerrar, mesActual, anioActual }) {
  const [tipo, setTipo] = useState("diario");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [mes, setMes] = useState(mesActual);
  const [anio, setAnio] = useState(anioActual);
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = async () => {
    setDescargando(true);
    try {
      let url, filename;
      if (tipo === "diario") {
        url = `/reportes/descargar-pdf-diario?fecha=${fecha}`;
        filename = `reporte_diario_${fecha}.pdf`;
      } else {
        url = `/reportes/descargar-pdf-mensual?mes=${mes}&anio=${anio}`;
        filename = `reporte_mensual_${meses[mes-1]}_${anio}.pdf`;
      }
      const res = await api.get(url, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      onCerrar();
    } catch { alert("Error al generar PDF"); }
    finally { setDescargando(false); }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "420px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#14532d" }}>Descargar reporte PDF</h2>
          <button onClick={onCerrar} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>

        {/* TIPO DE REPORTE */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          {[
            { val: "diario", label: "Reporte del día", icon: "📅" },
            { val: "mensual", label: "Reporte mensual", icon: "📈" },
          ].map((op) => (
            <button key={op.val} onClick={() => setTipo(op.val)}
              style={{ flex: 1, padding: "14px 10px", border: tipo === op.val ? "2px solid #16a34a" : "1.5px solid #e5e7eb", borderRadius: "10px", background: tipo === op.val ? "#f0fdf4" : "#fff", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>{op.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: tipo === op.val ? "#16a34a" : "#374151" }}>{op.label}</div>
            </button>
          ))}
        </div>

        {/* SELECTOR SEGÚN TIPO */}
        {tipo === "diario" ? (
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Selecciona el día</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Mes</label>
              <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} style={inputStyle}>
                {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Año</label>
              <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))} style={inputStyle}>
                {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
            {tipo === "diario"
              ? `Se descargará el reporte de ventas del día ${new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}`
              : `Se descargará el reporte mensual de ${meses[mes - 1]} ${anio}`
            }
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
            Cancelar
          </button>
          <button onClick={handleDescargar} disabled={descargando}
            style={{ flex: 1, padding: "12px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", opacity: descargando ? 0.7 : 1 }}>
            {descargando ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" };

export default function Reportes() {
  const [resumenDiario, setResumenDiario] = useState(null);
  const [utilidad, setUtilidad] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resRes, utilRes, sucRes] = await Promise.all([
        api.get("/reportes/resumen-diario"),
        api.get(`/reportes/utilidad-mensual?mes=${mes}&anio=${anio}`),
        api.get("/reportes/ventas-por-sucursal"),
      ]);
      setResumenDiario(resRes.data);
      setUtilidad(utilRes.data);
      setSucursales(sucRes.data.sucursales || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, [mes, anio]);

  const formatCOP = (val) => `$${Number(val).toLocaleString("es-CO")}`;

  return (
    <Layout>
      {mostrarModal && <ModalPDF onCerrar={() => setMostrarModal(false)} mesActual={mes} anioActual={anio} />}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Reportes</h1>
          <p style={styles.subtitle}>Análisis financiero de tu empresa</p>
        </div>
        <button onClick={() => setMostrarModal(true)} style={styles.btnPDF}>📄 Descargar PDF</button>
      </div>

      <div style={styles.selectorBox}>
        <span style={styles.selectorLabel}>Período:</span>
        <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} style={styles.select}>
          {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))} style={styles.select}>
          {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? <div style={styles.empty}>Cargando reportes...</div> : (
        <>
          {resumenDiario && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📅 Resumen del día — {resumenDiario.fecha}</h2>
              <div style={styles.cardsGrid}>
                <MetricCard label="Efectivo" valor={formatCOP(resumenDiario.dinero_hoy.efectivo)} color="#16a34a" icon="💵" />
                <MetricCard label="Transferencias" valor={formatCOP(resumenDiario.dinero_hoy.transferencias)} color="#0369a1" icon="🏦" />
                <MetricCard label="Total ventas" valor={formatCOP(resumenDiario.dinero_hoy.total_ventas)} color="#7c3aed" icon="💰" />
                <MetricCard label="Gastos" valor={formatCOP(resumenDiario.dinero_hoy.gastos_operativos)} color="#dc2626" icon="💸" />
                <MetricCard label="Utilidad del día" valor={formatCOP(resumenDiario.dinero_hoy.utilidad_dia)} color={resumenDiario.dinero_hoy.utilidad_dia >= 0 ? "#16a34a" : "#dc2626"} icon="📊" />
              </div>
            </div>
          )}

          {utilidad && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📈 Utilidad mensual — {meses[mes - 1]} {anio}</h2>
              <div style={styles.utilidadGrid}>
                <div style={styles.utilidadCard}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[
                      { nombre: "Ingresos", valor: utilidad.balance.ingresos },
                      { nombre: "Costos", valor: utilidad.balance.costos_mercancia },
                      { nombre: "Gastos", valor: utilidad.balance.gastos_operativos },
                      { nombre: "Ganancia", valor: utilidad.balance.ganancia_real },
                    ]} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val) => formatCOP(val)} />
                      <Bar dataKey="valor" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={styles.balanceBox}>
                  {[
                    { label: "Ingresos totales", val: utilidad.balance.ingresos, color: "#16a34a" },
                    { label: "Costos mercancía", val: utilidad.balance.costos_mercancia, color: "#f59e0b" },
                    { label: "Ganancia bruta", val: utilidad.balance.ganancia_bruta, color: "#0369a1" },
                    { label: "Gastos operativos", val: utilidad.balance.gastos_operativos, color: "#dc2626" },
                  ].map(item => (
                    <div key={item.label} style={styles.balanceRow}>
                      <span style={styles.balanceLabel}>{item.label}</span>
                      <span style={{ ...styles.balanceValor, color: item.color }}>{formatCOP(item.val)}</span>
                    </div>
                  ))}
                  <div style={styles.balanceTotalRow}>
                    <span style={styles.balanceTotalLabel}>GANANCIA REAL</span>
                    <span style={{ ...styles.balanceTotalValor, color: utilidad.balance.ganancia_real >= 0 ? "#16a34a" : "#dc2626" }}>
                      {formatCOP(utilidad.balance.ganancia_real)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sucursales.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🏪 Ventas por sucursal (hoy)</h2>
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead><tr>{["Sucursal", "Operaciones", "Total"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {sucursales.map((s, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                        <td style={styles.td}><span style={{ fontWeight: "600" }}>{s.nombre}</span></td>
                        <td style={styles.td}>{s.num_ventas}</td>
                        <td style={{ ...styles.td, fontWeight: "700", color: "#16a34a" }}>{formatCOP(s.total_ventas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

function MetricCard({ label, valor, color, icon }) {
  return (
    <div style={{ padding: "16px 20px", backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px 0" }}>{label}</p>
        <p style={{ fontSize: "18px", fontWeight: "700", color, margin: 0 }}>{valor}</p>
      </div>
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0 },
  btnPDF: { padding: "10px 20px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  selectorBox: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", backgroundColor: "#fff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e5e7eb" },
  selectorLabel: { fontSize: "13px", fontWeight: "600", color: "#6b7280" },
  select: { padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none" },
  section: { marginBottom: "28px" },
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "#14532d", margin: "0 0 16px 0" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" },
  utilidadGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  utilidadCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" },
  balanceBox: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center" },
  balanceRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f3f4f6" },
  balanceLabel: { fontSize: "14px", color: "#6b7280" },
  balanceValor: { fontSize: "16px", fontWeight: "700" },
  balanceTotalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", padding: "12px 16px", backgroundColor: "#f0fdf4", borderRadius: "8px" },
  balanceTotalLabel: { fontSize: "12px", fontWeight: "700", color: "#6b7280", letterSpacing: "1px" },
  balanceTotalValor: { fontSize: "22px", fontWeight: "700" },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" },
  empty: { padding: "60px", textAlign: "center", color: "#6b7280", fontSize: "15px" },
};