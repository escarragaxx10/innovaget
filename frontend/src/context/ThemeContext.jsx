import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#0d1117" : "#f3f4f6";
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const resetTheme = () => setDarkMode(false);

  const theme = {
    darkMode,
    toggleDarkMode,
    resetTheme,
    bg: darkMode ? "#0d1117" : "#f3f4f6",
    bgCard: darkMode ? "#161b22" : "#ffffff",
    bgHover: darkMode ? "#21262d" : "#f9fafb",
    border: darkMode ? "#30363d" : "#e5e7eb",
    text: darkMode ? "#e6edf3" : "#111827",
    textMuted: darkMode ? "#8b949e" : "#6b7280",
    textLabel: darkMode ? "#cdd9e5" : "#374151",
    input: darkMode ? "#161b22" : "#ffffff",
    inputBorder: darkMode ? "#3d444d" : "#d1d5db",
    sidebar: darkMode
      ? "linear-gradient(180deg, #0d1117 0%, #010409 100%)"
      : "linear-gradient(180deg, #14532d 0%, #052e16 100%)",
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