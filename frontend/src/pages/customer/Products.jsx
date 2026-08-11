import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { useCart } from "../../context/CartContext";
import "./Products.css";

export default function Products() {
  const navigate = useNavigate();
  const { id: companyId } = useParams();
  const { refreshCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    setPage(1);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setProducts([]);
      return;
    }

    async function loadProducts() {
      try {
        setLoading(true);

        const response = await getProducts(companyId, page, 20);

        const payload = response.data;
        console.log("DEBUG getProducts response:", response.data);

        setProducts(payload.items || []);
        setTotalPages(payload.total_pages || 1);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();

  }, [companyId, page]);

  async function handleAddToCart(product) {
    try {
      await addToCart(product.id, companyId, 1);
      await refreshCart();
      setToast("✓ Producto agregado al carrito");
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      console.error(err);
      setToast("✗ Error al agregar producto");
      setTimeout(() => setToast(""), 2500);
    }
  }

  let processedProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === "alpha-asc") {
    processedProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (sortBy === "alpha-desc") {
    processedProducts.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  }

  const pages = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (loading) {
    return <p className="catalog-loading">Cargando productos...</p>;
  }

  return (
    <div className="catalog-wrapper">
      <div className="catalog-header">
        <h1>Catálogo de Productos</h1>
      </div>

      <div className="catalog-toolbar">
        <div className="toolbar-search">
          <input
            className="catalog-search"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <div className="filter-group">
            <label>Ordenar por:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="default">Relevancia / Código</option>
              <option value="alpha-asc">Nombre (A - Z)</option>
              <option value="alpha-desc">Nombre (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      <p className="catalog-count">
        Mostrando <strong>{processedProducts.length}</strong> productos
      </p>

      <div className="products-grid">
        {processedProducts.length > 0 ? (
          processedProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="product-image-wrapper">
                <img
                  src={product.image_url || "/product-placeholder.png"}
                  alt={product.name}
                  className="product-image"
                />
              </div>
              <div className="product-body">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-description">
                  Cod: {product.code}
                  {product.description && ` - ${product.description}`}
                </p>
                <div className="product-price-label">Precio unitario</div>
                <div className="product-price">
                  ${Number(product.default_variant?.price ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <button
                  className="add-cart-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                >
                  Agregar al carrito
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-products">No se encontraron productos.</p>
        )}
      </div>

      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          ←
        </button>

        {startPage > 1 && (
          <>
            <button onClick={() => setPage(1)}>1</button>
            {startPage > 2 && <span>...</span>}
          </>
        )}

        {pages.map((number) => (
          <button
            key={number}
            onClick={() => setPage(number)}
            className={page === number ? "active-page" : ""}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span>...</span>}
            <button onClick={() => setPage(totalPages)}>{totalPages}</button>
          </>
        )}

        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
          →
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}