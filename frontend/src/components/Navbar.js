import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../Img/Logo.png";

export default function Navbar({ ui }) {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="nav">
      <div className="container navInner">
        <Link to="/" className="brand">
          <img src={logo} alt="RopaShop" className="logo" />
        </Link>
        <nav className="navLinks">
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Productos
          </NavLink>
          {token ? (
            <>
              <NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>
                Pedidos
              </NavLink>
              <button className="linkButton" onClick={() => ui.setCartOpen(true)}>
                Carrito
              </button>
            </>
          ) : null}
        </nav>

        <div className="navRight">
          {token ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => (isActive ? "chip active" : "chip")}>
                👤 {user?.name || "Perfil"}
              </NavLink>
              <button 
              className="btn ghost"
              onClick={() => {
                logout();
                navigate("/");
              }}
              >
                Salir
                </button>
            </>
              
          
          ) : (
            <>
              <Link className="btn ghost" to="/login">
                Entrar
              </Link>
              <Link className="btn" to="/register">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

