import { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [modo, setModo] = useState("login");
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [nombreSas, setNombreSas] = useState("");
  const [nit, setNit] = useState("");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [codigoActivacion, setCodigoActivacion] = useState("");
  const [mailEmail, setMailEmail] = useState("");
  const [mailPassword, setMailPassword] = useState("");
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [exitoRecuperar, setExitoRecuperar] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);
      const res = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("empresa_id", res.data.empresa_id);
      localStorage.setItem("sucursal_id", res.data.sucursal_id || "");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Credenciales incorrectas. Verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaso1 = (e) => {
    e.preventDefault();
    if (!codigoActivacion.trim()) return setError("Ingresa el código de activación");
    setError("");
    setPaso(2);
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
    } catch (err) {
      setError(err.response?.data?.detail || "Error en el registro. Verifica el código de activación.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setExitoRecuperar("");
    try {
      const res = await api.post("/auth/recuperar-password", { email: emailRecuperar });
      setExitoRecuperar(res.data.mensaje);
    } catch {
      setError("Error al enviar el correo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const volverLogin = () => {
    setModo("login"); setPaso(1); setError("");
    setCodigoActivacion(""); setNombreSas(""); setNit("");
    setEmailAdmin(""); setPasswordAdmin("");
    setMailEmail(""); setMailPassword("");
    setEmailRecuperar(""); setExitoRecuperar("");
  };

  return (
    <div style={styles.wrapper}>

      {/* MODAL GUÍA APP PASSWORD */}
      {mostrarGuia && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", maxWidth: "480px", width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#14532d" }}>¿Cómo obtener el App Password?</h2>
              <button onClick={() => setMostrarGuia(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", lineHeight: "1.6" }}>
              El <strong>App Password</strong> es una contraseña especial que Google genera para que aplicaciones externas puedan enviar correos desde tu Gmail de forma segura.
            </p>
            {[
              { titulo: "Activa la verificación en dos pasos", desc: "Ve a myaccount.google.com → Seguridad → Verificación en dos pasos → Actívala." },
              { titulo: "Busca 'Contraseñas de aplicaciones'", desc: "En la misma página de Seguridad, busca 'Contraseñas de aplicaciones'. Solo aparece si tienes la verificación activa." },
              { titulo: "Crea una nueva contraseña", desc: "Escribe 'Innovaget' en el campo y haz clic en Crear." },
              { titulo: "Copia el código generado", desc: "Google te mostrará un código de 16 caracteres. Cópialo inmediatamente, solo se muestra una vez." },
              { titulo: "Pégalo en el campo App Password", desc: "Pega el código sin espacios. Ejemplo: abcdefghijklmnop" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#14532d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#111827" }}>{p.titulo}</p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", lineHeight: "1.5" }}>{p.desc}</p>
                </div>
              </div>
            ))}
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", marginTop: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#16a34a" }}>
                <strong>Enlace directo:</strong> myaccount.google.com/apppasswords
              </p>
            </div>
            <button onClick={() => setMostrarGuia(false)} style={{ width: "100%", marginTop: "20px", padding: "12px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      <div style={styles.leftPanel}>
        <div style={styles.brand}>
          <div style={styles.logo}>IG</div>
          <h1 style={styles.brandName}>Innovaget</h1>
          <p style={styles.brandTagline}>Sistema ERP Empresarial</p>
        </div>
        <div style={styles.decorLines}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ ...styles.line, top: `${15 + i * 12}%` }} />
          ))}
        </div>
        <div style={styles.features}>
          {["Gestión de ventas en tiempo real", "Control de inventario inteligente", "Reportes financieros detallados", "Multi-sucursal y multi-usuario"].map((f, i) => (
            <div key={i} style={styles.featureItem}>
              <span style={styles.featureDot}>✦</span>
              <span style={styles.featureText}>{f}</span>
            </div>
          ))}
        </div>
        <p style={styles.leftFooterText}>Gestión inteligente para tu empresa</p>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          {/* LOGIN */}
          {modo === "login" && (
            <>
              <div style={styles.formHeader}>
                <h2 style={styles.formTitle}>Iniciar Sesión</h2>
                <p style={styles.formSubtitle}>Ingresa tus credenciales para continuar</p>
              </div>
              <form onSubmit={handleLogin} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Correo electrónico</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@empresa.com" required style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Contraseña</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>

                {/* ✅ ENLACE OLVIDÉ CONTRASEÑA */}
                <div style={{ textAlign: "right", marginTop: "-8px" }}>
                  <button type="button" onClick={() => { setModo("recuperar"); setError(""); }}
                    style={{ background: "none", border: "none", color: "#16a34a", fontSize: "13px", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {error && <div style={styles.errorBox}><span>⚠</span><span>{error}</span></div>}
                <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Verificando..." : "Ingresar al sistema"}
                </button>
              </form>
              <div style={styles.switchBox}>
                <span style={styles.switchText}>¿Tu empresa aún no está registrada?</span>
                <button onClick={() => { setModo("registro"); setError(""); setPaso(1); }} style={styles.switchBtn}>
                  Registrar empresa →
                </button>
              </div>
            </>
          )}

          {/* RECUPERAR CONTRASEÑA */}
          {modo === "recuperar" && (
            <>
              <div style={styles.formHeader}>
                <h2 style={styles.formTitle}>Recuperar contraseña</h2>
                <p style={styles.formSubtitle}>Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña</p>
              </div>
              <form onSubmit={handleRecuperar} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Correo electrónico</label>
                  <input type="email" value={emailRecuperar} onChange={(e) => setEmailRecuperar(e.target.value)}
                    placeholder="correo@empresa.com" required style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
                {error && <div style={styles.errorBox}><span>⚠</span><span>{error}</span></div>}
                {exitoRecuperar && (
                  <div style={{ padding: "11px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#16a34a", fontSize: "13px" }}>
                    ✅ {exitoRecuperar}
                  </div>
                )}
                <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>
              </form>
              <div style={styles.switchBox}>
                <button onClick={volverLogin} style={styles.switchBtn}>← Volver al inicio de sesión</button>
              </div>
            </>
          )}

          {/* PASO 1 */}
          {modo === "registro" && !registroExitoso && paso === 1 && (
            <>
              <div style={styles.formHeader}>
                <div style={styles.pasoIndicador}>
                  <div style={styles.pasoBadgeActivo}>1</div>
                  <div style={styles.pasoLinea} />
                  <div style={styles.pasoBadgeInactivo}>2</div>
                </div>
                <h2 style={styles.formTitle}>Código de activación</h2>
                <p style={styles.formSubtitle}>Ingresa el código que te proporcionó Innovaget para activar tu empresa</p>
              </div>
              <form onSubmit={handlePaso1} style={styles.form}>
                <div style={styles.codigoBoxGrande}>
                  <span style={{ fontSize: "40px", marginBottom: "12px" }}>🔑</span>
                  <label style={{ ...styles.label, textAlign: "center", marginBottom: "8px" }}>Código de activación</label>
                  <input type="text" value={codigoActivacion}
                    onChange={(e) => setCodigoActivacion(e.target.value.toUpperCase())}
                    placeholder="A1B2C3D4" required maxLength={8}
                    style={{ ...styles.input, letterSpacing: "6px", fontWeight: "700", fontSize: "22px", textAlign: "center", padding: "14px" }}
                    onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: "8px 0 0 0" }}>El código tiene 8 caracteres</p>
                </div>
                {error && <div style={styles.errorBox}><span>⚠</span><span>{error}</span></div>}
                <button type="submit" style={styles.btn}>Continuar →</button>
              </form>
              <div style={styles.switchBox}>
                <button onClick={volverLogin} style={styles.switchBtn}>← Volver al inicio de sesión</button>
              </div>
            </>
          )}

          {/* PASO 2 */}
          {modo === "registro" && !registroExitoso && paso === 2 && (
            <>
              <div style={styles.formHeader}>
                <div style={styles.pasoIndicador}>
                  <div style={{ ...styles.pasoBadgeActivo, background: "#16a34a" }}>✓</div>
                  <div style={{ ...styles.pasoLinea, background: "#16a34a" }} />
                  <div style={styles.pasoBadgeActivo}>2</div>
                </div>
                <h2 style={styles.formTitle}>Datos de la empresa</h2>
                <p style={styles.formSubtitle}>Completa la información para activar tu cuenta</p>
              </div>
              <form onSubmit={handleRegistro} style={styles.form}>
                <div style={styles.divider}><span style={styles.dividerText}>Datos de la empresa</span></div>
                <div style={styles.row}>
                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.label}>Nombre empresa</label>
                    <input type="text" value={nombreSas} onChange={(e) => setNombreSas(e.target.value)}
                      placeholder="Mi Empresa S.A.S" required style={styles.input}
                      onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  </div>
                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.label}>NIT</label>
                    <input type="text" value={nit} onChange={(e) => setNit(e.target.value)}
                      placeholder="900123456-1" required style={styles.input}
                      onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  </div>
                </div>
                <div style={styles.divider}><span style={styles.dividerText}>Cuenta del administrador</span></div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Correo del administrador</label>
                  <input type="email" value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)}
                    placeholder="admin@miempresa.com" required style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Contraseña del administrador</label>
                  <input type="password" value={passwordAdmin} onChange={(e) => setPasswordAdmin(e.target.value)}
                    placeholder="Mínimo 8 caracteres" required style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
                <div style={styles.divider}><span style={styles.dividerText}>Correo para facturas (opcional)</span></div>
                <div style={styles.infoBox}>
                  <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "600", color: "#92400e" }}>
                    Las facturas de tus clientes se enviarán desde este Gmail.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                    {[
                      "Ve a myaccount.google.com → Seguridad",
                      "Activa la Verificación en dos pasos",
                      "Busca 'Contraseñas de aplicaciones'",
                      "Escribe 'Innovaget' y haz clic en Crear",
                      "Copia el código de 16 caracteres y pégalo abajo",
                    ].map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <span style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#d97706", color: "#fff", fontSize: "9px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: "12px", color: "#92400e", lineHeight: "1.5" }}>{p}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setMostrarGuia(true)}
                    style={{ background: "none", border: "1px solid #d97706", borderRadius: "6px", padding: "4px 12px", fontSize: "12px", color: "#92400e", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>
                    Ver guía completa →
                  </button>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Gmail de la empresa</label>
                  <input type="email" value={mailEmail} onChange={(e) => setMailEmail(e.target.value)}
                    placeholder="tucorreo@gmail.com" style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>App Password de Gmail (16 caracteres)</label>
                  <input type="password" value={mailPassword} onChange={(e) => setMailPassword(e.target.value)}
                    placeholder="Ej: abcdefghijklmnop" style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  <span style={{ fontSize: "11px", color: "#9ca3af" }}>Si no lo tienes ahora, puedes configurarlo después desde tu perfil</span>
                </div>
                {error && <div style={styles.errorBox}><span>⚠</span><span>{error}</span></div>}
                <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Registrando..." : "Activar empresa"}
                </button>
              </form>
              <div style={styles.switchBox}>
                <button onClick={() => { setPaso(1); setError(""); }} style={styles.switchBtn}>← Volver al paso anterior</button>
              </div>
            </>
          )}

          {/* ÉXITO */}
          {registroExitoso && (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✅</div>
              <h2 style={styles.successTitle}>¡Empresa registrada!</h2>
              <p style={styles.successText}>
                Tu empresa <strong>{nombreSas}</strong> ha sido activada exitosamente.
                Ya puedes iniciar sesión con tu cuenta de administrador.
              </p>
              {!mailEmail && (
                <div style={{ ...styles.infoBox, marginBottom: "20px", textAlign: "left" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#92400e" }}>
                    Recuerda configurar el correo para facturas desde <strong>Mi Perfil → Editar perfil</strong> cuando inicies sesión.
                  </p>
                </div>
              )}
              <button onClick={() => { setModo("login"); setRegistroExitoso(false); setPaso(1); setError(""); }} style={styles.btn}>
                Ir al inicio de sesión
              </button>
            </div>
          )}

          <div style={styles.formFooter}>
            <p style={styles.footerText}>© 2026 Innovaget · Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
  formCard: { width: "100%", maxWidth: "460px" },
  formHeader: { marginBottom: "28px" },
  formTitle: { fontSize: "28px", fontWeight: "700", color: "#14532d", margin: "0 0 8px 0" },
  formSubtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  pasoIndicador: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" },
  pasoBadgeActivo: { width: "28px", height: "28px", borderRadius: "50%", background: "#14532d", color: "#fff", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },
  pasoBadgeInactivo: { width: "28px", height: "28px", borderRadius: "50%", background: "#e5e7eb", color: "#9ca3af", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },
  pasoLinea: { flex: 1, height: "2px", background: "#e5e7eb", borderRadius: "2px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "flex", gap: "12px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", letterSpacing: "0.5px", textTransform: "uppercase" },
  input: { padding: "11px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#ffffff", color: "#111827", transition: "border-color 0.2s", fontFamily: "inherit" },
  codigoBoxGrande: { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px", backgroundColor: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "12px" },
  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" },
  dividerText: { fontSize: "11px", fontWeight: "600", color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" },
  infoBox: { padding: "14px 16px", backgroundColor: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "10px" },
  errorBox: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  btn: { padding: "13px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.3px", fontFamily: "inherit", marginTop: "4px" },
  switchBox: { marginTop: "24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  switchText: { fontSize: "13px", color: "#6b7280" },
  switchBtn: { background: "none", border: "none", color: "#16a34a", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" },
  successBox: { textAlign: "center", padding: "20px 0" },
  successIcon: { fontSize: "56px", marginBottom: "16px" },
  successTitle: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 12px 0" },
  successText: { fontSize: "15px", color: "#4b5563", lineHeight: "1.6", margin: "0 0 16px 0" },
  formFooter: { marginTop: "28px", textAlign: "center" },
  footerText: { fontSize: "12px", color: "#9ca3af", margin: 0 },
};