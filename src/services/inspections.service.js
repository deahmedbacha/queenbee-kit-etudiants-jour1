import { ValidationError, ConflictError } from "../errors.js";

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLONY_STATUSES = ["forte", "normale", "faible", "morte"];

const estAbsent = (valeur) => valeur === undefined || valeur === null;
const estDateIso = (valeur) =>
  typeof valeur === "string" && ISO_8601.test(valeur) && !Number.isNaN(Date.parse(valeur));

// Service : les règles sur les inspections.
export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async list(hiveId) {
      await hivesService.get(hiveId); // NotFoundError si la ruche n'existe pas
      return inspectionsRepository.findByHive(hiveId);
    },

    async add(hiveId, body) {
      const hive = await hivesService.get(hiveId);
      const corps = body ?? {};

      // L'identifiant est un UUID choisi par l'application mobile, pas par le serveur.
      if (typeof corps.id !== "string" || !UUID.test(corps.id)) {
        throw new ValidationError("Le champ id est obligatoire et doit être un UUID.");
      }
      if (!estDateIso(corps.inspected_at)) {
        throw new ValidationError(
          "Le champ inspected_at est obligatoire et doit être une date ISO 8601, par exemple 2026-11-18T09:00:00Z.",
        );
      }
      if (!COLONY_STATUSES.includes(corps.colony_status)) {
        throw new ValidationError(`Le champ colony_status doit valoir ${COLONY_STATUSES.join(", ")}.`);
      }
      if (!estAbsent(corps.queen_present) && typeof corps.queen_present !== "boolean") {
        throw new ValidationError("Le champ queen_present doit être un booléen.");
      }
      if (!estAbsent(corps.observations) && typeof corps.observations !== "string") {
        throw new ValidationError("Le champ observations doit être un texte.");
      }

      // Un identifiant déjà connu signale une inspection déjà synchronisée.
      if (await inspectionsRepository.findById(corps.id)) {
        throw new ConflictError(`Une inspection porte déjà l'identifiant ${corps.id}.`);
      }

      return inspectionsRepository.insert({
        id: corps.id,
        hive_id: hive.id,
        inspected_at: corps.inspected_at,
        colony_status: corps.colony_status,
        queen_present: corps.queen_present ?? null,
        observations: corps.observations ?? null,
      });
    },
  };
}
