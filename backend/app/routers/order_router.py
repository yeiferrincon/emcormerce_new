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
from app.websocket_manager import manager


router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderCreateOut, status_code=201)
def crear_pedido(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    shipping_address: str | None = Body(None),
    shipping_phone: str | None = Body(None)
) -> OrderCreateOut:
    # Tomar el carrito actual del usuario y convertirlo en una orden.
    try:
        pedido = create_order_from_cart(
            db, user=usuario, shipping_address=shipping_address, shipping_phone=shipping_phone
        )
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
        "user_name": pedido.user.name if pedido.user else None,
        "status": pedido.status,
        "total_price": float(pedido.total_price),
        "currency": pedido.currency,
        "shipping_address": pedido.shipping_address,
        "shipping_phone": pedido.shipping_phone,
        "cancellation_comment": pedido.cancellation_comment,
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
            # Admin: mostrar todos los pedidos con nombre de usuario
            from app.models.user import User
            orders = list(
                db.execute(
                    select(Order)
                    .join(User, Order.user_id == User.id)
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
                "user_name": order.user.name if order.user else None,
                "status": order.status,
                "total_price": float(order.total_price),
                "currency": order.currency,
                "shipping_address": order.shipping_address,
                "shipping_phone": order.shipping_phone,
                "cancellation_comment": order.cancellation_comment,
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
async def actualizar_estado_pedido(
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

        # Guardar estado anterior para verificar si se está cancelando
        estado_anterior = pedido.status
        pedido.status = nuevo_status
        
        # Si se cancela el pedido, devolver stock a las variantes
        if nuevo_status == OrderStatus.cancelled and estado_anterior != OrderStatus.cancelled:
            from sqlalchemy.orm import joinedload
            pedido_con_items = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.variant)).filter(Order.id == order_id).first()
            if pedido_con_items:
                for item in pedido_con_items.items:
                    if item.variant:
                        item.variant.stock = (item.variant.stock or 0) + item.quantity
                        # Actualizar stock del producto principal
                        if item.variant.product:
                            total_stock = sum(v.stock or 0 for v in item.variant.product.variants)
                            item.variant.product.stock = total_stock
        
        # Si se cancela o entrega, guardar el comentario (número de guía para entregados)
        if cancellation_comment:
            pedido.cancellation_comment = cancellation_comment
        
        db.commit()
        db.refresh(pedido)

        # Notificar al usuario del cambio de estado
        await manager.broadcast_to_user(
            pedido.user_id,
            {
                "type": "order_status_changed",
                "order_id": pedido.id,
                "status": pedido.status,
                "cancellation_comment": pedido.cancellation_comment
            }
        )

        # Construir respuesta manualmente
        order_dict = {
            "id": pedido.id,
            "user_id": pedido.user_id,
            "user_name": pedido.user.name if pedido.user else None,
            "status": pedido.status,
            "total_price": float(pedido.total_price),
            "currency": pedido.currency,
            "shipping_address": pedido.shipping_address,
            "shipping_phone": pedido.shipping_phone,
            "cancellation_comment": pedido.cancellation_comment,
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
