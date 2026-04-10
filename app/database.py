from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 1. Cargamos el .env por si acaso estás en local
load_dotenv()

# 2. Obtenemos la URL de Docker, si no existe, usamos la local
# IMPORTANTE: El host en Docker debe ser 'db', en local es 'localhost'
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://user_innovague:password123@localhost:5432/innovague_db"
)

# 3. Creamos el motor
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 4. Fábrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Base ÚNICA para modelos
Base = declarative_base()

# 6. Inyección de dependencias
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()