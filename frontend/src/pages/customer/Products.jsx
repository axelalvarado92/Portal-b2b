import { useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";

import {
  getProducts,
} from "../../services/productService";

import {
  addToCart,
} from "../../services/cartService";

import {
  useCompany,
} from "../../context/CompanyContext";

import "./Products.css";

export default function Products() {

  const navigate = useNavigate();

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");
  
  const [toast, setToast] = useState("");
  const [cartCount, setCartCount] = useState(0);
  
  const {
    selectedCompany,
    loading: companiesLoading,
  } = useCompany();

useEffect(() => {

  console.log("EFFECT companiesLoading:", companiesLoading, "selectedCompany:", selectedCompany?.id);
  
  if (companiesLoading) return; // ← esperar que cargue el contexto
  if (!selectedCompany) return;

  async function loadProducts() {
    try {
      const response = await getProducts(selectedCompany.id);
      setProducts(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  loadProducts();

}, [selectedCompany, companiesLoading]); // ← agregar companiesLoading


async function handleAddToCart(product) {

  if (!selectedCompany) {
    setToast("⚠️ Seleccioná una empresa");
    setTimeout(() => setToast(""), 2500);
    return;
  }

  try {
    await addToCart(product.id, selectedCompany.id, 1);
    setCartCount(prev => prev + 1);
    setToast("✓ Producto agregado al carrito");
    setTimeout(() => setToast(""), 2500);
  } catch (err) {
    console.error(err);
    setToast("✗ Error al agregar producto");
    setTimeout(() => setToast(""), 2500);
  }

}

  const filteredProducts =
    products
      .filter(
        p =>
          p.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

  if (loading) {

    return (
      <p>
        Cargando productos...
      </p>
    );

  }

return (
  <div className="catalog-wrapper">

    <div className="catalog-header">
      <h1>Catálogo</h1>
      <div className="catalog-meta">
        <button className="cart-indicator" onClick={() => navigate("/cart")}>
          🛒 Carrito ({cartCount})
        </button>
      </div>
    </div>

    <div className="catalog-search-row">
      <input
        className="catalog-search"
        placeholder="Buscar producto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    <p className="catalog-count">
      Mostrando {filteredProducts.length} productos
    </p>

    <table className="catalog-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {filteredProducts.map(product => (
          <tr key={product.id}>
            <td>{product.code}</td>
            <td>{product.name}</td>
            <td>${product.price}</td>
            <td>{product.stock_quantity ?? "—"}</td>
            <td>
              <button
                className="snb-btn"
                onClick={() => handleAddToCart(product)}
              >
                Agregar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {toast && <div className="toast">{toast}</div>}

  </div>
);
}