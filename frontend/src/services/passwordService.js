
import api from "./api";

export const setInitialPassword = async (token, passwordData) => {
  const response = await api.post(
    `/password/setup/${encodeURIComponent(token)}`,
    passwordData
  );

  return response.data;
};
