
import api from "./api";

const ownerLoanService = {
  getLoans: async (status = "all") => {
    try {
      const response = await api.get("/loans", {
        params: status === "all" ? {} : { status },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to retrieve loan applications."
      );
    }
  },

  approveLoan: async (loanId, approvedAmount, ownerNotes) => {
    try {
      const response = await api.patch(
        `/loans/${loanId}/approve`,
        {
          approvedAmount: Number(approvedAmount),
          ownerNotes,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to approve loan application."
      );
    }
  },

  rejectLoan: async (loanId, ownerNotes) => {
    try {
      const response = await api.patch(
        `/loans/${loanId}/reject`,
        { ownerNotes }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to reject loan application."
      );
    }
  },

  disburseLoan: async (loanId) => {
    try {
      const response = await api.patch(
        `/loans/${loanId}/disburse`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to confirm loan disbursement."
      );
    }
  },
};

export default ownerLoanService;
