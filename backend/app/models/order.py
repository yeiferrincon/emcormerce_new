from __future__ import annotations

"""Modelo de órdenes del sistema.

Una orden representa la compra final del usuario a partir del contenido
actual de su carrito.
"""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class OrderStatus(str, enum.Enum):
    # Estados posibles de una orden.
    pending = "pending"
    paid = "paid"
    processing = "processing"  # despachar
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    duplicated = "duplicated"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # Identificador de la orden.
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False), nullable=False, default=OrderStatus.pending, index=True
    )
    total_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)  # Valor total de la compra.
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="COP")  # Moneda usada.
    shipping_address: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Dirección de envío.
    shipping_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)  # Teléfono de contacto.
    cancellation_comment: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # Comentario de cancelación.
    original_order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)  # ID del pedido original si este es una duplicación.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relación con el usuario que hizo la compra.
    # back_populates="orders" conecta esta relación con el atributo orders de la clase User.
    user: Mapped["User"] = relationship(back_populates="orders")
    # Lista de productos incluidos en la orden.
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")

