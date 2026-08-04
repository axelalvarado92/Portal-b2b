import api from "../api/api";

export async function getCart(companyId) {

  const response = await api.get(
    `/cart?company_id=${companyId}`
  );

  return response.data;
}

export async function addToCart({
  productId,
  companyId,
  quantity = 1,
  selectedOptions = {}
}) {

  const response = await api.post(
    "/cart/items",
    {
      product_id: productId,
      company_id: companyId,
      quantity,
      selected_options: selectedOptions
    }
  );

  return response.data;
}

export async function updateCartItem(
  itemId,
  quantity
) {

  const response = await api.patch(
    `/cart/items/${itemId}`,
    {
      quantity
    }
  );

  return response.data;
}

export async function deleteCartItem(
  itemId
) {

  const response = await api.delete(
    `/cart/items/${itemId}`
  );

  return response.data;
}

export async function clearCart(
  companyId
) {

  const response = await api.delete(
    `/cart?company_id=${companyId}`
  );

  return response.data;
}

export async function getAllCarts() {
  const response = await api.get("/cart/all");
  return response.data;
}