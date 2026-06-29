import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getProduct } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { useCompany } from "../../context/CompanyContext";

import "./ProductDetail.css";

export default function ProductDetail() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [toast, setToast] = useState("");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {

    try {

      const response = await getProduct(id);

      setProduct(response.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (!product) {
    return <p>Producto no encontrado.</p>;
  }
  
  async function handleAddToCart() {

    if (!selectedCompany) {
  
      setToast("Seleccioná una empresa.");
  
      setTimeout(() => setToast(""), 2500);
  
      return;
  
    }
  
    try {
  
      await addToCart(
        product.id,
        selectedCompany.id,
        1
      );
  
      setToast("✓ Producto agregado al carrito");
  
    } catch (err) {
  
      console.error(err);
  
      setToast("Error al agregar producto");
  
    }
  
    setTimeout(() => setToast(""), 2500);
  
  }
  return (

    <div className="product-detail">

      <button
        className="back-button"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>

      <div className="detail-card">

        <div className="detail-image">

          <img
            src={
              product.image_url ||
              "/product-placeholder.png"
            }
            alt={product.name}
          />

        </div>

        <div className="detail-info">

          <h1>{product.name}</h1>

          <p className="detail-code">
            Código: {product.code}
          </p>

          <div className="detail-price">
            $
            {Number(product.price).toLocaleString(
              "es-AR",
              {
                minimumFractionDigits: 2
              }
            )}
          </div>

          {product.description && (

            <div className="detail-description">

              <h3>Descripción</h3>

              <p>{product.description}</p>

            </div>

          )}

          <button
            className="add-cart-btn"
            onClick={handleAddToCart}
          >
            Agregar al carrito
          </button>

        </div>

      </div>

      {toast && (
      <div className="toast">
        {toast}
      </div>
    )}

    </div>

  );

}