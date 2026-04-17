from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- 1. USUARIOS Y SEGURIDAD ---

class UserBase(BaseModel):
    email: EmailStr
    role: str
    nombre: Optional[str] = None
    empresa_id: Optional[int] = None
    sucursal_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    empresa_id: Optional[int] = None
    sucursal_id: Optional[int] = None
    nombre: Optional[str] = None
    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str
    role: str
    sucursal_id: int
    nombre: Optional[str] = None

class EmpresaYAdminCreate(BaseModel):
    nombre_sas: str
    nit: str
    email_admin: EmailStr
    password_admin: str
    codigo_activacion: str
    mail_email: Optional[EmailStr] = None       # ✅ Correo para enviar facturas
    mail_password: Optional[str] = None         # ✅ App Password de Gmail

class RegistroExitoso(BaseModel):
    mensaje: str
    empresa_id: int
    admin_id: int

# --- 2. EMPRESAS ---

class EmpresaOut(BaseModel):
    id: int
    nombre_sas: str
    nit: str
    activa: bool
    class Config:
        from_attributes = True

# --- 3. SUCURSALES ---

class SucursalCreate(BaseModel):
    nombre: str
    direccion: str
    ciudad: str
    empresa_id: Optional[int] = None 

class SucursalOut(SucursalCreate):
    id: int
    class Config:
        from_attributes = True

# --- 4. INVENTARIO Y CATEGORÍAS ---

class CategoriaCreate(BaseModel):
    nombre: str

class CategoriaOut(CategoriaCreate):
    id: int
    class Config:
        from_attributes = True

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_venta: float
    precio_compra: float
    stock: int
    categoria_id: int
    sucursal_id: int
    empresa_id: int

class ProductoOut(ProductoCreate):
    id: int
    class Config:
        from_attributes = True

class ProductoStockCritico(BaseModel):
    id: int
    nombre: str
    stock: int
    sucursal_nombre: str
    class Config:
        from_attributes = True

# --- 5. COMPRAS (INGRESOS) ---

class IngresoMercancia(BaseModel):
    producto_id: int
    cantidad: int
    costo_unitario: float
    proveedor_id: Optional[int] = None
    margen_deseado: Optional[float] = None      # ✅ Ej: 30 = 30% de margen sobre precio final
    precio_venta_manual: Optional[float] = None  # ✅ Si prefiere ingresar el precio directamente
# --- 6. CLIENTES ---

class ClienteCreate(BaseModel):
    nombre: str
    cedula_nit: str
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    empresa_id: int

class ClienteOut(BaseModel):
    id: int
    nombre: str
    cedula_nit: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    class Config:
        from_attributes = True

# --- 7. PROVEEDORES ---

class ProveedorCreate(BaseModel):
    nombre: str
    empresa_id: int
    telefono: Optional[str] = None       # ✅ AGREGADO
    email: Optional[EmailStr] = None     # ✅ AGREGADO
    contacto: Optional[str] = None       # ✅ AGREGADO
    nit: Optional[str] = None            # ✅ AGREGADO

class ProveedorOut(ProveedorCreate):
    id: int
    class Config:
        from_attributes = True

# --- 8. VENTAS ---

class ItemVenta(BaseModel):
    producto_id: int
    cantidad: int

class DetalleVentaOut(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float
    subtotal: float             # ✅ AGREGADO
    class Config:
        from_attributes = True

class VentaCreate(BaseModel):
    empresa_id: int
    sucursal_id: int
    caja_id: int
    cliente_id: Optional[int] = None
    medio_pago: str = "Efectivo"
    pago_con: Optional[float] = None    # ✅ AGREGADO
    descuento_porcentaje: Optional[float] = 0.0  # ✅ AGREGAR
    descuento_valor: Optional[float] = 0.0       # ✅ AGREGAR
    items: List[ItemVenta]

class VentaOut(BaseModel):
    id: int
    total: float
    fecha: datetime
    medio_pago: str
    pago_con: Optional[float] = None    # ✅ AGREGADO
    cambio: Optional[float] = None      # ✅ AGREGADO
    estado: str                         # ✅ AGREGADO
    descuento_porcentaje: Optional[float] = 0.0  # ✅ AGREGAR
    descuento_valor: Optional[float] = 0.0       # ✅ AGREGAR
    detalles: List[DetalleVentaOut]
    class Config:
        from_attributes = True

# --- 9. CAJA Y GASTOS ---

class CajaCreate(BaseModel):
    sucursal_id: int
    monto_inicial: float

class CajaOut(BaseModel):
    id: int
    sucursal_id: int
    monto_inicial: float
    monto_final: Optional[float] = None
    estado: str
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime] = None
    class Config:
        from_attributes = True

class GastoCreate(BaseModel):
    descripcion: str
    monto: float
    sucursal_id: int
    caja_id: Optional[int] = None
    usuario_id: Optional[int] = None
    empleado_id: Optional[int] = None

class GastoOut(GastoCreate):
    id: int
    fecha: datetime             # ✅ Ahora existe en el modelo
    class Config:
        from_attributes = True

# --- 10. MOVIMIENTOS DE INVENTARIO ---

class MovimientoInventarioCreate(BaseModel):
    producto_id: int
    tipo: str                   # ✅ AGREGADO: "ENTRADA" / "SALIDA"
    cantidad: int
    motivo: Optional[str] = None  # ✅ AGREGADO

class MovimientoInventarioOut(MovimientoInventarioCreate):
    id: int
    usuario_id: Optional[int] = None  
    fecha: datetime             # ✅ Ahora existe en el modelo
    class Config:
        from_attributes = True

# --- 11. DASHBOARD ---

class DashboardStats(BaseModel):
    ventas_diarias: float
    numero_operaciones: int
    alertas_inventario: int
    total_clientes: int
    nombre_empresa: Optional[str] = None   # ✅ CORREGIDO: dashboard.py debe retornarlo
    moneda: str = "COP"
    ultimo_refresco: str
    class Config:
        from_attributes = True
# Agrega este schema nuevo al final:
class ActualizarPerfil(BaseModel):
    nombre: Optional[str] = None
    mail_email: Optional[EmailStr] = None
    mail_password: Optional[str] = None

    class Config:
        extra = "ignore"  # ✅ Ignora cualquier campo extra que llegue