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
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [cancellationComment, setCancellationComment] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});

  const fmt = useMemo(() => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }), []);
  const isAdmin = user?.role === "admin";

  // Función para obtener el paso actual del proceso según el estado
  const getProcessStep = (status) => {
    const steps = ["paid", "processing", "shipped", "delivered"];
    const stepIndex = steps.indexOf(status);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  // Función para obtener el nombre del estado en español
  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      paid: "Pagado",
      processing: "Despachando",
      cancelled: "Cancelado",
      shipped: "Enviado",
      delivered: "Entregado",
      duplicated: "Duplicado",
    };
    return labels[status] || status;
  };

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      paid: "#3b82f6",
      cancelled: "#ef4444",
      shipped: "#8b5cf6",
      delivered: "#10b981",
      duplicated: "#6366f1",
    };
    return colors[status] || "#64748b";
  };

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/orders");
      setItems(res.data || []);

      // Determinar robot según estado de pedidos
      if (res.data && res.data.length > 0) {
        const hasPending = res.data.some(o => o.status === "pending" || o.status === "paid" || o.status === "processing");
        const hasCompleted = res.data.some(o => o.status === "delivered");
        const hasFailed = res.data.some(o => o.status === "failed");

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

  async function updateOrderStatus(orderId, newStatus, cancellationComment = null) {
    setUpdatingStatus(orderId);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'cancelled' && cancellationComment) {
        payload.cancellation_comment = cancellationComment;
      }
      const res = await api.put(`/orders/${orderId}/status`, payload);
      // Actualizar el pedido en la lista local
      setItems(items.map(item => item.id === orderId ? res.data : item));
    } catch (e) {
      setError("No se pudo actualizar el estado del pedido.");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function duplicateOrder(orderId) {
    setUpdatingStatus(orderId);
    try {
      const res = await api.post(`/orders/${orderId}/duplicate`);
      // Actualizar el estado usando el valor más reciente
      setItems(prevItems => {
        // Actualizar el pedido duplicado
        const updatedItems = prevItems.map(item => 
          item.id === orderId ? { ...item, status: 'duplicated' } : item
        );
        // Agregar el nuevo pedido al inicio
        return [res.data, ...updatedItems];
      });
    } catch (e) {
      setError("No se pudo duplicar el pedido.");
    } finally {
      setUpdatingStatus(null);
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
      <h2>Pedidos {items.length > 0 && <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "normal" }}>({items.length})</span>}</h2>
      {items.length ? (
        <div className="stack">
          {items.map((o) => (
            <div key={o.id} className="panel">
              <div className="row" style={{ marginBottom: "12px" }}>
                <strong style={{ fontSize: "18px" }}>Pedido #{o.id}</strong>
                <span className="chip" style={{ background: getStatusColor(o.status), color: "white" }}>{getStatusLabel(o.status)}</span>
              </div>
              {isAdmin && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["paid", "processing", "shipped", "delivered", "cancelled"].map((status) => {
                      // No mostrar botón de cancelar si el pedido ya está entregado o duplicado
                      if (status === 'cancelled' && (o.status === 'delivered' || o.status === 'duplicated')) {
                        return null;
                      }
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            if (status === 'cancelled') {
                              setShowCommentInput({ ...showCommentInput, [o.id]: true });
                            } else {
                              updateOrderStatus(o.id, status);
                            }
                          }}
                          disabled={updatingStatus === o.id}
                          className="btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            background: o.status === status ? getStatusColor(status) : "#f8fafc",
                            color: o.status === status ? "white" : "#334155",
                            border: `1px solid ${getStatusColor(status)}`,
                            opacity: updatingStatus === o.id ? 0.5 : 1
                          }}
                        >
                          {getStatusLabel(status)}
                        </button>
                      );
                    })}
                  </div>
                  {showCommentInput[o.id] && (
                    <div style={{ marginTop: "8px" }}>
                      <textarea
                        placeholder="Comentario de cancelación..."
                        value={cancellationComment[o.id] || ''}
                        onChange={(e) => setCancellationComment({ ...cancellationComment, [o.id]: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "4px",
                          marginBottom: "8px",
                          minHeight: "60px"
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => {
                            updateOrderStatus(o.id, 'cancelled', cancellationComment[o.id]);
                            setShowCommentInput({ ...showCommentInput, [o.id]: false });
                          }}
                          className="btn"
                          style={{ background: "#ef4444", color: "white" }}
                        >
                          Confirmar Cancelación
                        </button>
                        <button
                          onClick={() => setShowCommentInput({ ...showCommentInput, [o.id]: false })}
                          className="btn ghost"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="row" style={{ marginBottom: "12px" }}>
                <span className="muted">{new Date(o.created_at).toLocaleString("es-CO")}</span>
                <strong style={{ fontSize: "20px", color: "#10b981" }}>{fmt.format(o.total_price)}</strong>
              </div>
              
              {/* Mostrar comentario de cancelación si existe */}
              {o.status === 'cancelled' && o.cancellation_comment && (
                <div style={{
                  marginBottom: "12px",
                  padding: "8px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}>
                  <strong style={{ color: "#dc2626" }}>Motivo de cancelación:</strong>
                  <p style={{ margin: "4px 0 0 0", color: "#991b1b" }}>{o.cancellation_comment}</p>
                </div>
              )}

              {/* Mostrar comentario en pedidos duplicados */}
              {o.status === 'duplicated' && o.cancellation_comment && (
                <div style={{
                  marginBottom: "12px",
                  padding: "8px",
                  background: "#e0e7ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}>
                  <strong style={{ color: "#4338ca" }}>Comentario:</strong>
                  <p style={{ margin: "4px 0 0 0", color: "#3730a3" }}>{o.cancellation_comment}</p>
                </div>
              )}

              {/* Botón de duplicación para pedidos cancelados */}
              {o.status === 'cancelled' && (
                <div style={{ marginBottom: "12px" }}>
                  <button
                    onClick={() => duplicateOrder(o.id)}
                    disabled={updatingStatus === o.id}
                    className="btn"
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      padding: "8px 16px",
                      fontSize: "14px",
                      opacity: updatingStatus === o.id ? 0.5 : 1
                    }}
                  >
                    {updatingStatus === o.id ? "Duplicando..." : "Duplicar pedido"}
                  </button>
                </div>
              )}

              {/* Indicador para pedidos duplicados */}
              {o.status === 'duplicated' && (
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#6366f1", fontWeight: "600" }}>
                    ✓ Este pedido fue duplicado
                  </span>
                </div>
              )}

              {/* Mostrar referencia al pedido original en pedidos duplicados */}
              {o.original_order_id && (
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    (Duplicado del pedido #{o.original_order_id})
                  </span>
                </div>
              )}
              
              {/* Timeline del proceso */}
              {o.status !== 'cancelled' && o.status !== 'duplicated' && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Estado del pedido:</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {["paid", "processing", "shipped", "delivered"].map((step, idx) => {
                      const currentStep = getProcessStep(o.status);
                      const isCompleted = idx < currentStep;
                      const isActive = idx === currentStep;
                      const isPending = idx > currentStep;
                      const isCancelled = o.status === "cancelled";
                    
                    return (
                      <React.Fragment key={step}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                          <div 
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontWeight: "600",
                              background: isCancelled ? "#ef4444" : (isCompleted ? "#10b981" : (isActive ? getStatusColor(o.status) : "#e2e8f0")),
                              color: isCancelled || isCompleted || isActive ? "white" : "#64748b",
                              border: "2px solid",
                              borderColor: isCancelled ? "#ef4444" : (isCompleted ? "#10b981" : (isActive ? getStatusColor(o.status) : "#e2e8f0"))
                            }}
                          >
                            {isCompleted ? "✓" : (idx + 1)}
                          </div>
                          <div style={{ fontSize: "11px", marginTop: "4px", color: "#64748b" }}>
                            {getStatusLabel(step)}
                          </div>
                        </div>
                        {idx < 3 && (
                          <div 
                            style={{
                              flex: 1,
                              height: "2px",
                              background: isCancelled ? "#ef4444" : (isCompleted ? "#10b981" : "#e2e8f0")
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ fontSize: "14px" }}>Items del pedido:</strong>
              </div>
              {o.items && o.items.length > 0 ? (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                  {o.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: idx < o.items.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                      <div>
                        <div style={{ fontWeight: "600" }}>{item.product_name || item.variant?.product?.name || "Producto"}</div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                          {item.variant_size || item.variant?.size || "N/A"} / {item.variant_color || item.variant?.color || "N/A"} x{item.quantity}
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

