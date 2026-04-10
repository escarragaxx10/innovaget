import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";


export default function Perfil() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await api.get("/usuarios/perfil");
        setUser(res.data);
      } catch (err) {
        console.error("Error cargando perfil", err);
      }
    };

    fetchPerfil();
  }, []);

  const [form, setForm] = useState({ password_actual: "", password_nueva: "", confirmar: "" });
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setError(""); setExito("");

    if (form.password_nueva !== form.confirmar) {
      setError("Las contraseñas nuevas no coinciden"); return;
    }
    if (form.password_nueva.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres"); return;
    }

    setGuardando(true);
    try {
      await api.put("/usuarios/cambiar-password", {
        password_actual: form.password_actual,
        password_nueva: form.password_nueva,
      });
      setExito("¡Contraseña actualizada exitosamente!");
      setForm({ password_actual: "", password_nueva: "", confirmar: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cambiar la contraseña");
    } finally { setGuardando(false); }
  };

  const getRolColor = (role) => {
    if (role === "admin") return { color: "#16a34a", bg: "#f0fdf4" };
    if (role === "gerente") return { color: "#7c3aed", bg: "#faf5ff" };
    return { color: "#0369a1", bg: "#f0f9ff" };
  };

  const { color, bg } = getRolColor(user?.role);

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Mi Perfil</h1>
      </div>

      <div style={styles.grid}>
        {/* INFO USUARIO */}
        <div style={styles.infoCard}>
          <div style={styles.avatarBox}>
            <div style={{ ...styles.avatar, backgroundColor: bg, color }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={styles.emailText}>{user?.email || "Cargando..."}</p>
              <span style={{ ...styles.rolBadge, backgroundColor: bg, color }}>
                {user?.role?.toUpperCase() || "Cargando..."}
              </span>
            </div>
          </div>

          <div style={styles.infoList}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>📧 Correo</span>
              <span style={styles.infoVal}>{user?.email || "Cargando..."}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>👔 Rol</span>
              <span style={{ ...styles.rolBadge, backgroundColor: bg, color }}>
                {user?.role || "Cargando..."}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>🏢 Empresa</span>
              <span style={styles.infoVal}>
                {user?.empresa?.nombre_sas || "Cargando..."}
              </span>
            </div>
          </div>
        </div>

        {/* CAMBIAR CONTRASEÑA */}
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>🔐 Cambiar contraseña</h2>
          <p style={styles.formDesc}>Por seguridad usa una contraseña de mínimo 8 caracteres.</p>

          <form onSubmit={handleCambiarPassword} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Contraseña actual</label>
              <input type="password" value={form.password_actual}
                onChange={(e) => setForm({ ...form, password_actual: e.target.value })}
                placeholder="••••••••" required style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nueva contraseña</label>
              <input type="password" value={form.password_nueva}
                onChange={(e) => setForm({ ...form, password_nueva: e.target.value })}
                placeholder="Mínimo 8 caracteres" required style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirmar nueva contraseña</label>
              <input type="password" value={form.confirmar}
                onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                placeholder="Repite la contraseña" required style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
            </div>

            {form.password_nueva && (
              <div style={styles.fortalezaBox}>
                <div style={styles.fortalezaBar}>
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{
                      ...styles.fortalezaSegmento,
                      backgroundColor: form.password_nueva.length >= n * 3
                        ? n <= 1 ? "#dc2626" : n <= 2 ? "#f59e0b" : n <= 3 ? "#16a34a" : "#16a34a"
                        : "#e5e7eb"
                    }} />
                  ))}
                </div>
                <span style={styles.fortalezaTexto}>
                  {form.password_nueva.length < 6 ? "Débil" : form.password_nueva.length < 10 ? "Media" : "Fuerte"}
                </span>
              </div>
            )}

            {error && <div style={styles.errorBox}>⚠ {error}</div>}
            {exito && <div style={styles.exitoBox}>✅ {exito}</div>}

            <button type="submit" disabled={guardando} style={{ ...styles.btnPrimario, opacity: guardando ? 0.7 : 1 }}>
              {guardando ? "Actualizando..." : "🔐 Actualizar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  header: { marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  infoCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "28px", display: "flex", flexDirection: "column", gap: "24px" },
  avatarBox: { display: "flex", alignItems: "center", gap: "16px" },
  avatar: { width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "700", flexShrink: 0 },
  emailText: { fontSize: "16px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" },
  rolBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  infoList: { display: "flex", flexDirection: "column", gap: "14px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #f3f4f6" },
  infoLabel: { fontSize: "14px", color: "#6b7280" },
  infoVal: { fontSize: "14px", fontWeight: "600", color: "#111827" },
  formCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "28px" },
  formTitle: { fontSize: "18px", fontWeight: "700", color: "#14532d", margin: "0 0 8px 0" },
  formDesc: { fontSize: "14px", color: "#6b7280", margin: "0 0 24px 0" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  fortalezaBox: { display: "flex", alignItems: "center", gap: "10px" },
  fortalezaBar: { display: "flex", gap: "4px", flex: 1 },
  fortalezaSegmento: { flex: 1, height: "6px", borderRadius: "3px", transition: "background-color 0.3s" },
  fortalezaTexto: { fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  exitoBox: { padding: "10px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#16a34a", fontSize: "13px" },
  btnPrimario: { padding: "13px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontWeight: "600" },
};