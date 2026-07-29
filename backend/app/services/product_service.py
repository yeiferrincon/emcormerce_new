from __future__ import annotations

"""Lógica de negocio para gestionar productos y variantes.

Este archivo contiene las operaciones más importantes del catálogo: listar productos,
crear categorías, agregar variantes y actualizar el stock.
"""

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.product import Product
from app.models.product_variant import ProductVariant


def list_categories(db: Session) -> list[Category]:
    # Devolver todas las categorías disponibles para mostrar en la tienda.
    return list(db.execute(select(Category).order_by(Category.name.asc())).scalars().all())


def create_category(db: Session, *, name: str, description: str | None) -> Category:
    # Crear una nueva categoría para clasificar productos.
    category = Category(name=name, description=description)
    db.add(category)
    db.flush()
    return category


def get_product(db: Session, product_id: int) -> Product | None:
    # Buscar un producto por su id y cargar también sus variantes.
    producto = (
        db.execute(
            select(Product)
            .where(Product.id == product_id)
            .options(joinedload(Product.variants))
        )
        .unique()
        .scalar_one_or_none()
    )
    if producto and not producto.variants:
        # Si el producto no tiene variantes, crear una variante por defecto.
        stock = int(producto.stock or 0)
        if stock <= 0:
            stock = 1
            producto.stock = stock
        variant = ProductVariant(
            product_id=producto.id,
            size="Única",
            color="Estándar",
            stock=stock,
        )
        db.add(variant)
        db.flush()
        producto.variants.append(variant)
    return producto


def list_products(
    db: Session,
    *,
    page: int,
    page_size: int,
    q: str | None = None,
    category_id: int | None = None,
    size: str | None = None,
    color: str | None = None,
) -> tuple[int, list[Product]]:
    # Preparar la consulta para listar productos con paginación y filtros.
    page = max(1, int(page))
    page_size = min(50, max(1, int(page_size)))

    # Calcular stock dinámicamente basado en variantes
    stock_subquery = (
        select(
            ProductVariant.product_id,
            func.coalesce(func.sum(ProductVariant.stock), 0).label("total_stock")
        )
        .group_by(ProductVariant.product_id)
        .subquery()
    )

    stmt = (
        select(Product)
        .outerjoin(stock_subquery, Product.id == stock_subquery.c.product_id)
        .options(joinedload(Product.variants))
        .order_by(Product.created_at.desc())
    )
    count_stmt = select(func.count(Product.id))

    filters = []
    if q:
        like = f"%{q.strip()}%"
        filters.append(or_(Product.name.ilike(like), Product.description.ilike(like)))
    if category_id:
        filters.append(Product.category_id == category_id)

    if size or color:
        # Filtrar productos que tengan al menos una variante que coincida.
        pv = ProductVariant
        conds = [pv.product_id == Product.id]
        if size:
            conds.append(pv.size == size)
        if color:
            conds.append(pv.color == color)
        stmt = stmt.where(select(pv.id).where(and_(*conds)).exists())
        count_stmt = count_stmt.where(select(pv.id).where(and_(*conds)).exists())

    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))

    total = int(db.execute(count_stmt).scalar_one())
    items = list(
        db.execute(stmt.offset((page - 1) * page_size).limit(page_size)).unique().scalars().all()
    )

    # Actualizar el stock de cada producto con el valor calculado
    for product in items:
        total_stock = db.execute(
            select(func.coalesce(func.sum(ProductVariant.stock), 0))
            .where(ProductVariant.product_id == product.id)
        ).scalar_one()
        product.stock = int(total_stock)

    return total, items


def create_product(
    db: Session,
    *,
    name: str,
    description: str | None,
    price: float,
    category_id: int,
    image_url: str | None,
) -> Product:
    # Crear un producto nuevo con stock inicial en cero.
    product = Product(
        name=name,
        description=description,
        price=price,
        category_id=category_id,
        image_url=image_url,
        stock=0,
    )
    db.add(product)
    db.flush()
    return product


