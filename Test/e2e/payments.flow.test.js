const api = require("../config/apiClient");

const USER_ID =
  "a438b468-4001-706f-f9b7-43396044fab9";

const COMPANY_ID =
  "48a3878c-5391-4c01-b78a-a0e971d6d26e";

jest.setTimeout(15000);

describe("PAYMENTS FLOW - E2E", () => {

  let paymentId;

  test("Create payment", async () => {

    const res = await api.post(
      "/payments",
      {
        user_id: USER_ID,
        company_id: COMPANY_ID,
        amount: 5000,
        payment_method: "cash",
        notes: "QA PAYMENT"
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "CREATE PAYMENT:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(201);

    expect(body.data.payment_id)
      .toBeDefined();

    paymentId = body.data.payment_id;

  });

  test("List payments", async () => {

    const res = await api.get(
      `/payments?company_id=${COMPANY_ID}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "LIST PAYMENTS:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.length)
      .toBeGreaterThan(0);

  });

  test("Get payment", async () => {

    const res = await api.get(
      `/payments/${paymentId}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "GET PAYMENT:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.id)
      .toBe(paymentId);

  });

});