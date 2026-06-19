import api from "../api/api";

export async function getAdminOrders() {
  const response = await api.get("/admin/orders");
  return response.data;
}

export async function getAdminOrder(orderId) {
  const response = await api.get(`/admin/orders/${orderId}`);
  return response.data;
}

// NUEVA FUNCIÓN: Envía el nuevo estado a tu API de Node/Express o Lambda
export async function updateAdminOrderStatus(orderId, status) {
  const response = await api.put(`/admin/orders/${orderId}`, { status });
  return response.data;
}