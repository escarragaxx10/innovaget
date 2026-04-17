from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from app.database import engine
from app.models import models
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth, sucursales, productos, ventas, clientes,
    proveedores, dashboard, super_admin, compras,
    cajas, inventario, reportes, empresas, usuarios,
    categorias, gastos
)
import os
import secrets
import time

# ── Zona horaria Colombia ──────────────────────────────────
os.environ["TZ"] = os.getenv("TZ", "America/Bogota")
time.tzset()

# resto del código igual...

# ── Base de datos ──────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ── Seguridad para /docs ───────────────────────────────────
security = HTTPBasic()

def verify_docs_access(credentials: HTTPBasicCredentials = Depends(security)):
    correct_user = secrets.compare_digest(
        credentials.username, os.getenv("DOCS_USER", "admin")
    )
    correct_pass = secrets.compare_digest(
        credentials.password, os.getenv("DOCS_PASSWORD", "changeme")
    )
    if not (correct_user and correct_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acceso denegado",
            headers={"WWW-Authenticate": "Basic"},
        )

# ── App ────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(
    title="Innovagué ERP",
    docs_url=None,      # Deshabilitamos /docs por defecto
    redoc_url=None,
    openapi_url=None,   # Deshabilitamos /openapi.json por defecto
)

# ── CORS ───────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # ✅ Agrega OPTIONS
    allow_headers=["Authorization", "Content-Type", "x-master-key"],     # ✅ Agrega x-master-key
)

# ── /docs protegido ────────────────────────────────────────
@app.get("/docs", include_in_schema=False)
async def custom_docs(credentials: HTTPBasicCredentials = Depends(verify_docs_access)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="Innovagué ERP")

@app.get("/openapi.json", include_in_schema=False)
async def custom_openapi(credentials: HTTPBasicCredentials = Depends(verify_docs_access)):
    return get_openapi(title=app.title, version=app.version, routes=app.routes)

# ── Routers ────────────────────────────────────────────────
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