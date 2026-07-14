from __future__ import annotations

"""Endpoints para crear cuentas, entrar y ver el perfil.

Este archivo es la parte sencilla de autenticación del backend.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user_schema import AuthResponse, LoginIn, TokenOut, UserCreate, UserOut, UserUpdate
from app.security.jwt_handler import create_access_token
from app.services.auth_service import authenticate_user, create_guest_user, register_user


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def registrar_usuario(datos: UserCreate, db: Session = Depends(get_db)) -> AuthResponse:
    # datos contiene el nombre, correo y contraseña del nuevo usuario.
    try:
        usuario = register_user(db, name=datos.name, email=str(datos.email).lower(), password=datos.password)
        db.commit()
    except ValueError as exc:
        # Si el correo ya existe, mostrar un error claro.
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Crear un token para que el usuario pueda entrar después.
    token = TokenOut(access_token=create_access_token(subject=str(usuario.id), role=str(usuario.role.value)))
    return AuthResponse(user=UserOut.model_validate(usuario), token=token)


@router.post("/guest", response_model=AuthResponse, status_code=201)
def invitado_sin_login(db: Session = Depends(get_db)) -> AuthResponse:
    # Crear un usuario temporal para que el cliente pueda comprar sin iniciar sesión.
    usuario = create_guest_user(db)
    db.commit()
    token = TokenOut(access_token=create_access_token(subject=str(usuario.id), role=str(usuario.role.value)))
    return AuthResponse(user=UserOut.model_validate(usuario), token=token)


@router.post("/login", response_model=AuthResponse)
def iniciar_sesion(datos: LoginIn, db: Session = Depends(get_db)) -> AuthResponse:
    # datos contiene correo y contraseña para validar al usuario.
    usuario = authenticate_user(db, email=str(datos.email).lower(), password=datos.password)
    if not usuario:
        # Si no coincide, negar el acceso.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Crear el token si las credenciales son correctas.
    token = TokenOut(access_token=create_access_token(subject=str(usuario.id), role=str(usuario.role.value)))
    return AuthResponse(user=UserOut.model_validate(usuario), token=token)


@router.get("/me", response_model=UserOut)
def mi_perfil(usuario: User = Depends(get_current_user)) -> UserOut:
    # Devolver la información del usuario autenticado.
    return UserOut.model_validate(usuario)


@router.put("/profile", response_model=UserOut)
def actualizar_perfil(
    datos: UserUpdate,
    db: Session = Depends(get_db),
    usuario_actual: User = Depends(get_current_user),
) -> UserOut:
    # datos trae los cambios que el usuario quiere guardar.
    usuario_actual.name = datos.name
    usuario_actual.phone = datos.phone
    usuario_actual.address = datos.address
    db.commit()

    # Mostrar el perfil ya actualizado.
    return UserOut.model_validate(usuario_actual)

