from __future__ import annotations

"""Esquemas para validar datos de usuarios.

Estos modelos definen qué información entra y sale en los endpoints de autenticación y perfil.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    # Datos que envía el frontend para registrar un usuario nuevo.
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=32)


class UserOut(BaseModel):
    # Forma en que se devuelve la información del usuario al cliente.
    id: int
    name: str
    email: EmailStr
    role: str
    phone: str | None = None
    address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    # Datos que puede cambiar el usuario en su perfil.
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=500)


class TokenOut(BaseModel):
    # Respuesta con el token de acceso generado.
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    # Datos enviados al iniciar sesión.
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthResponse(BaseModel):
    # Respuesta completa al iniciar sesión o registrarse.
    user: UserOut
    token: TokenOut
