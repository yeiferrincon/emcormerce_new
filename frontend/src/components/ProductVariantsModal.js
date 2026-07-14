import React, { useState } from "react";
import { api } from "../services/api";

export default function ProductVariantsModal({ product, onClose, onUpdate }) {
  const [variants, setVariants] = useState(product.variants || []);
  const [editingVariant, setEditingVariant] = useState(null);
  const [newStock, setNewStock] = useState(0);

  async function handleUpdateStock(variantId, stock) {
    try {
      await api.put(`/variants/${variantId}`, { stock });
      const updatedVariants = variants.map((v) =>
        v.id === variantId ? { ...v, stock } : v
      );
      setVariants(updatedVariants);
      setEditingVariant(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("No se pudo actualizar el stock de la variante");
    }
  }

  async function handleDeleteVariant(variantId) {
    if (!window.confirm("¿Estás seguro de eliminar esta variante?")) {
      return;
    }
    try {
      await api.delete(`/variants/${variantId}`);
      const updatedVariants = variants.filter((v) => v.id !== variantId);
      setVariants(updatedVariants);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("No se pudo eliminar la variante");
    }
  }

  function startEditing(variant) {
    setEditingVariant(variant.id);
    setNewStock(variant.stock);
  }

  function cancelEditing() {
    setEditingVariant(null);
    setNewStock(0);
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>Variantes de {product.name}</h2>
          <button className="modalClose" onClick={onClose}>×</button>
        </div>
        <div className="modalBody">
          {variants.length === 0 ? (
            <p className="muted">Este producto no tiene variantes.</p>
          ) : (
            <div className="variantsList">
              {variants.map((variant) => (
                <div key={variant.id} className="variantItem">
                  <div className="variantInfo">
                    <strong>Talla: {variant.size}</strong>
                    <span>Color: {variant.color}</span>
                  </div>
                  <div className="variantActions">
                    {editingVariant === variant.id ? (
                      <div className="variantEdit">
                        <input
                          type="number"
                          min="0"
                          value={newStock}
                          onChange={(e) => setNewStock(Number(e.target.value))}
                          className="smallInput"
                        />
                        <button
                          className="btn small"
                          onClick={() => handleUpdateStock(variant.id, newStock)}
                        >
                          Guardar
                        </button>
                        <button
                          className="btn small ghost"
                          onClick={cancelEditing}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="variantStock">
                        <span>Stock: {variant.stock}</span>
                        <button
                          className="btn small"
                          onClick={() => startEditing(variant)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn small danger"
                          onClick={() => handleDeleteVariant(variant.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
