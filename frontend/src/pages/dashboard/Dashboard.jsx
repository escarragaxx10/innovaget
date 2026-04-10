import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import Layout from "../../components/Layout";
import api from "../../api/axios";

const COLORS = ["#16a34a", "#4ade80", "#86efac", "#bbf7d0"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");

  const cargarDatos = async () => {
    try {
      const [statsRes, resumenRes, sucRes] = await Promise.all([
        api.get("/dashboard/"),
        api.get("/reportes/resumen-diario"),
        api.get("/reportes/ventas-por-sucursal"),
      ]);
      setStats(statsRes.data);
      setResumen(resumenRes.data);
      setSucursales(sucRes.data.sucursales || []);
      setUltimaActualizacion(new Date().toLocaleTimeString("es-CO"));
    } catch (err) {
      console.error("Error cargando dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 60000); // refresca cada minuto
    return () => clearInterval(interval);
  }, []);

  // Datos para gráfica de medios de pago
  const datosPago = resumen ? [
    { nombre: "Efectivo", valor: resumen.dinero_hoy.efectivo },
    { nombre: "Transferencia", valor: resumen.dinero_hoy.transferencias },
    { nombre: "Otros", valor: resumen.dinero_hoy.otros || 0 },
  ].filter(d => d.valor > 0) : [];

  // Datos para gráfica de sucursales
  const datosSucursales = sucursales.map(s => ({
    nombre: s.nombre,
    ventas: s.total_ventas,
    operaciones: s.num_ventas,
  }));

  const formatCOP = (val) => `$${Number(val).toLocaleString("es-CO")}`;

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingBox}>
          <div style={styles.loadingSpinner}>⟳</div>
          <p style={styles.loadingText}>Cargando métricas...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>
            {stats?.nombre_empresa || "Mi Empresa"} · Actualizado: {ultimaActualizacion}
          </p>
        </div>
        <button onClick={cargarDatos} style={styles.refreshBtn}>⟳ Actualizar</button>
      </div>

      {/* TARJETAS MÉTRICAS */}
      <div style={styles.cardsGrid}>
        <MetricCard
          icon="💵"
          label="Ventas del día"
          value={formatCOP(stats?.ventas_diarias || 0)}
          color="#16a34a"
          bg="#f0fdf4"
        />
        <MetricCard
          icon="🧾"
          label="Operaciones"
          value={stats?.numero_operaciones || 0}
          color="#0369a1"
          bg="#f0f9ff"
        />
        <MetricCard
          icon="👥"
          label="Total clientes"
          value={stats?.total_clientes || 0}
          color="#7c3aed"
          bg="#faf5ff"
        />
        <MetricCard
          icon="⚠️"
          label="Alertas inventario"
          value={stats?.alertas_inventario || 0}
          color="#dc2626"
          bg="#fef2f2"
          alerta={stats?.alertas_inventario > 0}
        />
      </div>

      {/* RESUMEN FINANCIERO DEL DÍA */}
      {resumen && (
        <div style={styles.resumenBox}>
          <h3 style={styles.sectionTitle}>💰 Resumen financiero del día</h3>
          <div style={styles.resumenGrid}>
            <div style={styles.resumenItem}>
              <span style={styles.resumenLabel}>Total ventas</span>
              <span style={{ ...styles.resumenValue, color: "#16a34a" }}>{formatCOP(resumen.dinero_hoy.total_ventas)}</span>
            </div>
            <div style={styles.resumenItem}>
              <span style={styles.resumenLabel}>Gastos operativos</span>
              <span style={{ ...styles.resumenValue, color: "#dc2626" }}>{formatCOP(resumen.dinero_hoy.gastos_operativos)}</span>
            </div>
            <div style={{ ...styles.resumenItem, borderTop: "2px solid #e5e7eb", paddingTop: "12px" }}>
              <span style={{ ...styles.resumenLabel, fontWeight: "700" }}>Utilidad del día</span>
              <span style={{ ...styles.resumenValue, color: resumen.dinero_hoy.utilidad_dia >= 0 ? "#16a34a" : "#dc2626", fontSize: "22px" }}>
                {formatCOP(resumen.dinero_hoy.utilidad_dia)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GRÁFICAS */}
      <div style={styles.chartsGrid}>

        {/* Ventas por sucursal */}
        <div style={styles.chartCard}>
          <h3 style={styles.sectionTitle}>🏪 Ventas por sucursal (hoy)</h3>
          {datosSucursales.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datosSucursales} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip formatter={(val) => formatCOP(val)} />
                <Bar dataKey="ventas" fill="#16a34a" radius={[4, 4, 0, 0]} name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyChart}>Sin ventas registradas hoy</div>
          )}
        </div>

        {/* Medios de pago */}
        <div style={styles.chartCard}>
          <h3 style={styles.sectionTitle}>💳 Medios de pago (hoy)</h3>
          {datosPago.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={datosPago} dataKey="valor" nameKey="nombre" cx="50%" cy="50%" outerRadius={80} label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}>
                  {datosPago.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCOP(val)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyChart}>Sin ventas registradas hoy</div>
          )}
        </div>
      </div>

      {/* TABLA SUCURSALES */}
      {datosSucursales.length > 0 && (
        <div style={styles.tableCard}>
          <h3 style={styles.sectionTitle}>📋 Detalle por sucursal</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Sucursal", "Operaciones", "Total ventas"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosSucursales.map((s, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                  <td style={styles.td}>{s.nombre}</td>
                  <td style={styles.td}>{s.operaciones}</td>
                  <td style={{ ...styles.td, color: "#16a34a", fontWeight: "600" }}>{formatCOP(s.ventas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

function MetricCard({ icon, label, value, color, bg, alerta }) {
  return (
    <div style={{ ...styles.card, backgroundColor: bg, border: alerta ? `2px solid ${color}` : "1px solid #e5e7eb" }}>
      <div style={{ ...styles.cardIcon, backgroundColor: color + "20", color }}>{icon}</div>
      <div>
        <p style={styles.cardLabel}>{label}</p>
        <p style={{ ...styles.cardValue, color }}>{value}</p>
      </div>
    </div>
  );
}

const styles = {
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px" },
  loadingSpinner: { fontSize: "48px", animation: "spin 1s linear infinite", color: "#16a34a" },
  loadingText: { color: "#6b7280", fontSize: "16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0 },
  refreshBtn: { padding: "8px 16px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
  card: { padding: "20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px" },
  cardIcon: { width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 },
  cardLabel: { fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" },
  cardValue: { fontSize: "24px", fontWeight: "700", margin: 0 },
  resumenBox: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", border: "1px solid #e5e7eb" },
  resumenGrid: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" },
  resumenItem: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  resumenLabel: { fontSize: "14px", color: "#6b7280" },
  resumenValue: { fontSize: "18px", fontWeight: "700" },
  chartsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" },
  chartCard: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" },
  sectionTitle: { fontSize: "15px", fontWeight: "700", color: "#14532d", margin: "0 0 16px 0" },
  emptyChart: { height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "14px" },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 14px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb" },
  td: { padding: "12px 14px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" },
};