def update_product(db: Session, product: Product, **changes) -> Product:
    # Actualizar campos del producto sin cambiar el flujo del router.
    for k, v in changes.items():
        if v is not None:
            setattr(product, k, v)
    db.flush()
    return product


def get_or_create_default_variant(db: Session, *, product_id: int) -> int:
    # Devuelve la variante principal de un producto, creando una si el producto no tiene ninguna.
    producto = (
        db.execute(
            select(Product)
            .where(Product.id == product_id)
            .options(joinedload(Product.variants))
        )
        .unique()
        .scalar_one_or_none()
    )
    if not producto:
        raise ValueError("Product not found")
    if producto.variants:
        return producto.variants[0].id

    stock = int(producto.stock or 0)
    if stock <= 0:
        stock = 1
        producto.stock = stock
    variante = ProductVariant(
        product_id=producto.id,
        size="Única",
        color="Estándar",
        stock=stock,
    )
    db.add(variante)
    db.flush()
    producto.variants.append(variante)
    _recalculate_product_stock(db, product_id=producto.id)
    return variante.id


def delete_product(db: Session, product: Product) -> None:
    # Eliminar el producto de la base de datos.
    # Primero verificar si tiene pedidos asociados
    from app.models.order_item import OrderItem
    from app.models.cart_item import CartItem

    # Verificar si el producto tiene pedidos
    order_items = db.execute(
        select(OrderItem).where(OrderItem.product_id == product.id)
    ).scalar_one_or_none()

    if order_items:
        raise ValueError(
            "Este producto ya tiene unidades vendidas y no se puede eliminar. "
            "Para ocultarlo, establece el stock en 0."
        )

    # Eliminar cart_items relacionados
    db.execute(db.delete(CartItem).where(
        CartItem.product_id == product.id))

    # Eliminar variantes (cascade ya está configurado)
    for variant in product.variants:
        db.delete(variant)

    # Finalmente eliminar el producto
    db.delete(product)
    db.flush()


def add_variant(
    db: Session,
    *,
    product: Product,
    size: str,
    color: str,
    stock: int,
) -> ProductVariant:
    # Crear una nueva variante para el producto.
    variant = ProductVariant(product_id=product.id, size=size, color=color, stock=stock)
    db.add(variant)
    db.flush()
    _recalculate_product_stock(db, product_id=product.id)
    return variant


def update_variant_stock(db: Session, variant: ProductVariant, *, stock: int) -> ProductVariant:
    # Cambiar el stock disponible de una variante concreta.
    variant.stock = stock
    db.flush()
    _recalculate_product_stock(db, product_id=variant.product_id)
    return variant


def delete_variant(db: Session, variant: ProductVariant) -> None:
    # Eliminar una variante y recalcular el stock general del producto.
    # Primero verificar si tiene pedidos asociados
    from app.models.order_item import OrderItem
    from app.models.cart_item import CartItem

    product_id = variant.product_id

    # Verificar si la variante tiene pedidos
    order_items = db.execute(
        select(OrderItem).where(
            OrderItem.product_variant_id == variant.id)
    ).scalar_one_or_none()

    if order_items:
        raise ValueError(
            "Esta variante ya tiene unidades vendidas y no se puede eliminar. "
            "Para ocultarla, establece su stock en 0."
        )

    # Eliminar cart_items relacionados
    db.execute(db.delete(CartItem).where(
        CartItem.product_variant_id == variant.id))

    # Eliminar la variante
    db.delete(variant)
    db.flush()
    _recalculate_product_stock(db, product_id=product_id)


def _recalculate_product_stock(db: Session, *, product_id: int) -> None:
    # Sumar el stock de todas las variantes para actualizar el stock general del producto.
    total = int(
        db.execute(
            select(func.coalesce(func.sum(ProductVariant.stock), 0)).where(ProductVariant.product_id == product_id)
        ).scalar_one()
    )
    db.execute(update(Product).where(Product.id == product_id).values(stock=total))
    db.flush()
