const api = require("../config/apiClient");
const auth = require("../config/auth");

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
        amount: 1000,
        payment_method: "transfer",
        reference: "TEST-PAYMENT",
        notes: "E2E test"
      },
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(201);

    paymentId =
      res.data.data.payment_id;

    expect(paymentId)
      .toBeDefined();

  });

  test("List payments", async () => {

    const res = await api.get(
      "/payments",
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(
      Array.isArray(res.data.data)
    ).toBe(true);

    const payment =
      res.data.data.find(
        p => p.id === paymentId
      );

    expect(payment)
      .toBeDefined();

  });

  test("Get payment detail", async () => {

    const res = await api.get(
      `/payments/${paymentId}`,
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(
      res.data.data.id
    ).toBe(paymentId);

    expect(
      res.data.data.amount
    ).toBe(1000);

    expect(
      res.data.data.payment_method
    ).toBe("transfer");

  });

});