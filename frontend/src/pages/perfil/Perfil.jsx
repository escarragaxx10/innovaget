import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

const GuiaAppPassword = ({ onCerrar }) => (
  <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", maxWidth: "480px", width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#14532d" }}>¿Cómo obtener el App Password?</h2>
        <button onClick={onCerrar} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}>✕</button>
      </div>

      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", lineHeight: "1.6" }}>
        El <strong>App Password</strong> es una contraseña especial que Google genera para que aplicaciones externas puedan enviar correos desde tu Gmail de forma segura.
      </p>

      {[
        { num: "1", titulo: "Activa la verificación en dos pasos", desc: "Ve a myaccount.google.com → Seguridad → Verificación en dos pasos → Actívala si no está activa." },
        { num: "2", titulo: "Busca 'Contraseñas de aplicaciones'", desc: "En la misma página de Seguridad, busca la opción 'Contraseñas de aplicaciones'. Solo aparece si tienes la verificación en dos pasos activa." },
        { num: "3", titulo: "Crea una nueva contraseña", desc: "Escribe un nombre como 'Innovaget' en el campo y haz clic en Crear." },
        { num: "4", titulo: "Copia el código generado", desc: "Google te mostrará un código de 16 caracteres. Cópialo inmediatamente, solo se muestra una vez." },
        { num: "5", titulo: "Pégalo en el campo App Password", desc: "Pega el código aquí sin espacios. Ejemplo: abcdefghijklmnop" },
      ].map((paso) => (
        <div key={paso.num} style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#14532d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", flexShrink: 0 }}>
            {paso.num}
          </div>
          <div>
            <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#111827" }}>{paso.titulo}</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", lineHeight: "1.5" }}>{paso.desc}</p>
          </div>
        </div>
      ))}

      <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", marginTop: "8px" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#16a34a", lineHeight: "1.6" }}>
          <strong>Enlace directo:</strong> myaccount.google.com/apppasswords
        </p>
      </div>

      <button onClick={onCerrar} style={{ width: "100%", marginTop: "20px", padding: "12px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
        Entendido
      </button>
    </div>
  </div>
);

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formPerfil, setFormPerfil] = useState({ nombre: "", mail_email: "", mail_password: "" });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [exitoPerfil, setExitoPerfil] = useState("");
  const [errorPerfil, setErrorPerfil] = useState("");
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const [form, setForm] = useState({ password_actual: "", password_nueva: "", confirmar: "" });
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await api.get("/usuarios/perfil");
        setUser(res.data);
        setFormPerfil({
          nombre: res.data.nombre || "",
          mail_email: res.data.empresa?.mail_email || "",
          mail_password: "",
        });
      } catch (err) {
        console.error("Error cargando perfil", err);
      }
    };
    fetchPerfil();
  }, []);

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    setErrorPerfil(""); setExitoPerfil("");
    try {
      await api.put("/usuarios/actualizar-perfil", {
        nombre: formPerfil.nombre || null,
        mail_email: formPerfil.mail_email || null,
        mail_password: formPerfil.mail_password || null,
      });
      setExitoPerfil("Perfil actualizado correctamente");
      setEditando(false);
      const res = await api.get("/usuarios/perfil");
      setUser(res.data);
    } catch (err) {
      console.error("ERROR:", err.response?.data?.detail);
      const detalle = err.response?.data?.detail;
      let mensajeError = "Error al actualizar el perfil";
      if (Array.isArray(detalle)) {
        mensajeError = `Error en ${detalle[0].loc[1]}: ${detalle[0].msg}`;
      } else if (typeof detalle === "string") {
        mensajeError = detalle;
      }
      setErrorPerfil(mensajeError);
    } finally {
      setGuardandoPerfil(false);
    }
  };

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
  const iniciales = user?.nombre
    ? user.nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <Layout>
      {mostrarGuia && <GuiaAppPassword onCerrar={() => setMostrarGuia(false)} />}

      <div style={styles.header}>
        <h1 style={styles.title}>Mi Perfil</h1>
        <p style={styles.subtitle}>Gestiona tu información personal y configuración de cuenta</p>
      </div>

      <div style={styles.grid}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* INFO USUARIO */}
          <div style={styles.card}>
            <div style={styles.avatarSection}>
              <div style={{ ...styles.avatar, backgroundColor: bg, color }}>
                {iniciales}
              </div>
              <div>
                <p style={styles.nombreDisplay}>
                  {user?.nombre || user?.email?.split("@")[0] || "Usuario"}
                </p>
                <p style={styles.emailDisplay}>{user?.email || "Cargando..."}</p>
                <span style={{ ...styles.rolBadge, backgroundColor: bg, color }}>
                  {user?.role?.toUpperCase() || "—"}
                </span>
              </div>
            </div>

            <div style={styles.infoList}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Correo</span>
                <span style={styles.infoVal}>{user?.email || "—"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Empresa</span>
                <span style={styles.infoVal}>{user?.empresa?.nombre_sas || "—"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>NIT</span>
                <span style={styles.infoVal}>{user?.empresa?.nit || "—"}</span>
              </div>
              {user?.sucursal && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Sucursal</span>
                  <span style={styles.infoVal}>{user.sucursal.nombre} — {user.sucursal.ciudad}</span>
                </div>
              )}
              {user?.role === "admin" && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Correo facturas</span>
                  <span style={styles.infoVal}>
                    {user?.empresa?.mail_email
                      ? <span style={{ color: "#16a34a", fontWeight: "600" }}>{user.empresa.mail_email}</span>
                      : <span style={{ color: "#f59e0b", fontSize: "12px" }}>No configurado</span>
                    }
                  </span>
                </div>
              )}
            </div>

            <button onClick={() => setEditando(!editando)} style={styles.btnSecundario}>
              {editando ? "Cancelar edición" : "Editar perfil"}
            </button>
          </div>

          {/* EDITAR PERFIL */}
          {editando && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Editar información</h2>
              <form onSubmit={handleGuardarPerfil} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Nombre completo</label>
                  <input type="text" value={formPerfil.nombre}
                    onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })}
                    placeholder="Tu nombre completo" style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>

                {user?.role === "admin" && (
                  <>
                    <div style={styles.divider}><span style={styles.dividerText}>Correo para envío de facturas</span></div>

                    {/* AVISO CON PASOS */}
                    <div style={styles.infoBoxAmarillo}>
                      <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "600", color: "#92400e" }}>
                        Las facturas de tus clientes se enviarán desde este correo Gmail.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                        {[
                          "Entra a myaccount.google.com",
                          "Ve a Seguridad → Verificación en dos pasos (actívala)",
                          "Busca 'Contraseñas de aplicaciones'",
                          "Escribe 'Innovaget' y haz clic en Crear",
                          "Copia el código de 16 caracteres y pégalo abajo",
                        ].map((paso, i) => (
                          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#d97706", color: "#fff", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                              {i + 1}
                            </span>
                            <span style={{ fontSize: "12px", color: "#92400e", lineHeight: "1.5" }}>{paso}</span>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setMostrarGuia(true)}
                        style={{ background: "none", border: "1px solid #d97706", borderRadius: "6px", padding: "4px 12px", fontSize: "12px", color: "#92400e", cursor: "pointer", fontWeight: "600" }}>
                        Ver guía completa con imágenes →
                      </button>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Gmail de la empresa</label>
                      <input type="email" value={formPerfil.mail_email}
                        onChange={(e) => setFormPerfil({ ...formPerfil, mail_email: e.target.value })}
                        placeholder="tucorreo@gmail.com" style={styles.input}
                        onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>App Password de Gmail (16 caracteres)</label>
                      <input type="password" value={formPerfil.mail_password}
                        onChange={(e) => setFormPerfil({ ...formPerfil, mail_password: e.target.value })}
                        placeholder="Ej: abcdefghijklmnop" style={styles.input}
                        onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>Dejar vacío para no cambiar la contraseña actual</span>
                    </div>
                  </>
                )}

                {errorPerfil && <div style={styles.errorBox}>⚠ {errorPerfil}</div>}
                {exitoPerfil && <div style={styles.exitoBox}>✅ {exitoPerfil}</div>}

                <button type="submit" disabled={guardandoPerfil}
                  style={{ ...styles.btnPrimario, opacity: guardandoPerfil ? 0.7 : 1 }}>
                  {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
                </button>
              </form>
            </div>
          )}

          {exitoPerfil && !editando && (
            <div style={styles.exitoBox}>✅ {exitoPerfil}</div>
          )}
        </div>

        {/* CAMBIAR CONTRASEÑA */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Cambiar contraseña</h2>
          <p style={styles.cardDesc}>Por seguridad usa una contraseña de mínimo 8 caracteres.</p>

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

            {form.password_nueva && (
              <div style={styles.fortalezaBox}>
                <div style={styles.fortalezaBar}>
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{
                      ...styles.fortalezaSegmento,
                      backgroundColor: form.password_nueva.length >= n * 3
                        ? n <= 1 ? "#dc2626" : n <= 2 ? "#f59e0b" : "#16a34a"
                        : "#e5e7eb"
                    }} />
                  ))}
                </div>
                <span style={styles.fortalezaTexto}>
                  {form.password_nueva.length < 6 ? "Débil" : form.password_nueva.length < 10 ? "Media" : "Fuerte"}
                </span>
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirmar nueva contraseña</label>
              <input type="password" value={form.confirmar}
                onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                placeholder="Repite la contraseña" required style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
            </div>

            {form.confirmar && form.password_nueva !== form.confirmar && (
              <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>Las contraseñas no coinciden</p>
            )}
            {form.confirmar && form.password_nueva === form.confirmar && form.confirmar.length > 0 && (
              <p style={{ fontSize: "12px", color: "#16a34a", margin: 0 }}>Las contraseñas coinciden</p>
            )}

            {error && <div style={styles.errorBox}>⚠ {error}</div>}
            {exito && <div style={styles.exitoBox}>✅ {exito}</div>}

            <button type="submit" disabled={guardando}
              style={{ ...styles.btnPrimario, opacity: guardando ? 0.7 : 1 }}>
              {guardando ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  header: { marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" },
  card: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" },
  cardTitle: { fontSize: "18px", fontWeight: "700", color: "#14532d", margin: 0 },
  cardDesc: { fontSize: "14px", color: "#6b7280", margin: 0 },
  avatarSection: { display: "flex", alignItems: "center", gap: "16px" },
  avatar: { width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", flexShrink: 0 },
  nombreDisplay: { fontSize: "17px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" },
  emailDisplay: { fontSize: "13px", color: "#6b7280", margin: "0 0 8px 0" },
  rolBadge: { padding: "3px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
  infoList: { display: "flex", flexDirection: "column", gap: "12px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #f3f4f6" },
  infoLabel: { fontSize: "13px", color: "#6b7280" },
  infoVal: { fontSize: "13px", fontWeight: "600", color: "#111827", textAlign: "right", maxWidth: "60%" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  divider: { display: "flex", alignItems: "center", gap: "12px" },
  dividerText: { fontSize: "11px", fontWeight: "600", color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" },
  infoBoxAmarillo: { padding: "14px 16px", backgroundColor: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "10px" },
  fortalezaBox: { display: "flex", alignItems: "center", gap: "10px" },
  fortalezaBar: { display: "flex", gap: "4px", flex: 1 },
  fortalezaSegmento: { flex: 1, height: "6px", borderRadius: "3px", transition: "background-color 0.3s" },
  fortalezaTexto: { fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  exitoBox: { padding: "10px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#16a34a", fontSize: "13px" },
  btnPrimario: { padding: "13px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontWeight: "600" },
  btnSecundario: { padding: "10px 16px", backgroundColor: "transparent", border: "1.5px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#374151" },
};