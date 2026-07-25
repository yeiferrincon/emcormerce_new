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
          <div>
            <span className="footerBrand">RopaShop</span>
            <p className="muted">Moda pastel y diseño ligero para tu tienda online.</p>
          </div>
          <span className="muted">FastAPI + React</span>
        </div>
      </footer>
    </div>
  );
}

