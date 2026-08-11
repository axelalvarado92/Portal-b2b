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
    
    if (
      selectedVariant.stock !== null &&
      selectedVariant.stock < quantity
    ) {
      setToast("No hay suficiente stock disponible.");
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
      
        selectedVariantId: selectedVariant?.id
      
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
          
              <label>Variante</label>
          
              <select
                value={selectedVariant?.id || ""}
                onChange={(e) => {
                  const variant = product.variants.find(
                    v => v.id === e.target.value
                  );
          
                  setSelectedVariant(variant || null);
                  setQuantity(1);
                }}
              >
          
                {product.variants
                  .filter(variant => variant.is_active !== false)
                  .map(variant => (
                    <option
                      key={variant.id}
                      value={variant.id}
                    >
                      {variant.sku}
                      {variant.attributes &&
                        Object.entries(variant.attributes).length > 0
                        ? ` - ${Object.entries(variant.attributes)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}`
                        : ""
                      }
                    </option>
                  ))}
          
              </select>
          
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
                disabled={
                  selectedVariant &&
                  selectedVariant.stock !== null &&
                  quantity >= selectedVariant.stock
                }
                onClick={() =>
                  setQuantity(q => q + 1)
                }
              >
                +
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
              selectedVariant.is_active === false ||
              selectedVariant.stock <= 0 ||
              quantity > selectedVariant.stock
            }
          >
            {selectedVariant?.stock <= 0
              ? "Sin stock"
              : "Agregar al carrito"}
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