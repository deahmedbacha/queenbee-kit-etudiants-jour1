import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { ValidationError } from "../src/errors.js";

test("refuse un poids hors de sa plage physique", async () => {
  // Préparer : un faux repository qui garde ce qu'on lui donne, injecté dans le service
  const enregistrees = [];
  const fauxMeasuresRepository = {
    async insert(mesure) {
      enregistrees.push(mesure);
      return mesure;
    },
  };
  const fauxHivesService = {
    async get(id) {
      return { id, site_id: "SN-CASA", status: "active" };
    },
  };
  const service = createMeasuresService({
    hivesService: fauxHivesService,
    measuresRepository: fauxMeasuresRepository,
  });

  // Agir : ajouter une mesure de 500 kg
  const ajout = service.add("SN-CASA-001", { timestamp: "2026-10-31T10:00:00Z", weight_kg: 500 });

  // Vérifier : une ValidationError est levée (assert.rejects), et rien n'est enregistré
  await assert.rejects(ajout, ValidationError);
  assert.equal(enregistrees.length, 0);
});
