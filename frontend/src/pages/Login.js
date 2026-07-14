import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import robotSaludando from "../Img/RobotRopaShop_4_Saludando.png";
import robotPensando from "../Img/RobotRopaShop_3_Pensando.png";
import robotExito from "../Img/RobotRopaShop_2_Con_Exito.png";
import robotError from "../Img/RobotRopaShop_5_Con_Error.png";
import robotPasswordHidden from "../Img/RobotRopaShop_6_contraseña oculta.png";
import robotPasswordVisible from "../Img/RobotRopaShop_7_mostrar contraseña.png";
import robotPasswordUpdate from "../Img/RobotRopaShop_8_actualizar contraseña.png";
import robotIcon from "../Img/RobotRopaShop_1.png";
import robot2 from "../Img/RobotRopaShop_2_Con_Exito.png";
import robot3 from "../Img/RobotRopaShop_3_Pensando.png";
import robot4 from "../Img/RobotRopaShop_4_Saludando.png";
import robot5 from "../Img/RobotRopaShop_5_Con_Error.png";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [robotState, setRobotState] = useState("saludando");
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState("");
  const [showRobotModal, setShowRobotModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRobotState("exito");
    try {
      await login(email, password);
      setTimeout(() => {
        navigate(location.state?.from || "/");
      }, 1000);
    } catch (e2) {
      setRobotState("error");
      setError(e2?.response?.data?.detail || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
    setActiveField("email");
    setRobotState("pensando");
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    setActiveField("password");
    if (!showPassword) {
      setRobotState("passwordHidden");
    } else {
      setRobotState("passwordVisible");
    }
  }

  function togglePasswordVisibility() {
    const newShowPassword = !showPassword;
    setShowPassword(newShowPassword);
    if (activeField === "password" || password) {
      if (newShowPassword) {
        setRobotState("passwordVisible");
      } else {
        setRobotState("passwordHidden");
      }
    }
  }

  function handleBlur() {
    setActiveField("");
    if (!email && !password) {
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
      case "passwordHidden":
        return robotPasswordHidden;
      case "passwordVisible":
        return robotPasswordVisible;
      case "passwordUpdate":
        return robotPasswordUpdate;
      default:
        return robotSaludando;
    }
  }

  function getRobotPosition() {
    if (robotState === "exito") {
      return "left";
    }
    if (robotState === "error") {
      return "left";
    }
    if (robotState === "passwordHidden" || robotState === "passwordVisible" || robotState === "passwordUpdate") {
      return "right";
    }
    return "left";
  }

  return (
    <div className="auth">
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
            </div>
          </div>
        </div>
      )}
      <div className="panel authCard">
        <h2>Entrar</h2>
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              value={email}
              onChange={handleEmailChange}
              onBlur={handleBlur}
              type="email"
              required
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                value={password}
                onChange={handlePasswordChange}
                onBlur={handleBlur}
                type={showPassword ? "text" : "password"}
                required
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text)",
                  fontSize: "16px"
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <button className="btn" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error ? <div className="danger">{error}</div> : null}
        </form>
        <p className="muted">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

