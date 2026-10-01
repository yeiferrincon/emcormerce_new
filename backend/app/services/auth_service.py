from __future__ import annotations

"""Lógica de negocio para registrar e iniciar sesión de usuarios.

Este archivo conecta los modelos con la autenticación y crea el carrito inicial del usuario.
"""

import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.models.user import User, UserRole
from app.security.password_hash import hash_password, verify_password


def register_user(db: Session, *, name: str, email: str, password: str, address: str | None = None, phone: str | None = None) -> User:
    # Crear un usuario nuevo y también su carrito inicial.
    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing:
        raise ValueError("Email already registered")

    # Crear el usuario con la contraseña cifrada.
    user = User(name=name, email=email, password_hash=hash_password(password), role=UserRole.user, address=address, phone=phone)
    db.add(user)
    db.flush()  # Asignar un id al usuario antes de crear el carrito.

    # Crear el carrito del usuario recién registrado.
    cart = Cart(user_id=user.id)
    db.add(cart)
    db.flush()

    return user


def create_guest_user(db: Session) -> User:
    # Crear un usuario invitado sin pedir contraseña al cliente.
    email = f"guest+{secrets.token_hex(8)}@ropashop.com"
    password = secrets.token_urlsafe(16)
    return register_user(db, name="Cliente invitado", email=email, password=password)


def authenticate_user(db: Session, *, email: str, password: str) -> User | None:
    # Buscar el usuario por correo y comprobar la contraseña.
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

