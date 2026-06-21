import api from "../api/api";

export async function createOrder(
  companyId,
  cartId,
  notes = ""
) {

  const response = await api.post(
    "/orders",
    {
      company_id: companyId,
      cart_id: cartId,
      notes
    }
  );

  return response.data;
}

export async function getOrders(companyId) {
  const url = companyId
    ? `/orders?company_id=${companyId}`
    : "/orders";

  const response = await api.get(url);
  return response.data;
}

export async function getOrder(
  orderId
) {

  const response = await api.get(
    `/orders/${orderId}`
  );

  return response.data;
}

export async function requestCancelOrder(orderId) {
  const response = await api.patch(`/orders/${orderId}/request-cancel`);
  return response.data;
}