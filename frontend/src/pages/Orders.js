import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import robotIcon from "../Img/RobotRopaShop_1.png";
import robot2 from "../Img/RobotRopaShop_2_Con_Exito.png";
import robot3 from "../Img/RobotRopaShop_3_Pensando.png";
import robot4 from "../Img/RobotRopaShop_4_Saludando.png";
import robot5 from "../Img/RobotRopaShop_5_Con_Error.png";
import robot6 from "../Img/RobotRopaShop_6_contraseña oculta.png";
import robot7 from "../Img/RobotRopaShop_7_mostrar contraseña.png";
import robot8 from "../Img/RobotRopaShop_8_actualizar contraseña.png";
import robotSuccess from "../Img/RobotRopaShop_2_Con_Exito.png";
import robotError from "../Img/RobotRopaShop_5_Con_Error.png";
import robotThinking from "../Img/RobotRopaShop_3_Pensando.png";

export default function Orders() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRobotModal, setShowRobotModal] = useState(false);
  const [mainRobot, setMainRobot] = useState(robotThinking);

  const fmt = useMemo(() => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }), []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/orders");
      setItems(res.data || []);

      // Determinar robot según estado de pedidos
      if (res.data && res.data.length > 0) {
        const hasPending = res.data.some(o => o.status === "pending");
        const hasCompleted = res.data.some(o => o.status === "completed");
        const hasFailed = res.data.some(o => o.status === "failed" || o.status === "cancelled");

        if (hasFailed) {
          setMainRobot(robotError);
        } else if (hasCompleted) {
          setMainRobot(robotSuccess);
        } else if (hasPending) {
          setMainRobot(robotThinking);
        } else {
          setMainRobot(robotThinking);
        }
      } else {
        setMainRobot(robotThinking);
      }
    } catch {
      setError("No se pudieron cargar los pedidos.");
      setMainRobot(robotError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  if (loading) return <div className="panel muted">Cargando...</div>;
  if (error) return <div className="panel danger">{error}</div>;

  return (
    <div className="stack">
      <img
        src={mainRobot}
        alt="Robot Estado"
        className="robotRopaShopRight"
      />
      <img
        src={robotIcon}
        alt="Robot Icon"
        className="robotIconMobile"
        onClick={() => setShowRobotModal(true)}
        title="Conoce la mascota de nuestra compañía"
      />
      {showRobotModal && (
        <div className="robotModal" onClick={() => setShowRobotModal(false)}>
          <div className="robotModalContent" onClick={(e) => e.stopPropagation()}>
            <button className="robotModalClose" onClick={() => setShowRobotModal(false)}>×</button>
            <h2>Conoce a nuestra mascota</h2>
            <div className="robotGallery">
              <div className="robotItem">
                <img src={robotIcon} alt="Robot 1" />
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
      <h2>Pedidos</h2>
      {items.length ? (
        <div className="stack">
          {items.map((o) => (
            <div key={o.id} className="panel">
              <div className="row" style={{ marginBottom: "12px" }}>
                <strong style={{ fontSize: "18px" }}>Pedido #{o.id}</strong>
                <span className="chip">{o.status}</span>
              </div>
              <div className="row" style={{ marginBottom: "12px" }}>
                <span className="muted">{new Date(o.created_at).toLocaleString("es-CO")}</span>
                <strong style={{ fontSize: "20px", color: "#10b981" }}>{fmt.format(o.total_price)}</strong>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ fontSize: "14px" }}>Items del pedido:</strong>
              </div>
              {o.items && o.items.length > 0 ? (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                  {o.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: idx < o.items.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                      <div>
                        <div style={{ fontWeight: "600" }}>{item.product_name || "Producto"}</div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                          {item.variant_size || "N/A"} / {item.variant_color || "N/A"} x{item.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: "600" }}>{fmt.format(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted">No hay items en este pedido</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="panel muted">Aún no tienes pedidos.</div>
      )}
    </div>
  );
}

