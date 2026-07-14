import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import CartItem from "../components/CartItem";
import robotSuccess from "../Img/RobotRopaShop_2_Con_Exito.png";
import robotError from "../Img/RobotRopaShop_5_Con_Error.png";
import robotIcon from "../Img/RobotRopaShop_1.png";
import robotImage from "../Img/RobotRopaShop_1.png";
import robot2 from "../Img/RobotRopaShop_2_Con_Exito.png";
import robot3 from "../Img/RobotRopaShop_3_Pensando.png";
import robot4 from "../Img/RobotRopaShop_4_Saludando.png";
import robot5 from "../Img/RobotRopaShop_5_Con_Error.png";
import robot6 from "../Img/RobotRopaShop_6_contraseña oculta.png";
import robot7 from "../Img/RobotRopaShop_7_mostrar contraseña.png";
import robot8 from "../Img/RobotRopaShop_8_actualizar contraseña.png";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [robotState, setRobotState] = useState(null); // 'success' | 'error' | null
  const [showRobotModal, setShowRobotModal] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const subtotalLabel = useMemo(() => {
    const v = cart?.subtotal || 0;
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v);
  }, [cart]);

  async function load() {
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

  async function checkout() {
    setError("");
    setRobotState(null);
    setLoading(true);
    try {
      await api.post("/orders");
      setRobotState("success");
      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    } catch (e) {
      setRobotState("error");
      setError(e?.response?.data?.detail || "No se pudo crear el pedido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  if (loading) return <div className="panel muted">Cargando...</div>;

  return (
    <div className="stack">
      {!robotState && <img src={robotImage} alt="Robot RopaShop" className="robotRopaShop" />}
      <img
        src={robotIcon}
        alt="Robot Icon"
        className="robotIconMobile"
        onClick={() => setShowRobotModal(true)}
        title="Conoce la mascota de nuestra compañía"
      />
      <h2>Carrito</h2>

      {robotState && (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <img
              src={robotState === "success" ? robotSuccess : robotError}
              alt={robotState === "success" ? "Éxito" : "Error"}
              style={{ width: "150px", height: "150px" }}
            />
          </div>
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>
            {robotState === "success" ? "¡Pedido creado exitosamente!" : "Error al crear el pedido"}
          </p>
          {robotState === "error" && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
              <button className="btn" onClick={() => { setRobotState(null); setError(""); }}>
                Volver a ver carrito
              </button>
            </div>
          )}
        </div>
      )}

      {!robotState && (
        <>
          {error && <div className="panel danger">{error}</div>}

          {cart?.items?.length ? (
            <div className="panel">
              {cart.items.map((it) => (
                <CartItem key={it.id} item={it} onRemove={remove} />
              ))}
            </div>
          ) : (
            <div className="panel muted">Tu carrito está vacío.</div>
          )}

          <div className="panel">
            <div className="row">
              <span className="muted">Subtotal</span>
              <strong>{subtotalLabel}</strong>
            </div>
            <button className="btn" onClick={checkout} disabled={!cart?.items?.length}>
              Crear pedido (pago simulado)
            </button>
          </div>
        </>
      )}

      {showRobotModal && (
        <div className="robotModal" onClick={() => setShowRobotModal(false)}>
          <div className="robotModalContent" onClick={(e) => e.stopPropagation()}>
            <button className="robotModalClose" onClick={() => setShowRobotModal(false)}>×</button>
            <h2>Conoce a nuestra mascota</h2>
            <div className="robotGallery">
              <div className="robotItem">
                <img src={robotImage} alt="Robot 1" />
                <p>Robot Base</p>
              </div>
              <div className="robotItem">
                <img src={robot2} alt="Robot 2 - Con Éxito" />
                <p>Con Éxito</p>
              </div>
              <div className="robotItem">
                <img src={robot3} alt="Robot 3 - Pensando" />
                <p>Pensando</p>
              </div>
              <div className="robotItem">
                <img src={robot4} alt="Robot 4 - Saludando" />
                <p>Saludando</p>
              </div>
              <div className="robotItem">
                <img src={robot5} alt="Robot 5 - Con Error" />
                <p>Con Error</p>
              </div>
              <div className="robotItem">
                <img src={robot6} alt="Robot 6 - Contraseña Oculta" />
                <p>Contraseña Oculta</p>
              </div>
              <div className="robotItem">
                <img src={robot7} alt="Robot 7 - Mostrar Contraseña" />
                <p>Mostrar Contraseña</p>
              </div>
              <div className="robotItem">
                <img src={robot8} alt="Robot 8 - Actualizar Contraseña" />
                <p>Actualizar Contraseña</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

