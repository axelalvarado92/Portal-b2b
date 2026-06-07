require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.test")
});
console.log(process.env.BASE_URL);
console.log(process.env.CUSTOMER1_TOKEN?.substring(0,20));
const api = require("../config/apiclient");
const auth = require("../config/auth");

describe("ORDERS VALIDATIONS - CUSTOMER", () => {

test("Customer cannot create order with non existing cart", async () => {


try {

  await api.post(
    "/orders",
    {
      company_id: process.env.TEST_COMPANY_ID,
      cart_id: "00000000-0000-0000-0000-000000000000"
    },
    {
      headers: auth.customer1Header()
    }
  );

  fail("Expected 404");

} catch (err) {

  expect(err.response.status).toBe(404);

}


});

});
