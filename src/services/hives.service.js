import { NotFoundError } from "../errors.js";

// Service : les règles sur les ruches. Il reçoit son repository, il ne l'importe pas.
export function createHivesService({ hivesRepository }) {
  return {
    // siteId absent ou vide : toutes les ruches. Une chaîne vide n'est pas undefined.
    async list(siteId) {
      if (!siteId) return hivesRepository.findAll();
      return hivesRepository.findBySite(siteId);
    },

    async get(id) {
      const hive = await hivesRepository.findById(id);
      if (!hive) throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      return hive;
    },
  };
}
