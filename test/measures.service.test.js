import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { NotFoundError, ValidationError } from "../src/errors.js";

const validMeasure = {
  timestamp: "2026-10-31T10:00:00Z",
  weight_kg: 36.8,
};

const fakeHivesService = {
  async getHive(id) {
    if (id !== "SN-CASA-001") {
      throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
    }
    return { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" };
  },
};

function createFakeMeasuresRepository() {
  const added = [];
  return {
    added,
    async add(measure) {
      added.push(measure);
      return measure;
    },
  };
}

test("enregistre une mesure valide", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  const measure = await service.addMeasure("SN-CASA-001", validMeasure);

  assert.equal(measure.hive_id, "SN-CASA-001");
  assert.equal(measure.site_id, "SN-CASA");
  assert.equal(measuresRepository.added.length, 1);
});

test("refuse une mesure pour une ruche inconnue", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await assert.rejects(
    service.addMeasure("XX-NOPE-999", validMeasure),
    NotFoundError,
  );
  assert.equal(measuresRepository.added.length, 0);
});

test("refuse une trame qui désigne une autre ruche que le chemin", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await assert.rejects(
    service.addMeasure("SN-CASA-001", { ...validMeasure, hive_id: "SN-CASA-002" }),
    ValidationError,
  );
  assert.equal(measuresRepository.added.length, 0); // rien n'a été enregistré
});
