from __future__ import annotations

"""Endpoints para crear y ver órdenes del usuario.

Este archivo convierte el carrito en un pedido y permite ver los pedidos hechos.
"""

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from app.config.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.schemas.order_schema import OrderCreateOut, OrderOut, OrderItemOut
from app.services.order_service import create_order_from_cart, get_order, list_orders
from app.models.order import Order
from app.models.order_item import OrderItem


router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderCreateOut, status_code=201)
def crear_pedido(db: Session = Depends(get_db), usuario=Depends(get_current_user)) -> OrderCreateOut:
    # Tomar el carrito actual del usuario y convertirlo en una orden.
    try:
        pedido = create_order_from_cart(db, user=usuario)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(exc)}")
    
    # Construir respuesta manualmente
    order_dict = {
        "id": pedido.id,
        "user_id": pedido.user_id,
        "status": pedido.status,
        "total_price": float(pedido.total_price),
        "currency": pedido.currency,
        "shipping_address": pedido.shipping_address,
        "shipping_phone": pedido.shipping_phone,
        "cancellation_comment": pedido.cancellation_comment,
        "original_order_id": pedido.original_order_id,
        "created_at": pedido.created_at,
        "items": [OrderItemOut.from_order_item(item) for item in pedido.items]
    }
    return OrderCreateOut(order=OrderOut(**order_dict), message="Pedido creado. Pago: simulacion (pendiente).")


@router.get("", response_model=list[OrderOut])
def listar_pedidos(db: Session = Depends(get_db), usuario=Depends(get_current_user)) -> list[OrderOut]:
    # Si es admin, mostrar todos los pedidos. Si es usuario normal, solo los suyos.
    try:
        from app.models.user import UserRole
        
        if usuario.role == UserRole.admin:
            # Admin: mostrar todos los pedidos
            orders = list(
                db.execute(
                    select(Order)
                    .order_by(Order.created_at.desc())
                    .options(
                        joinedload(Order.items)
                        .joinedload(OrderItem.variant),
                        joinedload(Order.items)
                        .joinedload(OrderItem.product)
                    )
                )
                .unique()
                .scalars()
                .all()
            )
        else:
            # Usuario normal: mostrar solo sus pedidos
            orders = list_orders(db, user=usuario)
            
        result = []
        for order in orders:
            order_dict = {
                "id": order.id,
                "user_id": order.user_id,
                "status": order.status,
                "total_price": float(order.total_price),
                "currency": order.currency,
                "shipping_address": order.shipping_address,
                "shipping_phone": order.shipping_phone,
                "cancellation_comment": order.cancellation_comment,
                "original_order_id": order.original_order_id,
                "created_at": order.created_at,
                "items": [OrderItemOut.from_order_item(item) for item in order.items]
            }
            result.append(OrderOut(**order_dict))
        return result
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al cargar pedidos: {str(exc)}")


