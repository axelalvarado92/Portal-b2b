const api = require("../config/apiClient");
const auth = require("../config/auth");
const store = require("../utils/dataStore");

describe("CART -> ORDER FLOW", () => {

  let cartId;
  let orderId;

  test("Add product to cart", async () => {

    const res = await api.post(
      "/cart/items",
      {
        company_id: store.companyA,
        product_id: store.product,
        quantity: 2
      },
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);
  });

  test("Get cart", async () => {

    const res = await api.get(
      `/cart?company_id=${store.companyA}`,
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(res.data.data.cart_id).toBeDefined();

    cartId = res.data.data.cart_id;

    store.cart = cartId;

    console.log("CART ID:", cartId);
  });

  test("Create order", async () => {

    const res = await api.post(
      "/orders",
      {
        company_id: store.companyA,
        cart_id: cartId,
        notes: "Pedido QA"
      },
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(201);

    expect(res.data.data.order_id).toBeDefined();

    orderId = res.data.data.order_id;

    store.order = orderId;

    console.log("ORDER ID:", orderId);
  });

  test("Get order", async () => {

    const res = await api.get(
      `/orders/${orderId}`,
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(res.data.data.id).toBe(orderId);
  });

  test("List orders", async () => {

    const res = await api.get(
      "/orders",
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(Array.isArray(res.data.data)).toBe(true);
  });

});