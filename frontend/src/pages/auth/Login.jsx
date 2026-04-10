import { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [modo, setModo] = useState("login");
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
  const [registroExitoso, setRegistroExitoso] = useState(false);

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
      localStorage.setItem("sucursal_id", res.data.sucursal_id || ""); // ✅ AGREGAR
      navigate("/dashboard");
    } catch {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
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
      });
      setRegistroExitoso(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Error en el registro. Verifica el código de activación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
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
                {error && <div style={styles.errorBox}><span>⚠</span><span>{error}</span></div>}
                <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Verificando..." : "Ingresar al sistema"}
                </button>
              </form>
              <div style={styles.switchBox}>
                <span style={styles.switchText}>¿Tu empresa aún no está registrada?</span>
                <button onClick={() => { setModo("registro"); setError(""); }} style={styles.switchBtn}>
                  Registrar empresa →
                </button>
              </div>
            </>
          )}

          {modo === "registro" && !registroExitoso && (
            <>
              <div style={styles.formHeader}>
                <h2 style={styles.formTitle}>Registro de Empresa</h2>
                <p style={styles.formSubtitle}>Completa los datos para activar tu cuenta</p>
              </div>
              <form onSubmit={handleRegistro} style={styles.form}>
                <div style={styles.codigoBox}>
                  <span style={styles.codigoIcon}>🔑</span>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Código de activación</label>
                    <input type="text" value={codigoActivacion}
                      onChange={(e) => setCodigoActivacion(e.target.value.toUpperCase())}
                      placeholder="Ej: A1B2C3D4" required
                      style={{ ...styles.input, letterSpacing: "3px", fontWeight: "700" }}
                      onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                  </div>
                </div>
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
                {error && <div style={styles.errorBox}><span>⚠</span><span>{error}</span></div>}
                <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Registrando..." : "Activar empresa"}
                </button>
              </form>
              <div style={styles.switchBox}>
                <button onClick={() => { setModo("login"); setError(""); }} style={styles.switchBtn}>
                  ← Volver al inicio de sesión
                </button>
              </div>
            </>
          )}

          {registroExitoso && (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✅</div>
              <h2 style={styles.successTitle}>¡Empresa registrada!</h2>
              <p style={styles.successText}>
                Tu empresa <strong>{nombreSas}</strong> ha sido activada exitosamente.
                Ya puedes iniciar sesión con tu cuenta de administrador.
              </p>
              <button onClick={() => { setModo("login"); setRegistroExitoso(false); setError(""); }} style={styles.btn}>
                Ir al inicio de sesión
              </button>
            </div>
          )}

          <div style={styles.formFooter}>
            <p style={styles.footerText}>© 2026 Innovagét · Todos los derechos reservados</p>
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
  brandName: { fontSize: "36px", fontWeight: "700", color: "#ffffff" , margin: "0 0 8px 0" },
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
  formHeader: { marginBottom: "32px" },
  formTitle: { fontSize: "28px", fontWeight: "700", color: "#14532d", margin: "0 0 8px 0" },
  formSubtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "flex", gap: "12px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", letterSpacing: "0.5px", textTransform: "uppercase" },
  input: { padding: "11px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#ffffff", color: "#111827", transition: "border-color 0.2s", fontFamily: "inherit" },
  codigoBox: { display: "flex", alignItems: "flex-end", gap: "12px", padding: "16px", backgroundColor: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px" },
  codigoIcon: { fontSize: "24px", marginBottom: "2px" },
  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" },
  dividerText: { fontSize: "11px", fontWeight: "600", color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" },
  errorBox: { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  btn: { padding: "13px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.3px", fontFamily: "inherit", marginTop: "4px" },
  switchBox: { marginTop: "24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  switchText: { fontSize: "13px", color: "#6b7280" },
  switchBtn: { background: "none", border: "none", color: "#16a34a", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" },
  successBox: { textAlign: "center", padding: "20px 0" },
  successIcon: { fontSize: "56px", marginBottom: "16px" },
  successTitle: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 12px 0" },
  successText: { fontSize: "15px", color: "#4b5563", lineHeight: "1.6", margin: "0 0 28px 0" },
  formFooter: { marginTop: "28px", textAlign: "center" },
  footerText: { fontSize: "12px", color: "#9ca3af", margin: 0 },
};