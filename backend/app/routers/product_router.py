from __future__ import annotations

"""Endpoints para ver y administrar productos.

Este archivo permite mostrar productos, crear categorías, crear productos,
agregar variantes y subir imágenes.
"""

import os
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import settings
from app.dependencies.auth import require_admin
from app.models.product_variant import ProductVariant
from app.schemas.product_schema import (
    CategoryCreate,
    CategoryOut,
    PaginatedProducts,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantOut,
    ProductVariantUpdate,
)
from app.services import product_service


router = APIRouter(prefix="", tags=["products"])


@router.get("/categories", response_model=list[CategoryOut])
def listar_categorias(db: Session = Depends(get_db)) -> list[CategoryOut]:
    # Traer todas las categorías para mostrarlas en la tienda.
    return [CategoryOut.model_validate(categoria) for categoria in product_service.list_categories(db)]


@router.post("/categories", response_model=CategoryOut, status_code=201, dependencies=[Depends(require_admin)])
def crear_categoria(datos: CategoryCreate, db: Session = Depends(get_db)) -> CategoryOut:
    # datos contiene el nombre y la descripción de la nueva categoría.
    try:
        categoria = product_service.create_category(db, name=datos.name.strip(), description=datos.description)
        db.commit()
        db.refresh(categoria)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category already exists") from exc
    return CategoryOut.model_validate(categoria)


@router.get("/products", response_model=PaginatedProducts)
def listar_productos(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    q: str | None = Query(None, max_length=200),
    category_id: int | None = Query(None, ge=1),
    size: str | None = Query(None, max_length=32),
    color: str | None = Query(None, max_length=64),
    db: Session = Depends(get_db),
) -> PaginatedProducts:
    # Traer productos con paginación y filtros opcionales.
    total, items = product_service.list_products(
        db,
        page=page,
        page_size=page_size,
        q=q,
        category_id=category_id,
        size=size,
        color=color,
    )
    return PaginatedProducts(
        page=page,
        page_size=page_size,
        total=total,
        items=[ProductOut.model_validate(producto) for producto in items],
    )


@router.get("/products/{product_id}", response_model=ProductOut)
def ver_producto(product_id: int, db: Session = Depends(get_db)) -> ProductOut:
    # Buscar un producto por su id.
    producto = product_service.get_product(db, product_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut.model_validate(producto)


@router.post("/products", response_model=ProductOut, status_code=201, dependencies=[Depends(require_admin)])
def crear_producto(datos: ProductCreate, db: Session = Depends(get_db)) -> ProductOut:
    # datos contiene la información básica del nuevo producto.
    try:
        producto = product_service.create_product(
            db,
            name=datos.name,
            description=datos.description,
            price=datos.price,
            category_id=datos.category_id,
            image_url=datos.image_url,
        )
        db.commit()
        db.refresh(producto)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid product") from exc
    return ProductOut.model_validate(producto)


@router.put("/products/{product_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
def actualizar_producto(product_id: int, datos: ProductUpdate, db: Session = Depends(get_db)) -> ProductOut:
    # datos trae los cambios parciales que se desean aplicar al producto.
    producto = product_service.get_product(db, product_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Product not found")
    try:
        product_service.update_product(
            db,
            producto,
            name=datos.name,
            description=datos.description,
            price=datos.price,
            category_id=datos.category_id,
            image_url=datos.image_url,
        )
        db.commit()
        db.refresh(producto)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid product") from exc
    return ProductOut.model_validate(producto)


@router.delete("/products/{product_id}", status_code=204, dependencies=[Depends(require_admin)])
def eliminar_producto(product_id: int, db: Session = Depends(get_db)) -> Response:
    # Eliminar un producto de la base de datos.
    producto = product_service.get_product(db, product_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Product not found")
    try:
        product_service.delete_product(db, producto)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Product could not be deleted") from exc
    return Response(status_code=204)


@router.post("/products/{product_id}/variants", response_model=ProductVariantOut, status_code=201, dependencies=[Depends(require_admin)])
def crear_variante(product_id: int, datos: ProductVariantCreate, db: Session = Depends(get_db)) -> ProductVariantOut:
    # datos define talla, color y stock de la variante nueva.
    producto = product_service.get_product(db, product_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Product not found")
    try:
        variante = product_service.add_variant(db, product=producto, size=datos.size, color=datos.color, stock=datos.stock)
        db.commit()
        db.refresh(variante)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Variant already exists") from exc
    return ProductVariantOut.model_validate(variante)


@router.put("/variants/{variant_id}", response_model=ProductVariantOut, dependencies=[Depends(require_admin)])
def actualizar_variante(variant_id: int, datos: ProductVariantUpdate, db: Session = Depends(get_db)) -> ProductVariantOut:
    # datos indica el nuevo stock de la variante.
    variante = db.get(ProductVariant, variant_id)
    if not variante:
        raise HTTPException(status_code=404, detail="Variant not found")
    try:
        product_service.update_variant_stock(db, variante, stock=datos.stock)
        db.commit()
        db.refresh(variante)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid variant") from exc
    return ProductVariantOut.model_validate(variante)


@router.delete("/variants/{variant_id}", status_code=204, dependencies=[Depends(require_admin)])
def eliminar_variante(variant_id: int, db: Session = Depends(get_db)) -> Response:
    # Eliminar una variante concreta de un producto.
    variante = db.get(ProductVariant, variant_id)
    if not variante:
        raise HTTPException(status_code=404, detail="Variant not found")
    try:
        product_service.delete_variant(db, variante)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Variant could not be deleted") from exc
    return Response(status_code=204)


@router.post("/products/{product_id}/image", response_model=ProductOut, dependencies=[Depends(require_admin)])
async def subir_imagen_producto(
    product_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ProductOut:
    # Subir una imagen para un producto y guardar su URL pública.
    producto = product_service.get_product(db, product_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Product not found")

    if not archivo.content_type or not archivo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    extension = Path(archivo.filename or "").suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    carpeta_subidas = Path(os.getcwd()) / settings.upload_dir
    carpeta_subidas.mkdir(parents=True, exist_ok=True)
    nombre_archivo = f"p{producto.id}_{secrets.token_hex(8)}{extension}"
    destino = carpeta_subidas / nombre_archivo

    datos = await archivo.read()
    if len(datos) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max image size is 5MB")
    destino.write_bytes(datos)

    url_publica = str(settings.public_base_url).rstrip("/")
    image_url = f"{url_publica}/static/{nombre_archivo}"
    try:
        product_service.update_product(db, producto, image_url=image_url)
        db.commit()
        db.refresh(producto)
    except Exception as exc:
        db.rollback()
        if destino.exists():
            destino.unlink()
        raise HTTPException(status_code=400, detail="Image could not be saved") from exc

    return ProductOut.model_validate(producto)
