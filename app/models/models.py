from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone

# --- 1. TABLAS MAESTRAS ---

class Empresa(Base):
    __tablename__ = "empresas"
    id = Column(Integer, primary_key=True, index=True)
    nombre_sas = Column(String, unique=True, index=True)
    nit = Column(String, unique=True, index=True)
    activa = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    mail_email = Column(String, nullable=True)      # ✅ Correo para enviar facturas
    mail_password = Column(String, nullable=True)   # ✅ App Password de Gmail
 
    sucursales = relationship("Sucursal", back_populates="dueno")
    usuarios = relationship("User", back_populates="empresa")
    empleados = relationship("Empleado", back_populates="empresa")
    clientes = relationship("Cliente", back_populates="empresa")
    proveedores = relationship("Proveedor", back_populates="empresa")
    ventas = relationship("Venta", back_populates="empresa")
    productos = relationship("Producto", back_populates="empresa")
    categorias = relationship("Categoria", back_populates="empresa")
 
class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    
    empresa = relationship("Empresa", back_populates="categorias")  # ✅ Falta back_populates
    productos = relationship("Producto", back_populates="categoria")

class TokenRegistro(Base):
    __tablename__ = "tokens_registro"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)
    usado = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_vencimiento = Column(DateTime, default=lambda: datetime.now(timezone.utc) + timedelta(days=30))  # ✅ NUEVO
 
class Licencia(Base):
    __tablename__ = "licencias"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)
    usada = Column(Boolean, default=False)

# --- 2. TABLAS DE USUARIOS Y SUCURSALES ---

class Sucursal(Base):
    __tablename__ = "sucursales"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    direccion = Column(String)
    ciudad = Column(String)
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    
    dueno = relationship("Empresa", back_populates="sucursales")
    productos = relationship("Producto", back_populates="sucursal")
    cajas = relationship("Caja", back_populates="sucursal")
    empleados = relationship("Empleado", back_populates="sucursal")
    gastos = relationship("Gasto", back_populates="sucursal")
    ventas = relationship("Venta", back_populates="sucursal")

class User(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    nombre = Column(String, nullable=True)
    
    empresa = relationship("Empresa", back_populates="usuarios")
    ventas = relationship("Venta", back_populates="vendedor_admin")
    gastos = relationship("Gasto", back_populates="usuario")
    movimientos = relationship("MovimientoInventario", back_populates="usuario")
    cajas = relationship("Caja", back_populates="admin_operador")

class Empleado(Base):
    __tablename__ = "empleados"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    nombre = Column(String, nullable=True)
    
    empresa = relationship("Empresa", back_populates="empleados")
    sucursal = relationship("Sucursal", back_populates="empleados")
    cajas = relationship("Caja", back_populates="empleado_operador")
    ventas = relationship("Venta", back_populates="vendedor_empleado")
    gastos = relationship("Gasto", back_populates="empleado")

# --- 3. INVENTARIO Y FLUJO ---

class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    descripcion = Column(String, nullable=True)
    precio_compra = Column(Float, default=0.0)
    precio_venta = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    empresa_id = Column(Integer, ForeignKey("empresas.id"))

    categoria = relationship("Categoria", back_populates="productos")
    sucursal = relationship("Sucursal", back_populates="productos")
    empresa = relationship("Empresa", back_populates="productos")  # ✅ CORREGIDO
    movimientos = relationship("MovimientoInventario", back_populates="producto")

class Caja(Base):
    __tablename__ = "cajas"
    id = Column(Integer, primary_key=True, index=True)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    monto_inicial = Column(Float)
    monto_final = Column(Float, nullable=True)
    estado = Column(String, default="ABIERTA")
    fecha_apertura = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_cierre = Column(DateTime, nullable=True)
    
    sucursal = relationship("Sucursal", back_populates="cajas")
    admin_operador = relationship("User", back_populates="cajas")
    empleado_operador = relationship("Empleado", back_populates="cajas")
    ventas = relationship("Venta", back_populates="caja")
    gastos = relationship("Gasto", back_populates="caja")  # ✅ AGREGADO

class Gasto(Base):
    __tablename__ = "gastos"
    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Float)
    descripcion = Column(String)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # ✅ AGREGADO
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    caja_id = Column(Integer, ForeignKey("cajas.id"), nullable=True)
    
    sucursal = relationship("Sucursal", back_populates="gastos")
    usuario = relationship("User", back_populates="gastos")
    empleado = relationship("Empleado", back_populates="gastos")
    caja = relationship("Caja", back_populates="gastos")  # ✅ AGREGADO

class Venta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float, default=0.0)
    medio_pago = Column(String, default="Efectivo")
    pago_con = Column(Float, nullable=True)       # ✅ AGREGADO
    cambio = Column(Float, nullable=True)          # ✅ AGREGADO
    estado = Column(String, default="COMPLETADA")  # ✅ AGREGADO
    descuento_porcentaje = Column(Float, nullable=True, default=0.0)  # ✅ AGREGAR
    descuento_valor = Column(Float, nullable=True, default=0.0)   
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    vendedor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    vendedor_empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    caja_id = Column(Integer, ForeignKey("cajas.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)

    caja = relationship("Caja", back_populates="ventas")
    cliente = relationship("Cliente", back_populates="ventas")
    vendedor_admin = relationship("User", back_populates="ventas")
    vendedor_empleado = relationship("Empleado", back_populates="ventas")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
    empresa = relationship("Empresa", back_populates="ventas")
    sucursal = relationship("Sucursal", back_populates="ventas")

class DetalleVenta(Base):
    __tablename__ = "detalles_ventas"
    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer)
    precio_unitario = Column(Float)
    subtotal = Column(Float, default=0.0)  # ✅ AGREGADO
    
    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    cedula_nit = Column(String, index=True)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    empresa = relationship("Empresa", back_populates="clientes")
    ventas = relationship("Venta", back_populates="cliente")

class Proveedor(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    telefono = Column(String, nullable=True)   # ✅ AGREGADO
    email = Column(String, nullable=True)      # ✅ AGREGADO
    contacto = Column(String, nullable=True)   # ✅ AGREGADO
    nit = Column(String, nullable=True)        # ✅ AGREGADO
    
    empresa = relationship("Empresa", back_populates="proveedores")

class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo = Column(String)                                          # ✅ AGREGADO: "ENTRADA" / "SALIDA"
    cantidad = Column(Integer)
    motivo = Column(String, nullable=True)                         # ✅ AGREGADO
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # ✅ AGREGADO
    
    producto = relationship("Producto", back_populates="movimientos")
    usuario = relationship("User", back_populates="movimientos")
    
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    token = Column(String, unique=True, index=True)
    usado = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_vencimiento = Column(DateTime)