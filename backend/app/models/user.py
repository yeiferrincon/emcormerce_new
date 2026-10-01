from __future__ import annotations

"""Modelo de usuario del sistema.

Representa a los clientes o administradores del e-commerce y guarda
información básica para autenticación y perfil.
"""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class UserRole(str, enum.Enum):
    # Tipos de usuario permitidos en la tienda.
    user = "user"
    admin = "admin"
    # Invitados creados por versiones anteriores (hoy se crean como "user").
    guest = "guest"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # Identificador del usuario.
    name: Mapped[str] = mapped_column(String(120), nullable=False)  # nullable=False significa que este campo no puede quedar vacío.
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)  # Correo para login.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)  # Contraseña ya encriptada.
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, native_enum=False), nullable=False, default=UserRole.user)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)  # nullable=True permite que el valor sea opcional.
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Dirección opcional.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Un usuario puede tener un carrito y muchas órdenes.
    # back_populates="user" conecta esta relación con el atributo "user" en la otra clase.
    cart: Mapped["Cart"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    # Explicación rápida de SQLAlchemy:
    # - mapped_column(...) le dice a SQLAlchemy que este atributo será una columna en la base de datos.
    # - nullable=False significa que el dato no puede quedar vacío.
    # - nullable=True permite que el dato sea opcional.
    # - relationship(...) crea una relación entre dos modelos.
    # - back_populates="user" sirve para conectar esta relación con el atributo "user" en la otra clase.
    # - Puedes usar otro nombre en vez de "user" o "cart", pero debe coincidir en ambos lados.
    #   Por ejemplo: en User puedes usar back_populates="owner" y en Cart usar owner = relationship(back_populates="cart").

