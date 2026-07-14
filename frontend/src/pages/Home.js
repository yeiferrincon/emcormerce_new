import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductVariantsModal from "../components/ProductVariantsModal";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import robotImage from "../Img/RobotRopaShop_1.png";
import robotIcon from "../Img/RobotRopaShop_1.png";
import robot2 from "../Img/RobotRopaShop_2_Con_Exito.png";
import robot3 from "../Img/RobotRopaShop_3_Pensando.png";
import robot4 from "../Img/RobotRopaShop_4_Saludando.png";
import robot5 from "../Img/RobotRopaShop_5_Con_Error.png";
import robot6 from "../Img/RobotRopaShop_6_contraseña oculta.png";
import robot7 from "../Img/RobotRopaShop_7_mostrar contraseña.png";
import robot8 from "../Img/RobotRopaShop_8_actualizar contraseña.png";

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminDescription, setAdminDescription] = useState("");
  const [adminPrice, setAdminPrice] = useState(0);
  const [adminCategory, setAdminCategory] = useState("");
  const [adminVariantSize, setAdminVariantSize] = useState("");
  const [adminVariantColor, setAdminVariantColor] = useState("");
  const [adminVariantStock, setAdminVariantStock] = useState(1);
  const [adminImageFile, setAdminImageFile] = useState(null);
  const [adminStatus, setAdminStatus] = useState({ type: "", message: "" });
  const [showRobotModal, setShowRobotModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function loadCategories() {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch {
      // ignore
    }
  }

  async function loadProducts(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      const params = { page: nextPage, page_size: pageSize };
      if (q.trim()) params.q = q.trim();
      if (categoryId) params.category_id = Number(categoryId);
      const res = await api.get("/products", { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts(page);
  }, [page, categoryId, q]); // eslint-disable-line react-hooks/exhaustive-deps

  function compressProductImage(file) {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith("image/")) {
        resolve(file);
        return;
      }

      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              resolve(file);
              return;
            }

            const filename = file.name.replace(/\.[^.]+$/, "") || "producto";
            resolve(new File([blob], `${filename}.webp`, { type: "image/webp" }));
          },
          "image/webp",
          0.78
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      image.src = objectUrl;
    });
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    if (!adminName || !adminPrice || !adminCategory) {
      setAdminStatus({ type: "danger", message: "Completa el nombre, precio y categoría." });
      return;
    }

    try {
      if (editingProduct) {
        // Editar producto existente
        const payload = {
          name: adminName,
          description: adminDescription,
          price: Number(adminPrice),
          category_id: Number(adminCategory),
        };

        await api.put(`/products/${editingProduct.id}`, payload);

        if (adminImageFile) {
          const compressedImage = await compressProductImage(adminImageFile);
          const formData = new FormData();
          formData.append("archivo", compressedImage);
          await api.post(`/products/${editingProduct.id}/image`, formData);
        }

        setAdminStatus({ type: "ok", message: "Producto actualizado exitosamente." });
      } else {
        // Crear nuevo producto
        const payload = {
          name: adminName,
          description: adminDescription,
          price: Number(adminPrice),
          category_id: Number(adminCategory),
        };

        const res = await api.post("/products", payload);

        if (adminVariantSize && adminVariantColor) {
          try {
            await api.post(`/products/${res.data.id}/variants`, {
              size: adminVariantSize,
              color: adminVariantColor,
              stock: Number(adminVariantStock) || 1,
            });
          } catch {
            setAdminStatus({ type: "danger", message: "Producto creado, pero no se pudo crear la variante." });
            setAdminName("");
            setAdminDescription("");
            setAdminPrice(0);
            setAdminCategory("");
            setAdminVariantSize("");
            setAdminVariantColor("");
            setAdminVariantStock(1);
            setAdminImageFile(null);
            e.target.reset();
            setPage(1);
            loadProducts(1);
            return;
          }
        }

        if (adminImageFile) {
          const compressedImage = await compressProductImage(adminImageFile);
          const formData = new FormData();
          formData.append("archivo", compressedImage);
          await api.post(`/products/${res.data.id}/image`, formData);
        }

        setAdminStatus({ type: "ok", message: "Producto creado exitosamente." });
      }

      resetAdminForm();
      e.target.reset();
      setPage(1);
      loadProducts(1);
    } catch (err) {
      setAdminStatus({ type: "danger", message: editingProduct ? "No se pudo actualizar el producto." : "No se pudo crear el producto." });
    }
  }

  function resetAdminForm() {
    setAdminName("");
    setAdminDescription("");
    setAdminPrice(0);
    setAdminCategory("");
    setAdminVariantSize("");
    setAdminVariantColor("");
    setAdminVariantStock(1);
    setAdminImageFile(null);
    setAdminStatus({ type: "", message: "" });
    setEditingProduct(null);
  }

  function handleEditProduct(product) {
    console.log("handleEditProduct - Product data:", product);
    console.log("handleEditProduct - product.name:", product.name);
    console.log("handleEditProduct - product.price:", product.price);
    console.log("handleEditProduct - product.category_id:", product.category_id);

    setEditingProduct(product);
    setAdminName(product.name || "");
    setAdminDescription(product.description || "");
    setAdminPrice(product.price || 0);
    setAdminCategory(product.category_id || "");
    setAdminVariantSize("");
    setAdminVariantColor("");
    setAdminVariantStock(1);
    setAdminImageFile(null);
    setAdminStatus({ type: "", message: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteProduct(product) {
    if (!window.confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/products/${product.id}`);
      setAdminStatus({ type: "ok", message: "Producto eliminado exitosamente." });
      setPage(1);
      loadProducts(1);
    } catch (err) {
      setAdminStatus({ type: "danger", message: "No se pudo eliminar el producto." });
    }
  }

  async function handleEditVariants(product) {
    try {
      const res = await api.get(`/products/${product.id}`);
      setSelectedProductForVariants(res.data);
    } catch (err) {
      alert("No se pudo cargar las variantes del producto");
    }
  }

  function applyFilters(e) {
    e.preventDefault();
    setPage(1);
    loadProducts(1);
  }

  return (
    <div className="homePage stack">
      <img src={robotImage} alt="Robot RopaShop" className="robotRopaShop" />
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
      <section className="homeHero">
        <div className="heroOverlay" />
        <div className="container heroContent">
          <div className="heroTopNav">
            <span className="heroTag">NIGHT SALE 🔥</span>
            <button
              className="heroCTA"
              type="button"
              onClick={() => {
                setQ("");
                setCategoryId("");
                setPage(1);
                loadProducts(1);
                document.getElementById("searchInput")?.focus();
              }}
            >
              Ver todo
            </button>
          </div>
          <div className="heroCopy">
            <span className="eyebrow">Tienda pastel</span>
            <h1>Legacy de estilo y color en cada look.</h1>
            <p className="heroText">
              Descubre prendas con actitud suave, banner llamativo y un catálogo moderno para tu tienda.
            </p>
            <div className="heroActions">
              <button className="btn" type="button" onClick={() => document.getElementById("searchInput")?.focus()}>
                Comprar ahora
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  setQ("");
                  setCategoryId("");
                  setPage(1);
                  loadProducts(1);
                  document.getElementById("searchInput")?.focus();
                }}
              >
                Explorar catálogo
              </button>
            </div>
          </div>
          <div className="heroVisual">
            <div className="heroCard">
              <span className="eyebrow">Destacados</span>
              <h2>Prendas de temporada</h2>
              <p>La mejor selección para quienes buscan calidad, color y un estilo urbano suave.</p>
              <div className="heroStats">
                <div>
                  <strong>+120</strong>
                  <span>Productos</span>
                </div>
                <div>
                  <strong>Envío rápido</strong>
                  <span>48 horas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {user?.role === "admin" ? (
        <section className="panel adminSection">
          <div className="adminHeader">
            <div>
              <h2>Panel administrador</h2>
              <p>Crea productos rápidos para la tienda desde aquí.</p>
            </div>
          </div>
          <form className="adminForm" onSubmit={handleCreateProduct}>
            <div className="field">
              <label>Nombre</label>
              <input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Nombre del producto" />
            </div>
            <div className="field">
              <label>Descripción</label>
              <input value={adminDescription} onChange={(e) => setAdminDescription(e.target.value)} placeholder="Descripción breve" />
            </div>
            <div className="field">
              <label>Precio</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={adminPrice}
                onChange={(e) => setAdminPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>Categoría</label>
              <select value={adminCategory} onChange={(e) => setAdminCategory(e.target.value)}>
                <option value="">Selecciona categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Talla</label>
              <input
                value={adminVariantSize}
                onChange={(e) => setAdminVariantSize(e.target.value)}
                placeholder="Única, S, M, L..."
              />
            </div>
            <div className="field">
              <label>Color</label>
              <input
                value={adminVariantColor}
                onChange={(e) => setAdminVariantColor(e.target.value)}
                placeholder="Rojo, Negro, Azul..."
              />
            </div>
            <div className="field">
              <label>Stock variante</label>
              <input
                type="number"
                min="1"
                step="1"
                value={adminVariantStock}
                onChange={(e) => setAdminVariantStock(Number(e.target.value))}
                placeholder="1"
              />
            </div>
            <div className="field">
              <label>Imagen del producto</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setAdminImageFile(e.target.files?.[0] || null)}
              />
              <small className="fieldHint">Se optimiza antes de subirla. En la base solo se guarda la URL.</small>
            </div>
            <div className="field actions adminActions">
              <button className="btn" type="submit">
                {editingProduct ? "Actualizar producto" : "Crear producto"}
              </button>
              {editingProduct && (
                <button className="btn ghost" type="button" onClick={resetAdminForm}>
                  Cancelar
                </button>
              )}
            </div>
            {adminStatus.message ? (
              <div className={`panel ${adminStatus.type}`}>{adminStatus.message}</div>
            ) : null}
          </form>
        </section>
      ) : null}

      <section className="shopIntro">
        <div className="container shopIntroInner">
          <div>
            <h2>Nuestro catálogo</h2>
            <p>Una galería con prendas suaves, combinaciones versátiles y precios claros.</p>
          </div>
          <div className="shopChips">
            <button
              type="button"
              className={categoryId === "" ? "chip active" : "chip"}
              onClick={() => {
                setCategoryId("");
                setPage(1);
              }}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={categoryId === String(c.id) ? "chip active" : "chip"}
                onClick={() => {
                  setCategoryId(String(c.id));
                  setPage(1);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel productFilter">
        <form className="filters" onSubmit={applyFilters}>
          <div className="field">
            <label htmlFor="searchInput">Buscar</label>
            <input
              id="searchInput"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Camisa, jean, chaqueta..."
            />
          </div>
          <div className="field">
            <label>Categoría</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field actions">
            <button className="btn" type="submit">
              Aplicar
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setQ("");
                setCategoryId("");
                setPage(1);
                setTimeout(() => loadProducts(1), 0);
              }}
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>

      {loading && <div className="panel muted">Cargando productos...</div>}
      {error && <div className="panel danger">{error}</div>}

      <section className="grid">
        {items.length
          ? items.map((p) => <ProductCard key={p.id} p={p} onEditVariants={handleEditVariants} onDelete={handleDeleteProduct} />)
          : !loading && <div className="panel muted">No hay productos disponibles para esta búsqueda.</div>}
      </section>

      {selectedProductForVariants && (
        <ProductVariantsModal
          product={selectedProductForVariants}
          onClose={() => setSelectedProductForVariants(null)}
          onUpdate={() => loadProducts(page)}
        />
      )}

      <section className="pager">
        <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
          Anterior
        </button>
        <span className="muted">
          Página {page} de {totalPages}
        </span>
        <button className="btn ghost" disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)}>
          Siguiente
        </button>
      </section>
    </div>
  );
}
