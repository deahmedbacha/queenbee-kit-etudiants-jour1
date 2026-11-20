import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/middlewares/validate.js";
import {
  measureSchema,
  paginationSchema,
  inspectionSchema,
} from "../src/validators/schemas.js";
import { ValidationError } from "../src/errors.js";

function run(schema, data, source = "body") {
  const req = { [source]: data };
  validate(schema, source)(req, {}, () => {});
  return req.validated;
}

test("refuse un poids hors de sa plage physique", () => {
  assert.throws(
    () => run(measureSchema, { timestamp: "2026-10-31T00:00:00Z", weight_kg: 500 }),
    ValidationError,
  );
});

test("refuse un poids qui n'est pas un nombre", () => {
  assert.throws(
    () => run(measureSchema, { timestamp: "2026-10-31T00:00:00Z", weight_kg: "abc" }),
    ValidationError,
  );
});

test("applique les valeurs par défaut de pagination et convertit les chaînes", () => {
  const defaut = run(paginationSchema, {}, "query");
  assert.deepEqual(defaut, { limit: 50, offset: 0 });

  const converti = run(paginationSchema, { limit: "10", offset: "20" }, "query");
  assert.deepEqual(converti, { limit: 10, offset: 20 });
});

test("refuse une inspection avec un champ non autorisé ou dans le futur", () => {
  assert.throws(
    () =>
      run(inspectionSchema, {
        id: "0b6c4a0e-6f1f-4d8e-9a39-2f3c9b1d7e55",
        inspected_at: "2026-11-01T09:00:00Z",
        colony_status: "forte",
        author_id: "x",
      }),
    ValidationError,
  );

  assert.throws(
    () =>
      run(inspectionSchema, {
        id: "0b6c4a0e-6f1f-4d8e-9a39-2f3c9b1d7e55",
        inspected_at: "2099-01-01T00:00:00Z",
        colony_status: "forte",
      }),
    ValidationError,
  );
});
