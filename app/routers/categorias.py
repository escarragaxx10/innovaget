from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol

router = APIRouter(prefix="/categorias", tags=["Inventario - Categorías"])

@router.post("/", response_model=schemas.CategoriaOut)
def crear_categoria(
    categoria_in: schemas.CategoriaCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    # ✅ CORREGIDO: Verificar duplicado solo dentro de la misma empresa
    existe = db.query(models.Categoria).filter(
        models.Categoria.nombre == categoria_in.nombre,
        models.Categoria.empresa_id == current_user.empresa_id
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="La categoría ya existe")

    nueva_categoria = models.Categoria(
        nombre=categoria_in.nombre,
        empresa_id=current_user.empresa_id  # ✅ CORREGIDO: aislamiento por empresa
    )

    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    return nueva_categoria

@router.get("/", response_model=List[schemas.CategoriaOut])
def listar_categorias(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente", "cajero"]))
):
    # ✅ CORREGIDO: Solo categorías de la empresa del usuario
    return db.query(models.Categoria).filter(
        models.Categoria.empresa_id == current_user.empresa_id
    ).all()

@router.delete("/{categoria_id}")
def eliminar_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    categoria = db.query(models.Categoria).filter(
        models.Categoria.id == categoria_id,
        models.Categoria.empresa_id == current_user.empresa_id
    ).first()

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    db.delete(categoria)
    db.commit()
    return {"mensaje": f"Categoría '{categoria.nombre}' eliminada"}