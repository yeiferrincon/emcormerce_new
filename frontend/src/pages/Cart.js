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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0); // 0: inicio, 1: seleccion metodo, 2: procesando, 3: completado
  const [paymentMethod, setPaymentMethod] = useState("");
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
      if (!token) {
        await createGuestSession();
      }
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

  async function updateQuantity(variantId, quantity) {
    try {
      const res = await api.put("/cart/update", { product_variant_id: variantId, quantity });
      setCart(res.data);
    } catch {
      setError("No se pudo actualizar la cantidad.");
    }
  }

  function handleCartUpdate(updatedCart) {
    setCart(updatedCart);
  }

  async function checkout() {
    setShowPaymentModal(true);
    setPaymentStep(0);
  }

  async function processPayment() {
    setError("");
    setRobotState(null);
    setLoading(true);
    setPaymentStep(2);
    try {
      if (!token) {
        await createGuestSession();
      }
      const response = await api.post("/orders");
      setPaymentStep(3);
      setRobotState("success");
      setTimeout(() => {
        setShowPaymentModal(false);
        navigate("/orders");
      }, 2000);
    } catch (e) {
      setPaymentStep(1);
      setRobotState("error");
      const errorMessage = e?.response?.data?.detail || e?.message || "No se pudo crear el pedido.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handlePaymentMethodSelect(method) {
    setPaymentMethod(method);
    setPaymentStep(1);
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
                <CartItem key={it.id} item={it} onRemove={remove} onUpdateQuantity={handleCartUpdate} />
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

      {showPaymentModal && (
        <div className="modalOverlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modalHeader">
              <h3>Proceso de Pago</h3>
              <button className="modalClose" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modalBody">
              {paymentStep === 0 && (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <h4>Resumen del Pedido</h4>
                    <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", marginTop: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Subtotal:</span>
                        <strong>{subtotalLabel}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Items:</span>
                        <strong>{cart?.items?.length || 0}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                        <span>Total:</span>
                        <span style={{ color: "#10b981" }}>{subtotalLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <h4>Selecciona el método de pago</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                      <button 
                        className="btn" 
                        onClick={() => handlePaymentMethodSelect("pse")}
                        style={{ 
                          background: "#f8fafc", 
                          border: "2px solid #e2e8f0", 
                          color: "#334155",
                          padding: "15px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "24px" }}>🏦</span>
                          <span>PSE</span>
                        </span>
                        <span>→</span>
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => handlePaymentMethodSelect("transferencia")}
                        style={{ 
                          background: "#f8fafc", 
                          border: "2px solid #e2e8f0", 
                          color: "#334155",
                          padding: "15px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "24px" }}>📱</span>
                          <span>Transferencia Bancaria</span>
                        </span>
                        <span>→</span>
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => handlePaymentMethodSelect("tarjeta")}
                        style={{ 
                          background: "#f8fafc", 
                          border: "2px solid #e2e8f0", 
                          color: "#334155",
                          padding: "15px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "24px" }}>💳</span>
                          <span>Tarjeta de Crédito/Débito</span>
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {paymentStep === 1 && (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <h4>Pago con {paymentMethod === "pse" ? "PSE" : paymentMethod === "transferencia" ? "Transferencia Bancaria" : "Tarjeta"}</h4>
                    <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", marginTop: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
                        <span>Total a pagar:</span>
                        <span style={{ color: "#10b981" }}>{subtotalLabel}</span>
                      </div>
                    </div>
                  </div>
                  {paymentMethod === "pse" && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Banco</label>
                        <select style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          <option value="">Selecciona tu banco</option>
                          <option value="bancolombia">Bancolombia</option>
                          <option value="davivienda">Davivienda</option>
                          <option value="bbva">BBVA</option>
                          <option value="bogota">Banco de Bogotá</option>
                          <option value="avvillas">Av Villas</option>
                          <option value="pichincha">Banco Pichincha</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Tipo de documento</label>
                        <select style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          <option value="cc">Cédula de Ciudadanía</option>
                          <option value="ce">Cédula de Extranjería</option>
                          <option value="ti">Tarjeta de Identidad</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Número de documento</label>
                        <input type="text" placeholder="Ingresa tu número de documento" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                      </div>
                    </div>
                  )}
                  {paymentMethod === "transferencia" && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ background: "#e0f2fe", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
                        <p style={{ margin: "0", fontSize: "14px" }}><strong>Banco:</strong> Bancolombia</p>
                        <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Cuenta:</strong> 123-456789-0</p>
                        <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Tipo:</strong> Ahorros</p>
                        <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Titular:</strong> RobotRopaShop SAS</p>
                      </div>
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Número de referencia</label>
                        <input type="text" placeholder="Ingresa el número de referencia de la transferencia" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                      </div>
                    </div>
                  )}
                  {paymentMethod === "tarjeta" && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Número de tarjeta</label>
                        <input type="text" placeholder="0000 0000 0000 0000" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Fecha expiración</label>
                          <input type="text" placeholder="MM/AA" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>CVV</label>
                          <input type="text" placeholder="123" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Nombre en la tarjeta</label>
                        <input type="text" placeholder="Como aparece en la tarjeta" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn" onClick={() => setPaymentStep(0)} style={{ flex: 1, background: "#64748b" }}>
                      Volver
                    </button>
                    <button className="btn" onClick={processPayment} disabled={loading} style={{ flex: 1 }}>
                      {loading ? "Procesando..." : "Confirmar Pago"}
                    </button>
                  </div>
                </div>
              )}
              {paymentStep === 2 && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <img src={robot3} alt="Procesando" style={{ width: "120px", height: "120px", marginBottom: "20px" }} />
                  <h4>Procesando Pago</h4>
                  <p className="muted">Por favor espera mientras procesamos tu pedido...</p>
                </div>
              )}
              {paymentStep === 3 && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                    <img src={robotSuccess} alt="Éxito" style={{ width: "120px", height: "120px" }} />
                  </div>
                  <h4>¡Pago Completado!</h4>
                  <p className="muted">Tu pedido ha sido creado exitosamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

