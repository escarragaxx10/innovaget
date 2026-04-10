from app.database import engine, Base
from app.models import models

def create_tables():
    print("🚀 Creando tablas en la base de datos de Innovaget...")
    # Esto busca todos los modelos en models.py y los crea en la DB
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas exitosamente.")

if __name__ == "__main__":
    create_tables()