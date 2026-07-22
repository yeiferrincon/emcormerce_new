import React, { useState } from "react";
import { api } from "../services/api";

export default function CartVariantModal({ product, currentVariantId, currentQuantity, onClose, onUpdate }) {
  const [variants, setVariants] = useState(product.variants || []);
  const [selectedVariantId, setSelectedVariantId] = useState(currentVariantId);
  const [quantity, setQuantity] = useState(currentQuantity);
  const [loading, setLoading] = useState(false);

  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  async function handleUpdate() {
    setLoading(true);
    try {
      // Primero remover la variante actual
      await api.delete("/cart/remove", { data: { product_variant_id: currentVariantId } });
      
      // Luego agregar la nueva variante con la nueva cantidad
      if (quantity > 0) {
        await api.post("/cart/add", { product_variant_id: selectedVariantId, quantity });
      }
      
      // Recargar el carrito completo
      const cartRes = await api.get("/cart");
      if (onUpdate) onUpdate(cartRes.data);
      onClose();
    } catch (err) {
      alert("No se pudo actualizar el carrito");
    } finally {
      setLoading(false);
    }
  }

  function handleQuantityChange(delta) {
    const newQuantity = Math.max(1, quantity + delta);
    if (newQuantity <= (selectedVariant?.stock || 0)) {
      setQuantity(newQuantity);
    }
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        <div className="modalHeader">
          <h3>Editar {product.name}</h3>
          <button className="modalClose" onClick={onClose}>×</button>
        </div>
        <div className="modalBody">
          <div style={{ marginBottom: "20px" }}>
            <h4>Selecciona la variante</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  style={{
                    padding: "12px",
                    border: `2px solid ${selectedVariantId === variant.id ? "#10b981" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: selectedVariantId === variant.id ? "#f0fdf4" : "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600" }}>{variant.size} / {variant.color}</div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      Stock: {variant.stock} | Precio: ${new Intl.NumberFormat("es-CO").format(variant.price || product.price)}
                    </div>
                  </div>
                  {selectedVariantId === variant.id && <span style={{ color: "#10b981", fontSize: "20px" }}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4>Cantidad</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="btn"
                style={{ padding: "8px 16px", fontSize: "18px" }}
              >
                -
              </button>
              <div style={{ fontSize: "18px", fontWeight: "600", minWidth: "50px", textAlign: "center" }}>
                {quantity}
              </div>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= (selectedVariant?.stock || 0)}
                className="btn"
                style={{ padding: "8px 16px", fontSize: "18px" }}
              >
                +
              </button>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "5px" }}>
              Stock disponible: {selectedVariant?.stock || 0}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
              <span>Total:</span>
              <span style={{ color: "#10b981" }}>
                ${new Intl.NumberFormat("es-CO").format((selectedVariant?.price || product.price) * quantity)}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={onClose} style={{ flex: 1, background: "#64748b" }}>
              Cancelar
            </button>
            <button className="btn" onClick={handleUpdate} disabled={loading} style={{ flex: 1 }}>
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
