import axios from "axios"

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  withCredentials: true, // automatically send cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
})

export default apiClient
