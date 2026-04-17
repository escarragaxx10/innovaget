import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (passwordNueva !== confirmar) {
      setError("Las contraseñas no coinciden"); return;
    }
    if (passwordNueva.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres"); return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        password_nueva: passwordNueva,
      });
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.leftPanel}>
        <div style={styles.brand}>
          <div style={styles.logo}>IG</div>
          <h1 style={styles.brandName}>
            <span style={{ color: "#fff" }}>Innova</span>
            <span style={{ color: "#4ade80" }}>get</span>
          </h1>
          <p style={styles.brandTagline}>Sistema ERP Empresarial</p>
        </div>
        <p style={styles.leftFooterText}>Gestión inteligente para tu empresa</p>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          {!token ? (
            <div style={styles.errorCard}>
              <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>❌</p>
              <h2 style={styles.formTitle}>Enlace inválido</h2>
              <p style={styles.formSubtitle}>Este enlace de recuperación no es válido.</p>
              <button onClick={() => navigate("/login")} style={styles.btn}>
                Volver al inicio de sesión
              </button>
            </div>
          ) : exito ? (
            <div style={styles.exitoCard}>
              <p style={{ fontSize: "56px", margin: "0 0 16px 0" }}>✅</p>
              <h2 style={styles.formTitle}>¡Contraseña actualizada!</h2>
              <p style={styles.formSubtitle}>Tu contraseña ha sido restablecida exitosamente.</p>
              <button onClick={() => navigate("/login")} style={styles.btn}>
                Iniciar sesión
              </button>
            </div>
          ) : (
            <>
              <div style={styles.formHeader}>
                <p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>🔐</p>
                <h2 style={styles.formTitle}>Nueva contraseña</h2>
                <p style={styles.formSubtitle}>Ingresa tu nueva contraseña para recuperar el acceso</p>
              </div>

              <form onSubmit={handleReset} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Nueva contraseña</label>
                  <input type="password" value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    placeholder="Mínimo 8 caracteres" required style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>

                {/* Indicador fortaleza */}
                {passwordNueva && (
                  <div style={styles.fortalezaBox}>
                    <div style={styles.fortalezaBar}>
                      {[1,2,3,4].map(n => (
                        <div key={n} style={{
                          ...styles.fortalezaSegmento,
                          backgroundColor: passwordNueva.length >= n * 3
                            ? n <= 1 ? "#dc2626" : n <= 2 ? "#f59e0b" : "#16a34a"
                            : "#e5e7eb"
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      {passwordNueva.length < 6 ? "Débil" : passwordNueva.length < 10 ? "Media" : "Fuerte"}
                    </span>
                  </div>
                )}

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Confirmar contraseña</label>
                  <input type="password" value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repite la contraseña" required style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>

                {confirmar && passwordNueva !== confirmar && (
                  <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>Las contraseñas no coinciden</p>
                )}
                {confirmar && passwordNueva === confirmar && confirmar.length > 0 && (
                  <p style={{ fontSize: "12px", color: "#16a34a", margin: 0 }}>✅ Las contraseñas coinciden</p>
                )}

                {error && <div style={styles.errorBox}>⚠ {error}</div>}

                <button type="submit" disabled={loading}
                  style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Actualizando..." : "Restablecer contraseña"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button onClick={() => navigate("/login")} style={styles.switchBtn}>
                  ← Volver al inicio de sesión
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: "28px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
              © 2026 Innovaget · Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", height: "100vh", fontFamily: "'Georgia', serif", backgroundColor: "#f8f7f4" },
  leftPanel: { width: "42%", background: "linear-gradient(160deg, #14532d 0%, #166534 50%, #052e16 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 50px", position: "relative", overflow: "hidden" },
  brand: { zIndex: 2 },
  logo: { width: "64px", height: "64px", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "bold", color: "#fff", marginBottom: "24px" },
  brandName: { fontSize: "36px", fontWeight: "700", margin: "0 0 8px 0" },
  brandTagline: { fontSize: "13px", color: "rgba(255,255,255,0.55)", letterSpacing: "2px", textTransform: "uppercase", margin: 0 },
  leftFooterText: { fontSize: "13px", color: "rgba(255,255,255,0.35)", fontStyle: "italic", margin: 0 },
  rightPanel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", backgroundColor: "#f8f7f4", overflowY: "auto" },
  formCard: { width: "100%", maxWidth: "420px" },
  formHeader: { marginBottom: "28px", textAlign: "center" },
  formTitle: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 8px 0" },
  formSubtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "11px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s", fontFamily: "inherit" },
  fortalezaBox: { display: "flex", alignItems: "center", gap: "10px" },
  fortalezaBar: { display: "flex", gap: "4px", flex: 1 },
  fortalezaSegmento: { flex: 1, height: "6px", borderRadius: "3px", transition: "background-color 0.3s" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  btn: { padding: "13px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  switchBtn: { background: "none", border: "none", color: "#16a34a", fontSize: "14px", fontWeight: "600", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" },
  exitoCard: { textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  errorCard: { textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
};