import api from "./api";

/**
 * Register a new dairy owner
 */
export const registerOwner = async (ownerData) => {
  const response = await api.post("/auth/register-owner", ownerData);

  return response.data;
};

/**
 * Login user
 */
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  return response.data;
};