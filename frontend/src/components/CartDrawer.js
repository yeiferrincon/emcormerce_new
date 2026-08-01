import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import CartItem from "./CartItem";

export default function CartDrawer({ open, onClose }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotalLabel = useMemo(() => {
    const v = cart?.subtotal || 0;
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v);
  }, [cart]);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/cart");
      setCart(res.data);
    } catch {
      setError("No se pudo cargar el carrito.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(variantId) {
    try {
      const res = await api.delete("/cart/remove", { data: { product_variant_id: variantId } });
      setCart(res.data);
    } catch {
      setError("No se pudo eliminar el item.");
    }
  }

  function handleCartUpdate(updatedCart) {
    console.log("Actualizando carrito en drawer:", updatedCart);
    setCart({ ...updatedCart });
  }

  useEffect(() => {
    if (open && token) {
      load();
    }
  }, [open, token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <div className="drawerOverlay" onMouseDown={onClose} role="presentation">
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawerHeader">
          <div className="drawerTitle">Carrito</div>
          <button className="iconBtn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {!token ? (
          <div className="panel">
            <p className="muted">Inicia sesión para comprar.</p>
            <Link className="btn" to="/login" onClick={onClose}>
              Entrar
            </Link>
          </div>
        ) : loading ? (
          <div className="panel muted">Cargando...</div>
        ) : error ? (
          <div className="panel danger">{error}</div>
        ) : (
          <>
            <div className="drawerBody">
              {cart?.items?.length ? cart.items.map((it) => <CartItem key={`${it.id}-${it.quantity}`} item={it} onRemove={remove} onUpdateQuantity={handleCartUpdate} />) : <div className="panel muted">Tu carrito está vacío.</div>}
            </div>
            <div className="drawerFooter">
              <div className="row">
                <span className="muted">Subtotal</span>
                <strong>{subtotalLabel}</strong>
              </div>
              <div className="row">
                <Link className="btn ghost" to="/cart" onClick={onClose}>
                  Ver carrito
                </Link>
                <button className="btn" onClick={() => { onClose(); navigate("/cart"); }} disabled={!cart?.items?.length}>
                  Continuar
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

