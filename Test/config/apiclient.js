const axios = require("axios");

const baseURL = process.env.BASE_URL;
const token = process.env.TOKEN;

if (!baseURL) {
  throw new Error("Missing BASE_URL env var");
}

const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

module.exports = api;