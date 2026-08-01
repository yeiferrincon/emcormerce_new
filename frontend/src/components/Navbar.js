import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
<<<<<<< Updated upstream
=======
import logo from "../Img/Logo.png";
>>>>>>> Stashed changes

export default function Navbar({ ui }) {
  const { token, user, logout } = useAuth();

  return (
    <header className="nav">
      <div className="container navInner">
        <Link to="/" className="brand">
<<<<<<< Updated upstream
          <span className="brandMark">RS</span>
          <span className="brandName">RopaShop</span>
=======
          <img src={logo} alt="RopaShop" className="logo" />
>>>>>>> Stashed changes
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
              <button className="btn ghost" onClick={logout}>
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

