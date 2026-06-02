const axios = require("axios");

const baseURL = process.env.BASE_URL;

if (!baseURL) {
  throw new Error("Missing BASE_URL env var");
}

module.exports = axios.create({
  baseURL,
  timeout: 15000
});
