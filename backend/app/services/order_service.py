from __future__ import annotations

"""Lógica para convertir un carrito en una orden.

Este archivo toma los productos del carrito, valida el stock, crea la orden y la vacía después.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.cart_item import CartItem
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User
from app.services.cart_service import clear_cart, get_or_create_cart


def create_order_from_cart(db: Session, *, user: User) -> Order:
    # Convertir el carrito del usuario en una orden real y descontar stock.
    cart = get_or_create_cart(db, user=user)
    cart_items = list(
        db.execute(
            select(CartItem)
            .where(CartItem.cart_id == cart.id)
            .options(joinedload(CartItem.variant).joinedload(ProductVariant.product))
        )
        .unique()
        .scalars()
        .all()
    )
    if not cart_items:
        raise ValueError("Cart is empty")

    # Bloquear variantes para evitar vender más de lo disponible en operaciones simultáneas.
    # Nota: FOR UPDATE no está soportado en esta configuración de PostgreSQL
    variant_ids = [ci.product_variant_id for ci in cart_items]
    locked_variants = {
        v.id: v
        for v in db.execute(
            select(ProductVariant)
            .where(ProductVariant.id.in_(variant_ids))
            .options(joinedload(ProductVariant.product))
        ).scalars()
    }

    total = 0.0
    order = Order(
        user_id=user.id,
        status=OrderStatus.paid,
        total_price=0,
        currency="COP",
        shipping_address=user.address,
        shipping_phone=user.phone,
    )
    db.add(order)
    db.flush()

    for ci in cart_items:
        variant = locked_variants.get(ci.product_variant_id)
        if not variant:
            raise ValueError("Variant not found")
        if ci.quantity > variant.stock:
            raise ValueError(f"Not enough stock for variant {variant.id}")

        product: Product = variant.product  # type: ignore[assignment]
        unit_price = float(product.price)
        total += unit_price * ci.quantity

        # Descontar el stock de la variante vendida.
        variant.stock -= ci.quantity
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_variant_id=variant.id,
                quantity=ci.quantity,
                price=unit_price,
            )
        )

    order.total_price = round(total, 2)
    db.flush()

    # Vaciar el carrito después de crear la orden.
    clear_cart(db, cart_id=cart.id)
    return order


def list_orders(db: Session, *, user: User) -> list[Order]:
    # Mostrar todas las órdenes del usuario, ordenadas desde la más reciente.
    return list(
        db.execute(
            select(Order)
            .where(Order.user_id == user.id)
            .order_by(Order.created_at.desc())
            .options(
                joinedload(Order.items)
                .joinedload(OrderItem.variant),
                joinedload(Order.items)
                .joinedload(OrderItem.product)
            )
        )
        .unique()
        .scalars()
        .all()
    )


def get_order(db: Session, *, user: User, order_id: int) -> Order | None:
    # Buscar una orden específica y comprobar que pertenezca al usuario o sea admin.
    order = (
        db.execute(select(Order).where(Order.id == order_id).options(joinedload(Order.items)))
        .unique()
        .scalar_one_or_none()
    )
    if not order:
        return None
    if order.user_id != user.id and str(getattr(user.role, "value", user.role)) != "admin":
        return None
    return order
