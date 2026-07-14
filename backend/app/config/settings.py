from __future__ import annotations

"""Configuración simple del proyecto.

Aquí se guardan los valores que usa la aplicación para funcionar.
"""

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Cargar valores desde un archivo .env si existe.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Entorno actual: desarrollo o producción.
    env: str = "dev"

    # Nombre de la aplicación.
    app_name: str = "RopaShop"

    # Dirección permitida para el frontend.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Dirección de la base de datos.
    database_url: str = Field(default="postgresql://postgres:root@localhost/RopaShop")

    # Clave secreta para crear tokens de acceso.
    jwt_secret_key: str = Field(default="dev-secret-key-change-me")

    # Algoritmo usado para firmar los tokens.
    jwt_algorithm: str = "HS256"

    # Tiempo de vida del token.
    access_token_expire_minutes: int = 60

    # Límite de peticiones por minuto.
    rate_limit_per_minute: int = 120

    # Carpeta para guardar subidas de imágenes.
    upload_dir: str = "uploads"

    # URL base pública para mostrar imágenes.
    public_base_url: AnyHttpUrl = "http://localhost:8000"

    def cors_origins_list(self) -> list[str]:
        # Convertir la cadena de orígenes en una lista limpia.
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


# Instancia global con la configuración cargada.
settings = Settings()

