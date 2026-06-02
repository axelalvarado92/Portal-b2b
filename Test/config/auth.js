let token = null;

const setToken = (t) => {
  token = t;
};

const getToken = () => token;

const authHeader = () => ({
  Authorization: `Bearer ${token}`,
});

module.exports = {

  adminHeader() {
    return {
      Authorization: `Bearer ${process.env.ADMIN_TOKEN}`
    };
  },

  customer1Header() {
    return {
      Authorization: `Bearer ${process.env.CUSTOMER1_TOKEN}`
    };
  },

  customer2Header() {
    return {
      Authorization: `Bearer ${process.env.CUSTOMER2_TOKEN}`
    };
  }

};