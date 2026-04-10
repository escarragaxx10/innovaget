from fastapi import FastAPI
from app.database import engine
from app.models import models
from fastapi.middleware.cors import CORSMiddleware
# 1. IMPORTANTE: Debes importar cada router para que Python los conozca
from app.routers import auth, sucursales, productos, ventas, clientes, proveedores, dashboard, super_admin,compras,cajas,inventario,reportes,empresas,usuarios,categorias,gastos

# 2. Creamos las tablas en la base de datos innova_admin
models.Base.metadata.create_all(bind=engine)


app = FastAPI(title="Innovagué ERP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Registro de los routers
app.include_router(empresas.router)
app.include_router(auth.router)
app.include_router(sucursales.router)
app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(clientes.router)
app.include_router(proveedores.router)
app.include_router(dashboard.router)
app.include_router(super_admin.router)
app.include_router(compras.router)
app.include_router(cajas.router)
app.include_router(inventario.router)
app.include_router(reportes.router)
app.include_router(usuarios.router)
app.include_router(categorias.router)
app.include_router(gastos.router)