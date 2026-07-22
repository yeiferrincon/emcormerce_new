import React, { useState } from "react";
import CartVariantModal from "./CartVariantModal";

export default function CartItem({ item, onRemove, onUpdateQuantity }) {
  const [showVariantModal, setShowVariantModal] = useState(false);

  return (
    <>
      <div className="cartItem">
        <div className="cartThumb">
          {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : <div className="thumbPh" />}
        </div>
        <div className="cartInfo">
          <div className="cartName">{item.product_name}</div>
          <div className="cartMeta">
            <span className="muted">
              {item.size} / {item.color}
            </span>
            <div className="quantityControl">
              <button
                onClick={() => setShowVariantModal(true)}
                className="btn"
                style={{ padding: "4px 12px", fontSize: "12px" }}
              >
                Editar ({item.quantity})
              </button>
            </div>
          </div>
          <div className="cartPrice">
            {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(item.unit_price * item.quantity)}
          </div>
        </div>
        <button className="iconBtn" onClick={() => onRemove(item.product_variant_id)} aria-label="Eliminar">
          ✕
        </button>
      </div>
      
      {showVariantModal && (
        <CartVariantModal
          product={{
            name: item.product_name,
            variants: item.available_variants || []
          }}
          currentVariantId={item.product_variant_id}
          currentQuantity={item.quantity}
          onClose={() => setShowVariantModal(false)}
          onUpdate={onUpdateQuantity}
        />
      )}
    </>
  );
}

