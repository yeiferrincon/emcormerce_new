from __future__ import annotations

"""Lógica para manejar el carrito del usuario.

Este archivo permite ver los productos agregados, sumarlos y quitarlos del carrito.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User


def get_or_create_cart(db: Session, *, user: User) -> Cart:
    # Obtener el carrito del usuario o crear uno si todavía no existe.
    cart = db.execute(select(Cart).where(Cart.user_id == user.id)).scalar_one_or_none()
    if cart:
        return cart
    cart = Cart(user_id=user.id)
    db.add(cart)
    db.flush()
    return cart


def get_cart_details(db: Session, *, user: User) -> dict:
    # Construir la información completa del carrito para enviarla al frontend.
    cart = get_or_create_cart(db, user=user)
    stmt = (
        select(CartItem)
        .where(CartItem.cart_id == cart.id)
        .options(joinedload(CartItem.variant).joinedload(ProductVariant.product))
    )
    items = list(db.execute(stmt).unique().scalars().all())

    out_items = []
    subtotal = 0.0
    for item in items:
        variant = item.variant
        product: Product = variant.product  # type: ignore[assignment]
        unit_price = float(product.price)
        subtotal += unit_price * item.quantity
        
        # Obtener todas las variantes disponibles del producto
        all_variants = db.execute(
            select(ProductVariant)
            .where(ProductVariant.product_id == product.id)
        ).scalars().all()
        
        available_variants = [
            {
                "id": v.id,
                "size": v.size,
                "color": v.color,
                "stock": v.stock,
                "price": unit_price
            }
            for v in all_variants
        ]
        
        out_items.append(
            {
                "id": item.id,
                "product_variant_id": variant.id,
                "quantity": item.quantity,
                "product_id": product.id,
                "product_name": product.name,
                "size": variant.size,
                "color": variant.color,
                "unit_price": unit_price,
                "image_url": product.image_url,
                "available_variants": available_variants,
            }
        )

    return {"id": cart.id, "items": out_items, "subtotal": round(subtotal, 2), "currency": "COP"}


def add_to_cart(db: Session, *, user: User, product_variant_id: int, quantity: int) -> dict:
    # Agregar una variante al carrito y validar que haya stock suficiente.
    cart = get_or_create_cart(db, user=user)
    variant = db.get(ProductVariant, product_variant_id)
    if not variant:
        raise ValueError("Variant not found")
    if quantity < 1:
        raise ValueError("Invalid quantity")

    existing = db.execute(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_variant_id == product_variant_id)
    ).scalar_one_or_none()

    new_qty = quantity if not existing else existing.quantity + quantity
    if new_qty > variant.stock:
        raise ValueError("Not enough stock")

    if existing:
        existing.quantity = new_qty
        db.flush()
    else:
        item = CartItem(cart_id=cart.id, product_variant_id=product_variant_id, quantity=quantity)
        db.add(item)
        db.flush()

    return get_cart_details(db, user=user)


def remove_from_cart(db: Session, *, user: User, product_variant_id: int) -> dict:
    # Quitar un producto del carrito por su variante.
    cart = get_or_create_cart(db, user=user)
    item = db.execute(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_variant_id == product_variant_id)
    ).scalar_one_or_none()
    if item:
        db.delete(item)
        db.flush()
    return get_cart_details(db, user=user)


def update_cart_item_quantity(db: Session, *, user: User, product_variant_id: int, quantity: int) -> dict:
    # Actualizar la cantidad de un item en el carrito.
    if quantity < 1:
        raise ValueError("Invalid quantity")
    cart = get_or_create_cart(db, user=user)
    variant = db.get(ProductVariant, product_variant_id)
    if not variant:
        raise ValueError("Variant not found")
    if quantity > variant.stock:
        raise ValueError("Not enough stock")

    item = db.execute(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_variant_id == product_variant_id)
    ).scalar_one_or_none()
    if item:
        item.quantity = quantity
        db.flush()
    else:
        raise ValueError("Item not found in cart")

    return get_cart_details(db, user=user)


def clear_cart(db: Session, *, cart_id: int) -> None:
    # Vaciar todos los items del carrito.
    db.query(CartItem).filter(CartItem.cart_id == cart_id).delete()
    db.flush()

