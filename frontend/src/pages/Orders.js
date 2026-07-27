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
import robotPedidoCamino from "../Img/robotRopaShop_pedido_Camino.png";

export default function Orders() {
  const { user, isAuthReady } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRobotModal, setShowRobotModal] = useState(false);
  const [mainRobot, setMainRobot] = useState(robotThinking);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [comment, setComment] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const [pendingStatus, setPendingStatus] = useState({});

  const fmt = useMemo(() => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }), []);
  const isAdmin = user?.role === "admin";

  // Función para obtener el paso actual del proceso según el estado
  const getProcessStep = (status) => {
    const steps = ["paid", "delivered"];
    const stepIndex = steps.indexOf(status);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  // Función para obtener el nombre del estado en español
  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      paid: "Pagado",
      cancelled: "Cancelado",
      delivered: "Entregado",
    };
    return labels[status] || status;
  };

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      paid: "#3b82f6",
      cancelled: "#ef4444",
      delivered: "#10b981",
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

  async function updateOrderStatus(orderId, newStatus, comment = null) {
    setUpdatingStatus(orderId);
    try {
      const payload = { status: newStatus };
      if (comment) {
        payload.cancellation_comment = comment;
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


  useEffect(() => {
    if (user && isAuthReady) {
      load();
    }
  }, [user, isAuthReady]);

  useEffect(() => {
    if (user && isAuthReady) {
      // Conectar WebSocket para actualizaciones en tiempo real
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
        const wsUrl = `${wsProtocol}//${wsHost}/ws/${user.id}`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'order_status_changed') {
              // Recargar pedidos cuando el admin cambie el estado
              load();
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };
        
        ws.onerror = (error) => {
          // Silenciar errores de WebSocket - la app funciona sin ellos
          console.debug('WebSocket connection issue (non-critical):', error);
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
        };
        
        return () => {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        };
      } catch (e) {
        console.debug('Failed to initialize WebSocket (non-critical):', e);
      }
    }
  }, [user, isAuthReady]);

  if (loading) return <div className="panel muted">Cargando...</div>;
  if (error) return <div className="panel danger">{error}</div>;

  return (
    <div className="stack">
      <img
        src={mainRobot}
        alt="Robot Estado"
        className="robotRopaShopRight"
      />
      {(items.some(o => o.status === 'paid' || o.status === 'delivered')) && (
        <img
          src={robotPedidoCamino}
          alt="Pedido en camino"
          className="robotRopaShopLeft"
          style={{
            position: "fixed",
            left: "2%",
            top: "55%",
            transform: "translateY(-50%)",
            width: "320px",
            height: "320px",
            objectFit: "contain",
            zIndex: "10",
            transition: "all 0.3s ease",
            animation: "float 3s ease-in-out infinite"
          }}
        />
      )}
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
              <div className="robotItem">
                <img src={robotPedidoCamino} alt="Robot 9 - Pedido en Camino" onError={(e) => { console.error('Error cargando imagen pedido camino:', e); e.target.style.display = 'none'; }} />
                <p>Pedido en Camino</p>
              </div>
            </div>
            <div className="robotContactInfo">
              <h3>Contacto</h3>
              <p>📍 Colombia</p>
              <p>📞 +57 300 123 4567</p>
              <p>✉ contacto@ropashop.com</p>
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
              {(o.shipping_address || o.shipping_phone || o.user_name) && (
                <div style={{ 
                  marginBottom: "12px", 
                  padding: "10px", 
                  background: "#f8fafc", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "6px",
                  fontSize: "13px"
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "6px", color: "#475569" }}>
                    📦 Información de Envío:
                  </div>
                  {o.user_name && (
                    <div style={{ marginBottom: "4px" }}>
                      <span style={{ color: "#64748b" }}>Nombre:</span> {o.user_name}
                    </div>
                  )}
                  {o.shipping_address && (
                    <div style={{ marginBottom: "4px" }}>
                      <span style={{ color: "#64748b" }}>Dirección:</span> {o.shipping_address}
                    </div>
                  )}
                  {o.shipping_phone && (
                    <div>
                      <span style={{ color: "#64748b" }}>Teléfono:</span> {o.shipping_phone}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["paid", "delivered", "cancelled"].map((status) => {
                      // No mostrar botón de cancelar si el pedido ya está entregado
                      if (status === 'cancelled' && o.status === 'delivered') {
                        return null;
                      }
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            if (status === 'cancelled' || status === 'delivered') {
                              setPendingStatus({ ...pendingStatus, [o.id]: status });
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
                        placeholder={pendingStatus[o.id] === 'delivered' ? "Número de guía de envío..." : "Comentario de cancelación..."}
                        value={comment[o.id] || ''}
                        onChange={(e) => setComment({ ...comment, [o.id]: e.target.value })}
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
                            updateOrderStatus(o.id, pendingStatus[o.id], comment[o.id]);
                            setShowCommentInput({ ...showCommentInput, [o.id]: false });
                            setPendingStatus({ ...pendingStatus, [o.id]: null });
                          }}
                          className="btn"
                          style={{ background: pendingStatus[o.id] === 'delivered' ? "#10b981" : "#ef4444", color: "white" }}
                        >
                          {pendingStatus[o.id] === 'delivered' ? 'Confirmar Entrega' : 'Confirmar Cancelación'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCommentInput({ ...showCommentInput, [o.id]: false });
                            setPendingStatus({ ...pendingStatus, [o.id]: null });
                          }}
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
              
              {/* Mostrar mensaje de cancelación específico para usuarios */}
              {o.status === 'cancelled' && !isAdmin && (
                <div style={{
                  marginBottom: "12px",
                  padding: "16px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}>
                  <strong style={{ color: "#dc2626", fontSize: "16px" }}>Motivo de la cancelación:</strong>
                  <p style={{ margin: "8px 0 0 0", color: "#991b1b", lineHeight: "1.6" }}>
                    Su pedido ha sido cancelado debido a que no fue posible confirmar el pago correspondiente dentro del tiempo establecido para el despacho.
                  </p>
                  <p style={{ margin: "8px 0 0 0", color: "#991b1b", lineHeight: "1.6" }}>
                    En caso de que el pago sí haya sido realizado, el valor será reembolsado al mismo medio de pago en un plazo de hasta 20 días hábiles.
                  </p>
                  <p style={{ margin: "8px 0 0 0", color: "#991b1b", lineHeight: "1.6" }}>
                    Si tiene alguna inquietud o requiere más información, puede comunicarse con nuestro equipo de atención al cliente al <strong>555 555 555</strong> o escribir al correo <strong>RopaShop@gmail.com</strong>.
                  </p>
                </div>
              )}

              {/* Mostrar comentario de cancelación para admin */}
              {o.status === 'cancelled' && isAdmin && o.cancellation_comment && (
                <div style={{
                  marginBottom: "12px",
                  padding: "8px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}>
                  <strong style={{ color: "#dc2626" }}>Comentario de cancelación:</strong>
                  <p style={{ margin: "4px 0 0 0", color: "#991b1b" }}>{o.cancellation_comment}</p>
                </div>
              )}


              {/* Mostrar número de guía para pedidos entregados */}
              {o.status === 'delivered' && (
                <div style={{
                  marginBottom: "12px",
                  padding: "12px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "20px", marginRight: "8px" }}>✅</span>
                    <strong style={{ color: "#059669" }}>¡Tu pedido ha sido despachado con éxito!</strong>
                  </div>
                  <p style={{ margin: "4px 0 0 0", color: "#065f46" }}>
                    Tu pedido ya fue enviado y está en camino a la dirección: <strong>{o.shipping_address}</strong>
                  </p>
                  {o.cancellation_comment && (
                    <div style={{ marginTop: "8px", padding: "8px", background: "#d1fae5", borderRadius: "4px" }}>
                      <strong style={{ color: "#047857" }}>Número de guía para rastreo:</strong>
                      <div style={{ 
                        marginTop: "4px", 
                        fontSize: "16px", 
                        fontWeight: "bold", 
                        color: "#065f46",
                        fontFamily: "monospace"
                      }}>
                        #{o.cancellation_comment}
                      </div>
                    </div>
                  )}
                  <p style={{ margin: "8px 0 0 0", color: "#065f46", fontSize: "13px" }}>
                    Utiliza este número para consultar el estado de tu envío en la página de la transportadora Enca24
                  </p>
                  <p style={{ margin: "4px 0 0 0", color: "#047857", fontWeight: "600" }}>
                    ¡Gracias por tu compra!
                  </p>
                </div>
              )}


              {/* Timeline del proceso */}
              {o.status !== 'cancelled' && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Estado del pedido:</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {["paid", "delivered"].map((step, idx) => {
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

