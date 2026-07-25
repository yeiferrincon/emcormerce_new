import React, { useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import { useAuth } from "./context/AuthContext";

function Protected({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const ui = useMemo(() => ({ cartOpen, setCartOpen }), [cartOpen]);

  return (
    <div className="appShell">
      <Navbar ui={ui} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail ui={ui} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container footerInner">
          <div className="footerColumn">
            <span className="footerBrand">RopaShop</span>
            <p className="footerText">Tu tienda online de moda. Compra de forma segura, descubre nuevas colecciones y recibe tus pedidos hasta la puerta de tu hogar.</p>
          </div>
          <div className="footerColumn footerCenter">
            <span className="footerTitle">Tecnologías</span>
            <div className="footerTechColumns">
              <div className="footerTechColumn">
                <span className="footerSubtitle">Frontend</span>
                <ul className="footerList">
                  <li>React + Vite</li>
                  <li>HTML</li>
                  <li>JavaScript</li>
                  <li>CSS</li>
                </ul>
              </div>
              <div className="footerTechColumn">
                <span className="footerSubtitle">Backend</span>
                <ul className="footerList">
                  <li>FastAPI</li>
                  <li>Python</li>
                </ul>
              </div>
              <div className="footerTechColumn">
                <span className="footerSubtitle">Base de Datos</span>
                <ul className="footerList">
                  <li>PostgreSQL</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footerColumn">
            <span className="footerTitle">Contacto</span>
            <p className="footerText">📍Cra. 29 123 45 Colombia</p>
            <p className="footerText">📞 +57 555 123 4567</p>
            <p className="footerText">✉ contacto@ropashop.com</p>
          </div>
        </div>
        <div className="container footerBottom">
          <div className="footerColumn"></div>
          <div className="footerColumn footerCenter">
            <p className="footerText">2026 Enca24</p>
          </div>
          <div className="footerColumn"></div>
        </div>
      </footer>
    </div>
  );
}

