import { ValidationError } from "../errors.js";

// Plages physiques retenues pour le module (UC-CY02, champs du § 6.5).
const PLAGES = {
  position_lat: [-90, 90],
  position_lon: [-180, 180],
  weight_kg: [0, 150],
  temp_internal_c: [-10, 60],
  temp_external_c: [-20, 60],
  humidity_pct: [0, 100],
  acoustic_activity_score: [0, 1],
  battery_pct: [0, 100],
};

const estAbsent = (valeur) => valeur === undefined || valeur === null;

// Service : les règles sur les mesures. Il reçoit ses dépendances, il n'importe jamais un repository.
export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async list(hiveId, { limit, offset }) {
      await hivesService.get(hiveId); // NotFoundError si la ruche n'existe pas
      return measuresRepository.findByHive(hiveId, { limit, offset });
    },

    async add(hiveId, body) {
      const hive = await hivesService.get(hiveId);
      const trame = body ?? {};

      if (estAbsent(trame.timestamp)) {
        throw new ValidationError("Le champ timestamp est obligatoire.");
      }
      if (estAbsent(trame.weight_kg)) {
        throw new ValidationError("Le champ weight_kg est obligatoire.");
      }
      if (trame.hive_id !== undefined && trame.hive_id !== hive.id) {
        throw new ValidationError(
          `Le champ hive_id (${trame.hive_id}) ne correspond pas à la ruche du chemin (${hive.id}).`,
        );
      }

      // Chaque champ présent doit être un nombre dans sa plage physique.
      for (const [champ, [min, max]] of Object.entries(PLAGES)) {
        const valeur = trame[champ];
        if (estAbsent(valeur)) continue;
        if (typeof valeur !== "number" || valeur < min || valeur > max) {
          throw new ValidationError(`Le champ ${champ} doit être un nombre compris entre ${min} et ${max}.`);
        }
      }

      // La mesure garde le timestamp de la trame : l'instant où le capteur l'a prise.
      return measuresRepository.insert({ ...trame, hive_id: hive.id, site_id: hive.site_id });
    },
  };
}
