import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.body.style.backgroundColor = darkMode ? "#0f172a" : "#f3f4f6";
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const theme = {
    darkMode,
    toggleDarkMode,
    // Colores principales
    bg: darkMode ? "#0f172a" : "#f3f4f6",
    bgCard: darkMode ? "#1e293b" : "#ffffff",
    bgHover: darkMode ? "#334155" : "#f9fafb",
    border: darkMode ? "#334155" : "#e5e7eb",
    text: darkMode ? "#f1f5f9" : "#111827",
    textMuted: darkMode ? "#94a3b8" : "#6b7280",
    textLabel: darkMode ? "#cbd5e1" : "#374151",
    input: darkMode ? "#1e293b" : "#ffffff",
    inputBorder: darkMode ? "#475569" : "#d1d5db",
    sidebar: darkMode ? "linear-gradient(180deg, #052e16 0%, #021a0c 100%)" : "linear-gradient(180deg, #14532d 0%, #052e16 100%)",
    primary: "#16a34a",
    primaryDark: "#15803d",
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}