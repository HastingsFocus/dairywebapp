
import api from "./api";

const userService = {
  // Owner invites a buyer.
  createBuyer: async (buyerData) => {
    const response = await api.post("/users/buyers", buyerData);
    return response.data;
  },

  // Owner views all their buyers.
  getBuyers: async () => {
    const response = await api.get("/users/buyers");
    return response.data;
  },

  // Owner views one buyer.
  getBuyerById: async (buyerId) => {
    const response = await api.get(`/users/buyers/${buyerId}`);
    return response.data;
  },

  // Owner activates or deactivates a buyer.
  updateBuyerStatus: async (buyerId, isActive) => {
    const response = await api.patch(
      `/users/buyers/${buyerId}/status`,
      { isActive }
    );
    return response.data;
  },

  // Buyer creates a farmer and sends an invitation.
  createFarmer: async (farmerData) => {
    const response = await api.post("/users/farmers", farmerData);
    return response.data;
  },

  // Buyer views their farmers.
  getFarmers: async () => {
    const response = await api.get("/users/farmers");
    return response.data;
  },

  // Buyer views one farmer's details.
  getFarmerById: async (farmerId) => {
    const response = await api.get(`/users/farmers/${farmerId}`);
    return response.data;
  },
};

export default userService;
