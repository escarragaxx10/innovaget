import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Cajas() {
  const [sucursales, setSucursales] = useState([]);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [gastosCaja, setGastosCaja] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [montoInicial, setMontoInicial] = useState("");
  const [efectivoFisico, setEfectivoFisico] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  // Form gasto
  const [nuevoGasto, setNuevoGasto] = useState({ descripcion: "", monto: "" });
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [errorGasto, setErrorGasto] = useState("");

 const role = localStorage.getItem("role");
const sucursal_id_cajero = localStorage.getItem("sucursal_id");

// Al cargar sucursales:
const cargarSucursales = async () => {
  try {
    const res = await api.get("/sucursales/");
    // ✅ Si es cajero, solo mostrar su sucursal
    if (role === "cajero" && sucursal_id_cajero) {
      setSucursales(res.data.filter(s => s.id === parseInt(sucursal_id_cajero)));
      setSucursalSeleccionada(sucursal_id_cajero); // ✅ Seleccionar automáticamente
    } else {
      setSucursales(res.data);
    }
  } catch (err) { console.error(err); }
};
  const cargarCajaActiva = async (sucId) => {
    if (!sucId) return;
    try {
      const res = await api.get(`/cajas/activa/${sucId}`);
      setCajaActiva(res.data);
      cargarGastos(res.data.id);
    } catch {
      setCajaActiva(null);
      setGastosCaja([]);
    }
  };

  const cargarGastos = async (cajaId) => {
    try {
      const res = await api.get(`/gastos/caja/${cajaId}`);
      setGastosCaja(res.data);
    } catch { setGastosCaja([]); }
  };

  useEffect(() => { cargarSucursales(); }, []);

  useEffect(() => {
    if (sucursalSeleccionada) {
      setResultado(null);
      setError("");
      cargarCajaActiva(sucursalSeleccionada);
    }
  }, [sucursalSeleccionada]);

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/cajas/abrir", {
        sucursal_id: parseInt(sucursalSeleccionada),
        monto_inicial: parseFloat(montoInicial),
      });
      setCajaActiva(res.data);
      setGastosCaja([]);
      setMontoInicial("");
      setResultado({ tipo: "apertura", data: res.data });
    } catch (err) {
      setError(err.response?.data?.detail || "Error al abrir la caja");
    } finally { setLoading(false); }
  };

  const handleRegistrarGasto = async (e) => {
    e.preventDefault();
    setGuardandoGasto(true);
    setErrorGasto("");
    try {
      await api.post("/gastos/", {
        descripcion: nuevoGasto.descripcion,
        monto: parseFloat(nuevoGasto.monto),
        sucursal_id: parseInt(sucursalSeleccionada),
        caja_id: cajaActiva.id,
      });
      setNuevoGasto({ descripcion: "", monto: "" });
      cargarGastos(cajaActiva.id);
    } catch (err) {
      setErrorGasto(err.response?.data?.detail || "Error al registrar gasto");
    } finally { setGuardandoGasto(false); }
  };

  const handleEliminarGasto = async (id) => {
    try {
      await api.delete(`/gastos/${id}`);
      cargarGastos(cajaActiva.id);
    } catch (err) { alert(err.response?.data?.detail || "Error al eliminar"); }
  };

  const handleCerrarCaja = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/cajas/cerrar/${cajaActiva.id}?efectivo_fisico_entregado=${parseFloat(efectivoFisico)}`);
      setResultado({ tipo: "cierre", data: res.data.detalle_cierre });
      setCajaActiva(null);
      setGastosCaja([]);
      setEfectivoFisico("");
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cerrar la caja");
    } finally { setLoading(false); }
  };

  const formatCOP = (val) => `$${Number(val).toLocaleString("es-CO")}`;
  const formatFecha = (f) => new Date(f).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const totalGastos = gastosCaja.reduce((s, g) => s + g.monto, 0);

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Control de Caja</h1>
          <p style={styles.subtitle}>Apertura, gastos y cierre por sucursal</p>
        </div>
      </div>

      {/* SELECTOR SUCURSAL */}
      <div style={styles.selectorCard}>
        <label style={styles.label}>Selecciona la sucursal</label>
        <select value={sucursalSeleccionada} onChange={(e) => setSucursalSeleccionada(e.target.value)} style={styles.select}>
          <option value="">Seleccionar sucursal...</option>
          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>)}
        </select>
      </div>

      {sucursalSeleccionada && (
        <>
          {/* ESTADO */}
          <div style={{ ...styles.estadoBox, borderColor: cajaActiva ? "#16a34a" : "#dc2626", backgroundColor: cajaActiva ? "#f0fdf4" : "#fef2f2" }}>
            <div style={styles.estadoIcon}>{cajaActiva ? "🟢" : "🔴"}</div>
            <div>
              <p style={{ ...styles.estadoTitulo, color: cajaActiva ? "#16a34a" : "#dc2626" }}>
                {cajaActiva ? "Caja abierta" : "No hay caja abierta"}
              </p>
              {cajaActiva && (
                <p style={styles.estadoSub}>
                  Abierta desde: {formatFecha(cajaActiva.fecha_apertura)} · Monto inicial: {formatCOP(cajaActiva.monto_inicial)}
                </p>
              )}
            </div>
          </div>

          {/* FORMULARIO APERTURA */}
          {!cajaActiva && (
            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>🔓 Abrir caja</h2>
              <p style={styles.formDesc}>Ingresa el monto en efectivo con el que inicia la caja.</p>
              <form onSubmit={handleAbrirCaja} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Monto inicial en caja</label>
                  <div style={styles.inputMoney}>
                    <span style={styles.moneyPrefix}>$</span>
                    <input type="number" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)}
                      placeholder="0" required min="0" style={styles.inputMoneyField} />
                    <span style={styles.moneySuffix}>COP</span>
                  </div>
                </div>
                {error && <div style={styles.errorBox}>⚠ {error}</div>}
                <button type="submit" disabled={loading} style={{ ...styles.btnAbrir, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Abriendo..." : "🔓 Abrir caja"}
                </button>
              </form>
            </div>
          )}

          {/* CAJA ABIERTA - GASTOS Y CIERRE */}
          {cajaActiva && (
            <div style={styles.grid}>
              {/* PANEL GASTOS */}
              <div style={styles.gastosPanel}>
                <h2 style={styles.formTitle}>💸 Gastos del día</h2>
                <p style={styles.formDesc}>Registra los gastos que ocurrieron durante el turno.</p>

                {/* Formulario nuevo gasto */}
                <form onSubmit={handleRegistrarGasto} style={styles.gastoForm}>
                  <input type="text" value={nuevoGasto.descripcion}
                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
                    placeholder="Descripción del gasto (Ej: Papel de impresora)" required
                    style={styles.gastoInput}
                    onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  <div style={styles.gastoMontoRow}>
                    <div style={styles.inputMoney}>
                      <span style={styles.moneyPrefix}>$</span>
                      <input type="number" value={nuevoGasto.monto}
                        onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
                        placeholder="0" required min="0" style={{ ...styles.inputMoneyField, fontSize: "15px" }} />
                    </div>
                    <button type="submit" disabled={guardandoGasto} style={styles.btnAgregarGasto}>
                      {guardandoGasto ? "..." : "+ Agregar"}
                    </button>
                  </div>
                  {errorGasto && <div style={styles.errorBox}>⚠ {errorGasto}</div>}
                </form>

                {/* Lista de gastos */}
                <div style={styles.gastosList}>
                  {gastosCaja.length === 0 ? (
                    <div style={styles.gastosVacio}>No hay gastos registrados aún</div>
                  ) : (
                    <>
                      {gastosCaja.map((g) => (
                        <div key={g.id} style={styles.gastoItem}>
                          <div style={styles.gastoInfo}>
                            <span style={styles.gastoDesc}>{g.descripcion}</span>
                            <span style={styles.gastoFecha}>{formatFecha(g.fecha)}</span>
                          </div>
                          <div style={styles.gastoRight}>
                            <span style={styles.gastoMonto}>{formatCOP(g.monto)}</span>
                            <button onClick={() => handleEliminarGasto(g.id)} style={styles.btnEliminarGasto}>✕</button>
                          </div>
                        </div>
                      ))}
                      <div style={styles.gastoTotal}>
                        <span style={{ fontWeight: "700" }}>Total gastos</span>
                        <span style={{ fontWeight: "700", color: "#dc2626" }}>{formatCOP(totalGastos)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* PANEL CIERRE */}
              <div style={styles.cierrePanel}>
                <h2 style={styles.formTitle}>🔒 Cerrar caja</h2>
                <p style={styles.formDesc}>Cuenta el efectivo físico en caja e ingresa el total.</p>

                <div style={styles.resumenCaja}>
                  <div style={styles.resumenRow}>
                    <span style={styles.resumenLabel}>Monto inicial</span>
                    <span style={styles.resumenValor}>{formatCOP(cajaActiva.monto_inicial)}</span>
                  </div>
                  <div style={styles.resumenRow}>
                    <span style={styles.resumenLabel}>Gastos registrados</span>
                    <span style={{ ...styles.resumenValor, color: "#dc2626" }}>{formatCOP(totalGastos)}</span>
                  </div>
                  <div style={styles.resumenRow}>
                    <span style={styles.resumenLabel}>ID de caja</span>
                    <span style={styles.resumenValor}>#{cajaActiva.id}</span>
                  </div>
                </div>

                <form onSubmit={handleCerrarCaja} style={{ ...styles.form, marginTop: "20px" }}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Efectivo físico contado</label>
                    <div style={styles.inputMoney}>
                      <span style={styles.moneyPrefix}>$</span>
                      <input type="number" value={efectivoFisico} onChange={(e) => setEfectivoFisico(e.target.value)}
                        placeholder="0" required min="0" style={styles.inputMoneyField} />
                      <span style={styles.moneySuffix}>COP</span>
                    </div>
                    <p style={styles.inputHint}>Cuenta todo el dinero físico incluyendo el monto inicial.</p>
                  </div>
                  {error && <div style={styles.errorBox}>⚠ {error}</div>}
                  <button type="submit" disabled={loading} style={{ ...styles.btnCerrar, opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Cerrando..." : "🔒 Cerrar caja y hacer cuadre"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* RESULTADO CIERRE */}
          {resultado && resultado.tipo === "cierre" && (
            <div style={styles.resultadoCard}>
              <h2 style={styles.resultadoTitulo}>📊 Resultado del cuadre</h2>
              <div style={styles.resumenCaja}>
                <div style={styles.resumenRow}>
                  <span style={styles.resumenLabel}>Monto inicial</span>
                  <span style={styles.resumenValor}>{formatCOP(resultado.data.monto_inicial)}</span>
                </div>
                <div style={styles.resumenRow}>
                  <span style={styles.resumenLabel}>Ventas en efectivo</span>
                  <span style={{ ...styles.resumenValor, color: "#16a34a" }}>{formatCOP(resultado.data.ventas_efectivo)}</span>
                </div>
                <div style={styles.resumenRow}>
                  <span style={styles.resumenLabel}>Gastos de caja</span>
                  <span style={{ ...styles.resumenValor, color: "#dc2626" }}>{formatCOP(resultado.data.gastos_caja)}</span>
                </div>
                <div style={styles.resumenRow}>
                  <span style={styles.resumenLabel}>Total esperado</span>
                  <span style={{ ...styles.resumenValor, fontWeight: "700" }}>{formatCOP(resultado.data.total_esperado)}</span>
                </div>
                <div style={styles.resumenRow}>
                  <span style={styles.resumenLabel}>Real entregado</span>
                  <span style={{ ...styles.resumenValor, fontWeight: "700" }}>{formatCOP(resultado.data.real_entregado)}</span>
                </div>
              </div>
              <div style={{
                ...styles.diferenciaBadge,
                backgroundColor: resultado.data.diferencia === 0 ? "#f0fdf4" : resultado.data.diferencia > 0 ? "#fffbeb" : "#fef2f2",
                borderColor: resultado.data.diferencia === 0 ? "#16a34a" : resultado.data.diferencia > 0 ? "#f59e0b" : "#dc2626",
              }}>
                <span style={{ fontSize: "24px" }}>
                  {resultado.data.diferencia === 0 ? "✅" : resultado.data.diferencia > 0 ? "⚠️" : "❌"}
                </span>
                <span style={{ fontSize: "16px", fontWeight: "700" }}>{resultado.data.estado}</span>
              </div>
            </div>
          )}

          {/* RESULTADO APERTURA */}
          {resultado && resultado.tipo === "apertura" && (
            <div style={{ ...styles.resultadoCard, borderColor: "#16a34a", textAlign: "center" }}>
              <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>✅</p>
              <p style={{ fontWeight: "700", fontSize: "18px", color: "#16a34a", margin: "0 0 8px 0" }}>¡Caja abierta exitosamente!</p>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Ya puedes registrar ventas y gastos en esta sucursal.</p>
            </div>
          )}
        </>
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
  estadoBox: { borderRadius: "12px", border: "2px solid", padding: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" },
  estadoIcon: { fontSize: "32px" },
  estadoTitulo: { fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" },
  estadoSub: { fontSize: "13px", color: "#6b7280", margin: 0 },
  formCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "28px", marginBottom: "20px" },
  formTitle: { fontSize: "18px", fontWeight: "700", color: "#14532d", margin: "0 0 8px 0" },
  formDesc: { fontSize: "14px", color: "#6b7280", margin: "0 0 20px 0" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  inputMoney: { display: "flex", alignItems: "center", border: "1.5px solid #d1d5db", borderRadius: "8px", overflow: "hidden" },
  moneyPrefix: { padding: "11px 14px", backgroundColor: "#f9fafb", color: "#6b7280", fontSize: "16px", fontWeight: "700", borderRight: "1px solid #d1d5db" },
  inputMoneyField: { flex: 1, padding: "11px 14px", fontSize: "18px", fontWeight: "700", border: "none", outline: "none", color: "#111827" },
  moneySuffix: { padding: "11px 14px", backgroundColor: "#f9fafb", color: "#6b7280", fontSize: "13px", borderLeft: "1px solid #d1d5db" },
  inputHint: { fontSize: "12px", color: "#9ca3af", margin: 0 },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  btnAbrir: { padding: "14px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer" },
  btnCerrar: { padding: "14px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" },
  gastosPanel: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px" },
  cierrePanel: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px" },
  gastoForm: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  gastoInput: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none" },
  gastoMontoRow: { display: "flex", gap: "10px" },
  btnAgregarGasto: { padding: "10px 16px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap" },
  gastosList: { display: "flex", flexDirection: "column", gap: "8px" },
  gastosVacio: { padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "14px", backgroundColor: "#f9fafb", borderRadius: "8px" },
  gastoItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#fffbeb", borderRadius: "8px", border: "1px solid #fde68a" },
  gastoInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  gastoDesc: { fontSize: "14px", fontWeight: "600", color: "#111827" },
  gastoFecha: { fontSize: "11px", color: "#9ca3af" },
  gastoRight: { display: "flex", alignItems: "center", gap: "10px" },
  gastoMonto: { fontSize: "15px", fontWeight: "700", color: "#dc2626" },
  btnEliminarGasto: { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "14px" },
  gastoTotal: { display: "flex", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#fef2f2", borderRadius: "8px", marginTop: "4px" },
  resumenCaja: { backgroundColor: "#f9fafb", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" },
  resumenRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  resumenLabel: { fontSize: "14px", color: "#6b7280" },
  resumenValor: { fontSize: "15px", fontWeight: "600", color: "#111827" },
  resultadoCard: { backgroundColor: "#fff", borderRadius: "12px", border: "2px solid #e5e7eb", padding: "28px" },
  resultadoTitulo: { fontSize: "18px", fontWeight: "700", color: "#14532d", margin: "0 0 16px 0" },
  diferenciaBadge: { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "16px", borderRadius: "10px", border: "2px solid", marginTop: "16px" },
};