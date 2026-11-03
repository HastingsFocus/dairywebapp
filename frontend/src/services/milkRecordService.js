
import api from "./api";

const milkRecordService = {
  // Create a new milk record
  createMilkRecord: async (recordData) => {
    const response = await api.post("/milk-records", recordData);
    return response.data;
  },

  // Get milk records by date or month
  // Example: getMilkRecords({ date: "2026-10-29" })
  // Example: getMilkRecords({ month: "2026-10" })
  getMilkRecords: async (filters = {}) => {
    const response = await api.get("/milk-records", {
      params: filters,
    });
    return response.data;
  },

  // Get daily and month-to-date milk totals
  // Example: getMilkSummary("2026-10-29")
  getMilkSummary: async (date) => {
    const response = await api.get("/milk-records/summary", {
      params: date ? { date } : {},
    });
    return response.data;
  },

  // Update an existing milk record
  updateMilkRecord: async (id, recordData) => {
    const response = await api.put(
      `/milk-records/${id}`,
      recordData
    );
    return response.data;
  },

  // Delete an existing milk record
  deleteMilkRecord: async (id) => {
    const response = await api.delete(`/milk-records/${id}`);
    return response.data;
  },
};

export default milkRecordService;
