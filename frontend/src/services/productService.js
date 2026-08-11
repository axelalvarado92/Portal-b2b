import api from "../api/api";

export async function getProducts(
  companyId,
  page = 1,
  limit = 20,
  search = ""
) {
  const params = new URLSearchParams();

  params.append("company_id", companyId);
  params.append("page", page);
  params.append("limit", limit);

  if (search.trim()) {
    params.append("search", search.trim());
  }

  const response = await api.get(`/products?${params.toString()}`);

  return response.data;
}

export async function getProduct(id) {

  const response = await api.get(`/products/${id}`);

  return response.data;

}