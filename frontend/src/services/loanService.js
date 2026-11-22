
import api from "./api";

const loanService = {
  getMyLoans: async () => {
    try {
      const response = await api.get("/loans/my-loans");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to retrieve your loan information."
      );
    }
  },

  requestLoan: async (amount, reason) => {
    try {
      const response = await api.post("/loans", {
        amount: Number(amount),
        reason: reason.trim(),
      });

      return response.data;
    } catch (error) {
      const requestError = new Error(
        error.response?.data?.message ||
          "Failed to submit your loan request."
      );

      requestError.eligibility = error.response?.data?.eligibility || null;
      requestError.status = error.response?.status;

      throw requestError;
    }
  },
};

export default loanService;
