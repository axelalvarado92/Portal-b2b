import api from "../api/api";

export async function getProducts(
  companyId = null
) {

  let url =
    "/admin/products";

  if (companyId) {

    url =
      `/admin/products?company_id=${companyId}`;

  }

  const response =
    await api.get(url);

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

export async function updateProduct(
  productId,
  data
) {

  const response =
    await api.patch(
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

export async function getPresignedUploadUrl(companyId, fileName) {
  const response = await api.post("/admin/import-products/presign", {
    company_id: companyId,
    file_name: fileName
  });
  return response.data;
}