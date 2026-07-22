from __future__ import annotations

"""Esquemas para validar datos del carrito de compras.

Definen cómo se envían y devuelven los productos agregados al carrito.
"""

from pydantic import BaseModel, Field, model_validator


class CartItemOut(BaseModel):
    # Forma de devolver un producto agregado al carrito.
    id: int
    product_variant_id: int
    quantity: int
    product_id: int
    product_name: str
    size: str
    color: str
    unit_price: float
    image_url: str | None = None
    available_variants: list[dict] | None = None


class CartOut(BaseModel):
    # Respuesta completa del carrito con subtotal.
    id: int
    items: list[CartItemOut]
    subtotal: float
    currency: str = "COP"


class CartAddIn(BaseModel):
    # Datos para agregar al carrito. Puede ser una variante concreta o un producto sin variantes.
    product_variant_id: int | None = None
    product_id: int | None = None
    # quantity es la cantidad de unidades que se quieren agregar.
    # Field(ge=1, le=50) significa que ese valor debe estar entre 1 y 50.
    quantity: int = Field(ge=1, le=50)

    @model_validator(mode="before")
    def valid_id(cls, values):
        if not values.get("product_variant_id") and not values.get("product_id"):
            raise ValueError("product_variant_id or product_id is required")
        return values


class CartRemoveIn(BaseModel):
    # Datos para quitar una variante específica del carrito.
    product_variant_id: int


class CartUpdateIn(BaseModel):
    # Datos para actualizar la cantidad de una variante en el carrito.
    product_variant_id: int
    quantity: int = Field(ge=1, le=50)

