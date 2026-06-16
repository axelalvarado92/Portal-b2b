import api from "../api/api";

export async function getAdminOrders() {

  const response = await api.get(
    "/admin/orders"
  );

  return response.data;

}

export async function getAdminOrder(
  orderId
) {

  const response =
    await api.get(
      `/admin/orders/${orderId}`
    );

  return response.data;

}