@router.get("/{order_id}", response_model=OrderOut)
def ver_pedido(order_id: int, db: Session = Depends(get_db), usuario=Depends(get_current_user)) -> OrderOut:
    # Mostrar un pedido en particular si pertenece al usuario.
    pedido = get_order(db, user=usuario, order_id=order_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderOut.model_validate(pedido)


@router.put("/{order_id}/status", response_model=OrderOut)
def actualizar_estado_pedido(
    order_id: int,
    status: str = Body(..., embed=True),
    cancellation_comment: str | None = Body(None, embed=True),
    db: Session = Depends(get_db),
    usuario=Depends(require_admin)
) -> OrderOut:
    # Actualizar el estado de un pedido (solo admin).
    try:
        from app.models.order import OrderStatus

        # Validar que el estado sea válido
        try:
            nuevo_status = OrderStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

        from app.models.order import Order
        pedido = db.get(Order, order_id)
        if not pedido:
            raise HTTPException(status_code=404, detail="Order not found")

        pedido.status = nuevo_status
        
        # Si se cancela, guardar el comentario
        if nuevo_status == OrderStatus.cancelled and cancellation_comment:
            pedido.cancellation_comment = cancellation_comment
        
        db.commit()
        db.refresh(pedido)

        # Construir respuesta manualmente
        order_dict = {
            "id": pedido.id,
            "user_id": pedido.user_id,
            "status": pedido.status,
            "total_price": float(pedido.total_price),
            "currency": pedido.currency,
            "shipping_address": pedido.shipping_address,
            "shipping_phone": pedido.shipping_phone,
            "cancellation_comment": pedido.cancellation_comment,
            "original_order_id": pedido.original_order_id,
            "created_at": pedido.created_at,
            "items": [OrderItemOut.from_order_item(item) for item in pedido.items]
        }
        return OrderOut(**order_dict)
    except HTTPException:
        raise
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al actualizar estado: {str(exc)}")


@router.post("/{order_id}/duplicate", response_model=OrderOut)
def duplicar_pedido(
    order_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
) -> OrderOut:
    # Duplicar un pedido existente (solo el dueño del pedido)
    try:
        from app.models.order import Order
        from app.models.order_item import OrderItem
        from app.services.order_service import get_order

        original_order = get_order(db, user=usuario, order_id=order_id)
        if not original_order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Verificar que el usuario sea el dueño del pedido o admin
        from app.models.user import UserRole
        if original_order.user_id != usuario.id and usuario.role != UserRole.admin:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para duplicar este pedido"
            )

        # Verificar que el pedido no haya sido duplicado anteriormente
        if original_order.status == "duplicated":
            raise HTTPException(
                status_code=400,
                detail="Este pedido ya ha sido duplicado"
            )

        # Crear nuevo pedido duplicando los items del original
        from app.models.order import OrderStatus
        from app.models.product_variant import ProductVariant

        # Verificar stock disponible para todos los items
        for item in original_order.items:
            variant = db.get(ProductVariant, item.product_variant_id)
            if not variant or variant.stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"No hay suficiente stock para {item.product_name}"
                )

        # Crear nuevo pedido
        total = 0.0
        new_order = Order(
            user_id=usuario.id,
            status=OrderStatus.paid,
            total_price=0,
            currency=original_order.currency,
            shipping_address=original_order.shipping_address,
            shipping_phone=original_order.shipping_phone,
            original_order_id=original_order.id
        )
        db.add(new_order)
        db.flush()

        # Duplicar items SIN descontar stock (ya está reservado)
        for item in original_order.items:
            variant = db.get(ProductVariant, item.product_variant_id)

            db.add(
                OrderItem(
                    order_id=new_order.id,
                    product_id=variant.product_id,
                    product_variant_id=item.product_variant_id,
                    quantity=item.quantity,
                    price=item.price
                )
            )
            total += float(item.price) * item.quantity

        new_order.total_price = round(total, 2)
        
        # Cambiar el estado del pedido original a "duplicated" y agregar comentario
        from datetime import datetime
        from app.models.order import OrderStatus
        
        original_order.status = OrderStatus.duplicated
        
        # Agregar comentario de duplicación manteniendo el comentario de cancelación original
        duplication_comment = f"Duplicado el {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        if original_order.cancellation_comment:
            original_order.cancellation_comment = f"{original_order.cancellation_comment}. {duplication_comment}"
        else:
            original_order.cancellation_comment = duplication_comment
        
        db.commit()
        db.refresh(new_order)

        # Cargar items del nuevo pedido
        new_order_with_items = get_order(db, user=usuario, order_id=new_order.id)

        # Construir respuesta
        order_dict = {
            "id": new_order_with_items.id,
            "user_id": new_order_with_items.user_id,
            "status": new_order_with_items.status,
            "total_price": float(new_order_with_items.total_price),
            "currency": new_order_with_items.currency,
            "shipping_address": new_order_with_items.shipping_address,
            "shipping_phone": new_order_with_items.shipping_phone,
            "cancellation_comment": new_order_with_items.cancellation_comment,
            "original_order_id": new_order_with_items.original_order_id,
            "created_at": new_order_with_items.created_at,
            "items": [OrderItemOut.from_order_item(item) for item in new_order_with_items.items]
        }
        return OrderOut(**order_dict)
    except HTTPException:
        raise
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al duplicar pedido: {str(exc)}")

