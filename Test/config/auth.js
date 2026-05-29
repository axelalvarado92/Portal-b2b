let token = null;

const setToken = (t) => {
  token = t;
};

const getToken = () => token;

const authHeader = () => ({
  Authorization: `Bearer ${token}`,
});

module.exports = {
  setToken,
  getToken,
  authHeader,
};