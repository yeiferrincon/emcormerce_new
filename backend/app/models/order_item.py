from __future__ import annotations

"""Modelo de un producto dentro de una orden final.

Cuando el usuario compra, cada artículo del carrito se guarda aquí con su precio.
"""

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # Identificador del item dentro de la orden.
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    product_variant_id: Mapped[int] = mapped_column(
        ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # Cuántas unidades se compraron.
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)  # Precio unitario al momento de comprar.

    # Relación con la orden que contiene este producto.
    order: Mapped["Order"] = relationship(back_populates="items")
    # Relación con la variante comprada.
    variant: Mapped["ProductVariant"] = relationship()
    # Relación con el producto.
    product: Mapped["Product"] = relationship()

