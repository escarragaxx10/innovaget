from app.database import engine, Base
from app.models import models  # Asegúrate de importar tus modelos aquí

def reset_database():
    print("--- Iniciando limpieza total de la base de datos ---")
    # 1. Borra todo en el orden inverso (de hijos a padres)
    Base.metadata.drop_all(bind=engine)
    print("1. Tablas borradas exitosamente.")

    # 2. Crea todo en el orden correcto (de padres a hijos)
    Base.metadata.create_all(bind=engine)
    print("2. Tablas creadas con la estructura nueva.")
    print("--- Proceso terminado con éxito ---")

if __name__ == "__main__":
    reset_database()