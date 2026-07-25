from __future__ import annotations

"""Archivo principal del backend.

Este archivo crea la aplicación FastAPI, conecta los routers y deja listo
el sistema para recibir peticiones del frontend.
"""

import logging
import os
import time
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config.database import Base, SessionLocal, engine
from app.config.settings import settings
from app.middleware.auth_middleware import AuthContextMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.models.category import Category
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.routers.auth_router import router as auth_router
from app.routers.cart_router import router as cart_router
from app.routers.order_router import router as order_router
from app.routers.product_router import router as product_router
from app.websocket_manager import manager

import app.models  # noqa: F401


def asegurar_categorias_por_defecto() -> None:
    # Crear categorías base si la tabla aún está vacía.
    db = SessionLocal()
    try:
        if db.query(Category).count() > 0:
            return

        categorias = [
            ("Camisetas", "Camisetas básicas, estampadas y urbanas."),
            ("Camisas", "Camisas casuales, formales y manga corta."),
            ("Pantalones", "Jeans, joggers, pantalones casuales y formales."),
            ("Chaquetas", "Chaquetas, buzos, hoodies y prendas exteriores."),
            ("Vestidos", "Vestidos casuales, elegantes y de temporada."),
            ("Faldas", "Faldas cortas, largas y estilos casuales."),
            ("Zapatos", "Tenis, botas, sandalias y calzado casual."),
            ("Accesorios", "Gorras, bolsos, correas y complementos."),
        ]

        db.add_all([Category(name=name, description=description) for name, description in categorias])
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def asegurar_variantes_por_defecto() -> None:
    # Asegurar que cada producto tenga al menos una variante y que el stock general
    # del producto refleje la suma de las variantes.
    db = SessionLocal()
    try:
        productos = db.query(Product).all()
        updated = False
        for producto in productos:
            if not producto.variants:
                stock = int(producto.stock or 0)
                # NO auto-incrementar stock al reiniciar
                if stock <= 0:
                    stock = 0
                producto.stock = stock
                variante = ProductVariant(
                    product_id=producto.id,
                    size="Única",
                    color="Estándar",
                    stock=stock,
                )
                db.add(variante)
                updated = True
            else:
                total_variant_stock = sum(int(v.stock or 0) for v in producto.variants)
                # NO reparar variantes con stock 0 automáticamente
                if producto.stock != total_variant_stock:
                    producto.stock = total_variant_stock
                    updated = True
        if updated:
            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# Crear las tablas al iniciar la aplicación.
Base.metadata.create_all(bind=engine)
asegurar_categorias_por_defecto()
asegurar_variantes_por_defecto()


def _configurar_logs() -> None:
    # Cambiar el nivel de logs según el entorno.
    nivel = logging.INFO if settings.env != "dev" else logging.DEBUG
    logging.basicConfig(level=nivel, format="%(asctime)s %(levelname)s %(name)s %(message)s")


_configurar_logs()
logger = logging.getLogger("app.http")

# Crear la aplicación FastAPI.
app = FastAPI(title=settings.app_name)

# Permitir que el frontend acceda a la API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Activar middleware de autenticación.
app.add_middleware(AuthContextMiddleware)

# Activar middleware de límite de peticiones.
app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.rate_limit_per_minute)

# Crear carpeta para guardar imágenes subidas.
uploads_dir = Path(os.getcwd()) / settings.upload_dir
uploads_dir.mkdir(parents=True, exist_ok=True)

# Exponer la carpeta como archivos estáticos.
app.mount("/static", StaticFiles(directory=str(uploads_dir)), name="static")


@app.middleware("http")
async def registrar_peticiones(request, call_next):
    # Medir cuánto tarda cada petición.
    inicio = time.perf_counter()
    respuesta = await call_next(request)
    tiempo_ms = (time.perf_counter() - inicio) * 1000.0
    logger.info("%s %s -> %s (%.1fms)", request.method, request.url.path, respuesta.status_code, tiempo_ms)
    return respuesta


@app.get("/health")
def revisar_salud() -> dict[str, str]:
    # Respuesta simple para comprobar si el backend está vivo.
    return {"status": "ok"}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


# Incluir todos los routers del proyecto.
app.include_router(auth_router, prefix="/api")
app.include_router(product_router, prefix="/api")
app.include_router(cart_router, prefix="/api")
app.include_router(order_router, prefix="/api")
