import api from "../api/api";

export async function getProducts(
  companyId,
  page = 1,
  limit = 20
) {

  const response = await api.get(
    `/products?company_id=${companyId}&page=${page}&limit=${limit}`
  );

  return response.data;
}

export async function getProduct(id) {

  const response = await api.get(`/products/${id}`);

  return response.data;

}