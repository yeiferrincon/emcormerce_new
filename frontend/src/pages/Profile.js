import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import robotSaludando from "../Img/RobotRopaShop_4_Saludando.png";
import robotPensando from "../Img/RobotRopaShop_3_Pensando.png";
import robotExito from "../Img/RobotRopaShop_2_Con_Exito.png";
import robotError from "../Img/RobotRopaShop_5_Con_Error.png";
import robotIcon from "../Img/RobotRopaShop_1.png";
import robotPasswordHidden from "../Img/RobotRopaShop_6_contraseña oculta.png";
import robotPasswordVisible from "../Img/RobotRopaShop_7_mostrar contraseña.png";
import robotPasswordUpdate from "../Img/RobotRopaShop_8_actualizar contraseña.png";
import robotPedidoCamino from "../Img/robotRopaShop_pedido_Camino.png";
import robot2 from "../Img/RobotRopaShop_2_Con_Exito.png";
import robot3 from "../Img/RobotRopaShop_3_Pensando.png";
import robot4 from "../Img/RobotRopaShop_4_Saludando.png";
import robot5 from "../Img/RobotRopaShop_5_Con_Error.png";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [robotState, setRobotState] = useState("saludando");
  const [showRobotModal, setShowRobotModal] = useState(false);

  const userRoleText = user?.role === "admin" ? "Administrador" : "Cliente";

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    setRobotState("pensando");
    try {
      const res = await api.put("/auth/profile", {
        name,
        phone: phone || null,
        address: address || null,
      });
      updateUser(res.data);
      setRobotState("exito");
      setSuccess("¡Perfil actualizado con éxito!");
      setTimeout(() => {
        setRobotState("saludando");
      }, 2000);
    } catch (err) {
      setRobotState("error");
      setError(err?.response?.data?.detail || "No se pudo actualizar el perfil.");
      setTimeout(() => {
        setRobotState("saludando");
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange() {
    if (name || phone || address) {
      setRobotState("pensando");
    } else {
      setRobotState("saludando");
    }
  }

  function getRobotImage() {
    switch (robotState) {
      case "pensando":
        return robotPensando;
      case "exito":
        return robotExito;
      case "error":
        return robotError;
      default:
        return robotSaludando;
    }
  }

  function getRobotPosition() {
    return "left";
  }

  return (
    <div className="auth" style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <img
        src={getRobotImage()}
        alt="Robot"
        className={`authRobot authRobot${getRobotPosition()}`}
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
                <img src={robotPasswordHidden} alt="Robot 6 - Contraseña Oculta" />
                <p>Contraseña Oculta</p>
              </div>
              <div className="robotItem">
                <img src={robotPasswordVisible} alt="Robot 7 - Mostrar Contraseña" />
                <p>Mostrar Contraseña</p>
              </div>
              <div className="robotItem">
                <img src={robotPasswordUpdate} alt="Robot 8 - Actualizar Contraseña" />
                <p>Actualizar Contraseña</p>
              </div>
              <div className="robotItem">
                <img src={robotPedidoCamino} alt="Robot 9 - Pedido en Camino" />
                <p>Pedido en Camino</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="panel authCard">
        <h2>Mi Perfil</h2>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="muted">Tipo de Cuenta:</span>
          <span className="chip" style={{ background: user?.role === "admin" ? "#ffd700" : "#00bcd4", color: "#000", fontWeight: "bold" }}>
            {userRoleText}
          </span>
        </div>

        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label>Correo Electrónico (No editable)</label>
            <input value={user?.email || ""} type="email" disabled style={{ opacity: 0.7, cursor: "not-allowed" }} />
          </div>

          <div className="field">
            <label>Nombre Completo</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                handleInputChange();
              }}
              required
              placeholder="Tu nombre"
            />
          </div>

          <div className="field">
            <label>Celular / Teléfono</label>
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                handleInputChange();
              }}
              placeholder="Ej: +57 300 123 4567"
            />
          </div>

          <div className="field">
            <label>Dirección de Envío</label>
            <textarea
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                handleInputChange();
              }}
              placeholder="Calle, Número, Apto, Ciudad"
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "14px",
                border: "1px solid var(--line)",
                background: "rgba(255,255,255,.06)",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: "14px"
              }}
            />
          </div>

          <button className="btn" disabled={loading} style={{ width: "100%", marginTop: "1rem" }}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>

          {success ? <div style={{ color: "var(--ok)", backgroundColor: "rgba(81, 207, 102, 0.1)", border: "1px solid var(--ok)", padding: "0.75rem", borderRadius: "14px", textAlign: "center", fontWeight: "600" }}>{success}</div> : null}
          {error ? <div className="danger" style={{ textAlign: "center" }}>{error}</div> : null}
        </form>
      </div>
    </div>
  );
}
