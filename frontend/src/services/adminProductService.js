import api from "../api/api";

export async function getProducts(
    companyId = null,
    page = 1,
    limit = 12,
    search = "",
    categoryId = null
) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  
  if (companyId) params.append("company_id", companyId);
  if (categoryId) params.append("category_id", categoryId);
  if (search)    params.append("search", search);

  const response = await api.get(`/admin/products?${params.toString()}`);
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
    const response = await api.patch(
        `/admin/products/${productId}`,
        data
    );

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

export async function getImportPresignedUrl(companyId, fileName) {
  const response = await api.post(
    "/admin/import-products/presign",
    {
      company_id: companyId,
      file_name: fileName
    }
  );

  return response.data.data;
}


