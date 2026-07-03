import api from "../api/api";

export async function getProducts(
  companyId = null,
  page = 1,
  limit = 12
) {
  let url = `/admin/products?page=${page}&limit=${limit}`;

  if (companyId) {
    url += `&company_id=${companyId}`;
  }

  const response = await api.get(url);

  // Devolvemos response.data directamente. 
  // Según tu log, esto contiene { data: { products: [...], total_pages: 54 }, error: null }
  return response.data;
}

// Agregamos esta función que faltaba para el detalle del producto
export async function getProduct(productId) {
  const response = await api.get(`/admin/products/${productId}`);
  return response.data;
}

export async function createProduct(
  data
) {

  const response =
    await api.post(
      "/admin/products",
      data
    );

  return response.data;

}

// adminProductService.js
export async function updateProduct(productId, data) {
  // Aplanamos el objeto para que coincida con lo que espera el SQL
  const payload = {
    ...data,
    category_id: data.category?.id || null // Extraemos el ID del objeto anidado
  };
  delete payload.category; // Eliminamos el objeto para no confundir a la Lambda

  const response = await api.patch(`/admin/products/${productId}`, payload);
  return response.data;
}

export async function deleteProduct(
  productId
) {

  const response =
    await api.delete(
      `/admin/products/${productId}`
    );

  return response.data;

}

export async function importProductsExcel(companyId, s3Key) {
  const response = await api.post("/admin/import-products", {
    company_id: companyId,
    s3_key: s3Key
  });
  return response.data;
}


