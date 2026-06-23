import api from "./api";

/**
 * GET /users/me
 */
export const getMe = async () => {
  const { data } = await api.get("/users/me");
  return data;
};

/**
 * PATCH /users/me
 */
export const updateMe = async (payload) => {
  const { data } = await api.patch("/users/me", payload);
  return data;
};