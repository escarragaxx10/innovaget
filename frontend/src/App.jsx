import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Productos from "./pages/productos/Productos";
import PuntoVenta from "./pages/caja/PuntoVenta";
import Empleados from "./pages/empleados/Empleados";
import Sucursales from "./pages/sucursales/Sucursales";
import Inventario from "./pages/inventario/Inventario";
import Clientes from "./pages/clientes/Clientes";
import Proveedores from "./pages/proveedores/Proveedores";
import Ventas from "./pages/ventas/Ventas";
import Reportes from "./pages/reportes/Reportes";
import Cajas from "./pages/cajas/Cajas";
import Categorias from "./pages/categorias/Categorias";
import Compras from "./pages/compras/Compras";
import HistorialCajas from "./pages/cajas/HistorialCajas";
import Perfil from "./pages/perfil/Perfil";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/productos" element={<PrivateRoute><Productos /></PrivateRoute>} />
        <Route path="/ventas" element={<PrivateRoute roles={["admin"]}><Ventas /></PrivateRoute>} />
        <Route path="/cajas" element={<PrivateRoute roles={["admin", "cajero"]}><Cajas /></PrivateRoute>} />
        <Route path="/caja" element={<PrivateRoute roles={["admin", "cajero"]}><PuntoVenta /></PrivateRoute>} />
        <Route path="/inventario" element={<PrivateRoute><Inventario /></PrivateRoute>} />
        <Route path="/caja" element={<PrivateRoute roles={["admin", "cajero"]}><PuntoVenta /></PrivateRoute>} />
        <Route path="/proveedores" element={<PrivateRoute roles={["admin"]}><Proveedores /></PrivateRoute>} />
        <Route path="/sucursales" element={<PrivateRoute roles={["admin"]}><Sucursales /></PrivateRoute>} />
        <Route path="/empleados" element={<PrivateRoute roles={["admin"]}><Empleados /></PrivateRoute>} />
        <Route path="/reportes" element={<PrivateRoute roles={["admin"]}><Reportes /></PrivateRoute>} />
        <Route path="/categorias" element={<PrivateRoute roles={["admin"]}><Categorias /></PrivateRoute>} />
        <Route path="/compras" element={<PrivateRoute roles={["admin"]}><Compras /></PrivateRoute>} />
        <Route path="/historial-cajas" element={<PrivateRoute roles={["admin"]}><HistorialCajas /></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;