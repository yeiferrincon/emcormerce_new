from __future__ import annotations

"""Esquemas para validar datos de productos y categorías.

Definen qué campos deben venir en las peticiones y cómo se devuelve la información al frontend.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class CategoryOut(BaseModel):
    # Forma de devolver una categoría al cliente.
    id: int
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    # Datos requeridos para crear una nueva categoría.
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None


class ProductVariantOut(BaseModel):
    # Forma de devolver una variante de producto.
    id: int
    size: str
    color: str
    stock: int

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    # Forma de devolver un producto completo al cliente.
    id: int
    name: str
    description: str | None = None
    price: float
    stock: int
    category_id: int
    image_url: str | None = None
    created_at: datetime
    variants: list[ProductVariantOut] = []

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    # Datos enviados para crear un producto nuevo.
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    price: float = Field(gt=0)
    category_id: int
    image_url: str | None = None
    size: str | None = Field(default=None, min_length=1, max_length=32)
    color: str | None = Field(default=None, min_length=1, max_length=64)
    stock: int = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    # Datos que pueden actualizarse de un producto existente.
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    category_id: int | None = None
    image_url: str | None = None


class ProductVariantCreate(BaseModel):
    # Datos para crear una variante con talla, color y stock.
    size: str = Field(min_length=1, max_length=32)
    color: str = Field(min_length=1, max_length=64)
    stock: int = Field(ge=0)


class ProductVariantUpdate(BaseModel):
    # Datos que pueden actualizarse de una variante.
    size: str | None = Field(default=None, min_length=1, max_length=32)
    color: str | None = Field(default=None, min_length=1, max_length=64)
    stock: int = Field(ge=0)


class PaginatedProducts(BaseModel):
    # Respuesta paginada del catálogo.
    page: int
    page_size: int
    total: int
    items: list[ProductOut]
