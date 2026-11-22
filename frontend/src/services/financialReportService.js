
import api from "./api";

const financialReportService = {
  // Retrieve the owner's monthly financial report.
  getFinancialReport: async (month) => {
    try {
      const response = await api.get("/financial-reports", {
        params: { month },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to load financial reports."
      );
    }
  },

  // Finalize one farmer's monthly payment.
  settleFarmerMonth: async (month, farmerId) => {
    try {
      const response = await api.post(
        `/settlements/${month}/farmers/${farmerId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to settle the farmer's monthly payment."
      );
    }
  },
};

export default financialReportService;
