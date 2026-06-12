import * as usersApi from "../api/users.api";

/**
 * Obtiene usuario autenticado
 */
export const fetchCurrentUser = async () => {
  const response = await usersApi.getMe();
  return response?.data;
};

/**
 * Actualiza usuario autenticado
 */
export const updateCurrentUser = async (payload) => {
  const response = await usersApi.updateMe(payload);
  return response?.data;
};