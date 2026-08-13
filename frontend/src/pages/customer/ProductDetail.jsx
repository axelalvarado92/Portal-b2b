import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getProduct } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { useCompany } from "../../context/CompanyContext";

import "./ProductDetail.css";

const COLOR_MAP = {
  rojo: "#dc2626",
  celeste: "#0ea5e9",
  blanco: "#f3f4f6",
  amarillo: "#facc15",
  verde: "#16a34a",
  naranja: "#f97316",
  negro: "#1f2937",
  azul: "#2563eb",
  violeta: "#7c3aed",
  rosa: "#ec4899",
  gris: "#6b7280",
  marrón: "#92400e",
  beige: "#d6c0a3",
  dorado: "#fbbf24",
  plateado: "#9ca3af",
};

export default function ProductDetail() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [toast, setToast] = useState("");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
  
    const activeVariants = (product.variants || [])
      .filter(variant => variant.is_active !== false);
  
    if (activeVariants.length > 0) {
      setSelectedVariant(activeVariants[0]);
    } else {
      setSelectedVariant(null);
    }
  
  }, [product]);

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

    console.log("DEBUG PRODUCT DETAIL:", {
      variant: selectedVariant,
      quantity,
      stock: selectedVariant?.stock
    });

    if (!selectedVariant) {
      setToast("No hay una variante disponible.");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    
    if (selectedVariant.is_active === false) {
      setToast("La variante seleccionada no está disponible.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    if (!selectedCompany) {
  
      setToast("Seleccioná una empresa.");
  
      setTimeout(() => setToast(""), 2500);
  
      return;
  
    }
  
    try {
  
      await addToCart({
        productId: product.id,
        companyId: selectedCompany.id,
        quantity,
        selectedOptions: {
          variant_id: selectedVariant?.id,
          ...(selectedVariant?.attributes || {})
        }
      });
  
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
            {Number(
              selectedVariant?.price ?? 0
            ).toLocaleString("es-AR", {
              minimumFractionDigits: 2
            })}
          </div>

          {product.has_variants && product.variants?.length > 1 && (
          <div className="variant-container">
            <label className="variant-label">Seleccioná una opción</label>
            <div className="variant-pills">
              {product.variants
                .filter(variant => variant.is_active !== false)
                .map(variant => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const label = variant.attributes && Object.entries(variant.attributes).length > 0
                    ? Object.entries(variant.attributes).map(([_, val]) => val).join(" · ")
                    : variant.sku;
        
              return (
              <button
                key={variant.id}
                type="button"
                className={`variant-pill ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  setSelectedVariant(variant);
                  setQuantity(1);
                }}
              >
                {/* INDICADOR DE COLOR */}
                {(() => {
                  const colorEntry = Object.entries(variant.attributes || {})
                    .find(([key]) => key.toLowerCase() === "color");
                  
                  if (colorEntry) {
                    const colorName = colorEntry[1];
                    const colorHex = COLOR_MAP[colorName.toLowerCase().trim()] || "#d1d5db";
                    return (
                      <span
                        className="pill-color-dot"
                        style={{ backgroundColor: colorHex }}
                        title={colorName}
                      />
                    );
                  }
                  return null;
                })()}
  
                <span className="pill-name">
                  {label}
                </span>
                <span className="pill-price">
                  ${Number(variant.price ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </button>
            );
                })}
            </div>
          </div>
        )}

          {product.description && (

            <div className="detail-description">

              <h3>Descripción</h3>

              <p>{product.description}</p>

            </div>

          )}

          <div className="quantity-selector">

            <label>Cantidad</label>
          
            <div className="quantity-controls">
          
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() =>
                  setQuantity(q => Math.max(1, q - 1))
                }
              >
                −
              </button>
          
              <span>{quantity}</span>
          
              <button
                type="button"
                onClick={() =>
                  setQuantity(q => q + 1)
                }
              >
                +
              </button>
          
            </div>
          
          </div>

          <button
            className="add-cart-btn"
            onClick={handleAddToCart}
            disabled={
              !selectedVariant ||
              selectedVariant.is_active === false
            }
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