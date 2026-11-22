
import api from "./api";

const farmerFinancialReportService = {
  getMyFinancialReport: async (month) => {
    try {
      const [milkResponse, loanResponse, settlementResponse] =
        await Promise.all([
          api.get("/milk-records", {
            params: { month },
          }),
          api.get("/loans/my-loans"),
          api.get("/settlements/my-settlements"),
        ]);

      return {
        records: Array.isArray(milkResponse.data?.records)
          ? milkResponse.data.records
          : [],

        loans: Array.isArray(loanResponse.data?.loans)
          ? loanResponse.data.loans
          : [],

        eligibility: loanResponse.data?.eligibility || null,

        settlements: Array.isArray(settlementResponse.data?.settlements)
          ? settlementResponse.data.settlements
          : [],
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to load your financial report."
      );
    }
  },
};

export default farmerFinancialReportService;
