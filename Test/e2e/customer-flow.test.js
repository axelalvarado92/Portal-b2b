require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.test")
});

const api = require("../config/apiclient");
const auth = require("../config/auth");

describe("CUSTOMER FLOW - CART + ORDERS", () => {

let cartId;
let itemId;
let orderId;

const companyId = process.env.TEST_COMPANY_ID;
const productId = process.env.TEST_PRODUCT_ID;

test("Customer - Get cart", async () => {


const res = await api.get(
  `/cart?company_id=${companyId}`,
  {
    headers: auth.customer1Header()
  }
);

expect(res.status).toBe(200);

cartId = res.data.data.cart_id;

expect(cartId).toBeDefined();


});

test("Customer - Add item to cart", async () => {


const res = await api.post(
  "/cart/items",
  {
    company_id: companyId,
    product_id: productId,
    quantity: 2
  },
  {
    headers: auth.customer1Header()
  }
);

expect(res.status).toBe(200);


});

test("Customer - Verify cart contents", async () => {


const res = await api.get(
  `/cart?company_id=${companyId}`,
  {
    headers: auth.customer1Header()
  }
);

expect(res.status).toBe(200);

expect(res.data.data.items.length).toBeGreaterThan(0);

itemId = res.data.data.items[0].id;

expect(itemId).toBeDefined();


});

test("Customer - Update cart item", async () => {


const res = await api.patch(
  `/cart/items/${itemId}`,
  {
    quantity: 5,
    observations: "Prueba E2E"
  },
  {
    headers: auth.customer1Header()
  }
);

expect(res.status).toBe(200);


});

test("Customer - Create order", async () => {


const res = await api.post(
  "/orders",
  {
    company_id: companyId,
    cart_id: cartId,
    notes: "Pedido generado por test"
  },
  {
    headers: auth.customer1Header()
  }
);

expect(res.status).toBe(201);

orderId = res.data.data.order_id;

expect(orderId).toBeDefined();


});

test("Customer - List orders", async () => {


const res = await api.get(
  "/orders",
  {
    headers: auth.customer1Header()
  }
);

expect(res.status).toBe(200);

expect(res.data.data.length).toBeGreaterThan(0);


});

test("Customer - Get order detail", async () => {

const res = await api.get(
  `/orders/${orderId}`,
  {
    headers: auth.customer1Header()
  }
);

expect(res.status).toBe(200);

expect(res.data.data.id).toBe(orderId);


});

});
