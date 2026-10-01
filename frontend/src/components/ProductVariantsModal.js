import React, { useState } from "react";
import { api } from "../services/api";

export default function ProductVariantsModal({ product, onClose, onUpdate }) {
  const [variants, setVariants] = useState(product.variants || []);
  const [editingVariant, setEditingVariant] = useState(null);
  const [newStock, setNewStock] = useState(0);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");

  async function handleUpdateStock(variantId, stock, size, color) {
    try {
      const payload = { stock };
      if (size) payload.size = size;
      if (color) payload.color = color;
      
      await api.put(`/variants/${variantId}`, payload);
      const updatedVariants = variants.map((v) =>
        v.id === variantId ? { ...v, stock, size: size || v.size, color: color || v.color } : v
      );
      setVariants(updatedVariants);
      setEditingVariant(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "No se pudo actualizar la variante";
      alert(errorMessage);
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
      setEditingVariant(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "No se pudo eliminar la variante";
      alert(errorMessage);
    }
  }

  function startEditing(variant) {
    setEditingVariant(variant.id);
    setNewStock(variant.stock);
    setNewSize(variant.size);
    setNewColor(variant.color);
  }

  function cancelEditing() {
    setEditingVariant(null);
    setNewStock(0);
    setNewSize("");
    setNewColor("");
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
                        <div className="editField">
                          <label>Talla</label>
                          <input
                            type="text"
                            value={newSize}
                            onChange={(e) => setNewSize(e.target.value)}
                            className="smallInput"
                          />
                        </div>
                        <div className="editField">
                          <label>Color</label>
                          <input
                            type="text"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="smallInput"
                          />
                        </div>
                        <div className="editField">
                          <label>Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={newStock}
                            onChange={(e) => setNewStock(Number(e.target.value))}
                            className="smallInput"
                          />
                        </div>
                        <div className="editActions">
                          <button
                            className="btn small"
                            onClick={() => handleUpdateStock(variant.id, newStock, newSize, newColor)}
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
