from __future__ import annotations

"""Endpoints para manejar el carrito del usuario.

Aquí el usuario puede ver su carrito, agregar productos y quitarlos.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.cart_schema import (
    CartAddIn,
    CartOut,
    CartRemoveIn,
    CartUpdateIn,
)
from app.services import product_service
from app.services.cart_service import (
    add_to_cart,
    get_cart_details,
    remove_from_cart,
    update_cart_item_quantity,
)


router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartOut)
def ver_carrito(db: Session = Depends(get_db), usuario=Depends(get_current_user)) -> CartOut:
    # Obtener el carrito del usuario actual y convertirlo al formato de respuesta.
    return CartOut.model_validate(get_cart_details(db, user=usuario))


@router.post("/add", response_model=CartOut)
def agregar_al_carrito(datos: CartAddIn, db: Session = Depends(get_db), usuario=Depends(get_current_user)) -> CartOut:
    # datos puede indicar una variante concreta o un producto sin variantes.
    try:
        variant_id = datos.product_variant_id
        if not variant_id and datos.product_id:
            variant_id = product_service.get_or_create_default_variant(db, product_id=datos.product_id)
        carrito = add_to_cart(db, user=usuario, product_variant_id=variant_id, quantity=datos.quantity)
        db.commit()
        return CartOut.model_validate(carrito)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        db.rollback()
        raise


@router.delete("/remove", response_model=CartOut)
def quitar_del_carrito(datos: CartRemoveIn, db: Session = Depends(get_db), usuario=Depends(get_current_user)) -> CartOut:
    # datos indica qué variante se desea quitar del carrito.
    try:
        carrito = remove_from_cart(db, user=usuario, product_variant_id=datos.product_variant_id)
        db.commit()
        return CartOut.model_validate(carrito)
    except Exception:
        db.rollback()
        raise


@router.put("/update", response_model=CartOut)
def actualizar_cantidad(datos: CartUpdateIn, db: Session = Depends(get_db), usuario=Depends(get_current_user)) -> CartOut:
    # datos indica qué variante y la nueva cantidad.
    try:
        carrito = update_cart_item_quantity(db, user=usuario, product_variant_id=datos.product_variant_id, quantity=datos.quantity)
        db.commit()
        return CartOut.model_validate(carrito)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        db.rollback()
        raise

