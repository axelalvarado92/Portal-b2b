const api = require("../config/apiClient");
const auth = require("../config/auth");

const COMPANY_ID = "48a3878c-5391-4c01-b78a-a0e971d6d26e";
const PRODUCT_ID = "1719401e-2b52-47b6-beaf-eb22abbea34c";

describe("ORDER FLOW - E2E", () => {

  let cartId;
  let orderId;

  test("Add item to cart", async () => {

    const res = await api.post("/cart/items", {
      product_id: PRODUCT_ID,
      company_id: COMPANY_ID,
      quantity: 2
    }, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(200);
  });

  test("Get cart", async () => {

    const res = await api.get(
      "/cart?company_id=" + COMPANY_ID,
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    cartId = res.data.data.cart_id;

    expect(cartId).toBeDefined();
  });

  test("Create order from cart", async () => {

    const res = await api.post("/orders", {
      company_id: COMPANY_ID,
      cart_id: cartId
    }, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(201);

    orderId = res.data.data.order_id;

    expect(orderId).toBeDefined();
  });

  test("List orders", async () => {

    const res = await api.get("/orders", {
      headers: auth.authHeader()
    });

    console.log(
      JSON.stringify(res.data, null, 2)
    );

    expect(res.status).toBe(200);

    const order = res.data.data.find(
      o => o.id === orderId
    );

    expect(order).toBeDefined();
  });

  test("Get order detail", async () => {

    const res = await api.get(`/orders/${orderId}`, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(200);

    expect(res.data.data.id).toBe(orderId);

    expect(
      res.data.data.items.length
    ).toBeGreaterThan(0);

  });

});