const api = require("../config/apiClient");
const auth = require("../config/auth");

describe("INVOICES FLOW - E2E", () => {

  let invoiceId;

  test("Create invoice", async () => {

    const res = await api.post(
      "/invoices",
      {
        order_id: "74a2df26-8a15-4942-92c4-b35f440f7a7c",

        external_invoice_number: `FAC-${Date.now()}`,

        items: [
          {
            order_item_id: "5c6ed3a9-20d7-4993-989c-2b414ddb2036",
            invoiced_unit_price: 100
          }
        ]
      },
      {
        headers: auth.authHeader()
      }
    );

    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(201);

    invoiceId = res.data.data.invoice_id;

    expect(invoiceId).toBeDefined();

  });

  test("List invoices", async () => {

    const res = await api.get(
      "/invoices",
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    console.log(JSON.stringify(res.data, null, 2));

  });

  test("Get invoice", async () => {

    const res = await api.get(
      `/invoices/${invoiceId}`,
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    console.log(JSON.stringify(res.data, null, 2));

  });

});