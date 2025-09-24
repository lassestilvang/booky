import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api", // Adjust base URL as needed
  headers: {
    "Content-Type": "application/json",
    // Add auth headers if needed, e.g., Authorization: `Bearer ${token}`
  },
});

export default apiClient;
