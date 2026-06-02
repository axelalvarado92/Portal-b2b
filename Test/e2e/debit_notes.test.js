const api = require("../config/apiClient");

describe("DEBIT NOTES FLOW - E2E", () => {

  let noteId;

  test("Create debit note", async () => {

    const res = await api.post(
      "/notes",
      {
        user_id: "a438b468-4001-706f-f9b7-43396044fab9",
        company_id: "48a3878c-5391-4c01-b78a-a0e971d6d26e",
        type: "debit",
        reason: "qa_debit_test",
        amount: 500,
        notes: "Nota de débito creada por QA"
      }
    );

    console.log("CREATE DEBIT NOTE:");
    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(201);

    noteId = res.data.data.note_id;

    expect(noteId).toBeDefined();
  });

  test("Get debit note detail", async () => {

    const res = await api.get(
      `/notes/${noteId}`
    );

    console.log("DEBIT NOTE DETAIL:");
    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);

    expect(res.data.data.type).toBe("debit");
  });

});