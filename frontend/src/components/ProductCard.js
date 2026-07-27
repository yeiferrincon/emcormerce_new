import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProductCard({ p, onEditVariants, onDelete }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  console.log("ProductCard - User:", user);
  console.log("ProductCard - isAdmin:", isAdmin);
  console.log("ProductCard - Product:", p);

  return (
    <div className="card">
      <Link to={`/products/${p.id}`} className="cardMedia">
        {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" /> : <div className="placeholder">Sin imagen</div>}
      </Link>
      <div className="cardBody">
        <div className="cardTitle">{p.name}</div>
        <div className="cardMeta">
          <span className="price">
            {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(p.price)}
          </span>
          <span className="muted">{p.stock} stock</span>
        </div>
        {/* Mostrar mensaje inmediato si no hay stock */}
        {((p.stock || 0) <= 0) ? (
          <div className="danger" style={{ marginTop: 8 }}>
            {p.description && String(p.description).includes("Agotado")
              ? "Agotado"
              : "Agotado."}
          </div>
        ) : null}
        {isAdmin && (
          <div className="cardActions">
            <button className="btn small" onClick={() => onEditVariants && onEditVariants(p)}>
              Variantes
            </button>
            <button className="btn small danger" onClick={() => onDelete && onDelete(p)}>
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

