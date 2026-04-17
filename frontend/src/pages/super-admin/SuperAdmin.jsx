import { useState } from "react";
import api from "../../api/axios";

export default function SuperAdmin() {
  const [masterKey, setMasterKey] = useState("");
  const [conectado, setConectado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [stats, setStats] = useState({ total: 0, disponibles: 0, usados: 0, vencidos: 0 });
  const [tokens, setTokens] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  const [cantidad, setCantidad] = useState(5);
  const [diasVigencia, setDiasVigencia] = useState(30);
  const [nuevosCodigos, setNuevosCodigos] = useState([]);

  const [empresas, setEmpresas] = useState([]);
  const [statsEmpresas, setStatsEmpresas] = useState({ total: 0, activas: 0, inactivas: 0 });

  const [tab, setTab] = useState("tokens");
  const [nombreSas, setNombreSas] = useState("");
  const [nit, setNit] = useState("");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [codigoActivacion, setCodigoActivacion] = useState("");
  const [mailEmail, setMailEmail] = useState("");
  const [mailPassword, setMailPassword] = useState("");
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const showError = (msg) => { setError(msg); setTimeout(() => setError(""), 5000); };
  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 4000); };

  const cargarTokens = async (key = masterKey) => {
    try {
      const res = await api.get("/super-admin/ver-tokens", { headers: { "x-master-key": key } });
      setStats({
        total: res.data.total,
        disponibles: res.data.disponibles,
        usados: res.data.usados,
        vencidos: res.data.vencidos || 0,
      });
      setTokens(res.data.tokens || []);
      return true;
    } catch (err) {
      if (err.response?.status === 401) { showError("Master Key incorrecta"); return false; }
      showError("No se pudo conectar al servidor");
      return false;
    }
  };

  const cargarEmpresas = async (key = masterKey) => {
    try {
      const res = await api.get("/super-admin/ver-empresas", { headers: { "x-master-key": key } });
      setStatsEmpresas({ total: res.data.total, activas: res.data.activas, inactivas: res.data.inactivas });
      setEmpresas(res.data.empresas || []);
    } catch {
      showError("Error al cargar empresas");
    }
  };

  const handleConectar = async (e) => {
    e.preventDefault();
    if (!masterKey.trim()) return showError("Ingresa tu Master Key");
    setLoading(true);
    const ok = await cargarTokens(masterKey);
    if (ok) {
      await cargarEmpresas(masterKey);
      setConectado(true);
      showSuccess("Conectado correctamente");
    }
    setLoading(false);
  };

  const generarUno = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/super-admin/generar-token?dias_vigencia=${diasVigencia}`, {}, {
        headers: { "x-master-key": masterKey }
      });
      setNuevosCodigos([{ codigo: res.data.codigo_activacion, dias: diasVigencia }]);
      showSuccess("Licencia generada con éxito");
      await cargarTokens();
    } catch (err) {
      if (err.response?.status === 401) return showError("Master Key incorrecta");
      showError("Error al generar licencia");
    } finally { setLoading(false); }
  };

  const generarLote = async () => {
    setLoading(true);
    try {
      const res = await api.post(
        `/super-admin/generar-tokens-lote?cantidad=${cantidad}&dias_vigencia=${diasVigencia}`, {},
        { headers: { "x-master-key": masterKey } }
      );
      setNuevosCodigos((res.data.codigos || []).map(c => ({ codigo: c, dias: diasVigencia })));
      showSuccess(`${cantidad} licencias generadas`);
      await cargarTokens();
    } catch (err) {
      if (err.response?.status === 401) return showError("Master Key incorrecta");
      showError("Error al generar lote");
    } finally { setLoading(false); }
  };

  const toggleEmpresa = async (id, activa) => {
    try {
      await api.patch(`/super-admin/empresa/${id}/toggle`, {}, { headers: { "x-master-key": masterKey } });
      showSuccess(`Empresa ${activa ? "desactivada" : "activada"} correctamente`);
      await cargarEmpresas();
    } catch { showError("Error al cambiar estado de empresa"); }
  };

  const eliminarToken = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este token?")) return;
    try {
      await api.delete(`/super-admin/token/${id}`, { headers: { "x-master-key": masterKey } });
      showSuccess("Token eliminado");
      await cargarTokens();
    } catch (err) {
      showError(err.response?.data?.detail || "Error al eliminar token");
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/empresas/registro-maestro", {
        nombre_sas: nombreSas,
        nit,
        email_admin: emailAdmin,
        password_admin: passwordAdmin,
        codigo_activacion: codigoActivacion,
        mail_email: mailEmail || null,
        mail_password: mailPassword || null,
      });
      setRegistroExitoso(true);
      await cargarTokens();
      await cargarEmpresas();
    } catch (err) {
      showError(err.response?.data?.detail || "Error en el registro");
    } finally { setLoading(false); }
  };

  const resetRegistro = () => {
    setRegistroExitoso(false);
    setNombreSas(""); setNit(""); setEmailAdmin("");
    setPasswordAdmin(""); setCodigoActivacion("");
    setMailEmail(""); setMailPassword("");
  };

  const formatFecha = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const tokensFiltrados = tokens.filter((t) => {
    if (filtro === "disponibles") return !t.usado && !t.vencido;
    if (filtro === "usados") return t.usado;
    if (filtro === "vencidos") return t.vencido && !t.usado;
    return true;
  });

  const getBadgeVencimiento = (t) => {
    if (t.usado) return null;
    if (t.vencido) return { label: "Vencido", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    if (t.dias_restantes <= 5) return { label: `Vence en ${t.dias_restantes}d`, bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
    return { label: `${t.dias_restantes}d restantes`, bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
  };

  if (!conectado) {
    return (
      <div style={s.wrapper}>
        <div style={s.leftPanel}>
          <div style={s.brand}>
            <div style={s.logo}>SA</div>
            <h1 style={s.brandName}>Super Admin</h1>
            <p style={s.brandTagline}>Panel de control de licencias</p>
          </div>
          <div style={s.decorLines}>
            {[...Array(6)].map((_, i) => <div key={i} style={{ ...s.line, top: `${15 + i * 12}%` }} />)}
          </div>
          <div style={s.features}>
            {["Generación de licencias con vencimiento", "Registro y control de empresas", "Correo propio por empresa", "Acceso exclusivo del ingeniero"].map((f, i) => (
              <div key={i} style={s.featureItem}>
                <span style={s.featureDot}>✦</span>
                <span style={s.featureText}>{f}</span>
              </div>
            ))}
          </div>
          <p style={s.leftFooterText}>Área restringida — Solo personal autorizado</p>
        </div>
        <div style={s.rightPanel}>
          <div style={s.formCard}>
            <div style={s.formHeader}>
              <h2 style={s.formTitle}>Acceso seguro</h2>
              <p style={s.formSubtitle}>Ingresa tu Master Key para continuar</p>
            </div>
            <form onSubmit={handleConectar} style={s.form}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Master Key</label>
                <input type="password" value={masterKey} onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="••••••••••••••••" required style={s.input}
                  onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>
              {error && <div style={s.errorBox}><span>⚠</span><span>{error}</span></div>}
              {success && <div style={s.successMsgBox}><span>✓</span><span>{success}</span></div>}
              <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Verificando..." : "Acceder al panel"}
              </button>
            </form>
            <div style={s.formFooter}><p style={s.footerText}>© 2026 Innovagét · Panel Interno</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.dashWrapper}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={s.headerLogo}>SA</div>
          <div>
            <h2 style={s.headerTitle}>Panel Super Admin</h2>
            <p style={s.headerSub}>Innovagét ERP — Control de licencias</p>
          </div>
        </div>
        <button onClick={() => { setConectado(false); setMasterKey(""); }} style={s.logoutBtn}>
          Cerrar sesión
        </button>
      </div>

      <div style={s.dashContent}>
        {error && <div style={{ ...s.errorBox, marginBottom: "16px" }}><span>⚠</span><span>{error}</span></div>}
        {success && <div style={{ ...s.successMsgBox, marginBottom: "16px" }}><span>✓</span><span>{success}</span></div>}

        <p style={s.sectionLabel}>Tokens de licencia</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "8px" }}>
          {[
            { label: "Total tokens", value: stats.total, color: "#14532d" },
            { label: "Disponibles", value: stats.disponibles, color: "#16a34a" },
            { label: "Usados", value: stats.usados, color: "#6b7280" },
            { label: "Vencidos", value: stats.vencidos, color: "#dc2626" },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <p style={s.statLabel}>{st.label}</p>
              <p style={{ ...s.statValue, color: st.color }}>{st.value}</p>
            </div>
          ))}
        </div>

        <p style={s.sectionLabel}>Empresas registradas</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total empresas", value: statsEmpresas.total, color: "#14532d" },
            { label: "Activas", value: statsEmpresas.activas, color: "#16a34a" },
            { label: "Inactivas", value: statsEmpresas.inactivas, color: "#dc2626" },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <p style={s.statLabel}>{st.label}</p>
              <p style={{ ...s.statValue, color: st.color }}>{st.value}</p>
            </div>
          ))}
        </div>

        <div style={s.tabs}>
          {["tokens", "generar", "empresas", "registro"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}>
              {t === "tokens" ? "Ver tokens" : t === "generar" ? "Generar licencias" : t === "empresas" ? "Empresas" : "Registrar empresa"}
            </button>
          ))}
        </div>

        {tab === "tokens" && (
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={s.cardTitle}>Tokens registrados</h3>
              <button onClick={() => cargarTokens()} disabled={loading} style={s.secondaryBtn}>
                {loading ? "Cargando..." : "Actualizar"}
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {["todos", "disponibles", "usados", "vencidos"].map((f) => (
                <button key={f} onClick={() => setFiltro(f)}
                  style={{ ...s.filterBtn, ...(filtro === f ? s.filterActive : {}) }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {tokensFiltrados.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>No hay tokens en esta categoría.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {tokensFiltrados.map((t, i) => {
                  const badge = getBadgeVencimiento(t);
                  return (
                    <div key={i} style={s.tokenRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={s.tokenCode}>{t.codigo}</span>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>Creado {formatFecha(t.fecha_creacion)}</span>
                        {t.fecha_vencimiento && (
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Vence {formatFecha(t.fecha_vencimiento)}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {badge && (
                          <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px", background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        )}
                        <span style={{ ...s.badge, ...(t.usado ? s.badgeUsado : s.badgeDisp) }}>
                          {t.usado ? "Usado" : "Disponible"}
                        </span>
                        {!t.usado && (
                          <button onClick={() => eliminarToken(t.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "16px", padding: "0 4px" }}>✕</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "generar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Vigencia de las licencias</h3>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>Define cuántos días tendrá validez el código.</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={s.label}>Días: <strong>{diasVigencia}</strong></label>
                <input type="range" min="1" max="365" value={diasVigencia}
                  onChange={(e) => setDiasVigencia(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
                  {diasVigencia === 30 ? "1 mes" : diasVigencia === 90 ? "3 meses" : diasVigencia === 365 ? "1 año" : `${diasVigencia} días`}
                </span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Generar 1 licencia</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>Genera un código único para entregar a un cliente.</p>
                <button onClick={generarUno} disabled={loading} style={{ ...s.btn, marginTop: 0 }}>
                  {loading ? "Generando..." : "Generar licencia"}
                </button>
                {nuevosCodigos.length === 1 && (
                  <div style={s.codigoGenerado}>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#6b7280" }}>Código generado</p>
                    <p style={s.codigoValor}>{nuevosCodigos[0].codigo}</p>
                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#16a34a" }}>Válido por {nuevosCodigos[0].dias} días</p>
                  </div>
                )}
              </div>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Generar en lote</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>Genera varios códigos de una vez (máx. 50).</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <label style={s.label}>Cantidad: <strong>{cantidad}</strong></label>
                  <input type="range" min="1" max="50" value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))} style={{ flex: 1 }} />
                </div>
                <button onClick={generarLote} disabled={loading} style={{ ...s.btn, marginTop: 0 }}>
                  {loading ? "Generando..." : `Generar ${cantidad} licencias`}
                </button>
                {nuevosCodigos.length > 1 && (
                  <div style={{ marginTop: "16px" }}>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                      {nuevosCodigos.length} códigos generados (válidos {nuevosCodigos[0].dias} días):
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {nuevosCodigos.map((c, i) => <span key={i} style={s.codigoPill}>{c.codigo}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "empresas" && (
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={s.cardTitle}>Empresas registradas</h3>
              <button onClick={() => cargarEmpresas()} disabled={loading} style={s.secondaryBtn}>
                {loading ? "Cargando..." : "Actualizar"}
              </button>
            </div>
            {empresas.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>No hay empresas registradas.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {empresas.map((e) => (
                  <div key={e.id} style={{ ...s.tokenRow, flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#14532d" }}>
                          {e.nombre_sas.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#111827" }}>{e.nombre_sas}</p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>NIT: {e.nit}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ ...s.badge, ...(e.activa ? s.badgeDisp : s.badgeUsado) }}>
                          {e.activa ? "Activa" : "Inactiva"}
                        </span>
                        <button onClick={() => toggleEmpresa(e.id, e.activa)}
                          style={{ ...s.secondaryBtn, fontSize: "12px", padding: "4px 12px", color: e.activa ? "#dc2626" : "#16a34a", borderColor: e.activa ? "#fecaca" : "#bbf7d0" }}>
                          {e.activa ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "16px", paddingLeft: "48px" }}>
                      <span style={s.metaChip}>Usuarios: {e.num_usuarios}</span>
                      <span style={s.metaChip}>Sucursales: {e.num_sucursales}</span>
                      {e.fecha_registro && <span style={s.metaChip}>Registrada: {formatFecha(e.fecha_registro)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "registro" && (
          <div style={s.card}>
            {!registroExitoso ? (
              <>
                <h3 style={s.cardTitle}>Registrar nueva empresa</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
                  Completa los datos para activar una empresa en el sistema.
                </p>
                <form onSubmit={handleRegistro} style={s.form}>
                  <div style={s.codigoBox}>
                    <span style={{ fontSize: "24px" }}>🔑</span>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Código de activación</label>
                      <input type="text" value={codigoActivacion}
                        onChange={(e) => setCodigoActivacion(e.target.value.toUpperCase())}
                        placeholder="Ej: A1B2C3D4" required
                        style={{ ...s.input, letterSpacing: "3px", fontWeight: "700" }}
                        onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                    </div>
                  </div>

                  <div style={s.divider}><span style={s.dividerText}>Datos de la empresa</span></div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ ...s.fieldGroup, flex: 1 }}>
                      <label style={s.label}>Nombre empresa</label>
                      <input type="text" value={nombreSas} onChange={(e) => setNombreSas(e.target.value)}
                        placeholder="Mi Empresa S.A.S" required style={s.input}
                        onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                    </div>
                    <div style={{ ...s.fieldGroup, flex: 1 }}>
                      <label style={s.label}>NIT</label>
                      <input type="text" value={nit} onChange={(e) => setNit(e.target.value)}
                        placeholder="900123456-1" required style={s.input}
                        onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                    </div>
                  </div>

                  <div style={s.divider}><span style={s.dividerText}>Cuenta del administrador</span></div>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Correo del administrador</label>
                    <input type="email" value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)}
                      placeholder="admin@miempresa.com" required style={s.input}
                      onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  </div>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Contraseña del administrador</label>
                    <input type="password" value={passwordAdmin} onChange={(e) => setPasswordAdmin(e.target.value)}
                      placeholder="Mínimo 8 caracteres" required style={s.input}
                      onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  </div>

                  <div style={s.divider}><span style={s.dividerText}>Correo para envío de facturas</span></div>
                  <div style={{ padding: "12px 16px", backgroundColor: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "10px", marginBottom: "4px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#92400e" }}>
                      Este correo se usará para enviar facturas a los clientes. Debe ser un Gmail con App Password activado.
                      Si no lo configuras ahora, se usará el correo del sistema.
                    </p>
                  </div>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Gmail de la empresa (opcional)</label>
                    <input type="email" value={mailEmail} onChange={(e) => setMailEmail(e.target.value)}
                      placeholder="facturas@miempresa.com" style={s.input}
                      onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  </div>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>App Password de Gmail (opcional)</label>
                    <input type="password" value={mailPassword} onChange={(e) => setMailPassword(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx" style={s.input}
                      onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  </div>

                  <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Registrando..." : "Activar empresa"}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
                <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 12px 0" }}>
                  ¡Empresa registrada!
                </h2>
                <p style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.6", margin: "0 0 28px 0" }}>
                  <strong>{nombreSas}</strong> ha sido activada exitosamente.
                </p>
                <button onClick={resetRegistro} style={s.btn}>Registrar otra empresa</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  wrapper: { display: "flex", height: "100vh", fontFamily: "'Georgia', 'Times New Roman', serif", backgroundColor: "#f8f7f4" },
  leftPanel: { width: "42%", background: "linear-gradient(160deg, #14532d 0%, #166534 50%, #052e16 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 50px", position: "relative", overflow: "hidden" },
  brand: { zIndex: 2 },
  logo: { width: "64px", height: "64px", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "bold", color: "#fff", letterSpacing: "1px", marginBottom: "24px" },
  brandName: { fontSize: "36px", fontWeight: "700", color: "#ffffff", margin: "0 0 8px 0" },
  brandTagline: { fontSize: "13px", color: "rgba(255,255,255,0.55)", letterSpacing: "2px", textTransform: "uppercase", margin: 0 },
  decorLines: { position: "absolute", left: 0, top: 0, width: "100%", height: "100%", zIndex: 1 },
  line: { position: "absolute", left: "-10%", width: "120%", height: "1px", background: "rgba(255,255,255,0.1)", transform: "rotate(-8deg)" },
  features: { zIndex: 2, display: "flex", flexDirection: "column", gap: "14px" },
  featureItem: { display: "flex", alignItems: "center", gap: "12px" },
  featureDot: { color: "#4ade80", fontSize: "10px" },
  featureText: { fontSize: "14px", color: "rgba(255,255,255,0.75)" },
  leftFooterText: { fontSize: "13px", color: "rgba(255,255,255,0.35)", fontStyle: "italic", margin: 0, zIndex: 2 },
  rightPanel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", backgroundColor: "#f8f7f4", overflowY: "auto" },
  formCard: { width: "100%", maxWidth: "420px" },
  formHeader: { marginBottom: "32px" },
  formTitle: { fontSize: "28px", fontWeight: "700", color: "#14532d", margin: "0 0 8px 0" },
  formSubtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", letterSpacing: "0.5px", textTransform: "uppercase" },
  input: { padding: "11px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#ffffff", color: "#111827", transition: "border-color 0.2s", fontFamily: "inherit" },
  btn: { padding: "13px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.3px", fontFamily: "inherit", marginTop: "4px" },
  errorBox: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  successMsgBox: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#16a34a", fontSize: "13px" },
  formFooter: { marginTop: "28px", textAlign: "center" },
  footerText: { fontSize: "12px", color: "#9ca3af", margin: 0 },
  codigoBox: { display: "flex", alignItems: "flex-end", gap: "12px", padding: "16px", backgroundColor: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px" },
  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" },
  dividerText: { fontSize: "11px", fontWeight: "600", color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" },
  dashWrapper: { minHeight: "100vh", backgroundColor: "#f8f7f4", fontFamily: "'Georgia', 'Times New Roman', serif" },
  header: { background: "linear-gradient(160deg, #14532d 0%, #166534 100%)", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerLogo: { width: "44px", height: "44px", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", color: "#fff" },
  headerTitle: { fontSize: "20px", fontWeight: "700", color: "#fff", margin: 0 },
  headerSub: { fontSize: "12px", color: "rgba(255,255,255,0.55)", margin: 0, letterSpacing: "1px" },
  logoutBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" },
  dashContent: { padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" },
  sectionLabel: { fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0" },
  statCard: { backgroundColor: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "12px", padding: "16px 20px" },
  statLabel: { fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px 0" },
  statValue: { fontSize: "28px", fontWeight: "700", margin: 0 },
  tabs: { display: "flex", gap: "4px", marginBottom: "20px", backgroundColor: "#e5e7eb", padding: "4px", borderRadius: "10px", width: "fit-content" },
  tabBtn: { padding: "8px 20px", borderRadius: "8px", border: "none", background: "transparent", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#6b7280", fontFamily: "inherit" },
  tabActive: { backgroundColor: "#fff", color: "#14532d", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  card: { backgroundColor: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "12px", padding: "24px" },
  cardTitle: { fontSize: "16px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  secondaryBtn: { padding: "7px 16px", backgroundColor: "transparent", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#374151", cursor: "pointer", fontFamily: "inherit" },
  filterBtn: { padding: "5px 14px", border: "1.5px solid #e5e7eb", borderRadius: "20px", background: "transparent", fontSize: "12px", fontWeight: "600", cursor: "pointer", color: "#6b7280", fontFamily: "inherit" },
  filterActive: { backgroundColor: "#14532d", borderColor: "#14532d", color: "#fff" },
  tokenRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #f3f4f6" },
  tokenCode: { fontFamily: "monospace", fontSize: "15px", fontWeight: "700", letterSpacing: "3px", color: "#111827" },
  badge: { fontSize: "11px", fontWeight: "600", padding: "3px 12px", borderRadius: "20px" },
  badgeDisp: { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
  badgeUsado: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
  codigoGenerado: { marginTop: "16px", padding: "16px", backgroundColor: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px", textAlign: "center" },
  codigoValor: { margin: 0, fontSize: "24px", fontWeight: "700", letterSpacing: "4px", color: "#14532d", fontFamily: "monospace" },
  codigoPill: { padding: "4px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", fontSize: "12px", fontWeight: "700", letterSpacing: "2px", color: "#14532d", fontFamily: "monospace" },
  metaChip: { fontSize: "12px", color: "#6b7280" },
};