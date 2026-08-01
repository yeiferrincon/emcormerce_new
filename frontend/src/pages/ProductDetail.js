import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function ProductDetail({ ui }) {
  const { id } = useParams();
  const { token, createGuestSession } = useAuth();
  const [p, setP] = useState(null);
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const priceLabel = useMemo(() => {
    const v = p?.price || 0;
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v);
  }, [p]);

  const selectedVariant = useMemo(
    () => p?.variants?.find((variant) => String(variant.id) === variantId),
    [p, variantId]
  );

  const canAddToCart = Boolean(
    (selectedVariant && selectedVariant.stock > 0) || (!selectedVariant && p?.stock > 0)
  );

  // Actualizar cantidad cuando cambia la variante seleccionada
  useEffect(() => {
    if (selectedVariant) {
      setQty(selectedVariant.stock > 0 ? 1 : 0);
    } else if (p?.stock > 0) {
      setQty(1);
    } else {
      setQty(0);
    }
  }, [selectedVariant, p]);

  async function load() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await api.get(`/products/${id}`);
      setP(res.data);
      const first = res.data?.variants?.[0]?.id || "";
      setVariantId(first ? String(first) : "");
    } catch {
      setError("No se pudo cargar el producto.");
    } finally {
      setLoading(false);
    }
  }

  async function addToCart() {
    setMsg("");
    setError("");
    if (!variantId && !p?.id) {
      setError("No hay variante disponible.");
      return;
    }
    try {
      let activeToken = token;
      if (!activeToken) {
        activeToken = await createGuestSession();
        if (!activeToken) {
          throw new Error("No se pudo autenticar como invitado.");
        }
      }
      const payload = {
        quantity: Number(qty),
      };
      if (variantId) {
        payload.product_variant_id = Number(variantId);
      } else {
        payload.product_id = Number(id);
      }
      // Usar el token directamente para asegurar que se envíe
      await api.post("/cart/add", payload, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      ui?.setCartOpen(true);
      setMsg("Agregado al carrito.");
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "No se pudo agregar al carrito.");
    }
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="panel muted">Cargando...</div>;
  if (error) return <div className="panel danger">{error}</div>;
  if (!p) return null;

  return (
    <div className="detail">
      <div className="detailMedia">
        {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="placeholder big">Sin imagen</div>}
      </div>
      <div className="detailBody">
        <Link to="/" className="muted">
          ← Volver
        </Link>
        <h2>{p.name}</h2>
        <div className="detailMeta">
          <span className="price">{priceLabel}</span>
          <span className="muted">{selectedVariant ? `${selectedVariant.stock} stock` : `${p.stock} stock`}</span>
        </div>
        {p.description ? <p className="muted">{p.description}</p> : null}

        <div className="panel">
          <div className="field">
            <label>Variante</label>
            <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {p.variants?.length ? (
                p.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.size} / {v.color} (stock: {v.stock})
                  </option>
                ))
              ) : (
                <option value="">Sin variantes</option>
              )}
            </select>
          </div>
          <div className="field">
            <label>Cantidad</label>
            <input type="number" min="1" max="50" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="row">
            <button
              className="btn"
              onClick={addToCart}
              disabled={!canAddToCart || Number(qty) < 1 || (selectedVariant && Number(qty) > selectedVariant.stock)}
            >
              Agregar al carrito
            </button>
            {!token ? (
              <Link className="btn ghost" to="/login">
                Entrar
              </Link>
            ) : null}
          </div>
          {selectedVariant && selectedVariant.stock <= 0 ? (
            <div className="danger">Esta variante no tiene stock disponible.</div>
          ) : null}
          {msg ? <div className="ok">{msg}</div> : null}
          {error ? <div className="danger">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}

