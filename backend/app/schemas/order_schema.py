from __future__ import annotations

"""Esquemas para validar datos de órdenes y pedidos.

Definen cómo se devuelve una compra hecha por el usuario.
"""

from datetime import datetime

from pydantic import BaseModel


class OrderItemOut(BaseModel):
    # Forma de devolver un producto incluido en una orden.
    id: int
    product_id: int
    product_variant_id: int
    quantity: int
    price: float
    product_name: str | None = None
    variant_size: str | None = None
    variant_color: str | None = None

    @classmethod
    def from_order_item(cls, order_item):
        return cls(
            id=order_item.id,
            product_id=order_item.product_id,
            product_variant_id=order_item.product_variant_id,
            quantity=order_item.quantity,
            price=float(order_item.price),
            product_name=order_item.product.name if order_item.product else None,
            variant_size=order_item.variant.size if order_item.variant else None,
            variant_color=order_item.variant.color if order_item.variant else None,
        )


class OrderOut(BaseModel):
    # Forma de devolver una orden completa al cliente.
    id: int
    user_id: int
    user_name: str | None = None
    status: str
    total_price: float
    currency: str
    shipping_address: str | None = None
    shipping_phone: str | None = None
    cancellation_comment: str | None = None
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}


class OrderCreateOut(BaseModel):
    # Respuesta que se devuelve al crear una orden.
    order: OrderOut
    message: str

