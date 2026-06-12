import { useEffect, useState } from "react";

import { useCompany } from "../context/CompanyContext";

import { getProducts } from "../services/productService";

import { addToCart } from "../services/cartService";

export default function Products() {

  const { selectedCompany } =
    useCompany();

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  async function handleAddToCart(
    productId
  ) {

    try {

      await addToCart(
        productId,
        selectedCompany.id,
        1
      );

      alert(
        "Producto agregado"
      );

    } catch (err) {

      console.error(err);

      alert(
        "Error al agregar"
      );

    }

  }

  useEffect(() => {

    async function loadProducts() {

      if (!selectedCompany) return;

      try {

        const response =
          await getProducts(
            selectedCompany.id
          );

        console.log(
          "PRODUCTS:",
          response
        );

        setProducts(
          response.data || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadProducts();

  }, [selectedCompany]);

  if (loading) {
    return (
      <p>
        Cargando productos...
      </p>
    );
  }

  return (
    <div style={{ padding: "40px" }}>

      <h1>Productos</h1>

      <p>
        Empresa:
        {" "}
        {selectedCompany?.name}
      </p>

      {products.map(product => (

        <div
          key={product.id}
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            marginBottom: "10px",
          }}
        >

          <h3>{product.name}</h3>

          <button
            onClick={() =>
              handleAddToCart(
                product.id
              )
            }
          >
            Agregar al carrito
          </button>

          <p>
            Código:
            {" "}
            {product.code}
          </p>

          <p>
            Precio:
            {" "}
            ${product.price}
          </p>

          <p>
            Stock:
            {" "}
            {product.stock_quantity}
          </p>

        </div>

      ))}

    </div>
  );
}